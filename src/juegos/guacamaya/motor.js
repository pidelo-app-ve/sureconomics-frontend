/**
 * El motor de «La guacamaya va a su casa»: física, mundo y puntuación, sin dibujar nada.
 *
 * Separado del dibujo y de React a propósito: así se prueba en Node, sin navegador, y
 * se puede afirmar lo que importa de un juego que se comparte -- que el vuelo de hoy es
 * el mismo para todos, que nunca aparece una pared imposible y que dura un minuto.
 *
 * ## El reto del día
 *
 * El mundo sale de un generador pseudoaleatorio con semilla. La semilla es la fecha de
 * Caracas, así que hoy todo el mundo esquiva los mismos zamuros en el mismo orden: «yo
 * llegué con 7 mangos» significa algo cuando el otro jugó el mismo vuelo. Mañana cambia.
 *
 * ## Unidades
 *
 * Todo se mide en un mundo de `ALTO` unidades de alto; el ancho depende de la pantalla
 * (`crearPartida({ ancho })`). La velocidad, la gravedad y los huecos están en esas
 * unidades, así que el juego se siente igual en un teléfono que en un portátil: lo que
 * cambia es cuánto se ve por delante, no lo difícil que es.
 */

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
/** El radio de la guacamaya para chocar. Algo menor que el dibujo: rozar no debe doler. */
export const RADIO = 13;
const RADIO_MANGO = 15;
/** Tras un golpe, un respiro sin poder volver a chocar. Parpadea mientras dura. */
const INVULNERABLE = 1.3;

/** Velocidad del mundo: arranca tranquila y aprieta hacia el final. */
const velocidad = (prog) => 200 + 70 * prog;
/** Distancia entre obstáculos: amplia al principio, más justa al final. */
const hueco = (prog) => 300 - 100 * prog;
/** Espacio libre que siempre queda encima de un edificio, para que se pueda pasar. */
const PASO_MINIMO = 230;

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

export const semillaDelDia = (dia = diaDeCaracas()) => semillaDe(`guacamaya-${dia}`);

/* —— La partida —————————————————————————————————————————————————————— */

const COLORES_PAPAGAYO = ["#ffcc33", "#2fbf71", "#e2483d", "#3a8dde", "#f07c2b"];

export const crearPartida = ({ ancho, semilla }) => ({
  ancho,
  rng: mulberry32(semilla),
  t: 0,
  recorrido: 0,
  y: ALTO * 0.42,
  vy: 0,
  aleteo: 0,
  vidas: VIDAS,
  mangos: 0,
  golpes: 0,
  invulnerable: 0,
  obstaculos: [],
  mangosEnVuelo: [],
  siguiente: 260,
  terminada: false,
  llego: false,
});

/** La x fija de la guacamaya: un poco a la izquierda, para ver lo que viene. */
export const xDeLaGuacamaya = (p) => p.ancho * 0.28;

export const aletear = (p) => {
  if (p.terminada) return;
  p.vy = ALETEO;
  p.aleteo = 0.22;
};

/** Cambia el ancho visible (girar el teléfono, redimensionar) sin reiniciar el vuelo. */
export const cambiarAncho = (p, ancho) => {
  p.ancho = ancho;
};

const entre = (rng, min, max) => min + rng() * (max - min);

const ponerMangos = (p, x, prog) => {
  const { rng } = p;
  if (rng() > 0.58) return;
  const y = entre(rng, 130, SUELO - 150);
  // A veces una pequeña fila de tres en arco: premia una curva de vuelo, no un toque.
  const enArco = prog > 0.1 && rng() < 0.25;
  const n = enArco ? 3 : 1;
  for (let i = 0; i < n; i += 1) {
    p.mangosEnVuelo.push({ x: x + i * 46, y: y - (enArco && i === 1 ? 30 : 0), fase: rng() * 6 });
  }
};

const elegirTipo = (rng, prog) => {
  const pesos = [
    ["edificio", 0.42],
    ["papagayo", 0.33],
    ["zamuro", prog > 0.15 ? 0.3 : 0],
    ["tormenta", prog > 0.3 ? 0.22 : 0],
  ];
  const total = pesos.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [tipo, w] of pesos) {
    r -= w;
    if (r <= 0) return tipo;
  }
  return "edificio";
};

