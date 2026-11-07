const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DIR = __dirname;
const HTTP_PORT = 8090;
const HTTPS_PORT = 8445;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg'
};

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function handleRequest(req, res) {
  let reqPath = req.url.split('?')[0];

  // Guardado persistente directo en disco desde el Calibrador
  if (reqPath === '/api/save-hotspots') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const scenesData = JSON.parse(body);
          const dataPath = path.join(DIR, 'js', 'hotspots-data.js');
          const jsContent = `/**
 * Base de Datos Oficial de Cumbres (Sierra Mágina) con Ortografía y Tildes Correctas
 * Guardado automático desde el Calibrador de Cumbres
 */

const SCENES_DATA = ${JSON.stringify(scenesData, null, 2)};

window.SCENES_DATA = SCENES_DATA;
`;
          fs.writeFileSync(dataPath, jsContent, 'utf8');
          console.log('[API] Hitos sincronizados en disco: js/hotspots-data.js');
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ success: true, message: 'Hitos guardados en disco' }));
        } catch (e) {
          console.error('[API Error guardando hitos]:', e.message);
          res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  
  const filePath = path.join(DIR, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
}

const localIp = getLocalIp();

// 1. Servidor HTTP (Pruebas en Mac)
const httpServer = http.createServer(handleRequest);
httpServer.listen(HTTP_PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌐 [360pajarillo] Servidor Activo:`);
  console.log(`💻 En tu Mac (Navegador):   http://localhost:${HTTP_PORT}`);
  console.log(`🥽 En tus Meta Quest (Wi-Fi): https://${localIp}:${HTTPS_PORT}`);
  console.log(`======================================================\n`);
});

// 2. Servidor HTTPS (Para Meta Quest WebXR)
try {
  const sslOptions = {
    key: fs.readFileSync(path.join(DIR, 'key.pem')),
    cert: fs.readFileSync(path.join(DIR, 'cert.pem'))
  };

  const httpsServer = https.createServer(sslOptions, handleRequest);
  httpsServer.listen(HTTPS_PORT);
} catch (e) {
  console.warn('[HTTPS Aviso]: No se pudo iniciar HTTPS (WebXR requiere HTTPS o localhost):', e.message);
}
