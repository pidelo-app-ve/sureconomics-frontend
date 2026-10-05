/**
 * Cómo se ve «La guacamaya va a su casa»: el dibujo de cada fotograma en un canvas 2D.
 *
 * Todo a mano, con trazados, sin imágenes ni librerías: el juego entero pesa unos pocos
 * kilobytes y no pide nada a la red. La escena es la de Caracas a la caída de la tarde
 * -- el Ávila, la ciudad, la Cota Mil con sus barandas amarillas -- y el reloj del juego
 * es el reloj del cielo: a los 0 segundos hay sol alto y a los 60 es de noche. El
 * jugador ve el tiempo que le queda sin mirar el número.
 *
 * Lo que es decorado (estrellas, cordillera, edificios del fondo) sale de una semilla
 * fija y no de la del día: el paisaje es siempre el mismo Caracas, lo que cambia cada
 * día es el vuelo.
 */

import { ALTO, DURACION, SUELO, mulberry32, xDeLaGuacamaya, forma } from "./motor";
import { PLUMAJE_BASE } from "./plumajes";

/* —— Color ——————————————————————————————————————————————————————————— */

const hexARgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Interpola entre varios colores repartidos de 0 a 1. */
const tramo = (colores, t) => {
  const k = Math.max(0, Math.min(1, t)) * (colores.length - 1);
  const i = Math.min(colores.length - 2, Math.floor(k));
  const f = k - i;
  const a = hexARgb(colores[i]);
  const b = hexARgb(colores[i + 1]);
  const c = a.map((v, j) => Math.round(v + (b[j] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

// La tarde de Caracas, de las cinco a las siete: dorado, naranja, malva, noche.
const CIELO_ARRIBA = ["#f2a65a", "#d9655b", "#6a3f7a", "#1d1a3a"];
const CIELO_ABAJO = ["#ffd89a", "#f6a15f", "#c46a6f", "#3a2a52"];
const SIERRA_LEJOS = ["#a07ab8", "#7b5aa6", "#4a3a72", "#262040"];
const SIERRA_CERCA = ["#4f8f55", "#3c7347", "#27493a", "#152820"];
const CIUDAD = ["#6e5a8c", "#56466f", "#3a3052", "#221c33"];
const EDIFICIO = ["#5a4a7e", "#4a3d68", "#342b4d", "#1f1a30"];

/* —— La escena fija ——————————————————————————————————————————————————— */

/** Lo que no cambia en todo el vuelo: se calcula una vez por tamaño de pantalla. */
export const crearEscena = (ancho) => {
  const rng = mulberry32(20261005);
  const estrellas = Array.from({ length: 70 }, () => ({
    x: rng() * ancho,
    y: rng() * (SUELO - 260),
    r: 0.6 + rng() * 1.2,
    brillo: 0.4 + rng() * 0.6,
  }));
  // Un tramo de ciudad de fondo, que se repite: 1200 unidades bastan para no notarlo.
  const TRAMO = 1200;
  const bloques = [];
  for (let x = 0; x < TRAMO; ) {
    const w = 34 + rng() * 60;
    const h = 60 + rng() * 120;
    bloques.push({ x, w, h, ventanas: rng() });
    x += w + rng() * 8;
  }
  return { ancho, estrellas, bloques, tramo: TRAMO, efectos: [] };
};

/** Una cresta de montaña hecha con senos: suave, irregular y que se puede repetir. */
const cresta = (x, base, amplitud, semilla) =>
  base -
  amplitud *
    (0.55 * Math.sin(x * 0.006 + semilla) +
      0.3 * Math.sin(x * 0.017 + semilla * 2.1) +
      0.15 * Math.sin(x * 0.041 + semilla * 3.7));

const dibujarSierra = (ctx, ancho, desplazamiento, base, amplitud, semilla, color) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, SUELO);
  for (let x = 0; x <= ancho + 8; x += 8) {
    ctx.lineTo(x, cresta(x + desplazamiento, base, amplitud, semilla));
  }
  ctx.lineTo(ancho, SUELO);
  ctx.closePath();
  ctx.fill();
};

/* —— Las figuras ————————————————————————————————————————————————————— */

const TAU = Math.PI * 2;

const elipse = (ctx, color, x, y, rx, ry, rot = 0) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fill();
};

const circulo = (ctx, color, x, y, r) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
};

