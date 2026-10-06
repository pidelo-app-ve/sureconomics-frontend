/**
 * Las herramientas de pintura que comparten los escenarios, los obstáculos y la guacamaya:
 * mezclar colores, trazar una cresta de montaña, repetir un tramo con paralaje.
 *
 * Todo a mano, sin imágenes: cada escenario pesa lo que pesa su código.
 */

import { SUELO } from "./motor";

export const TAU = Math.PI * 2;

const hexARgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Interpola entre varios colores repartidos de 0 a 1. */
export const tramo = (colores, t) => {
  const k = Math.max(0, Math.min(1, t)) * (colores.length - 1);
  const i = Math.min(colores.length - 2, Math.floor(k));
  const f = k - i;
  const a = hexARgb(colores[i]);
  const b = hexARgb(colores[i + 1]);
  const c = a.map((v, j) => Math.round(v + (b[j] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/** Un número estable entre 0 y 1 a partir de otro: para variar un tramo sin guardar nada. */
export const ruido = (n) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Repite `dibujar(x, indice)` a lo ancho, desplazado `desplaz` unidades: el fondo que
 * pasa. `indice` es el número del tramo (negativo o no), para que cada uno salga distinto
 * pero siempre igual cuando se vuelve a pasar por él.
 */
export const teselas = (ancho, desplaz, largo, dibujar) => {
  const base = Math.floor(desplaz / largo);
  const resto = desplaz - base * largo;
  for (let k = -1; k * largo - resto < ancho + largo; k += 1) dibujar(k * largo - resto, base + k);
};

export const elipse = (ctx, color, x, y, rx, ry, rot = 0) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fill();
};

export const circulo = (ctx, color, x, y, r) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
};

/** Una cresta de montaña hecha con senos: suave, irregular y que se puede repetir. */
export const cresta = (x, base, amplitud, semilla) =>
  base -
  amplitud *
    (0.55 * Math.sin(x * 0.006 + semilla) +
      0.3 * Math.sin(x * 0.017 + semilla * 2.1) +
      0.15 * Math.sin(x * 0.041 + semilla * 3.7));

export const dibujarSierra = (ctx, ancho, desplazamiento, base, amplitud, semilla, color) => {
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

/** Una palmera de silueta o de color: tronco curvo y hojas en arco. */
export const palmera = (ctx, x, base, alto, color, hojas = color) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, alto * 0.06);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x + alto * 0.12, base - alto * 0.5, x + alto * 0.04, base - alto);
  ctx.stroke();
  ctx.strokeStyle = hojas;
  ctx.lineWidth = Math.max(1.6, alto * 0.045);
  const cx = x + alto * 0.04;
  const cy = base - alto;
  for (const a of [-2.7, -2.2, -1.7, -1.2, -0.7, -0.3, 0.1]) {
    const lx = cx + Math.cos(a) * alto * 0.46;
    const ly = cy + Math.sin(a) * alto * 0.2 + alto * 0.18;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(a) * alto * 0.28, cy - alto * 0.16, lx, ly);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
};
