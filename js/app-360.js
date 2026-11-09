/**
 * 360pajarillo · Visor Inmersivo de Cumbres 360° (Sierra Mágina)
 * Estilo PeakVisor · Audio Ambiental · Locución TTS · Brújula Dinámica
 */

// ==============================================================================
// ESTADO GLOBAL Y DATOS UNIFICADOS (Fuente única: hotspots-data.js)
// ==============================================================================
const AppState = {
  currentSceneId: "magina",
  selectedPeak: null,
  calibrationMode: false,
  currentYaw: 0,
  currentPitch: 0,
  voiceEnabled: true,
  windEnabled: false
};

const CURRENT_DATA_VERSION = "1.2.0";

function getLiveScenesData() {
  const defaultData = JSON.parse(JSON.stringify(window.SCENES_DATA));
  try {
    const savedVer = localStorage.getItem('sierra_magina_dataset_version');
    // Si la versión guardada en el navegador es anterior a la oficial (1.2.0),
    // actualizar automáticamente el localStorage con todos los datos oficiales
    if (savedVer !== CURRENT_DATA_VERSION) {
      localStorage.setItem('sierra_magina_360_hotspots', JSON.stringify(defaultData));
      localStorage.setItem('sierra_magina_dataset_version', CURRENT_DATA_VERSION);
      return defaultData;
    }

    const saved = localStorage.getItem('sierra_magina_360_hotspots');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        for (const sceneId in defaultData) {
          if (parsed[sceneId] && Array.isArray(parsed[sceneId].hotspots) && parsed[sceneId].hotspots.length >= defaultData[sceneId].hotspots.length) {
            defaultData[sceneId] = parsed[sceneId];
          }
        }
        return defaultData;
      }
    }
  } catch (e) {
    console.warn("Error leyendo localStorage:", e);
  }
  return defaultData;
}

// Cargar siempre datos persistidos del usuario si existen
window.LIVE_SCENES = getLiveScenesData();

function saveLiveScenesData() {
  try {
    localStorage.setItem('sierra_magina_360_hotspots', JSON.stringify(window.LIVE_SCENES));
    localStorage.setItem('sierra_magina_dataset_version', CURRENT_DATA_VERSION);
  } catch (e) {}

  // Sincronización automática si se ejecuta sobre el servidor Node local
  try {
    fetch('/api/save-hotspots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(window.LIVE_SCENES)
    }).then(r => r.json()).then(d => {
      console.log('[Sync Auto]:', d);
    }).catch(() => {});
  } catch (e) {}
}

function sphericalToCartesian(yawDeg, pitchDeg, distance = 14.0) {
  const yawRad = THREE.MathUtils.degToRad(yawDeg);
  const pitchRad = THREE.MathUtils.degToRad(pitchDeg);

  const x = distance * Math.cos(pitchRad) * Math.sin(yawRad);
  const y = distance * Math.sin(pitchRad);
  const z = -distance * Math.cos(pitchRad) * Math.cos(yawRad);

  return { x, y, z };
}

// ==============================================================================
// MOTOR DE AUDIO AMBIENTAL: VIENTO DE ALTA MONTAÑA (Procedural Web Audio API)
// ==============================================================================
class MountainWind {
  constructor() {
    this.ctx = null;
    this.gain = null;
    this.filter = null;
    this.isPlaying = false;
  }

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Buffer de ruido estéreo filtrado
      const bufferSize = this.ctx.sampleRate * 4;
      const noiseBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = noiseBuffer.getChannelData(channel);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      // Filtro paso bajo modulado (simula ráfagas de aire en la cresta)
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(340, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      // LFO para oscilar la frecuencia del filtro (ráfagas periódicas de viento)
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.16, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(this.filter.frequency);
      lfo.start();

      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0.14, this.ctx.currentTime); // Volumen sutil relajante

      noise.connect(this.filter);
      this.filter.connect(this.gain);
      this.gain.connect(this.ctx.destination);

      noise.start();
      this.isPlaying = true;
      AppState.windEnabled = true;

      const btn = document.getElementById('btn-wind-toggle');
      if (btn) btn.classList.add('active');
    } catch (e) {
      console.warn('Audio de viento no soportado:', e);
    }
  }

  stop() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      this.ctx.close();
    } catch (e) {}
    this.isPlaying = false;
    AppState.windEnabled = false;

    const btn = document.getElementById('btn-wind-toggle');
    if (btn) btn.classList.remove('active');
  }

  toggle() {
    if (this.isPlaying) this.stop();
    else this.start();
  }
}
window.mountainWind = new MountainWind();

// ==============================================================================
// LOCUCIÓN POR VOZ (Text-to-Speech con síntesis de voz en español)
// ==============================================================================
function speakPeak(peakData) {
  if (!AppState.voiceEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const cleanElevation = (peakData.elevation || '').replace('m', 'metros');
    let speechText = `${peakData.title}. ${cleanElevation}.`;
    if (peakData.desc && peakData.desc.trim()) {
      speechText += ` ${peakData.desc.trim()}`;
    }
    const utter = new SpeechSynthesisUtterance(speechText);
    utter.lang = 'es-ES';
    utter.rate = 0.95;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn('TTS error:', e);
  }
}

