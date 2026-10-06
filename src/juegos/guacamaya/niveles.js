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
 * Zulia, los aviones en La Guaira, las rocas y la niebla en Canaima. El último, el de la
 * loma, no tiene obstáculos: tiene un jefe que tira piedras.
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
    clave: "canaima",
    escenario: "canaima",
    vel: [270, 345],
    hueco: [270, 185],
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
  {
    id: 7,
    clave: "loma",
    escenario: "loma",
    // El mundo pasa despacio: aquí no hay nada que esquivar salvo lo que viene de la loma.
    vel: [150, 185],
    hueco: [260, 220],
    mangos: 0.75,
    jefe: true,
    pool: [],
  },
];

export const POR_ID = Object.fromEntries(NIVELES.map((n) => [n.id, n]));

/** El nivel con ese número; si no existe, el primero. */
export const nivelDe = (id) => POR_ID[id] ?? NIVELES[0];

/** El siguiente vuelo, o `null` si era el último. */
export const siguienteDe = (id) => POR_ID[id + 1] ?? null;
