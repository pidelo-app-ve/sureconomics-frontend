/**
 * El motor de «Vuela, guacamaya»: física, mundo y puntuación, sin dibujar nada.
 *
 * Separado del dibujo y de React a propósito: así se prueba en Node, sin navegador, y
 * se puede afirmar lo que importa de un juego que se comparte -- que el vuelo de hoy es
 * el mismo para todos, que nunca aparece una pared imposible y que dura un minuto.
 *
 * ## Los vuelos
 *
 * Todo lo que distingue un nivel de otro está en `niveles.js` como datos: velocidad,
 * huecos, qué obstáculos salen y cuándo, ráfagas, niebla. Este archivo solo sabe
 * crearlos y moverlos. El de la loma no tiene obstáculos: tiene un jefe que tira piedras
 * (`actualizarJefe`). El clima -- ráfagas, nieve, térmicas -- cambia la gravedad
 * (`gravedadEn`) y la nieve, además, el aleteo (`impulsoDeAleteo`).
 *
 * ## El reto del día
 *
 * El mundo sale de un generador pseudoaleatorio con semilla. La semilla es la fecha de
 * Caracas y el número de vuelo, así que hoy todo el mundo esquiva los mismos zamuros en
 * el mismo orden: «llegué a Canaima con 7 mangos» significa algo cuando el otro jugó el
 * mismo vuelo. Mañana cambia.
 *
 * El clima (las ráfagas) sale de **otro** generador, derivado del primero: así añadir o
 * quitar ráfagas no cambia qué obstáculos salen ni dónde.
 *
 * ## Unidades
 *
 * Todo se mide en un mundo de `ALTO` unidades de alto; el ancho depende de la pantalla
 * (`crearPartida({ ancho })`). La velocidad, la gravedad y los huecos están en esas
 * unidades, así que el juego se siente igual en un teléfono que en un portátil: lo que
 * cambia es cuánto se ve por delante, no lo difícil que es.
 */

import { nivelDe } from "./niveles.js";

/** Cuánto dura el vuelo, en segundos: «un minuto de pausa». */
export const DURACION = 60;
/** El alto del mundo, en unidades. */
export const ALTO = 600;
/** Donde empieza la calle: tocarla cuesta una vida. */
export const SUELO = ALTO - 58;
/** Vidas al empezar. */
export const VIDAS = 3;

const GRAVEDAD = 1500;
const ALETEO = -430;
const CAIDA_MAX = 620;
/** Con una corriente de aire hacia arriba la guacamaya no sube más rápido que esto. */
const ASCENSO_MAX = -420;
/** El radio de la guacamaya para chocar. Algo menor que el dibujo: rozar no debe doler. */
export const RADIO = 13;
const RADIO_MANGO = 15;
/** Tras un golpe, un respiro sin poder volver a chocar. Parpadea mientras dura. */
const INVULNERABLE = 1.3;
/** Espacio libre que siempre queda encima de un edificio, para que se pueda pasar. */
const PASO_MINIMO = 230;
/** En los últimos segundos no sale nada nuevo: la llegada a casa no puede ser una sorpresa. */
const SIN_NOVEDADES = 3;
/** Cuánto aviso da un avión antes de cruzar, en segundos. */
const AVISO_AVION = 0.85;
const VELOCIDAD_AVION = 470;

const lerp = (a, b, k) => a + (b - a) * k;
/** Velocidad del mundo: arranca tranquila y aprieta hacia el final. */
const velocidad = (n, prog) => lerp(n.vel[0], n.vel[1], prog);
/** Distancia entre obstáculos: amplia al principio, más justa al final. */
const hueco = (n, prog) => lerp(n.hueco[0], n.hueco[1], prog);

/* —— Azar con semilla ———————————————————————————————————————————————— */