window.toggleVoiceNarration = function () {
  AppState.voiceEnabled = !AppState.voiceEnabled;
  if (!AppState.voiceEnabled && ('speechSynthesis' in window)) {
    window.speechSynthesis.cancel();
  }
  const btn = document.getElementById('btn-voice-toggle');
  if (btn) {
    btn.classList.toggle('active', AppState.voiceEnabled);
    btn.textContent = AppState.voiceEnabled ? '🔊 Voz' : '🔇 Voz';
  }
};

// ==============================================================================
// GENERADOR DINÁMICO DE PÍLDORA PEAKVISOR (Badge Diagonal 45°)
// ==============================================================================
function createPeakVisorCanvas(title, elevation) {
  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d');
  const fontTitle = 'bold 74px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const fontElev = 'bold 70px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  mCtx.font = fontTitle;
  const titleMetrics = mCtx.measureText(title);
  const titleW = Math.max(220, Math.ceil(titleMetrics.width) + 80);

  const hasElevation = elevation && elevation.trim().length > 0;
  let elevW = 0;
  if (hasElevation) {
    mCtx.font = fontElev;
    const elevMetrics = mCtx.measureText(elevation);
    elevW = Math.max(180, Math.ceil(elevMetrics.width) + 70);
  }

  const totalPillW = titleW + elevW;
  const pillH = 160;
  const radius = pillH / 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalPillW + 40;
  canvas.height = pillH + 40;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pillX = 20;
  const pillY = 20;
  const splitX = pillX + titleW;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  if (hasElevation) {
    // Mitad izquierda blanca
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(pillX + radius, pillY);
    ctx.lineTo(splitX, pillY);
    ctx.lineTo(splitX, pillY + pillH);
    ctx.lineTo(pillX + radius, pillY + pillH);
    ctx.arc(pillX + radius, pillY + radius, radius, Math.PI / 2, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Mitad derecha cian
    ctx.fillStyle = '#00C4D6';
    ctx.beginPath();
    ctx.moveTo(splitX, pillY);
    ctx.lineTo(pillX + totalPillW - radius, pillY);
    ctx.arc(pillX + totalPillW - radius, pillY + radius, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(splitX, pillY + pillH);
    ctx.lineTo(splitX, pillY);
    ctx.closePath();
    ctx.fill();

    // Texto altitud
    ctx.fillStyle = '#FFFFFF';
    ctx.font = fontElev;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(elevation, splitX + (elevW / 2), pillY + radius + 2);
  } else {
    // Pastilla blanca completa
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(pillX + radius, pillY);
    ctx.lineTo(pillX + totalPillW - radius, pillY);
    ctx.arc(pillX + totalPillW - radius, pillY + radius, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(pillX + radius, pillY + pillH);
    ctx.arc(pillX + radius, pillY + radius, radius, Math.PI / 2, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Texto nombre
  ctx.fillStyle = '#152123';
  ctx.font = fontTitle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, pillX + (titleW / 2), pillY + radius + 2);

  return {
    canvas,
    aspect: canvas.width / canvas.height
  };
}

// ==============================================================================
// BRÚJULA DE SUELO VR (ANILLO GUARDIÁN A LOS PIES)
// ==============================================================================
function createFloorCompassCanvas() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  const rOuter = 480;
  const rSafe = 450;
  const rText = 390;
  const rCard = 345;
  const rCenter = 125;

  // 1. Zona segura de suelo: degradado radial tenue (sensación de área delimitada)
  const grad = ctx.createRadialGradient(cx, cy, 60, cx, cy, rOuter);
  grad.addColorStop(0, 'rgba(0, 196, 214, 0.02)');
  grad.addColorStop(0.7, 'rgba(0, 196, 214, 0.06)');
  grad.addColorStop(0.95, 'rgba(0, 196, 214, 0.15)');
  grad.addColorStop(1, 'rgba(0, 196, 214, 0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.fill();

  // 2. Anillo exterior Guardián (Delimita el espacio para no salir de la zona segura)
  ctx.save();
  ctx.shadowColor = '#00C4D6';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = '#00C4D6';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Línea interior discontinua de guía
  ctx.save();
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = 'rgba(0, 196, 214, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, rSafe, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 3. Graduaciones y marcas angulares de 360 grados
  for (let i = 0; i < 360; i += 5) {
    const rad = (i - 90) * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    let len = 10;
    let stroke = 'rgba(255, 255, 255, 0.35)';
    let width = 1.2;

    if (i % 30 === 0) {
      len = 26;
      stroke = (i === 0) ? '#EE5959' : 'rgba(255, 255, 255, 0.95)';
      width = 2.8;
    } else if (i % 10 === 0) {
      len = 16;
      stroke = 'rgba(0, 196, 214, 0.7)';
      width = 1.8;
    }

    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(cx + cos * (rOuter - 4), cy + sin * (rOuter - 4));
    ctx.lineTo(cx + cos * (rOuter - 4 - len), cy + sin * (rOuter - 4 - len));
    ctx.stroke();

    // Números de grados cada 30°
    if (i % 30 === 0 && i !== 0 && i !== 90 && i !== 180 && i !== 270) {
      ctx.save();
      ctx.translate(cx + cos * rText, cy + sin * rText);
      ctx.rotate(rad + Math.PI / 2);
      ctx.fillStyle = 'rgba(210, 221, 216, 0.8)';
      ctx.font = 'bold 16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i}°`, 0, 0);
      ctx.restore();
    }
  }

  // 4. Sector y Flecha del NORTE (Rojo Coral #EE5959 PeakVisor)
  ctx.save();
  ctx.fillStyle = 'rgba(238, 89, 89, 0.38)';
  ctx.beginPath();
  const nRad1 = (-90 - 16) * (Math.PI / 180);
  const nRad2 = (-90 + 16) * (Math.PI / 180);
  ctx.moveTo(cx, cy - rCenter - 10);
  ctx.lineTo(cx + Math.cos(nRad1) * (rOuter - 10), cy + Math.sin(nRad1) * (rOuter - 10));
  ctx.arc(cx, cy, rOuter - 10, nRad1, nRad2);
  ctx.closePath();
  ctx.fill();

  // Gran Flecha de Norte
  ctx.shadowColor = '#EE5959';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#EE5959';
  ctx.beginPath();
  ctx.moveTo(cx, cy - rOuter + 6);
  ctx.lineTo(cx - 20, cy - rOuter + 38);
  ctx.lineTo(cx + 20, cy - rOuter + 38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Letra N y subtexto NORTE · 0°
  ctx.save();
  ctx.fillStyle = '#EE5959';
  ctx.shadowColor = 'rgba(238, 89, 89, 0.85)';
  ctx.shadowBlur = 10;
  ctx.font = 'bold 46px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - rCard);

  ctx.font = 'bold 13px -apple-system, sans-serif';
  ctx.fillText('NORTE · 0°', cx, cy - rCard + 32);
  ctx.restore();

  // 5. ESTE (90°), SUR (180°), OESTE (270°)
  const cardinals = [
    { label: 'E', sub: 'ESTE · 90°', deg: 90, color: '#00C4D6' },
    { label: 'S', sub: 'SUR · 180°', deg: 180, color: '#8C9994' },
    { label: 'W', sub: 'OESTE · 270°', deg: 270, color: '#00C4D6' }
  ];

  cardinals.forEach(card => {
    const rad = (card.deg - 90) * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    ctx.save();
    ctx.translate(cx + cos * rCard, cy + sin * rCard);
    ctx.rotate(rad + Math.PI / 2);
    ctx.fillStyle = card.color;
    ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.label, 0, -8);

    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(card.sub, 0, 18);
    ctx.restore();
  });

  // Intercardinales: NE, SE, SO, NO
  const inters = [
    { label: 'NE', deg: 45 },
    { label: 'SE', deg: 135 },
    { label: 'SO', deg: 225 },
    { label: 'NO', deg: 315 }
  ];
  inters.forEach(inter => {
    const rad = (inter.deg - 90) * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    ctx.save();
    ctx.translate(cx + cos * (rCard + 12), cy + sin * (rCard + 12));
    ctx.rotate(rad + Math.PI / 2);
    ctx.fillStyle = 'rgba(0, 196, 214, 0.7)';
    ctx.font = 'bold 18px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(inter.label, 0, 0);
    ctx.restore();
  });

  // 6. Centro de la Zona Segura (Área donde pisa el usuario)
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(0, 196, 214, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, rCenter, 0, Math.PI * 2);
  ctx.stroke();

  // Cruz central sutil
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0, 196, 214, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 75, cy);
  ctx.lineTo(cx + 75, cy);
  ctx.moveTo(cx, cy - 75);
  ctx.lineTo(cx, cy + 75);
  ctx.stroke();

  // Texto central identificativo
  ctx.fillStyle = 'rgba(0, 196, 214, 0.85)';
  ctx.font = 'bold 14px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦ ZONA SEGURA VR ✦', cx, cy - 14);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.fillText('SIERRA MÁGINA 360°', cx, cy + 10);
  ctx.restore();

  return canvas;
}

function setupFloorCompass() {
  const planeEl = document.getElementById('vr-floor-compass');
  if (!planeEl) return;

  const canvas = createFloorCompassCanvas();
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const applyTexture = () => {
    const mesh = planeEl.getObject3D('mesh');
    if (mesh && mesh.material) {
      mesh.material.map = texture;
      mesh.material.needsUpdate = true;
    }
  };

  planeEl.addEventListener('loaded', applyTexture);
  applyTexture();

  updateFloorCompassRotation();
}

function updateFloorCompassRotation() {
  const rigEl = document.getElementById('vr-floor-compass-rig');
  if (!rigEl) return;

  const sceneData = window.LIVE_SCENES[AppState.currentSceneId] || {};
  const baseHeading = (sceneData.baseHeading !== undefined) ? sceneData.baseHeading : -101;
  rigEl.setAttribute('rotation', `0 ${baseHeading} 0`);
}

// ==============================================================================
// COMPONENTE: peak-marker (Testigo Blanco Sutil · Línea Detrás de Pastilla · Locución)
// ==============================================================================
AFRAME.registerComponent('peak-marker', {
  schema: {
    id: { type: 'string', default: '' },
    title: { type: 'string', default: '' },
    elevation: { type: 'string', default: '' },
    desc: { type: 'string', default: '' },
    yaw: { type: 'number', default: 0 },
    pitch: { type: 'number', default: 0 }
  },

  init: function () {
    const el = this.el;
    const data = this.data;

    const { canvas, aspect } = createPeakVisorCanvas(data.title, data.elevation);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const height3D = 0.95;
    const width3D = height3D * aspect;

    // Estructura DOM A-Frame con testigo sutil (Punto Blanco Limpio)
    el.innerHTML = `
      <!-- 1. Testigo de cumbre: PUNTO BLANCO SUTIL Y LIMPIO (sin círculos azules) -->
      <a-sphere class="peak-dot clickable" radius="0.08" material="color: #FFFFFF; shader: flat; opacity: 0.95"></a-sphere>

      <!-- 2. ZONA DE IMPACTO AMPLIA: esfera transparente (0.001) para capturar el cursor fácilmente -->
      <a-sphere class="peak-hitbox clickable" radius="0.85"
                material="opacity: 0.001; transparent: true; depthWrite: false; shader: flat"></a-sphere>

      <!-- 3. CONTENEDOR DESPLEGABLE: Línea detrás (z = -0.05) + Pastilla delante (z = +0.05) -->
      <a-entity class="peak-popup" position="0 0 0" scale="0.001 0.001 0.001" visible="false">
        <!-- Línea vertical conectora: queda limpiamente POR DETRÁS de la pastilla -->
        <a-cylinder class="peak-stem clickable" position="0 0.65 -0.05" radius="0.016" height="1.3"
                    material="color: #00C4D6; shader: flat; opacity: 0.95; depthTest: true"></a-cylinder>

        <!-- Pastilla grande PeakVisor a 45 grados: por delante de la línea -->
        <a-entity position="0 1.35 0.05" rotation="0 0 45">
          <a-plane class="peak-pill-plane clickable" width="${width3D}" height="${height3D}" position="${width3D * 0.45} 0 0"
                   material="transparent: true; shader: flat; side: double; depthTest: true"></a-plane>
        </a-entity>
      </a-entity>
    `;

    this.popup = el.querySelector('.peak-popup');
    this.dot = el.querySelector('.peak-dot');
    this.hitbox = el.querySelector('.peak-hitbox');
    this.stem = el.querySelector('.peak-stem');
    this.pillPlane = el.querySelector('.peak-pill-plane');

    // Asignar textura Three.js a la pastilla (renderOrder mayor para estar delante)
    if (this.pillPlane) {
      const applyTexture = () => {
        const mesh = this.pillPlane.getObject3D('mesh');
        if (mesh && mesh.material) {
          mesh.material.map = texture;
          mesh.material.needsUpdate = true;
          mesh.renderOrder = 5;
        }
      };
      this.pillPlane.addEventListener('loaded', applyTexture);
      applyTexture();
    }

    if (this.stem) {
      const applyStem = () => {
        const mesh = this.stem.getObject3D('mesh');
        if (mesh) mesh.renderOrder = 1;
      };
      this.stem.addEventListener('loaded', applyStem);
      applyStem();
    }

    el.peakMarkerComponent = this;
    this.hideTimeout = null;
    this.closeTimer = null;

    // Conectar eventos a los elementos interactivos del hito
    const interactiveItems = [el, this.hitbox, this.dot, this.stem, this.pillPlane];

    const handleHover = () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      this.showPill(true);
      speakPeak(data);
    };

    const handleLeave = () => {
      if (this.hideTimeout) clearTimeout(this.hideTimeout);
      this.hideTimeout = setTimeout(() => {
        if (!AppState.selectedPeak || AppState.selectedPeak.id !== data.id) {
          this.showPill(false);
        }
        this.hideTimeout = null;
      }, 300);
    };

    const handleClick = (evt) => {
      if (evt && evt.stopPropagation) evt.stopPropagation();
      if (this.hideTimeout) clearTimeout(this.hideTimeout);
      window.selectPeak(data);
      this.showPill(true);
      speakPeak(data);
    };

    interactiveItems.forEach(item => {
      if (!item) return;
      item.addEventListener('mouseenter', handleHover);
      item.addEventListener('raycaster-intersected', handleHover);
      item.addEventListener('mouseleave', handleLeave);
      item.addEventListener('raycaster-intersected-cleared', handleLeave);
      item.addEventListener('click', handleClick);
    });
  },

  showPill: function (visible) {
    if (!this.popup) return;

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    if (visible) {
      this.popup.setAttribute('visible', 'true');
      this.popup.setAttribute('animation', {
        property: 'scale',
        to: '1.15 1.15 1.15',
        dur: 200,
        easing: 'easeOutBack'
      });
      if (this.dot) this.dot.setAttribute('material', 'color: #00C4D6; opacity: 1.0');
    } else {
      this.popup.setAttribute('animation', {
        property: 'scale',
        to: '0.001 0.001 0.001',
        dur: 150,
        easing: 'easeInQuad'
      });
      this.closeTimer = setTimeout(() => {
        if (!AppState.selectedPeak || AppState.selectedPeak.id !== this.data.id) {
          this.popup.setAttribute('visible', 'false');
        }
        this.closeTimer = null;
      }, 160);
      if (this.dot) this.dot.setAttribute('material', 'color: #FFFFFF; opacity: 0.95');
    }
  }
});

const _camWorldPos = new THREE.Vector3();
AFRAME.registerComponent('look-at-camera', {
  tick: function () {
    const cam = this.el.sceneEl && this.el.sceneEl.camera;
    if (cam) {
      cam.getWorldPosition(_camWorldPos);
      this.el.object3D.lookAt(_camWorldPos);
    }
  }
});

// ==============================================================================
// GESTIÓN DE ESCENAS
// ==============================================================================

function renderScene(sceneId) {
  const sceneData = window.LIVE_SCENES[sceneId];
  if (!sceneData) return;

  AppState.currentSceneId = sceneId;

  document.getElementById('hud-current-scene').textContent = `${sceneData.name} · ${sceneData.altitude}`;
  document.querySelectorAll('.btn-scene-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scene === sceneId);
  });

  // Actualizar rotación de la brújula de suelo para la escena actual
  updateFloorCompassRotation();

  // Actualizar textos del widget 2D de ubicación en modo edición / escritorio
  const vpName = document.getElementById('viewpoint-name');
  const vpAlt = document.getElementById('viewpoint-alt');
  if (vpName) vpName.textContent = sceneData.shortName || sceneData.name.replace('Cumbre de ', '');
  if (vpAlt) vpAlt.textContent = sceneData.altitude;

  const sky = document.getElementById('sky-360');
  sky.setAttribute('src', sceneData.image);
  sky.setAttribute('rotation', sceneData.skyRotation || "0 0 0");

  const container = document.getElementById('hotspots-container');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  sceneData.hotspots.forEach(hs => {
    const pos = sphericalToCartesian(hs.yaw, hs.pitch, 14.0);
    const entity = document.createElement('a-entity');
    entity.setAttribute('id', `peak-${hs.id}`);
    entity.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    entity.setAttribute('look-at-camera', '');
    entity.setAttribute('peak-marker', hs);
    entity.setAttribute('class', 'clickable');
    container.appendChild(entity);
  });

  renderPeakStrip(sceneData.hotspots);
  renderCalibratorList();
  window.closePeakCard();
}

