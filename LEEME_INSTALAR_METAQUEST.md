# 🥽 Guía de Carga e Instalación en Meta Quest 3S (Modo Visitante · Offline)

Esta carpeta (`360pajarillo_METAQUEST_VISITANTE`, **57 MB**) es la versión **definitiva para visitantes**:
- **Sin botones de configuración ni calibración** (el visitante nunca puede tocar ajustes).
- **Portada institucional** con los logotipos oficiales y **3 botones directos** para elegir qué explorar:
  1. **⛰️ Pico Mágina** (Panorámica 360°)
  2. **🏔️ Refugio Miramundos** (Panorámica 360°)
  3. **🏛️ Santuario El Pajarillo** (Esculturas 3D del Héroe, Niño y Lobo)
- **100 % Offline** (incluye `aframe.min.js` en local + Service Worker PWA).
- **Sonido de viento** solo en VR dentro de las panorámicas 360°.

---

## Paso 1: Arrancar el servidor en tu Mac (solo una vez para instalarlo en las gafas)
1. Haz doble clic en **`ABRIR_SERVIDOR_METAQUEST.command`** *(o ejecuta `node server.js` en Terminal dentro de esta carpeta)*.
2. Verás la dirección HTTPS local de tu red Wi-Fi, por ejemplo:  
   `https://192.168.1.17:8445`

## Paso 2: Cargar e instalar Offline en las Meta Quest 3S
1. Conecta las **Meta Quest 3S** al mismo Wi-Fi que tu Mac.
2. Abre **Meta Quest Browser** en las gafas y entra en `https://192.168.1.17:8445` *(acepta el aviso de certificado local una sola vez en Avanzado → Continuar)*.
3. Espera **5 segundos** a que el Service Worker descargue los 57 MB en la memoria interna de las gafas.
4. Pulsa el icono de **Instalar aplicación / Añadir a biblioteca (PWA)** en la barra del navegador de Quest.
5. A partir de ese momento tendrás el icono **El Pajarillo VR** directamente en la biblioteca de las gafas y funcionará **sin internet y sin el Mac encendido**.

## Para salir de una vista y elegir otra en VR
- Mira hacia el suelo durante **5 segundos** (aparecerá el aviso *«Salir al Menú en 5s...»*) para volver a la portada con los logotipos y los 3 botones.

---

> **Carpeta de edición original:** `/Users/juan/Documents/antigravity_proyect/360pajarillo` (conserva el Modo Calibrador y todas las herramientas para futuras modificaciones).  
> **Escena 3D editable en Blender:** `/Users/juan/Documents/el_pajarillo_escena_vr.blend`.
