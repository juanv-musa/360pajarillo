/**
 * Base de Datos Oficial de Cumbres (Sierra Mágina) con Ortografía y Tildes Correctas
 */

const SCENES_DATA = {
  "magina": {
    "id": "magina",
    "name": "Cumbre de Pico Mágina",
    "shortName": "Mágina",
    "altitude": "2 165 m",
    "baseHeading": 54,
    "image": "assets/images/foto_360_magina.jpg",
    "skyRotation": "0 0 0",
    "hotspots": [
      {
        "id": "peak-1794214710287",
        "title": "Pico Almadén",
        "elevation": "2.036 m",
        "yaw": -153.2,
        "pitch": 0.8,
        "desc": "En la cima hay estación de telecomunicaciones que da cobertura a toda la provincia de Jaén."
      },
      {
        "id": "peak-1794214782152",
        "title": "Peña de Jaén",
        "elevation": "2.147 m",
        "yaw": -171.3,
        "pitch": 0.5,
        "desc": "Se encuentra coronada por una cruz metálica y un hito con una placa conmemorativa."
      },
      {
        "id": "peak-1794228184781",
        "title": "Cerro Aznaitín",
        "elevation": "1.735 m",
        "yaw": -83.9,
        "pitch": -1.2,
        "desc": "En su cumbre se juntan los términos municipales de Jimena, Torres y Albanchez de Mágina"
      },
      {
        "id": "peak-1794218468491",
        "title": "Cerro Cárceles",
        "elevation": "2.056 m",
        "yaw": -107.9,
        "pitch": -1.4,
        "desc": "Cerro Cárceles también conocido como El Cárceles o Cerro Ponce."
      },
      {
        "id": "peak-1794220373006",
        "title": "Sierra Jabalcúz",
        "elevation": "1.618 m",
        "yaw": -160.5,
        "pitch": 0.9,
        "desc": "Jabalcuz es un monte situado al sur de la ciudad de Jaén."
      },
      {
        "id": "peak-1794220642171",
        "title": "La Serrezuela",
        "elevation": "1.956 m",
        "yaw": 137,
        "pitch": -4.4,
        "desc": "La Serrezuela es monte cubierto de vegetación mediterránea, con  zona boscosa de pinos, carrascas, romerales, tomillares  y espartales"
      },
      {
        "id": "peak-1794220821242",
        "title": "Loma de las Viñas",
        "elevation": "1.134 m",
        "yaw": 106.2,
        "pitch": -8.8,
        "desc": "Antigua zona de viñedos tradicionales reconvertida hoy en olivares, rodeada por el entorno natural del parque"
      },
      {
        "id": "peak-1794221173808",
        "title": "Pico Veleta",
        "elevation": "3.398 m",
        "yaw": 98.9,
        "pitch": 2,
        "desc": "Situado en Sierra Nevada, es la cuarta cumbre más alta de España."
      },
      {
        "id": "peak-1794221343900",
        "title": "Pico del Mulhacén",
        "elevation": "3.479 m",
        "yaw": 94.8,
        "pitch": 2.5,
        "desc": "El Mulhacén es el pico más alto de la península ibérica y el segundo de España tras el Teide en Tenerife (Islas Canarias)."
      },
      {
        "id": "peak-1794221592584",
        "title": "Cuerda del Milagro",
        "elevation": "1.938 m",
        "yaw": 54,
        "pitch": -3.8,
        "desc": "También conocida como Cuerda de los Bolos es una prominente cresta situada al sur del Pico Mágina."
      },
      {
        "id": "peak-1794221775849",
        "title": "Cerro de la Cantera",
        "elevation": "1.148 m",
        "yaw": 75.6,
        "pitch": -5.5,
        "desc": "En sus inmediaciones se conservan la Era del Cortijo de la Cantera, construida con la técnica tradicional de piedra seca."
      },
      {
        "id": "peak-1794222101737",
        "title": "HUELMA",
        "elevation": "981 m",
        "yaw": 103.3,
        "pitch": -8.8,
        "desc": "Municipio de Huelma"
      },
      {
        "id": "peak-1794222329856",
        "title": "La Sagra",
        "elevation": "2.386 m",
        "yaw": -0.7,
        "pitch": 1.3,
        "desc": "Situada al norte de la provincia de Granada, entre los términos municipales de Huéscar y la Puebla de Don Fadrique."
      },
      {
        "id": "peak-1794222605722",
        "title": "El Yelmo",
        "elevation": "1.808 m",
        "yaw": -21.6,
        "pitch": 0.2,
        "desc": "Pico enclavado en la zona noreste de la provincia de Jaén, en el término municipal de Segura de la Sierra."
      },
      {
        "id": "peak-1794222934967",
        "title": "Refugio Miramundos",
        "elevation": "2.077 m",
        "yaw": -0.8,
        "pitch": -4,
        "desc": "Un pequeño pero bien cuidado Refugio Libre sobre el pico Miramundos en la Sierra Mágina de Jaén"
      }
    ]
  },
  "miramundos": {
    "id": "miramundos",
    "name": "Cumbre de Miramundos",
    "shortName": "Miramundos",
    "altitude": "2.077 m",
    "baseHeading": -130,
    "image": "assets/images/foto_360_miramundos.jpg",
    "skyRotation": "0 -90 0",
    "hotspots": [
      {
        "id": "peak-1794228405927",
        "title": "Cerro Aznaitín",
        "elevation": "1.735 m",
        "yaw": 107,
        "pitch": 0.8,
        "desc": "En su cumbre se juntan los términos municipales de Jimena, Torres y Albanchez de Mágina."
      },
      {
        "id": "peak-1794228603142",
        "title": "Alto de La Serrezuela",
        "elevation": "1.362 m",
        "yaw": 155.6,
        "pitch": -1.8,
        "desc": "Pequeño macizo montañoso, enclavado entre los municipios de Bedmar y Jódar."
      },
      {
        "id": "peak-1794228850652",
        "title": "Morra del Peleo",
        "elevation": "1.606 m",
        "yaw": 177,
        "pitch": -7.6,
        "desc": "La \"Tríada\" de la Sierra de la Cruz: Junto al Morro de Cabacillas (1.604 m) y los Morros de Camaramarila."
      },
      {
        "id": "peak-1794229056449",
        "title": "Golondrina",
        "elevation": "1.139 m",
        "yaw": 172.7,
        "pitch": -4.2,
        "desc": "En la zona se localizan importantes estaciones con pinturas rupestres."
      },
      {
        "id": "peak-1794229186776",
        "title": "El Yelmo",
        "elevation": "1.808 m",
        "yaw": -179.3,
        "pitch": -7.4,
        "desc": "El Yelmo es uno de los enclaves de referencia en España para la práctica del parapente y el vuelo libre"
      },
      {
        "id": "peak-1794229692448",
        "title": "Cerro Gordo",
        "elevation": "1.528 m",
        "yaw": -126.9,
        "pitch": -9.3,
        "desc": "Se ubica en el término municipal de Bélmez de la Moraleda, delimitando por su vertiente oeste con el imponente Barranco del Gargantón."
      },
      {
        "id": "peak-1794229833670",
        "title": "Cerro Postrero",
        "elevation": "1.444 m",
        "yaw": -91.9,
        "pitch": 0,
        "desc": "Muy cerca del municipio de Pedro Martínez, en la provincia de Granada, y forma parte del entorno del Geoparque de Granada."
      },
      {
        "id": "peak-1794229940838",
        "title": "Pico Mulhacén",
        "elevation": "3.479 m",
        "yaw": -64.2,
        "pitch": 2.2,
        "desc": "El Mulhacén es el pico más alto de la península ibérica y el segundo de España tras el Teide en Tenerife (Islas Canarias)."
      },
      {
        "id": "peak-1794230060471",
        "title": "Pico Veleta",
        "elevation": "3.396 m",
        "yaw": -60.7,
        "pitch": 2,
        "desc": "En su cumbre confluyen los términos municipales de Dílar, Monachil, Güéjar Sierra y Capileira."
      },
      {
        "id": "peak-1794230355611",
        "title": "Alta Coloma",
        "elevation": "1.696 m",
        "yaw": -20.4,
        "pitch": 0.3,
        "desc": "En su interior se encuentra el acuífero de Alta Coloma, que abastece al Nacimiento de Arbuniel."
      },
      {
        "id": "peak-1794231294883",
        "title": "Pico Mágina",
        "elevation": "2.165 m",
        "yaw": 30,
        "pitch": 3.9,
        "desc": "Es el pico más alto de esta provincia de Jaén y se encuentra en la divisoria de los términos municipales de Albanchez de Mágina y de Huelma."
      },
      {
        "id": "peak-1794231387426",
        "title": "Cerro Cárceles",
        "elevation": "2.054 m",
        "yaw": 63.2,
        "pitch": 2.2,
        "desc": "Se encuentra en la cuerda principal al norte del Pico Mágina, muy cerca de otras cumbres conocidas como Peña Jaén y el Cerro Ponce."
      }
    ]
  }
};

window.SCENES_DATA = SCENES_DATA;