function renderPeakStrip(hotspots) {
  const strip = document.getElementById('peak-strip');
  strip.innerHTML = '';
  hotspots.forEach(hs => {
    const chip = document.createElement('button');
    chip.className = 'peak-chip';
    chip.id = `chip-${hs.id}`;
    chip.innerHTML = `<span>▲</span> <strong>${hs.title}</strong> <small>${hs.elevation}</small>`;
    chip.onclick = () => {
      window.selectPeak(hs);
      window.lookAtPeak(hs.yaw, hs.pitch);
    };
    strip.appendChild(chip);
  });
}

window.selectPeak = function (peakData) {
  document.querySelectorAll('.clickable').forEach(el => {
    if (el.peakMarkerComponent) el.peakMarkerComponent.showPill(false);
  });

  AppState.selectedPeak = peakData;

  const targetEl = document.getElementById(`peak-${peakData.id}`);
  if (targetEl && targetEl.peakMarkerComponent) {
    targetEl.peakMarkerComponent.showPill(true);
  }

  document.getElementById('card-peak-title').textContent = peakData.title;
  document.getElementById('card-peak-elev').textContent = peakData.elevation;
  document.getElementById('card-peak-desc').textContent = peakData.desc || 'Cumbre destacada de Sierra Mágina.';

  document.querySelectorAll('.peak-chip').forEach(c => c.classList.remove('active'));
  const activeChip = document.getElementById(`chip-${peakData.id}`);
  if (activeChip) activeChip.classList.add('active');

  document.getElementById('peak-info-card').classList.add('visible');
  speakPeak(peakData);
};