/**
 * Los accesorios se dibujaron sobre una guacamaya algo más chica (cabeza en 11,-6 de
 * radio 8; esta la tiene en 13,-5 de radio 9). En vez de recalcular cada trazo, se
 * dibujan en ese espacio y se llevan a este con una escala y un desplazamiento.
 */
const enEspacioDeAccesorios = (ctx, dibujo) => {
  ctx.save();
  ctx.translate(0.625, 1.75);
  ctx.scale(1.125, 1.125);
  dibujo();
  ctx.restore();
};

/** Lo que va detrás del cuerpo: el fajo bajo las patas, orejas y cuernos tras la cabeza. */
const accesoriosDetras = (ctx, extra) => {
  if (extra === "dolar") {
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i % 2 ? "#7ab873" : "#8fcb88";
      ctx.fillRect(-5 + i, 8 + i * 1.6, 15, 6);
      ctx.strokeStyle = "#3f7a3a";
      ctx.lineWidth = 0.6;
      ctx.strokeRect(-5 + i, 8 + i * 1.6, 15, 6);
    }
    ctx.fillStyle = "#e8c34a";
    ctx.fillRect(1.5, 8, 2.6, 10);
  } else if (extra === "oso") {
    for (const ox of [6, 15]) circulo(ctx, "#5a341c", ox, -13, 3.8);
    for (const ox of [6, 15]) circulo(ctx, "#e0a3a0", ox, -13, 1.8);
  } else if (extra === "toro") {
    ctx.strokeStyle = "#f3e6c4";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(7, -11);
    ctx.quadraticCurveTo(1, -17, 5, -21);
    ctx.moveTo(15, -12);
    ctx.quadraticCurveTo(21, -18, 17, -22);
    ctx.stroke();
    ctx.lineCap = "butt";
  }
};

/** Una gorra sobre la cabeza: la copa recortada al casco, con sus franjas, y la visera. */
const gorra = (ctx, franjas, visera, adorno) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(11, -8.5, 8.6, Math.PI, 0);
  ctx.closePath();
  ctx.clip();
  for (const [color, y, alto] of franjas) {
    ctx.fillStyle = color;
    ctx.fillRect(1, y, 22, alto);
  }
  adorno?.();
  ctx.restore();
  elipse(ctx, visera, 19, -8.6, 6.3, 1.5, 0.08);
};

