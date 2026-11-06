/**
 * Base de Datos Oficial de Cumbres (Sierra Mágina) con Ortografía y Tildes Correctas
 */

const SCENES_DATA = {
  "magina": {
    "id": "magina",
    "name": "Cumbre de Pico Mágina",
    "altitude": "2.167 m",
    "image": "assets/images/foto_360_magina.jpg",
    "skyRotation": "0 0 0",
    "hotspots": [
      {
        "id": "almaden",
        "title": "Pico Almadén",
        "elevation": "2.036 m",
        "yaw": 0.0,
        "pitch": 1.5,
        "desc": "En su cima se alza la estación de telecomunicaciones. Domina toda la vertiente de Mancha Real con amplias vistas hacia la Vega de Jaén."
      }
    ]
  },
  "miramundos": {
    "id": "miramundos",
    "name": "Cumbre de Miramundos",
    "altitude": "2.077 m",
    "image": "assets/images/foto_360_miramundos.jpg",
    "skyRotation": "0 -90 0",
    "hotspots": [
      {
        "id": "pena-miramundos",
        "title": "Peña de Miramundos",
        "elevation": "2.077 m",
        "yaw": 24.0,
        "pitch": -2.0,
        "desc": "Una de las cumbres más representativas del macizo calizo de Sierra Mágina."
      },
      {
        "id": "refugio-miramundos",
        "title": "Refugio Miramundos",
        "elevation": "2.077 m",
        "yaw": -5.0,
        "pitch": -4.0,
        "desc": "Histórica caseta forestal levantada en piedra seca en la cumbre."
      }
    ]
  }
};

window.SCENES_DATA = SCENES_DATA;