window.closePeakCard = function () {
  document.getElementById('peak-info-card').classList.remove('visible');
  document.querySelectorAll('.peak-chip').forEach(c => c.classList.remove('active'));

  document.querySelectorAll('.clickable').forEach(el => {
    if (el.peakMarkerComponent) el.peakMarkerComponent.showPill(false);
  });

  AppState.selectedPeak = null;
};

window.lookAtPeak = function (targetYaw, targetPitch) {
  const cam = document.getElementById('head-camera');
  if (cam && cam.components && cam.components['look-controls']) {
    const lc = cam.components['look-controls'];
    const targetYawRad = -THREE.MathUtils.degToRad(targetYaw);
    const targetPitchRad = THREE.MathUtils.degToRad(targetPitch);

    if (lc.yawObject && lc.pitchObject) {
      lc.yawObject.rotation.y = targetYawRad;
      lc.pitchObject.rotation.x = targetPitchRad;
    }
  }
};

window.lookAtSelectedPeak = function () {
  if (AppState.selectedPeak) {
    window.lookAtPeak(AppState.selectedPeak.yaw, AppState.selectedPeak.pitch);
  }
};

window.switchScene = function (sceneId) {
  if (AppState.currentSceneId === sceneId) return;
  const overlay = document.getElementById('fade-overlay');
  if (overlay) {
    overlay.setAttribute('animation', 'property: material.opacity; to: 1; dur: 200; easing: easeInOutQuad');
    setTimeout(() => {
      renderScene(sceneId);
      overlay.setAttribute('animation', 'property: material.opacity; to: 0; dur: 300; easing: easeInOutQuad');
    }, 220);
  } else {
    renderScene(sceneId);
  }
};

