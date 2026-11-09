/**
 * Base de Datos Oficial de Cumbres (Sierra Mágina) con Ortografía y Tildes Correctas
 */

const SCENES_DATA = {
  "magina": {
    "id": "magina",
    "name": "Cumbre de Pico Mágina",
    "shortName": "Mágina",
    "altitude": "2 165 m",
    "baseHeading": -101,
    "image": "assets/images/foto_360_magina.jpg",
    "skyRotation": "0 0 0",
    "hotspots": [
      {
        "id": "almaden",
        "title": "Pico Almadén",
        "elevation": "2.036 m",
        "yaw": 0.0,
        "pitch": 1.5,
        "desc": "En la cima hay estación de telecomunicaciones que da cobertura a toda la provincia de Jaén."
      },
      {
        "id": "pena-jaen",
        "title": "Peña de Jaén",
        "elevation": "2.147 m",
        "yaw": -13.5,
        "pitch": 2.0,
        "desc": "Cumbre destacada de Sierra Mágina."
      }
    ]
  },
  "miramundos": {
    "id": "miramundos",
    "name": "Cumbre de Miramundos",
    "shortName": "Miramundos",
    "altitude": "2.077 m",
    "baseHeading": -45,
    "image": "assets/images/foto_360_miramundos.jpg",
    "skyRotation": "0 -90 0",
    "hotspots": [
      {
        "id": "pena-miramundos",
        "title": "Peña de Miramundos",
        "elevation": "2.077 m",
        "yaw": 24.0,
        "pitch": -2.0,
        "desc": "Espigón calizo culminante sobre el anfiteatro kárstico de Sierra Mágina."
      },
      {
        "id": "refugio-miramundos",
        "title": "Refugio Miramundos",
        "elevation": "2.077 m",
        "yaw": -5.0,
        "pitch": -4.0,
        "desc": "Histórica caseta forestal levantada en mampostería tradicional de piedra seca en la cumbre."
      }
    ]
  }
};

window.SCENES_DATA = SCENES_DATA;
