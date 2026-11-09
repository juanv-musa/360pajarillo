# Versión de Referencia: v1.0.0-definitiva

- **Identificador de versión:** `v1.0.0-definitiva` (Tag: `v1.0.0`)
- **Commit Base:** `0b57727`
- **Fecha:** 9 de noviembre de 2026
- **Estado:** ✅ Validada y fijada como referencia definitiva.
- **Rama de respaldo:** `backup-v1.0.0-definitiva`
- **URL de producción (GitHub Pages):** https://juanv-musa.github.io/360pajarillo/

---

## 📌 Especificaciones y Características Fijadas

1. **Puntos Clave de Referencia (Inmutables):**
   - **Pico Almadén (2.036 m):** `yaw: 0.0°`, `pitch: 1.5°`, `heading: -101°`.
   - **Peña de Jaén (2.147 m):** `yaw: -13.5°`, `pitch: 2.0°`.
   - Estos puntos sirven como ancla fija para toda la calibración de la panorámica 360°.

2. **Diseño Visual e Indicadores 3D:**
   - La línea guía azul/turquesa del mástil se dibuja **por detrás** de la pastilla de texto (`z = -0.05`, `renderOrder = 1` vs `renderOrder = 5`), garantizando nitidez en la lectura de cumbres.
   - Retícula de visión sutil: punto blanco limpio, sin halos ni círculos que produzcan mareo en visor.

3. **Separación de Modos: Escritorio (Edición) vs. Realidad Virtual (Meta Quest):**
   - **Modo Escritorio / Navegador:**
     - Widget inferior 2D visible: `📍 Mágina 2 165 m` junto con la brújula rotativa con grados de orientación (-101°) para calibración en vivo.
     - Panel de edición y botones de guardado con sincronización a `localStorage`.
   - **Modo Gafas VR (Meta Quest):**
     - El widget 2D y las cajas fijas flotantes quedan **completamente ocultos** para mantener la inmersión limpia y sin estorbos.
     - **Anillo Guardián 360° en el suelo:** brújula espacial a los pies con los 4 puntos cardinales y grados (0° a 360°), sirviendo como delimitador de espacio físico y referencia de orientación real.

4. **Persistencia y Datos Online:**
   - Los datos se sincronizan con `localStorage` del navegador para que cualquier nuevo punto añadido en el modo de calibración no se pierda al recargar la página.

5. **Audio y Accesibilidad:**
   - Audio ambiental de viento integrado.
   - Motor de síntesis por voz (Web Speech API / TTS) para locución de cumbres.