// ==============================================================================
// GESTOR DE CALIBRACIÓN Y HERRAMIENTAS DE SINCRONIZACIÓN
// ==============================================================================

window.toggleCalibrationMode = function () {
  AppState.calibrationMode = !AppState.calibrationMode;
  const panel = document.getElementById('calibrator-panel');
  const reticle = document.getElementById('calibrator-reticle');
  const btn = document.getElementById('btn-calibrator');

  if (AppState.calibrationMode) {
    panel.style.display = 'block';
    reticle.style.display = 'block';
    btn.classList.add('active');
    btn.textContent = 'Cerrar Calibrador';
    renderCalibratorList();
  } else {
    panel.style.display = 'none';
    reticle.style.display = 'none';
    btn.classList.remove('active');
    btn.textContent = 'Modo Calibrador';
  }
};

function renderCalibratorList() {
  const listEl = document.getElementById('calibrator-hotspots-list');
  if (!listEl) return;

  const currentHotspots = window.LIVE_SCENES[AppState.currentSceneId].hotspots;
  listEl.innerHTML = '';

  if (currentHotspots.length === 0) {
    listEl.innerHTML = '<div style="color:#888; font-size:0.75rem; padding:4px;">No hay cumbres marcadas en esta vista.</div>';
    return;
  }

  currentHotspots.forEach((hs, idx) => {
    const row = document.createElement('div');
    row.className = 'calib-item-row';
    row.innerHTML = `
      <div class="calib-item-info">
        <span class="calib-item-title">${hs.title} (${hs.elevation})</span>
        <span class="calib-item-coords">Yaw: ${hs.yaw}° | Pitch: ${hs.pitch}°</span>
      </div>
      <div class="calib-item-btns">
        <button class="btn-mini-calib" title="Centrar cámara" onclick="window.lookAtPeak(${hs.yaw}, ${hs.pitch})">👁️</button>
        <button class="btn-mini-calib" title="Subir altura +0.5°" onclick="window.nudgePeakPitch(${idx}, 0.5)">▲</button>
        <button class="btn-mini-calib" title="Bajar altura -0.5°" onclick="window.nudgePeakPitch(${idx}, -0.5)">▼</button>
        <button class="btn-mini-calib" title="Editar texto" onclick="window.editPeak(${idx})">✏️</button>
        <button class="btn-mini-del" title="Borrar este punto" onclick="window.deletePeak(${idx})">✕</button>
      </div>
    `;
    listEl.appendChild(row);
  });
}