const crearObstaculo = (p, prog) => {
  const { rng } = p;
  const x = p.ancho + 60;
  const tipo = elegirTipo(rng, prog);
  if (tipo === "edificio") {
    const w = entre(rng, 64, 100);
    const alto = Math.min(110 + (0.6 * rng() + 0.4 * prog) * 190, SUELO - PASO_MINIMO);
    return { tipo, x, w, h: alto, fase: 0, ventanas: Math.floor(rng() * 1e6) };
  }
  if (tipo === "papagayo") {
    return {
      tipo,
      x,
      y: entre(rng, 110, SUELO - 170),
      fase: rng() * 6,
      color: COLORES_PAPAGAYO[Math.floor(rng() * COLORES_PAPAGAYO.length)],
    };
  }
  if (tipo === "zamuro") {
    return { tipo, x, y: entre(rng, 90, SUELO - 200), fase: rng() * 6, extra: entre(rng, 40, 95) };
  }
  return { tipo: "tormenta", x, y: entre(rng, 70, 240), w: 132, h: 64, fase: rng() * 6 };
};

/* —— Formas para chocar ———————————————————————————————————————————————— */

/** La caja o el círculo con que choca cada obstáculo, en coordenadas de pantalla. */
export const forma = (o) => {
  switch (o.tipo) {
    case "edificio":
      return { rect: { x: o.x, y: SUELO - o.h, w: o.w, h: o.h } };
    // Los que se mueven chocan con un círculo menor que el dibujo: es un juego de un
    // minuto para descansar de leer, y un roce con la punta de un ala no debe costar
    // una vida. Medido con un piloto automático: con los radios del dibujo solo llegaba
    // a casa uno de cada diez vuelos.
    case "papagayo":
      return { circulo: { x: o.x, y: o.y + Math.sin(o.fase * 1.6) * 20, r: 15 } };
    case "zamuro":
      return { circulo: { x: o.x, y: o.y + Math.sin(o.fase * 3) * 18, r: 13 } };
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
  if (f.rect) return chocaCirculoRect(cx, p.y, RADIO, f.rect);
  const { x, y, r } = f.circulo;
  return (cx - x) ** 2 + (p.y - y) ** 2 < (RADIO + r) ** 2;
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

  p.t = Math.min(DURACION, p.t + dt);
  const prog = p.t / DURACION;
  const vel = velocidad(prog);
  p.recorrido += vel * dt;

  // La guacamaya: gravedad, aleteo y techo. El techo no hace daño: frena.
  p.vy = Math.min(CAIDA_MAX, p.vy + GRAVEDAD * dt);
  p.y += p.vy * dt;
  if (p.y < RADIO) {
    p.y = RADIO;
    p.vy = 0;
  }
  p.aleteo = Math.max(0, p.aleteo - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt);

  // El mundo corre hacia la izquierda.
  for (const o of p.obstaculos) {
    o.x -= (vel + (o.extra || 0)) * dt;
    o.fase += dt;
  }
  for (const m of p.mangosEnVuelo) {
    m.x -= vel * dt;
    m.fase += dt;
  }
  p.obstaculos = p.obstaculos.filter((o) => o.x > -220);
  p.mangosEnVuelo = p.mangosEnVuelo.filter((m) => m.x > -40 && !m.tomado);

  // Lo que viene. En los últimos tres segundos no sale nada nuevo: la llegada a casa
  // no puede ser un zamuro que aparece en la puerta.
  p.siguiente -= vel * dt;
  if (p.siguiente <= 0 && p.t < DURACION - 3) {
    const o = crearObstaculo(p, prog);
    p.obstaculos.push(o);
    const gap = hueco(prog) * entre(p.rng, 0.85, 1.25);
    ponerMangos(p, o.x + gap / 2, prog);
    p.siguiente = gap;
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

/** Segundos que faltaban para llegar, para la pantalla final. */
export const faltaban = (p) => Math.max(0, Math.ceil(DURACION - p.t));