/** Lo que va encima: flotador, pelota, botones, lentes, gorras y sombrero. */
const accesoriosDelante = (ctx, extra) => {
  if (extra === "roques") {
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = "#ff5a5a";
    ctx.beginPath();
    ctx.ellipse(1, 5, 16, 5, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.setLineDash([]);
    elipse(ctx, "#111", 14.8, -6.8, 3.8, 2.9);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(11, -7.5);
    ctx.lineTo(5, -8);
    ctx.stroke();
    elipse(ctx, "rgba(255,255,255,0.7)", 13.6, -7.8, 1.2, 0.6, -0.4);
  } else if (extra === "pelotera") {
    circulo(ctx, "#fbf8f0", 5, 11.5, 3.4);
    ctx.strokeStyle = "#d6282b";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(2.6, 11.5, 2.4, -0.9, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(7.4, 11.5, 2.4, Math.PI - 0.9, Math.PI + 0.9);
    ctx.stroke();
    gorra(ctx, [["#f4f1ea", -18, 10], ["#1b2a4a", -10.6, 2]], "#14203a");
    circulo(ctx, "#1b2a4a", 11, -17, 1.1);
  } else if (extra === "tricolor") {
    gorra(ctx, [["#ffcc00", -18, 4.4], ["#0b3fa8", -13.6, 2.6], ["#d21f2a", -11, 2.6]], "#d21f2a", () => {
      for (let i = 0; i < 8; i += 1) {
        const an = Math.PI * (1.12 + i * 0.11);
        circulo(ctx, "#fff", 11 + Math.cos(an) * 6.8, -6.2 + Math.sin(an) * 6.8, 0.55);
      }
    });
  } else if (extra === "liqui") {
    for (const [bx, by] of [[8, -3], [9, 0.5], [9.5, 4], [9, 7.5]]) circulo(ctx, "#d9b44a", bx, by, 1);
    // El sombrero llanero.
    elipse(ctx, "#2b1d12", 11, -13, 11.5, 2.3);
    ctx.beginPath();
    ctx.moveTo(5, -13);
    ctx.lineTo(6, -20);
    ctx.quadraticCurveTo(11, -22, 16, -20);
    ctx.lineTo(17, -13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7a1f1f";
    ctx.fillRect(5.4, -15.6, 11.2, 1.8);
  } else if (extra === "toro") {
    ctx.strokeStyle = "#d9b44a";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(22.4, -1.2, 2, 0, TAU);
    ctx.stroke();
  }
};

/** El zamuro arrepentido: el plumaje que cambia el ave entera. */
const dibujarZamuroJugador = (ctx, fase) => {
  const w = Math.sin(fase);
  ctx.scale(-1, 1);
  ctx.fillStyle = "#17141c";
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.quadraticCurveTo(-10, -14 - w * 10, -30, -8 - w * 16);
  ctx.lineTo(-24, -2 - w * 8);
  ctx.lineTo(-30, 0 - w * 10);
  ctx.quadraticCurveTo(-12, 4, -4, 4);
  ctx.moveTo(4, -2);
  ctx.quadraticCurveTo(10, -14 - w * 10, 28, -10 - w * 16);
  ctx.lineTo(22, -3 - w * 8);
  ctx.lineTo(26, -1 - w * 10);
  ctx.quadraticCurveTo(12, 4, 4, 4);
  ctx.fill();
  elipse(ctx, "#1f1b24", 0, 1, 13, 7);
  circulo(ctx, "#4a4550", -13, -1, 4.5);
  ctx.fillStyle = "#cfc6b8";
  ctx.beginPath();
  ctx.moveTo(-17, -2);
  ctx.lineTo(-23, 0);
  ctx.lineTo(-17, 1.5);
  ctx.fill();
  circulo(ctx, "#ff6a3d", -14, -2, 1);
};

/**
 * La guacamaya, con el plumaje que lleve puesto. Mira a la derecha; `angulo` la inclina
 * según sube o cae, `fase` mueve el ala.
 */
export const dibujarGuacamaya = (ctx, x, y, angulo, fase, alfa = 1, plumaje = PLUMAJE_BASE) => {
  const c = plumaje.c;
  const extra = plumaje.extra;
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(x, y);
  ctx.rotate(angulo);

  if (extra === "zamuro") {
    enEspacioDeAccesorios(ctx, () => dibujarZamuroJugador(ctx, fase));
    ctx.restore();
    return;
  }

  enEspacioDeAccesorios(ctx, () => accesoriosDetras(ctx, extra));

  // La cola larga, en dos plumas.
  ctx.fillStyle = c.cola;
  ctx.beginPath();
  ctx.moveTo(-12, 2);
  ctx.quadraticCurveTo(-30, 4, -40, 14);
  ctx.quadraticCurveTo(-28, 8, -12, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.colaB;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.quadraticCurveTo(-28, -1, -38, 6);
  ctx.quadraticCurveTo(-26, 4, -12, 5);
  ctx.closePath();
  ctx.fill();

  // El cuerpo y el pecho.
  elipse(ctx, c.cuerpo, 0, 0, 17, 12);
  elipse(ctx, c.barriga, 4, 5, 11, 7, -0.2);
  if (extra === "brillo") elipse(ctx, "rgba(255,255,255,0.45)", -3, -6, 8, 2.5, -0.2);

  // La cabeza: frente, cara, ojo y pico curvo.
  circulo(ctx, c.cabeza, 13, -5, 9);
  ctx.fillStyle = c.frente;
  ctx.beginPath();
  ctx.arc(12, -11, 4.5, Math.PI, Math.PI * 2);
  ctx.fill();
  elipse(ctx, c.cara, 16, -4, 5, 4);
  if (extra === "turpial") {
    // El antifaz azul y el ojo amarillo del turpial.
    elipse(ctx, "#3c7be0", 16.5, -6, 3.8, 3);
    circulo(ctx, "#ffd27a", 16.5, -6, 1.8);
    circulo(ctx, "#111", 16.7, -6, 1);
  } else {
    circulo(ctx, "#111", 16.5, -6, 1.7);
  }
  ctx.fillStyle = c.pico;
  ctx.beginPath();
  ctx.moveTo(20, -7);
  ctx.quadraticCurveTo(29, -6, 27, 1);
  ctx.quadraticCurveTo(24, -2, 20, -1);
  ctx.closePath();
  ctx.fill();
  if (extra === "roja") {
    // El pico claro de la roja, con la punta oscura.
    ctx.fillStyle = "#1c1c1c";
    ctx.beginPath();
    ctx.moveTo(24.5, -2);
    ctx.lineTo(27, 1);
    ctx.lineTo(27.4, -2.6);
    ctx.closePath();
    ctx.fill();
  }

  // El ala, que bate. Por debajo asoma el otro color.
  const batida = Math.sin(fase) * 0.9;
  ctx.save();
  ctx.translate(-2, -2);
  ctx.rotate(-0.4 + batida);
  elipse(ctx, c.alaBajo, -6, -2, 14, 6);
  elipse(ctx, c.ala, -7, -4, 14, 6);
  ctx.restore();

  enEspacioDeAccesorios(ctx, () => accesoriosDelante(ctx, extra));

  ctx.restore();
};

const dibujarMango = (ctx, x, y, fase) => {
  const flota = Math.sin(fase * 3) * 3;
  ctx.save();
  ctx.translate(x, y + flota);
  ctx.rotate(0.35);
  const g = ctx.createLinearGradient(-8, -10, 8, 10);
  g.addColorStop(0, "#ffd23f");
  g.addColorStop(1, "#ff7a1a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2f9e44";
  ctx.beginPath();
  ctx.ellipse(4, -12, 5, 2.4, -0.6, 0, Math.PI * 2);
  ctx.fill();
  // Un brillo, para que se lea como fruta y no como moneda.
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(-3, -4, 2.2, 3.6, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const dibujarEdificio = (ctx, o, prog, ahora) => {
  const y = SUELO - o.h;
  ctx.fillStyle = tramo(EDIFICIO, prog);
  ctx.fillRect(o.x, y, o.w, o.h);
  // Un borde de luz del lado del sol.
  ctx.fillStyle = "rgba(255,190,120,0.18)";
  ctx.fillRect(o.x + o.w - 4, y, 4, o.h);
  // Ventanas: más encendidas cuanto más tarde.
  const rng = mulberry32(o.ventanas);
  const encendidas = 0.25 + prog * 0.6;
  for (let fy = y + 12; fy < SUELO - 14; fy += 18) {
    for (let fx = o.x + 9; fx < o.x + o.w - 12; fx += 14) {
      if (rng() < encendidas) {
        ctx.fillStyle = `rgba(255,${200 + Math.floor(rng() * 40)},120,${0.55 + prog * 0.4})`;
        ctx.fillRect(fx, fy, 6, 8);
      }
    }
  }
  // La antena con su luz roja que titila.
  ctx.strokeStyle = "rgba(30,24,40,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(o.x + o.w / 2, y);
  ctx.lineTo(o.x + o.w / 2, y - 26);
  ctx.stroke();
  if (Math.sin(ahora * 4 + o.ventanas) > 0) {
    ctx.fillStyle = "#ff4a3d";
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, y - 27, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

const dibujarPapagayo = (ctx, o) => {
  const { circulo } = forma(o);
  const { x, y } = circulo;
  // El hilo, hasta la calle: es lo que hace que se lea como papagayo y no como rombo.
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 22);
  ctx.quadraticCurveTo(x + 40, (y + SUELO) / 2, x + 90, SUELO);
  ctx.stroke();
  // La cometa.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(o.fase * 2) * 0.15);
  ctx.fillStyle = o.color;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(17, 0);
  ctx.lineTo(0, 24);
  ctx.lineTo(-17, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, 24);
  ctx.moveTo(-17, 0);
  ctx.lineTo(17, 0);
  ctx.stroke();
  // La cola, con sus lazos.
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.moveTo(0, 24);
  for (let i = 1; i <= 4; i += 1) ctx.lineTo(Math.sin(o.fase * 4 + i) * 6, 24 + i * 9);
  ctx.stroke();
  ctx.restore();
};

const dibujarZamuro = (ctx, o) => {
  const { x, y } = forma(o).circulo;
  const ala = Math.sin(o.fase * 9) * 9;
  ctx.fillStyle = "#16131c";
  ctx.beginPath();
  ctx.ellipse(x, y, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 2);
  ctx.lineTo(x - 24, y - 6 - ala);
  ctx.lineTo(x - 2, y + 2);
  ctx.moveTo(x + 4, y - 2);
  ctx.lineTo(x + 22, y - 6 - ala);
  ctx.lineTo(x + 2, y + 2);
  ctx.fill();
  // Cabeza gris, mirando hacia la guacamaya.
  ctx.fillStyle = "#6b6670";
  ctx.beginPath();
  ctx.arc(x - 14, y - 1, 4, 0, Math.PI * 2);
  ctx.fill();
};

const dibujarTormenta = (ctx, o, conRayos, rayo) => {
  const { x, y, w, h } = o;
  ctx.fillStyle = "#4a4766";
  ctx.beginPath();
  ctx.ellipse(x, y + 6, w / 2, h / 3, 0, 0, Math.PI * 2);
  ctx.arc(x - w / 4, y - 4, h / 2.6, 0, Math.PI * 2);
  ctx.arc(x + w / 6, y - 10, h / 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(x + w / 6, y - 14, h / 3, 0, Math.PI * 2);
  ctx.fill();
  // El rayo, de vez en cuando: avisa de que esa nube no se atraviesa.
  // Con la guacamaya del Catatumbo el rayo sale morado, con su resplandor.
  if (conRayos && Math.sin(o.fase * 2.3) > 0.82) {
    ctx.save();
    ctx.strokeStyle = rayo?.trazo ?? "#ffe25a";
    if (rayo) {
      ctx.shadowColor = rayo.sombra;
      ctx.shadowBlur = 18;
    }
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 18);
    ctx.lineTo(x - 4, y + 34);
    ctx.lineTo(x + 6, y + 34);
    ctx.lineTo(x - 6, y + 54);
    ctx.stroke();
    ctx.restore();
  }
};

/* —— Un fotograma —————————————————————————————————————————————————————— */

/**
 * Dibuja el estado `p` del motor. `ahora` es el reloj real (para titilar luces y batir
 * alas aunque el juego esté en la portada); `reducido` quita los destellos y la estela;
 * `plumaje` es el que lleva puesto la guacamaya.
 */
export const dibujar = (ctx, p, escena, ahora, { reducido = false, plumaje = PLUMAJE_BASE } = {}) => {
  const { ancho } = escena;
  const prog = p.t / DURACION;

  // El cielo.
  const cielo = ctx.createLinearGradient(0, 0, 0, SUELO);
  cielo.addColorStop(0, tramo(CIELO_ARRIBA, prog));
  cielo.addColorStop(1, tramo(CIELO_ABAJO, prog));
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, ancho, ALTO);

  // Las estrellas, a partir de la mitad del vuelo.
  const noche = Math.max(0, (prog - 0.55) / 0.45);
  if (noche > 0) {
    for (const e of escena.estrellas) {
      ctx.fillStyle = `rgba(255,248,230,${noche * e.brillo})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // El sol, que baja detrás del Ávila.
  const sx = ancho * 0.7;
  const sy = ALTO * 0.24 + (SUELO - 120 - ALTO * 0.24) * Math.pow(prog, 1.1);
  const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, 120);
  halo.addColorStop(0, "rgba(255,236,170,0.55)");
  halo.addColorStop(1, "rgba(255,236,170,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(sx - 120, sy - 120, 240, 240);
  ctx.fillStyle = tramo(["#fff4c2", "#ffd36b", "#ff9a4a", "#ff7a3a"], prog);
  ctx.beginPath();
  ctx.arc(sx, sy, 32, 0, Math.PI * 2);
  ctx.fill();

  // El Ávila: una sierra lejana y otra cercana, a distintas velocidades.
  dibujarSierra(ctx, ancho, p.recorrido * 0.06, SUELO - 205, 60, 1.3, tramo(SIERRA_LEJOS, prog));
  dibujarSierra(ctx, ancho, p.recorrido * 0.14, SUELO - 135, 44, 4.1, tramo(SIERRA_CERCA, prog));

  // La ciudad de fondo, con sus ventanas.
  const desplaz = (p.recorrido * 0.4) % escena.tramo;
  ctx.fillStyle = tramo(CIUDAD, prog);
  for (let rep = 0; rep < 2 + Math.ceil(ancho / escena.tramo); rep += 1) {
    for (const b of escena.bloques) {
      const x = b.x - desplaz + rep * escena.tramo;
      if (x > ancho || x + b.w < 0) continue;
      ctx.fillRect(x, SUELO - b.h, b.w, b.h);
    }
  }
  const luz = 0.15 + prog * 0.7;
  ctx.fillStyle = `rgba(255,214,130,${luz})`;
  for (let rep = 0; rep < 2 + Math.ceil(ancho / escena.tramo); rep += 1) {
    for (const b of escena.bloques) {
      const x = b.x - desplaz + rep * escena.tramo;
      if (x > ancho || x + b.w < 0) continue;
      for (let fy = SUELO - b.h + 8; fy < SUELO - 8; fy += 13) {
        if ((Math.sin(fy * 7.3 + b.ventanas * 50) + 1) / 2 < 0.45) {
          ctx.fillRect(x + 5 + ((fy * 3) % Math.max(6, b.w - 12)), fy, 3, 4);
        }
      }
    }
  }

  // Lo que hay que esquivar.
  for (const o of p.obstaculos) {
    if (o.tipo === "edificio") dibujarEdificio(ctx, o, prog, ahora);
    else if (o.tipo === "papagayo") dibujarPapagayo(ctx, o);
    else if (o.tipo === "zamuro") dibujarZamuro(ctx, o);
    else dibujarTormenta(ctx, o, !reducido, plumaje.rayo);
  }

  // Lo que hay que recoger.
  for (const m of p.mangosEnVuelo) dibujarMango(ctx, m.x, m.y, m.fase);

  // La Cota Mil: el asfalto, sus barandas amarillas y las rayas del carril.
  ctx.fillStyle = tramo(["#3a3344", "#2d2838", "#221e2c", "#17141f"], prog);
  ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
  const paso = 46;
  const off = p.recorrido % paso;
  ctx.fillStyle = "#f2b632";
  ctx.fillRect(0, SUELO - 3, ancho, 3);
  for (let x = -off; x < ancho; x += paso) ctx.fillRect(x, SUELO - 14, 4, 12);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  const off2 = (p.recorrido * 1.6) % 60;
  for (let x = -off2; x < ancho; x += 60) ctx.fillRect(x, SUELO + 30, 28, 3);

  // La guacamaya. Parpadea mientras es invulnerable tras un golpe.
  const gx = xDeLaGuacamaya(p);
  const angulo = Math.max(-0.5, Math.min(0.7, p.vy / 700));
  const fase = p.aleteo > 0 ? ahora * 40 : ahora * 9;
  const parpadeo = p.invulnerable > 0 && Math.floor(ahora * 12) % 2 === 0 ? 0.35 : 1;

  // La estela de los plumajes que brillan: chispas que nacen detrás y se quedan atrás.
  const dt = Math.min(1 / 30, Math.max(0, ahora - (escena.ultimoCuadro ?? ahora)));
  escena.ultimoCuadro = ahora;
  escena.rastro = (escena.rastro ?? []).filter((q) => q.vida > 0);
  if (plumaje.rastro && !reducido && !p.terminada) {
    for (let n = Math.random() < dt * 30 ? 1 : 0; n > 0; n -= 1) {
      escena.rastro.push({
        x: gx - 18,
        y: p.y + (Math.random() - 0.5) * 10,
        vx: -30 - Math.random() * 40,
        vy: (Math.random() - 0.5) * 40,
        r: 1 + Math.random() * 1.4,
        color: plumaje.rastro[Math.random() < 0.5 ? 0 : 1],
        vida: 0.7,
      });
    }
  }
  for (const q of escena.rastro) {
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vida -= dt * 1.4;
    ctx.globalAlpha = Math.max(0, Math.min(1, q.vida));
    circulo(ctx, q.color, q.x, q.y, q.r);
  }
  ctx.globalAlpha = 1;

  dibujarGuacamaya(ctx, gx, p.y, angulo, fase, parpadeo, plumaje);

  // Los efectos: el «+10» de cada mango, que sube y se apaga.
  escena.efectos = escena.efectos.filter((e) => ahora - e.desde < 0.8);
  ctx.font = "700 18px 'Host Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  for (const e of escena.efectos) {
    const k = (ahora - e.desde) / 0.8;
    ctx.fillStyle = `rgba(255,230,140,${1 - k})`;
    ctx.fillText(e.texto, e.x, e.y - 20 - k * 26);
  }
};

/** Apunta un efecto para dibujarlo durante un momento (un mango recogido). */
export const efecto = (escena, ahora, x, y, texto) => {
  escena.efectos.push({ desde: ahora, x, y, texto });
};