window.nudgePeakPitch = function (idx, delta) {
  const hs = window.LIVE_SCENES[AppState.currentSceneId].hotspots[idx];
  if (hs) {
    hs.pitch = Math.round((hs.pitch + delta) * 10) / 10;
    saveLiveScenesData();
    renderScene(AppState.currentSceneId);
  }
};

window.editPeak = function (idx) {
  const hs = window.LIVE_SCENES[AppState.currentSceneId].hotspots[idx];
  if (!hs) return;

  const newTitle = prompt("Modificar nombre (soporta tildes y eñes):", hs.title);
  if (newTitle && newTitle.trim()) hs.title = newTitle.trim();

  const newElev = prompt("Modificar altitud:", hs.elevation);
  if (newElev && newElev.trim()) hs.elevation = newElev.trim();

  const newDesc = prompt("Modificar descripción (locución y ficha):", hs.desc || "");
  if (newDesc !== null) hs.desc = newDesc.trim();

  saveLiveScenesData();
  renderScene(AppState.currentSceneId);
};

window.deletePeak = function (idx) {
  const hs = window.LIVE_SCENES[AppState.currentSceneId].hotspots[idx];
  if (confirm(`¿Borrar el hito '${hs.title}'?`)) {
    window.LIVE_SCENES[AppState.currentSceneId].hotspots.splice(idx, 1);
    saveLiveScenesData();
    renderScene(AppState.currentSceneId);
  }
};

window.getCurrentHeading = function () {
  const sceneData = window.LIVE_SCENES[AppState.currentSceneId] || {};
  const baseHeading = (sceneData.baseHeading !== undefined) ? sceneData.baseHeading : -99;
  let currentHeading = Math.round(baseHeading + AppState.currentYaw);
  while (currentHeading > 180) currentHeading -= 360;
  while (currentHeading <= -180) currentHeading += 360;
  return currentHeading;
};

window.promptCalibrateCompass = function () {
  const sceneData = window.LIVE_SCENES[AppState.currentSceneId] || {};
  const currH = window.getCurrentHeading();
  const input = prompt(
    `🧭 CALIBRAR BRÚJULA PARA '${sceneData.shortName || sceneData.name}':\n\n` +
    `Introduce el rumbo real de la brújula hacia donde estás mirando en este momento.\n` +
    `(Ejemplos: -99° o 261° para Pico Almadén, 0° para Norte, 90° para Este)\n\n` +
    `Rumbo actual: ${currH}°`,
    `${currH}°`
  );
  if (input !== null && input.trim() !== '') {
    window.setCompassHeadingForCurrentView(input.trim());
  }
};

