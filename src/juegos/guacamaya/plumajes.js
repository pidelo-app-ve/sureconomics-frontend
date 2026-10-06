/**
 * Los plumajes de la guacamaya y la alcancía de mangos con que se compran.
 *
 * Solo cuentan los mangos que llegan a casa: si la guacamaya pierde las tres vidas, los
 * de ese vuelo se pierden. Así cada vuelo tiene algo en juego además de los puntos.
 *
 * Igual que el récord (`registro.js`), vive solo en este navegador, sin cuenta y sin
 * nada que viaje al servidor, y todo acceso va en try/catch: con el almacenamiento
 * bloqueado se juega igual, solo que con la guacamaya de siempre.
 *
 * El nombre y la nota de cada plumaje no están aquí: viven en los diccionarios
 * (`juegos.guacamaya.plumajes.<id>.nombre` y `.nota`) y la tienda los lee con `t()`.
 * Aquí quedan el `id`, el precio, los colores y los accesorios, que no tienen idioma.
 */

const CLAVE = "se_pausa_guacamaya_plumajes";

/** Los colores de la guacamaya de siempre. Las demás cambian los que necesitan. */
const AZUL = {
  cuerpo: "#1f6fd1",
  barriga: "#ffc928",
  cabeza: "#1f6fd1",
  frente: "#3aa66b",
  cara: "#f4efe6",
  pico: "#1d1d22",
  ala: "#1556a8",
  alaBajo: "#e0a91f",
  cola: "#1a58ad",
  colaB: "#2f7fe0",
};

const con = (cambios) => ({ ...AZUL, ...cambios });

/**
 * El catálogo, del más barato al más caro. `extra` dice qué accesorio o efecto lleva;
 * lo pinta `dibujo.js`. `rastro` deja estela al volar; `rayo` cambia el color de los
 * rayos de las tormentas.
 */
export const PLUMAJES = [
  { id: "azul", precio: 0, c: AZUL },
  {
    id: "roja",
    precio: 20,
    extra: "roja",
    c: con({ cuerpo: "#d92b2f", barriga: "#c42127", cabeza: "#d92b2f", frente: "#d92b2f", ala: "#ffc21a", alaBajo: "#2257c9", cola: "#c41f24", colaB: "#2257c9", pico: "#efe6d6" }),
  },
  {
    id: "turpial",
    precio: 25,
    extra: "turpial",
    c: con({ cuerpo: "#ff8a1c", barriga: "#ffa63a", cabeza: "#141414", frente: "#141414", cara: "#141414", pico: "#9aa0a8", ala: "#141414", alaBajo: "#f2f2f2", cola: "#141414", colaB: "#141414" }),
  },
  { id: "pelotera", precio: 30, extra: "pelotera", c: AZUL },
  { id: "roques", precio: 35, extra: "roques", c: AZUL },
  { id: "tricolor", precio: 40, extra: "tricolor", c: AZUL },
  {
    id: "liqui",
    precio: 45,
    extra: "liqui",
    c: con({ cuerpo: "#f4efe2", barriga: "#ebe4d2", cabeza: "#2a7de1", ala: "#e2dac6", alaBajo: "#2a7de1", cola: "#2a7de1", colaB: "#ffc93c" }),
  },
  {
    id: "catatumbo",
    precio: 60,
    extra: "brillo",
    rastro: ["#9fe8ff", "#ffe14d"],
    rayo: { trazo: "#e9dcff", sombra: "#a066ff" },
    c: con({ cuerpo: "#3d4bff", barriga: "#9fe8ff", cabeza: "#3d4bff", frente: "#9fe8ff", cara: "#e8f6ff", ala: "#2430c9", alaBajo: "#ffe14d", cola: "#2430c9", colaB: "#ffe14d" }),
  },
  {
    id: "toro",
    precio: 70,
    extra: "toro",
    c: con({ cuerpo: "#1f9d55", barriga: "#b8f0c8", cabeza: "#1f9d55", frente: "#b8f0c8", cara: "#f2fbf4", ala: "#167a41", alaBajo: "#0d5a2e", cola: "#167a41", colaB: "#b8f0c8" }),
  },
  {
    id: "oso",
    precio: 70,
    extra: "oso",
    c: con({ cuerpo: "#7a4a2a", barriga: "#c99c6c", cabeza: "#7a4a2a", frente: "#7a4a2a", cara: "#efdcc4", ala: "#5a341c", alaBajo: "#3b2010", cola: "#5a341c", colaB: "#c99c6c" }),
  },
  {
    id: "dolar",
    precio: 80,
    extra: "dolar",
    c: con({ cuerpo: "#2e8b57", barriga: "#cfe8c9", cabeza: "#2e8b57", frente: "#cfe8c9", cara: "#f3faf1", ala: "#1f6b42", alaBajo: "#0f4a2a", cola: "#1f6b42", colaB: "#cfe8c9" }),
  },
  {
    id: "dorada",
    precio: 100,
    extra: "brillo",
    rastro: ["#fff3b0", "#ffd23f"],
    c: con({ cuerpo: "#e8b923", barriga: "#fff0a8", cabeza: "#e8b923", frente: "#fff3c4", cara: "#fffaf0", ala: "#c9931a", alaBajo: "#8a5e0c", cola: "#d19c18", colaB: "#fff0a8" }),
  },
  { id: "zamuro", precio: 150, extra: "zamuro", c: AZUL },
];

export const PLUMAJE_BASE = PLUMAJES[0];

export const plumajePorId = (id) => PLUMAJES.find((k) => k.id === id) ?? PLUMAJE_BASE;

const leer = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLAVE) || "null");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const escribir = (v) => {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(v));
  } catch {
    /* sin memoria, se juega igual */
  }
};

/** Lo guardado, ya saneado: mangos en la alcancía, plumajes comprados y el puesto. */
export const leerTienda = () => {
  const v = leer();
  const validos = new Set(PLUMAJES.map((k) => k.id));
  const tiene = ["azul", ...(Array.isArray(v.tiene) ? v.tiene : [])].filter(
    (id, i, a) => validos.has(id) && a.indexOf(id) === i
  );
  const puesto = tiene.includes(v.puesto) ? v.puesto : "azul";
  return { mangos: Math.max(0, Math.floor(Number(v.mangos) || 0)), tiene, puesto };
};

/** Mete en la alcancía los mangos que llegaron a casa. */
export const guardarMangos = (n) => {
  const t = leerTienda();
  const nueva = { ...t, mangos: t.mangos + Math.max(0, Math.floor(n) || 0) };
  escribir(nueva);
  return nueva;
};

/** Compra y se pone un plumaje. Devuelve la tienda nueva, o `null` si no alcanza. */
export const comprar = (id) => {
  const t = leerTienda();
  const k = PLUMAJES.find((x) => x.id === id);
  if (!k || t.tiene.includes(id) || t.mangos < k.precio) return null;
  const nueva = { mangos: t.mangos - k.precio, tiene: [...t.tiene, id], puesto: id };
  escribir(nueva);
  return nueva;
};

/** Se pone un plumaje que ya tiene. */
export const ponerse = (id) => {
  const t = leerTienda();
  if (!t.tiene.includes(id)) return t;
  const nueva = { ...t, puesto: id };
  escribir(nueva);
  return nueva;
};
