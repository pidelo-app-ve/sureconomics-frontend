/**
 * Los siete vuelos: lo que cambia de uno a otro, solo como datos.
 *
 * Cada nivel dura lo mismo, un minuto (es «un minuto de pausa»), y se juega sobre el
 * mismo motor. Lo que cambia es:
 *
 * - **`vel`**: la velocidad del mundo, al empezar y al terminar el minuto.
 * - **`hueco`**: la distancia entre obstáculos, igual. Menos hueco, menos aire.
 * - **`pool`**: qué puede aparecer y cuándo. Cada fila es `[tipo, peso, desde]`: el peso
 *   relativo y el punto del vuelo (de 0 a 1) en que ese tipo entra en juego.
 * - **`mangos`**: la probabilidad de que cada obstáculo traiga mangos.
 * - **`rafagas`**: corrientes que empujan a la guacamaya, con aviso antes de llegar.
 * - **`niebla`**: solo visual, pero cambia cómo se lee lo que viene.
 * - **`escenario`**: qué pinta `escenarios.js` detrás.
 *
 * Cada vuelo estrena **una cosa**, que es lo que se aprende en él: las palomas en
 * Barquisimeto, las abejas y las ráfagas en Margarita, los grillos y las torres en el
 * Zulia, los aviones en La Guaira. El sexto, el de la loma, no tiene obstáculos: tiene
 * un jefe que tira piedras. Después, el viento y los remolinos de los médanos de Coro,
 * la nieve y el teleférico de Mérida, y el sol y las térmicas del llano de Barinas.
 * Canaima, con rocas y niebla, cierra el juego y es el más difícil.
 *
 * **El número de un vuelo puede cambiar** (en octubre de 2026 la loma pasó del 7 al 6 y
 * Canaima al último): lo que no cambia es su `clave`, y por eso el progreso guardado va
 * por clave y no por número (`registro.js`).
 *
 * Los nombres y las frases que se leen no están aquí sino en `i18n/<idioma>/juegos.json`
 * (`juegos.guacamaya.niveles.<clave>`).
 */

/** Cómo se dibuja y mide el «edificio» de cada escenario: la misma pieza con otra forma. */
const ESTILOS = {
  edificio: { estilo: "edificio", w: [64, 100], h: [110, 300] },
  palmera: { estilo: "palmera", w: [30, 42], h: [120, 230] },
  torre: { estilo: "torre", w: [38, 54], h: [130, 300] },
  grua: { estilo: "grua", w: [60, 90], h: [130, 290] },
  // Los médanos de Coro: cardones, altos y flacos.
  cardon: { estilo: "cardon", w: [26, 40], h: [130, 260] },
  // Mérida: las torres del teleférico.
  pilon: { estilo: "pilon", w: [36, 52], h: [150, 300] },
};