window.setCompassHeadingForCurrentView = function (val) {
  if (!val) return;
  let str = String(val).toUpperCase().replace('°', '').trim();
  let degrees = null;
  if (str === 'N' || str === 'NORTE') degrees = 0;
  else if (str === 'E' || str === 'ESTE') degrees = 90;
  else if (str === 'S' || str === 'SUR') degrees = 180;
  else if (str === 'W' || str === 'O' || str === 'OESTE') degrees = -90;
  else {
    const num = parseFloat(str);
    if (!isNaN(num)) degrees = num;
  }

  if (degrees === null) {
    alert("Por favor, introduce un ángulo numérico válido en grados (ej: -99°, 261°, 0°)");
    return;
  }

  while (degrees > 180) degrees -= 360;
  while (degrees <= -180) degrees += 360;

  // currentHeading = baseHeading + AppState.currentYaw
  // => baseHeading = degrees - AppState.currentYaw
  let newBaseHeading = Math.round(degrees - AppState.currentYaw);
  while (newBaseHeading > 180) newBaseHeading -= 360;
  while (newBaseHeading <= -180) newBaseHeading += 360;

  window.LIVE_SCENES[AppState.currentSceneId].baseHeading = newBaseHeading;
  saveLiveScenesData();

  updateFloorCompassRotation();
  lastVrHeading = null; // forzar refresco del widget en VR

  const sceneData = window.LIVE_SCENES[AppState.currentSceneId] || {};
  alert(`🧭 ¡Brújula calibrada para '${sceneData.shortName || sceneData.name}'!\n` +
        `Rumbo fijado en ${degrees}° hacia esta vista.\n` +
        `El Norte, la brújula y el anillo del suelo han quedado sincronizados.`);
};

window.addHotspotAtCurrentView = function () {
  const title = prompt("Nombre de la cumbre (ej: 'Peña de Jaén', 'Pico Almadén'):");
  if (!title || !title.trim()) return;

  const elev = prompt("Altitud (ej: '2.147 m'):", "2.000 m") || "";
  const desc = prompt("Breve descripción (se mostrará y locutará al enfocar):") || "";

  // Opción para calibrar la brújula en este nuevo hito
  const currH = window.getCurrentHeading();
  const compassPrompt = prompt(
    `🧭 CALIBRACIÓN DE BRÚJULA PARA ESTA CUMBRE (Opcional):\n\n` +
    `Introduce el rumbo real de la brújula hacia '${title.trim()}' en grados.\n` +
    `(Ejemplo: -99° o 261° para Almadén, 0° para Norte)\n\n` +
    `Rumbo actual: ${currH}°. Pulsa Aceptar para calibrarlo o Cancelar para mantenerlo:`,
    `${currH}°`
  );
  if (compassPrompt !== null && compassPrompt.trim() !== '') {
    window.setCompassHeadingForCurrentView(compassPrompt.trim());
  }

  const newHs = {
    id: `peak-${Date.now()}`,
    title: title.trim(),
    elevation: elev.trim(),
    yaw: AppState.currentYaw,
    pitch: AppState.currentPitch,
    desc: desc.trim()
  };

  window.LIVE_SCENES[AppState.currentSceneId].hotspots.push(newHs);
  saveLiveScenesData();
  renderScene(AppState.currentSceneId);
};

window.clearAllHotspots = function () {
  if (confirm("¿Quieres borrar todos los hitos de esta panorámica y empezar de cero?")) {
    window.LIVE_SCENES[AppState.currentSceneId].hotspots = [];
    saveLiveScenesData();
    renderScene(AppState.currentSceneId);
  }
};

window.exportHotspotsToClipboard = function () {
  const jsContent = `/**
 * Base de Datos Oficial de Cumbres (Sierra Mágina) con Ortografía y Tildes Correctas
 */

const SCENES_DATA = ${JSON.stringify(window.LIVE_SCENES, null, 2)};

window.SCENES_DATA = SCENES_DATA;
`;
  navigator.clipboard.writeText(jsContent).then(() => {
    alert("¡Código de puntos copiado al portapapeles! Listo para sincronizar o pegar en GitHub.");
  }).catch(() => {
    prompt("Copia este código y guárdalo:", jsContent);
  });
};