/** Generador pequeño y conocido (mulberry32): misma semilla, misma secuencia, en cualquier navegador. */
export const mulberry32 = (semilla) => {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Un número estable a partir de un texto (FNV-1a). */
export const semillaDe = (texto) => {
  let h = 2166136261;
  for (const c of String(texto)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/**
 * El día de hoy en Caracas, `AAAA-MM-DD`. Venezuela está en UTC−4 todo el año (no hay
 * horario de verano desde 2016), así que basta con restar cuatro horas: el reto cambia
 * a la medianoche de Caracas para todos, juegue desde donde juegue.
 */
export const diaDeCaracas = (ahora = new Date()) =>
  new Date(ahora.getTime() - 4 * 3600 * 1000).toISOString().slice(0, 10);

/** La semilla de un vuelo de un día. El primero conserva la de siempre. */
export const semillaDelDia = (dia = diaDeCaracas(), nivel = 1) =>
  semillaDe(nivel === 1 ? `guacamaya-${dia}` : `guacamaya-${dia}-n${nivel}`);

/* —— La partida —————————————————————————————————————————————————————— */

const COLORES_PAPAGAYO = ["#ffcc33", "#2fbf71", "#e2483d", "#3a8dde", "#f07c2b"];

const entre = (rng, min, max) => min + rng() * (max - min);

const crearJefe = (ancho) => ({
  x: ancho - 58,
  y: SUELO - 96,
  estado: "espera",
  // Un par de segundos para ubicarse antes de la primera piedra.
  resta: 2.4,
  carga: 0,
  cargaMax: 0.8,
  pend: [],
  lanzadas: 0,
});

/**
 * `nivel` es el número de vuelo (o su ficha de `niveles.js`). Sin él, el primero.
 */
export const crearPartida = ({ ancho, semilla, nivel = 1 }) => {
  const n = typeof nivel === "object" ? nivel : nivelDe(nivel);
  const clima = mulberry32(semilla ^ 0x9e3779b9);
  return {
    ancho,
    nivel: n,
    rng: mulberry32(semilla),
    clima,
    t: 0,
    recorrido: 0,
    y: ALTO * 0.42,
    vy: 0,
    aleteo: 0,
    vidas: VIDAS,
    mangos: 0,
    mangosSalidos: 0,
    golpes: 0,
    invulnerable: 0,
    obstaculos: [],
    mangosEnVuelo: [],
    siguiente: 260,
    terminada: false,
    llego: false,
    // Las corrientes de aire: `null` en los vuelos que no las tienen.
    rafaga: n.rafagas ? { fase: "espera", resta: entre(clima, 4, 7), signo: 1 } : null,
    // La nieve de Mérida: igual que el viento, con calma, aviso y nevada.
    nieve: n.nevadas ? { fase: "espera", resta: entre(clima, 3, 5) } : null,
    // Las rocas encadenan sus pasos: cada uno parte de dónde quedó el anterior.
    centroRoca: null,
    piedras: [],
    jefe: n.jefe ? crearJefe(ancho) : null,
  };
};

/** La x fija de la guacamaya: un poco a la izquierda, para ver lo que viene. */
export const xDeLaGuacamaya = (p) => p.ancho * 0.28;

export const aletear = (p) => {
  if (p.terminada) return;
  p.vy = impulsoDeAleteo(p);
  p.aleteo = 0.22;
};

/** El empujón de un aleteo ahora mismo: con las alas cargadas de nieve, menos. */
export const impulsoDeAleteo = (p) =>
  p.nieve?.fase === "activa" && p.t < DURACION - SIN_NOVEDADES ? ALETEO * p.nivel.nevadas.aleteo : ALETEO;

/** Cambia el ancho visible (girar el teléfono, redimensionar) sin reiniciar el vuelo. */
export const cambiarAncho = (p, ancho) => {
  p.ancho = ancho;
  if (p.jefe) p.jefe.x = ancho - 58;
};

const ponerMangos = (p, x, prog, yFijo) => {
  const { rng } = p;
  if (rng() > p.nivel.mangos) return;
  const y = yFijo ?? entre(rng, 130, SUELO - 150);
  // A veces una pequeña fila de tres en arco: premia una curva de vuelo, no un toque.
  const enArco = yFijo === undefined && prog > 0.1 && rng() < 0.25;
  const n = enArco ? 3 : 1;
  for (let i = 0; i < n; i += 1) {
    p.mangosEnVuelo.push({ x: x + i * 46, y: y - (enArco && i === 1 ? 30 : 0), fase: rng() * 6 });
  }
  p.mangosSalidos += n;
};

const elegirTipo = (rng, prog, pool) => {
  const abiertos = pool.filter(([, , desde]) => prog >= desde);
  const total = abiertos.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [tipo, w] of abiertos) {
    r -= w;
    if (r <= 0) return tipo;
  }
  return abiertos[0][0];
};

/**
 * Lo que aparece a la derecha: un obstáculo o un grupo (una bandada, un enjambre, las dos
 * rocas de un paso). Devuelve los obstáculos, cuánto espacio extra ocupa el grupo y, si
 * hay un sitio obvio para un mango, dónde.
 */
const crearGrupo = (p, prog) => {
  const { rng, nivel } = p;
  const x = p.ancho + 60;
  const tipo = elegirTipo(rng, prog, nivel.pool);

  if (tipo === "edificio") {
    const e = nivel.edificio;
    const w = entre(rng, e.w[0], e.w[1]);
    const alto = Math.min(e.h[0] + (0.6 * rng() + 0.4 * prog) * (e.h[1] - e.h[0]), SUELO - PASO_MINIMO);
    return { obs: [{ tipo, x, w, h: alto, fase: 0, ventanas: Math.floor(rng() * 1e6), estilo: e.estilo }], largo: 0 };
  }
  if (tipo === "papagayo") {
    return {
      obs: [
        {
          tipo,
          x,
          y: entre(rng, 110, SUELO - 170),
          fase: rng() * 6,
          color: COLORES_PAPAGAYO[Math.floor(rng() * COLORES_PAPAGAYO.length)],
        },
      ],
      largo: 0,
    };
  }
  if (tipo === "zamuro") {
    return { obs: [{ tipo, x, y: entre(rng, 90, SUELO - 200), fase: rng() * 6, extra: entre(rng, 40, 95) }], largo: 0 };
  }
  if (tipo === "paloma") {
    // Una bandada en uve: la guía y una a cada lado, un poco detrás.
    const y0 = entre(rng, 120, SUELO - 190);
    const obs = [
      [0, 0],
      [36, -24],
      [36, 24],
    ].map(([dx, dy]) => ({ tipo, x: x + dx, y: y0 + dy, fase: rng() * 6 }));
    return { obs, largo: 36 };
  }
  if (tipo === "abejas") {
    // Un enjambre: cinco abejas que zigzaguean alrededor de un punto que avanza.
    const y0 = entre(rng, 130, SUELO - 210);
    const obs = Array.from({ length: 5 }, () => ({
      tipo: "abeja",
      x: x + rng() * 70,
      y: y0 + (rng() - 0.5) * 80,
      fase: rng() * 6,
      amp: entre(rng, 14, 30),
      giro: entre(rng, 4, 6),
    }));
    return { obs, largo: 70 };
  }
  if (tipo === "grillo") {
    // Salta desde la calle: sube y baja con su propio ritmo, sin pasar de cierta altura.
    return {
      obs: [{ tipo, x, alto: entre(rng, 120, 185), fase: rng() * 6, ritmo: entre(rng, 2, 2.8) }],
      largo: 0,
    };
  }
  if (tipo === "avion") {
    // Espera fuera de la pantalla mientras el aviso parpadea en el borde, y cruza deprisa.
    return {
      obs: [
        {
          tipo,
          x: p.ancho + 140,
          y: entre(rng, 100, SUELO - 150),
          fase: rng() * 6,
          espera: AVISO_AVION,
          extra: VELOCIDAD_AVION,
        },
      ],
      // Cruza en poco tiempo, así que lo siguiente sale algo más tarde.
      largo: 140,
    };
  }
  if (tipo === "roca") {
    // Dos rocas, una colgando y otra alzada, con un paso en medio que siempre cabe.
    const paso = lerp(nivel.paso[0], nivel.paso[1], prog);
    const minimo = 60 + paso / 2;
    const maximo = SUELO - 60 - paso / 2;
    const previo = p.centroRoca ?? entre(rng, minimo, maximo);
    // Lo que se puede subir o bajar entre un paso y el siguiente: lo que da el aleteo en
    // el tiempo que tarda en llegar, con holgura. Sin esto dos pasos seguidos podrían quedar
    // uno arriba y otro abajo sin tiempo para ir de uno a otro.
    const distancia = hueco(nivel, prog) + 90;
    const posible = Math.min(200, 0.55 * 300 * (distancia / velocidad(nivel, prog)));
    const centro = Math.max(minimo, Math.min(maximo, previo + (rng() * 2 - 1) * posible));
    p.centroRoca = centro;
    const w = entre(rng, 70, 95);
    const forma = Math.floor(rng() * 1e6);
    return {
      obs: [
        { tipo, x, w, y: 0, h: centro - paso / 2, desde: "arriba", forma },
        { tipo, x, w, y: centro + paso / 2, h: SUELO - (centro + paso / 2), desde: "abajo", forma: forma + 1 },
      ],
      largo: w,
      mangoY: centro,
      mangoX: w / 2,
    };
  }
  if (tipo === "remolino") {
    // Un remolino de arena de los médanos: una columna que sale del suelo y se mece.
    // Nunca tan alto que no deje pasar por encima.
    const alto = Math.min(entre(rng, 170, 270) + prog * 40, SUELO - PASO_MINIMO);
    const remolino = { tipo, x, alto, fase: rng() * 6, extra: entre(rng, 15, 45) };
    // Muchas veces con un zamuro encima: hay que pasar entre los dos, con el viento
    // empujando. El hueco nunca baja de lo que deja pasar una roca de Canaima.
    if (rng() < 0.8) {
      const techo = SUELO - alto;
      const y = Math.max(70, techo - entre(rng, 160, 195));
      return { obs: [remolino, { tipo: "zamuro", x: x + 10, y, fase: rng() * 6, extra: remolino.extra }], largo: 0 };
    }
    return { obs: [remolino], largo: 0 };
  }
  if (tipo === "cabina") {
    // Una cabina del teleférico, colgada de su cable, que viene de frente.
    return { obs: [{ tipo, x, y: entre(rng, 130, SUELO - 210), fase: rng() * 6, extra: entre(rng, 40, 80) }], largo: 0 };
  }
  if (tipo === "condor") {
    // El cóndor del páramo: grande, planea despacio y sube y baja mucho.
    return { obs: [{ tipo, x, y: entre(rng, 120, SUELO - 220), fase: rng() * 6, extra: entre(rng, 20, 55) }], largo: 0 };
  }
  if (tipo === "garza") {
    // Una bandada de garzas, en uve, como las palomas pero más altas y más anchas.
    const y0 = entre(rng, 110, SUELO - 220);
    const obs = [
      [0, 0],
      [42, -28],
      [42, 28],
    ].map(([dx, dy]) => ({ tipo, x: x + dx, y: y0 + dy, fase: rng() * 6 }));
    return { obs, largo: 42 };
  }
  if (tipo === "termica") {
    // Una corriente de aire caliente del llano: no se choca con ella, pero levanta de
    // golpe. Casi siempre trae garzas arriba: la trampa es subir hacia ellas.
    // Con fuerza bajo cero sube aunque no se aletee: hay que entrar bajo.
    const termica = { tipo, x: x + 110, w: 200, fuerza: -1.1, fase: rng() * 6 };
    const obs = [termica];
    if (rng() < 0.7) {
      // Las garzas, a la salida de la corriente: quien sube sin mirar, sale entre ellas.
      const y0 = entre(rng, 130, 300);
      obs.push(...[[200, 0], [240, -26], [240, 26]].map(([dx, dy]) => ({ tipo: "garza", x: x + dx, y: y0 + dy, fase: rng() * 6 })));
    }
    return { obs, largo: 240 };
  }
  return { obs: [{ tipo: "tormenta", x: x + 40, y: entre(rng, 70, 240), w: 132, h: 64, fase: rng() * 6 }], largo: 0 };
};

/* —— Formas para chocar ———————————————————————————————————————————————— */

/**
 * La caja o el círculo con que choca cada obstáculo, en coordenadas de pantalla; `null`
 * si ahora mismo no choca con nada (un avión que todavía no ha entrado).
 */
export const forma = (o) => {
  switch (o.tipo) {
    case "edificio":
      return { rect: { x: o.x, y: SUELO - o.h, w: o.w, h: o.h } };
    case "roca":
      return { rect: { x: o.x, y: o.y, w: o.w, h: o.h } };
    // Los que se mueven chocan con un círculo menor que el dibujo: es un juego de un
    // minuto para descansar de leer, y un roce con la punta de un ala no debe costar
    // una vida. Medido con un piloto automático: con los radios del dibujo solo llegaba
    // a casa uno de cada diez vuelos.
    case "papagayo":
      return { circulo: { x: o.x, y: o.y + Math.sin(o.fase * 1.6) * 20, r: 15 } };
    case "zamuro":
      return { circulo: { x: o.x, y: o.y + Math.sin(o.fase * 3) * 18, r: 13 } };
    case "paloma":
      return { circulo: { x: o.x, y: o.y + Math.sin(o.fase * 5) * 7, r: 11 } };
    case "abeja":
      return {
        circulo: {
          x: o.x + Math.cos(o.fase * o.giro) * 14,
          y: o.y + Math.sin(o.fase * o.giro) * o.amp,
          r: 8,
        },
      };
    case "grillo":
      return { circulo: { x: o.x, y: SUELO - 12 - Math.abs(Math.sin(o.fase * o.ritmo)) * o.alto, r: 11 } };
    case "avion":
      return o.espera > 0 ? null : { rect: { x: o.x - 50, y: o.y - 10, w: 100, h: 20 } };
    case "remolino":
      return { rect: { x: o.x - 17 + Math.sin(o.fase * 2.2) * 6, y: SUELO - o.alto, w: 34, h: o.alto } };
    case "cabina":
      return { rect: { x: o.x - 21, y: o.y - 14 + Math.sin(o.fase * 1.4) * 5, w: 42, h: 34 } };
    case "condor":
      return { circulo: { x: o.x, y: o.y + Math.sin(o.fase * 1.3) * 34, r: 16 } };
    case "garza":
      return { circulo: { x: o.x, y: o.y + Math.sin(o.fase * 3.6) * 8, r: 11 } };
    case "termica":
      return null; // no se choca: empuja (ver `gravedadEn`)
    default: // tormenta: un rectángulo algo menor que la nube dibujada
      return { rect: { x: o.x - o.w / 2 + 22, y: o.y - o.h / 2 + 14, w: o.w - 44, h: o.h - 26 } };
  }
};

const chocaCirculoRect = (cx, cy, r, { x, y, w, h }) => {
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
};

export const choca = (p, o) => {
  const cx = xDeLaGuacamaya(p);
  const f = forma(o);
  if (!f) return false;
  if (f.rect) return chocaCirculoRect(cx, p.y, RADIO, f.rect);
  const { x, y, r } = f.circulo;
  return (cx - x) ** 2 + (p.y - y) ** 2 < (RADIO + r) ** 2;
};

/* —— El clima ———————————————————————————————————————————————————————— */

/**
 * Las ráfagas: un tiempo de calma, un aviso (en el que se ve el viento pero todavía no
 * empuja) y la corriente, que sube o baja a la guacamaya. Cuánto empuja lo dice
 * `gravedadEn`.
 */
const pasoDelViento = (p, dt) => {
  const r = p.rafaga;
  if (!r) return;
  const cfg = p.nivel.rafagas;
  r.resta -= dt;
  if (r.resta <= 0) {
    if (r.fase === "espera") {
      r.fase = "aviso";
      r.resta = cfg.aviso;
      r.signo = p.clima() < 0.5 ? -1 : 1;
    } else if (r.fase === "aviso") {
      r.fase = "activa";
      r.resta = cfg.dura;
    } else {
      r.fase = "espera";
      r.resta = entre(p.clima, cfg.cada[0], cfg.cada[1]);
    }
  }
};

/** La nieve: calma, aviso (caen los primeros copos) y nevada, que carga las alas. */
const pasoDeLaNieve = (p, dt) => {
  const n = p.nieve;
  if (!n) return;
  const cfg = p.nivel.nevadas;
  n.resta -= dt;
  if (n.resta > 0) return;
  if (n.fase === "espera") {
    n.fase = "aviso";
    n.resta = cfg.aviso;
  } else if (n.fase === "aviso") {
    n.fase = "activa";
    n.resta = cfg.dura;
  } else {
    n.fase = "espera";
    n.resta = entre(p.clima, cfg.cada[0], cfg.cada[1]);
  }
};

/**
 * Cuánto vale la gravedad para quien vuela en `x`: 1 es la normal; negativa, una
 * corriente que levanta; mayor que uno, algo que hunde. Suma las ráfagas (con la fuerza
 * de cada vuelo: en los médanos soplan más), la nieve (pesa) y las térmicas del llano
 * (levantan a quien pasa por encima). `obstaculos` se puede cambiar para mirar el futuro.
 */
export const gravedadEn = (p, x, obstaculos = p.obstaculos) => {
  if (p.t >= DURACION - SIN_NOVEDADES) return 1;
  let f = 1;
  const r = p.rafaga;
  if (r?.fase === "activa") {
    const cfg = p.nivel.rafagas;
    f = r.signo < 0 ? cfg.sube ?? -0.35 : cfg.hunde ?? 1.6;
  }
  if (p.nieve?.fase === "activa" && f > 0) f *= p.nivel.nevadas.peso;
  for (const o of obstaculos) {
    if (o.tipo === "termica" && x >= o.x - o.w / 2 && x <= o.x + o.w / 2) {
      f = Math.min(f, o.fuerza);
      break;
    }
  }
  return f;
};

/* —— El jefe de la loma ———————————————————————————————————————————————— */

/**
 * Cómo tira piedras, de menos a más:
 *
 * - **Al empezar**, una piedra cada vez, con tiempo entre una y otra.
 * - **A partir de un cuarto**, a veces dos seguidas.
 * - **A partir de la mitad**, abanicos de tres y piedras en arco que caen desde arriba.
 * - **Al final**, ráfagas de cuatro.
 *
 * Antes de cada lanzamiento levanta el brazo (`carga`): hay un instante en que se ve que
 * apunta. La piedra sale hacia donde está la guacamaya **en ese momento**, un poco por
 * delante, y llega a su altura en un segundo: quien sigue moviéndose la esquiva.
 */
const elegirPatron = (p, prog) => {
  const r = p.rng();
  if (prog < 0.12) return "simple";
  if (prog < 0.4) return r < 0.5 ? "simple" : r < 0.8 ? "doble" : "lob";
  if (prog < 0.75) return r < 0.2 ? "simple" : r < 0.5 ? "abanico" : r < 0.75 ? "lob" : "doble";
  return r < 0.35 ? "racha" : r < 0.6 ? "abanico" : r < 0.82 ? "lob" : "doble";
};

const PATRONES = {
  simple: [{ en: 0, modo: "directa", desvio: 0 }],
  doble: [
    { en: 0, modo: "directa", desvio: 0 },
    { en: 0.35, modo: "directa", desvio: 0 },
  ],
  abanico: [
    { en: 0, modo: "directa", desvio: -75 },
    { en: 0, modo: "directa", desvio: 0 },
    { en: 0, modo: "directa", desvio: 75 },
  ],
  lob: [{ en: 0, modo: "lob", desvio: 0 }],
  racha: [0, 0.38, 0.76, 1.14].map((en) => ({ en, modo: "directa", desvio: 0 })),
};

const lanzarPiedra = (p, { modo, desvio }, prog) => {
  const j = p.jefe;
  const x0 = j.x - 20;
  const y0 = j.y - 40;
  const dx = x0 - xDeLaGuacamaya(p);
  // Un poco por delante de donde va: se apunta a donde estará, no a donde estaba.
  const objetivo = Math.max(60, Math.min(SUELO - 40, p.y + p.vy * 0.3 + desvio));
  const g = modo === "lob" ? 820 : 230;
  const T = modo === "lob" ? 1.05 : dx / lerp(360, 470, prog);
  p.piedras.push({
    x: x0,
    y: y0,
    vx: -dx / T,
    vy: (objetivo - y0) / T - 0.5 * g * T,
    g,
    r: 9,
    giro: 0,
  });
  j.lanzadas += 1;
};

const actualizarJefe = (p, dt, prog) => {
  const j = p.jefe;
  j.x = p.ancho - 58;
  j.vida = 1 - prog;

  for (const q of j.pend) q.en -= dt;
  const listas = j.pend.filter((q) => q.en <= 0);
  j.pend = j.pend.filter((q) => q.en > 0);
  for (const q of listas) lanzarPiedra(p, q, prog);

  const quedaTiempo = p.t < DURACION - SIN_NOVEDADES - 0.5;
  if (j.estado === "espera") {
    j.resta -= dt;
    if (j.resta <= 0 && quedaTiempo) {
      j.estado = "carga";
      j.cargaMax = lerp(0.7, 0.4, prog);
      j.carga = j.cargaMax;
      j.patron = elegirPatron(p, prog);
    }
  } else {
    j.carga -= dt;
    if (j.carga <= 0) {
      j.pend.push(...PATRONES[j.patron].map((q) => ({ ...q })));
      j.estado = "espera";
      j.resta = lerp(1.7, 0.8, prog) * entre(p.rng, 0.9, 1.15);
    }
  }
};

/* —— Un paso del mundo ———————————————————————————————————————————————— */

const golpe = (p, eventos, motivo) => {
  if (p.invulnerable > 0) return;
  p.vidas -= 1;
  p.golpes += 1;
  p.invulnerable = INVULNERABLE;
  eventos.push({ tipo: "golpe", motivo });
};

/**
 * Avanza `dt` segundos y devuelve lo que pasó (`golpe`, `mango`, `fin`) para que quien
 * dibuja pueda celebrarlo o sacudir la pantalla. `dt` llega acotado por quien llama.
 */
export const avanzar = (p, dt) => {
  const eventos = [];
  if (p.terminada) return eventos;

  const n = p.nivel;
  p.t = Math.min(DURACION, p.t + dt);
  const prog = p.t / DURACION;
  const vel = velocidad(n, prog);
  p.recorrido += vel * dt;

  // La guacamaya: gravedad (que el clima cambia), aleteo y techo. El techo no hace daño: frena.
  pasoDelViento(p, dt);
  pasoDeLaNieve(p, dt);
  const factor = gravedadEn(p, xDeLaGuacamaya(p));
  p.vy = Math.min(CAIDA_MAX, p.vy + GRAVEDAD * factor * dt);
  if (factor < 0) p.vy = Math.max(ASCENSO_MAX, p.vy);
  p.y += p.vy * dt;
  if (p.y < RADIO) {
    p.y = RADIO;
    p.vy = 0;
  }
  p.aleteo = Math.max(0, p.aleteo - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt);

  // El mundo corre hacia la izquierda.
  for (const o of p.obstaculos) {
    o.fase = (o.fase || 0) + dt;
    // Un avión no entra hasta que se acaba su aviso.
    if (o.tipo === "avion" && o.espera > 0) {
      o.espera -= dt;
      continue;
    }
    o.x -= (vel + (o.extra || 0)) * dt;
  }
  for (const m of p.mangosEnVuelo) {
    m.x -= vel * dt;
    m.fase += dt;
  }
  p.obstaculos = p.obstaculos.filter((o) => o.x > -220);
  p.mangosEnVuelo = p.mangosEnVuelo.filter((m) => m.x > -40 && !m.tomado);

  // Lo que viene.
  p.siguiente -= vel * dt;
  if (p.siguiente <= 0 && p.t < DURACION - SIN_NOVEDADES) {
    const gap = hueco(n, prog) * entre(p.rng, 0.85, 1.25);
    if (!n.pool.length) {
      // El vuelo del jefe: no hay obstáculos, solo mangos que tentar.
      ponerMangos(p, p.ancho + 60, prog);
      p.siguiente = gap;
    } else {
      const g = crearGrupo(p, prog);
      p.obstaculos.push(...g.obs);
      ponerMangos(p, g.obs[0].x + (g.mangoX ?? gap / 2), prog, g.mangoY);
      p.siguiente = gap + g.largo;
    }
  }

  if (p.jefe) {
    actualizarJefe(p, dt, prog);
    for (const s of p.piedras) {
      s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.giro += dt * 9;
    }
    p.piedras = p.piedras.filter((s) => s.x > -30 && s.y < SUELO && s.y > -120);
  }

  // La calle: cuesta una vida y devuelve hacia arriba, para no quedar pegado.
  if (p.y + RADIO >= SUELO) {
    p.y = SUELO - RADIO;
    golpe(p, eventos, "suelo");
    p.vy = ALETEO * 1.05;
  }

  for (const o of p.obstaculos) {
    if (p.invulnerable === 0 && choca(p, o)) {
      golpe(p, eventos, o.tipo);
      p.vy = Math.min(p.vy, -260);
    }
  }

  const gx = xDeLaGuacamaya(p);
  for (const s of p.piedras) {
    if (p.invulnerable === 0 && (gx - s.x) ** 2 + (p.y - s.y) ** 2 < (RADIO + s.r) ** 2) {
      s.x = -999; // se acabó: la filtra el próximo paso
      golpe(p, eventos, "piedra");
      p.vy = Math.min(p.vy, -260);
    }
  }
  for (const m of p.mangosEnVuelo) {
    if ((gx - m.x) ** 2 + (p.y - m.y) ** 2 < (RADIO + RADIO_MANGO) ** 2) {
      m.tomado = true;
      p.mangos += 1;
      eventos.push({ tipo: "mango", x: m.x, y: m.y });
    }
  }

  if (p.vidas <= 0) {
    p.terminada = true;
    p.llego = false;
    eventos.push({ tipo: "fin", llego: false });
  } else if (p.t >= DURACION) {
    p.terminada = true;
    p.llego = true;
    eventos.push({ tipo: "fin", llego: true });
  }
  return eventos;
};

/** Puntos: cada mango vale 10, cada segundo en el aire 1, y llegar a casa 100 más 20 por vida. */
export const puntuacion = (p) =>
  p.mangos * 10 + Math.floor(p.t) + (p.llego ? 100 + p.vidas * 20 : 0);

/**
 * Las estrellas de un vuelo, de 0 a 3: una por llegar a casa, otra por llegar sin un solo
 * golpe y otra por recoger al menos seis de cada diez mangos que salieron.
 */
export const estrellasDe = (p) => {
  if (!p.llego) return 0;
  let e = 1;
  if (p.golpes === 0) e += 1;
  if (p.mangosSalidos > 0 && p.mangos >= Math.ceil(p.mangosSalidos * 0.6)) e += 1;
  return e;
};

/** Segundos que faltaban para llegar, para la pantalla final. */
export const faltaban = (p) => Math.max(0, Math.ceil(DURACION - p.t));
