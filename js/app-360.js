/**
 * 360pajarillo · Visor de Cumbres con Despliegue Robusto en Hover y Clic
 */

const AppState = {
  currentSceneId: "magina",
  selectedPeak: null,
  calibrationMode: false,
  currentYaw: 0,
  currentPitch: 0
};

function getLiveScenesData() {
  try {
    const saved = localStorage.getItem('sierra_magina_360_hotspots');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Error leyendo localStorage:", e);
  }
  return JSON.parse(JSON.stringify(window.SCENES_DATA));
}

window.LIVE_SCENES = getLiveScenesData();

function saveLiveScenesData() {
  localStorage.setItem('sierra_magina_360_hotspots', JSON.stringify(window.LIVE_SCENES));
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
// GENERADOR DINÁMICO DE PÍLDORA PEAKVISOR (Texto Grande y Remates Redondeados)
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
// COMPONENTE: peak-marker (Con Testigo Discreto y Despliegue Fiable)
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

    // Estructura DOM A-Frame con zona de impacto amplia
    el.innerHTML = `
      <!-- 1. Punto Cian en la cima -->
      <a-sphere class="peak-dot clickable" radius="0.12" material="color: #00C4D6; shader: flat"></a-sphere>

      <!-- 2. Halo testigo suave con pulsación -->
      <a-ring class="peak-halo clickable" radius-inner="0.14" radius-outer="0.22"
              material="color: #00C4D6; shader: flat; opacity: 0.65; transparent: true"
              animation="property: scale; from: 0.9 0.9 0.9; to: 1.25 1.25 1.25; dir: alternate; loop: true; dur: 1200; easing: easeInOutSine"></a-ring>

      <!-- 3. ZONA DE IMPACTO AMPLIA: esfera transparente (0.001) para capturar el cursor fácilmente -->
      <a-sphere class="peak-hitbox clickable" radius="0.85"
                material="opacity: 0.001; transparent: true; depthWrite: false; shader: flat"></a-sphere>

      <!-- 4. CONTENEDOR DESPLEGABLE: Línea + Pastilla (Oculto de inicio) -->
      <a-entity class="peak-popup" position="0 0 0" scale="0.001 0.001 0.001" visible="false">
        <!-- Línea vertical conectora -->
        <a-cylinder class="peak-stem clickable" position="0 0.7 0" radius="0.016" height="1.4"
                    material="color: #00C4D6; shader: flat; opacity: 0.95"></a-cylinder>

        <!-- Pastilla grande PeakVisor a 45 grados -->
        <a-entity position="0 1.4 0" rotation="0 0 45">
          <a-plane class="peak-pill-plane clickable" width="${width3D}" height="${height3D}" position="${width3D * 0.45} 0 0"
                   material="transparent: true; shader: flat; side: double"></a-plane>
        </a-entity>
      </a-entity>
    `;

    this.popup = el.querySelector('.peak-popup');
    this.halo = el.querySelector('.peak-halo');
    this.dot = el.querySelector('.peak-dot');
    this.hitbox = el.querySelector('.peak-hitbox');
    this.stem = el.querySelector('.peak-stem');
    this.pillPlane = el.querySelector('.peak-pill-plane');

    // Asignar textura Three.js al plano
    if (this.pillPlane) {
      const applyTexture = () => {
        const mesh = this.pillPlane.getObject3D('mesh');
        if (mesh && mesh.material) {
          mesh.material.map = texture;
          mesh.material.needsUpdate = true;
        }
      };
      this.pillPlane.addEventListener('loaded', applyTexture);
      applyTexture();
    }

    el.peakMarkerComponent = this;
    this.hideTimeout = null;
    this.closeTimer = null;

    // Conectar eventos a todos los elementos interactivos del hito
    const interactiveItems = [el, this.hitbox, this.dot, this.halo, this.stem, this.pillPlane];

    const handleHover = () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      this.showPill(true);
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
      if (this.halo) this.halo.setAttribute('material', 'opacity: 1.0; color: #5FE2FF');
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
      if (this.halo) this.halo.setAttribute('material', 'opacity: 0.65; color: #00C4D6');
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
// GESTOR DE CALIBRACIÓN
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

window.addHotspotAtCurrentView = function () {
  const title = prompt("Nombre de la cumbre (con tildes si lleva, ej: 'Pico Almadén', 'Peña de Miramundos'):");
  if (!title || !title.trim()) return;

  const elev = prompt("Altitud (ej: '2.036 m'):", "2.000 m") || "";
  const desc = prompt("Breve descripción:") || "";

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

      if (AppState.calibrationMode) {
        document.getElementById('calib-yaw').textContent = `${AppState.currentYaw}°`;
        document.getElementById('calib-pitch').textContent = `${AppState.currentPitch}°`;
      }
    }
  }
  requestAnimationFrame(updateCameraOrientationLoop);
}

function setupDesktopMouseInteractions() {
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Raycaster nativo en tiempo real para escritorio Mac / PC
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

  // Clic directo con ratón sobre cualquier parte de la cumbre
  window.addEventListener('click', (e) => {
    if (sceneEl.is('vr-mode')) return;
    if (e.target.closest('.museum-hud, .peak-info-card, .peak-strip-container, .welcome-overlay, .calibrator-panel, #btn-calibrator')) {
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
};

document.addEventListener('DOMContentLoaded', () => {
  renderScene("magina");
  updateCameraOrientationLoop();
  setupCursorMode();
  setupDesktopMouseInteractions();
});
