# Versión de Referencia: v2.0.0-realidad-mixta-portales-y-boton-suelo

- **Identificador de versión:** `v2.0.0-realidad-mixta-portales-y-boton-suelo` (Etiqueta Git: `v2.0.0`)
- **Fecha:** 12 de noviembre de 2026
- **Estado:** ✅ Flujo completo de Realidad Mixta (Passthrough), Menú de 3 Pantallas Flotantes y Botón 🏠 de suelo con mirada de 3 segundos consolidado.
- **URL de producción (GitHub Pages):** https://juanv-musa.github.io/360pajarillo/

---

## 🥽 1. Flujo de Realidad Mixta (Passthrough) para Centro de Interpretación
1. **Puesta de Gafas (Paso 1):**
   - El visitante ve la **sala física real** a través de las cámaras a color de las Meta Quest.
   - Frente a él flota la **Pastilla Principal de Bienvenida** (Logos Santuario de El Pajarillo, Ayuntamiento de Huelma, cofinanciación de la Unión Europea y Junta de Andalucía, título y botón *"Comenzar Exploración"*).
2. **Menú de 3 Pantallas Flotantes (Paso 2):**
   - Al pulsar *"Comenzar Exploración"*, la pastilla inicial se repliega y se despliegan en arco en la sala real **3 Pantallas Espaciales**:
     * ⛰️ **Pico Mágina (2.165 m):** 15 cumbres e hitos con miniatura fotográfica.
     * 🏔️ **Refugio Miramundos (2.077 m):** 12 cumbres e hitos con miniatura fotográfica.
     * ❄️ **Nevero de Piedra Seca (2.100 m):** Reconstrucción 3D y Patrimonio UNESCO.
   - El usuario sigue viendo la sala real mientras interactúa con los 3 portales.
3. **Inmersión en Cumbre (Paso 3):**
   - Al seleccionar cualquiera de las 3 pantallas, un fundido suave (*fade*) sumerge al usuario al 100% en la experiencia virtual de esa cumbre con sonido de viento, cumbres marcadas y brújula.

---

## 🏠 2. Botón de Casa en el Suelo (Gaze Timer 3 seg / Clic Láser)
- **Ubicación:** Frente a los pies en el Anillo Guardián (`position="0 0.04 -1.1" rotation="-45 0 0"`).
- **Activación por mirada:** Al mirar al icono `🏠` durante **3 segundos**, un anillo radial cian se va completando con indicador numérico regresivo en tiempo real (*"Volviendo a la sala en 3s..."*). Al llenarse, devuelve al usuario al menú de las 3 pantallas en la sala real sin tocar mandos.
- **Activación por mando:** Clic directo con puntero láser o botones B/Y del mando.

---

## 🛡️ 3. Modo Calibrador Protegido para Administrador
- **Para visitantes:** Los botones de calibrador, cruces y herramientas técnicas están **completamente ocultos** por defecto.
- **Para el administrador:** Se activa instantáneamente pulsando la tecla **`C`** en el teclado o accediendo con la URL:  
  `https://juanv-musa.github.io/360pajarillo/?admin=1`
- Todos los puntos calibrados (15 en Mágina, 12 en Miramundos) y la persistencia en `localStorage` y `hotspots-data.js` están 100% intactos.