window.downloadHotspotsFile = function () {
  const jsContent = `/**
 * Base de Datos Oficial de Cumbres (Sierra Mágina) con Ortografía y Tildes Correctas
 */

const SCENES_DATA = ${JSON.stringify(window.LIVE_SCENES, null, 2)};

window.SCENES_DATA = SCENES_DATA;
`;
  const blob = new Blob([jsContent], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hotspots-data.js';
  a.click();
};

// ==============================================================================
// BUCLE DE ORIENTACIÓN, BRÚJULA DINÁMICA Y CALIBRACIÓN
// ==============================================================================
function updateCameraOrientationLoop() {
  const cam = document.getElementById('head-camera');
  if (cam && cam.components && cam.components['look-controls']) {
    const lc = cam.components['look-controls'];
    if (lc.yawObject && lc.pitchObject) {
      let yaw = -THREE.MathUtils.radToDeg(lc.yawObject.rotation.y);
      let pitch = THREE.MathUtils.radToDeg(lc.pitchObject.rotation.x);

      yaw = ((yaw + 180) % 360) - 180;
      if (yaw < -180) yaw += 360;

      AppState.currentYaw = Math.round(yaw * 10) / 10;
      AppState.currentPitch = Math.round(pitch * 10) / 10;

      // Cálculo del rumbo respecto al Norte de la escena
      const sceneData = window.LIVE_SCENES[AppState.currentSceneId] || {};
      const baseHeading = (sceneData.baseHeading !== undefined) ? sceneData.baseHeading : -101;
      let currentHeading = Math.round(baseHeading + yaw);
      while (currentHeading > 180) currentHeading -= 360;
      while (currentHeading <= -180) currentHeading += 360;

      // Actualizar Brújula 2D en modo edición / escritorio
      const headingEl = document.getElementById('compass-heading');
      const fovWedgeEl = document.getElementById('compass-fov-wedge');
      if (headingEl) headingEl.textContent = `${currentHeading}°`;
      if (fovWedgeEl) fovWedgeEl.style.transform = `rotate(${currentHeading}deg)`;

      if (AppState.calibrationMode) {
        const calibYaw = document.getElementById('calib-yaw');
        const calibPitch = document.getElementById('calib-pitch');
        const calibCompass = document.getElementById('calib-compass-val');
        if (calibYaw) calibYaw.textContent = `${AppState.currentYaw}°`;
        if (calibPitch) calibPitch.textContent = `${AppState.currentPitch}°`;
        if (calibCompass) calibCompass.textContent = `${currentHeading}°`;
      }
    }
  }
  requestAnimationFrame(updateCameraOrientationLoop);
}

// ==============================================================================
// INTERACCIÓN DE RATÓN EN ESCRITORIO (Mac / PC)
// ==============================================================================
function setupDesktopMouseInteractions() {
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('mousemove', (e) => {
    if (sceneEl.is('vr-mode')) return;
    const camera = sceneEl.camera;
    if (!camera) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hotspotsContainer = document.getElementById('hotspots-container');
    if (!hotspotsContainer || !hotspotsContainer.object3D) return;

    const intersects = raycaster.intersectObjects(hotspotsContainer.object3D.children, true);

    let hoveredComp = null;
    for (let hit of intersects) {
      let obj = hit.object;
      while (obj) {
        if (obj.el && obj.el.peakMarkerComponent) {
          hoveredComp = obj.el.peakMarkerComponent;
          break;
        }
        obj = obj.parent;
      }
      if (hoveredComp) break;
    }

    if (hoveredComp) {
      if (hoveredComp.hideTimeout) {
        clearTimeout(hoveredComp.hideTimeout);
        hoveredComp.hideTimeout = null;
      }
      hoveredComp.showPill(true);
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
      document.querySelectorAll('[peak-marker]').forEach(el => {
        const comp = el.peakMarkerComponent;
        if (comp && (!AppState.selectedPeak || AppState.selectedPeak.id !== comp.data.id)) {
          if (!comp.hideTimeout) {
            comp.hideTimeout = setTimeout(() => {
              if (!AppState.selectedPeak || AppState.selectedPeak.id !== comp.data.id) {
                comp.showPill(false);
              }
              comp.hideTimeout = null;
            }, 250);
          }
        }
      });
    }
  });

  window.addEventListener('click', (e) => {
    if (sceneEl.is('vr-mode')) return;
    if (e.target.closest('.museum-hud, .peak-info-card, .peak-strip-container, .welcome-overlay, .calibrator-panel, #btn-calibrator, .viewpoint-compass-widget')) {
      return;
    }

    const camera = sceneEl.camera;
    if (!camera) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hotspotsContainer = document.getElementById('hotspots-container');
    if (!hotspotsContainer || !hotspotsContainer.object3D) return;

    const intersects = raycaster.intersectObjects(hotspotsContainer.object3D.children, true);

    let clickedComp = null;
    for (let hit of intersects) {
      let obj = hit.object;
      while (obj) {
        if (obj.el && obj.el.peakMarkerComponent) {
          clickedComp = obj.el.peakMarkerComponent;
          break;
        }
        obj = obj.parent;
      }
      if (clickedComp) break;
    }

    if (clickedComp) {
      window.selectPeak(clickedComp.data);
      clickedComp.showPill(true);
    }
  });
}

function setupCursorMode() {
  const sceneEl = document.querySelector('a-scene');
  const gaze = document.getElementById('gaze-cursor');

  if (sceneEl && gaze) {
    gaze.setAttribute('visible', 'false');

    sceneEl.addEventListener('enter-vr', () => {
      gaze.setAttribute('visible', 'true');
    });

    sceneEl.addEventListener('exit-vr', () => {
      gaze.setAttribute('visible', 'false');
    });
  }
}

window.startExperience = function () {
  const modal = document.getElementById('welcome-modal');
  if (modal) modal.classList.add('hidden');
  // Iniciar sonido de viento relajante al comenzar
  window.mountainWind.start();
};

document.addEventListener('DOMContentLoaded', () => {
  renderScene("magina");
  setupFloorCompass();
  updateCameraOrientationLoop();
  setupCursorMode();
  setupDesktopMouseInteractions();
});