export const NIVELES = [
  {
    id: 1,
    clave: "caracas",
    escenario: "caracas",
    vel: [195, 255],
    hueco: [320, 230],
    mangos: 0.58,
    edificio: ESTILOS.edificio,
    pool: [
      ["edificio", 0.42, 0],
      ["papagayo", 0.33, 0],
      ["zamuro", 0.3, 0.15],
      ["tormenta", 0.22, 0.3],
    ],
  },
  {
    id: 2,
    clave: "barquisimeto",
    escenario: "barquisimeto",
    vel: [220, 285],
    hueco: [292, 210],
    mangos: 0.56,
    edificio: ESTILOS.edificio,
    pool: [
      ["edificio", 0.28, 0],
      ["papagayo", 0.24, 0],
      ["paloma", 0.38, 0],
      ["zamuro", 0.22, 0.15],
      ["tormenta", 0.14, 0.4],
    ],
  },
  {
    id: 3,
    clave: "margarita",
    escenario: "margarita",
    vel: [220, 285],
    hueco: [300, 215],
    mangos: 0.56,
    edificio: ESTILOS.palmera,
    rafagas: { cada: [7, 10], aviso: 0.9, dura: 1.5 },
    pool: [
      ["edificio", 0.24, 0],
      ["papagayo", 0.2, 0],
      ["abejas", 0.3, 0],
      ["paloma", 0.2, 0],
      ["zamuro", 0.16, 0.2],
      ["tormenta", 0.1, 0.5],
    ],
  },
  {
    id: 4,
    clave: "zulia",
    escenario: "zulia",
    vel: [256, 332],
    hueco: [275, 192],
    mangos: 0.54,
    edificio: ESTILOS.torre,
    pool: [
      ["edificio", 0.24, 0],
      ["grillo", 0.34, 0],
      ["zamuro", 0.22, 0.1],
      ["tormenta", 0.42, 0],
      ["paloma", 0.14, 0.2],
    ],
  },
  {
    id: 5,
    clave: "laguaira",
    escenario: "laguaira",
    vel: [260, 330],
    hueco: [280, 198],
    mangos: 0.52,
    edificio: ESTILOS.grua,
    pool: [
      ["edificio", 0.2, 0],
      ["avion", 0.4, 0.05],
      ["papagayo", 0.14, 0],
      ["paloma", 0.14, 0],
      ["grillo", 0.12, 0],
      ["tormenta", 0.12, 0.35],
    ],
  },
  {
    id: 6,
    clave: "loma",
    escenario: "loma",
    // El mundo pasa despacio: aquí no hay nada que esquivar salvo lo que viene de la loma.
    vel: [150, 185],
    hueco: [260, 220],
    mangos: 0.75,
    jefe: true,
    pool: [],
  },
  {
    id: 7,
    clave: "coro",
    escenario: "coro",
    vel: [278, 352],
    hueco: [252, 176],
    mangos: 0.52,
    edificio: ESTILOS.cardon,
    // Lo que estrena: el viento. Ráfagas más seguidas, más largas y más fuertes que las de
    // Margarita, y remolinos de arena que salen del suelo.
    rafagas: { cada: [2.4, 3.8], aviso: 0.7, dura: 3, sube: -0.95, hunde: 2.5 },
    pool: [
      ["edificio", 0.22, 0],
      ["remolino", 0.38, 0],
      ["zamuro", 0.14, 0],
      ["papagayo", 0.12, 0],
      ["paloma", 0.14, 0],
    ],
  },
  {
    id: 8,
    clave: "merida",
    escenario: "merida",
    vel: [258, 330],
    hueco: [278, 195],
    mangos: 0.52,
    edificio: ESTILOS.pilon,
    // Lo que estrena: la nieve. Cuando nieva, la guacamaya pesa más y cada aleteo sube
    // menos. Y las cabinas del teleférico, que vienen de frente.
    nevadas: { cada: [5, 8], aviso: 1.1, dura: 4, peso: 1.3, aleteo: 0.86 },
    pool: [
      ["edificio", 0.26, 0],
      ["cabina", 0.3, 0],
      ["condor", 0.22, 0],
      ["paloma", 0.1, 0.2],
      ["tormenta", 0.12, 0.35],
    ],
  },
  {
    id: 9,
    clave: "barinas",
    escenario: "barinas",
    vel: [278, 350],
    hueco: [250, 176],
    mangos: 0.55,
    edificio: ESTILOS.palmera,
    // Lo que estrena: el sol del llano. Corrientes de aire caliente que levantan de golpe,
    // muchas veces hacia una bandada de garzas.
    pool: [
      ["edificio", 0.24, 0],
      ["termica", 0.32, 0],
      ["garza", 0.22, 0],
      ["zamuro", 0.12, 0],
      ["grillo", 0.1, 0],
    ],
  },
  {
    id: 10,
    clave: "canaima",
    escenario: "canaima",
    vel: [276, 352],
    hueco: [262, 180],
    mangos: 0.52,
    niebla: true,
    /** El paso entre dos rocas, al empezar y al terminar. Siempre cabe: ver `crearGrupo`. */
    paso: [225, 182],
    pool: [
      ["roca", 0.4, 0],
      ["abejas", 0.22, 0],
      ["zamuro", 0.16, 0.1],
      ["tormenta", 0.16, 0.3],
      ["avion", 0.12, 0.4],
    ],
  },
];

export const POR_ID = Object.fromEntries(NIVELES.map((n) => [n.id, n]));

/** El nivel con ese número; si no existe, el primero. */
export const nivelDe = (id) => POR_ID[id] ?? NIVELES[0];

/** El siguiente vuelo, o `null` si era el último. */
export const siguienteDe = (id) => POR_ID[id + 1] ?? null;
