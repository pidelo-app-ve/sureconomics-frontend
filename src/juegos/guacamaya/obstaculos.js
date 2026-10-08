/**
 * Lo que hay que esquivar, pintado: los obstáculos de los siete vuelos, las piedras del
 * jefe y el propio jefe.
 *
 * Cada pieza se dibuja donde dice el motor (`forma(o)` da la caja o el círculo con que
 * choca, y el dibujo es siempre un poco mayor: un roce con la punta de un ala no cuesta
 * una vida). Aquí no hay lógica de juego, solo pincel.
 */

import { SUELO, forma, mulberry32 } from "./motor";
import { TAU, circulo, elipse, ruido, tramo } from "./pintura";

const EDIFICIO = ["#5a4a7e", "#4a3d68", "#342b4d", "#1f1a30"];

/* —— Lo que se levanta del suelo ————————————————————————————————————————— */

const dibujarBloque = (ctx, o, prog, ahora) => {
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
  if (Math.sin(ahora * 4 + o.ventanas) > 0) circulo(ctx, "#ff4a3d", o.x + o.w / 2, y - 27, 3);
};

/** Una palmera alta: tronco con anillos y la copa de hojas arriba. */
const dibujarPalmera = (ctx, o, prog) => {
  const cx = o.x + o.w / 2;
  const y = SUELO - o.h;
  const coco = tramo(["#7a5a2a", "#5a4228", "#33262e", "#140f18"], prog);
  ctx.fillStyle = tramo(["#8a6a48", "#6e5240", "#463446", "#1c1626"], prog);
  ctx.beginPath();
  ctx.moveTo(cx - o.w * 0.3, SUELO);
  ctx.quadraticCurveTo(cx - o.w * 0.1, SUELO - o.h * 0.5, cx - o.w * 0.18, y + 8);
  ctx.lineTo(cx + o.w * 0.18, y + 8);
  ctx.quadraticCurveTo(cx + o.w * 0.12, SUELO - o.h * 0.5, cx + o.w * 0.3, SUELO);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(20,10,20,0.22)";
  ctx.lineWidth = 1.2;
  for (let ay = SUELO - 14; ay > y + 14; ay -= 13) {
    ctx.beginPath();
    ctx.moveTo(cx - o.w * 0.28, ay);
    ctx.lineTo(cx + o.w * 0.28, ay + 2);
    ctx.stroke();
  }
  // La copa: hojas largas que se abren desde la punta.
  ctx.strokeStyle = tramo(["#3f9a52", "#2f7a46", "#1e5238", "#0c2218"], prog);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const fin = o.w * 1.15;
  for (const a of [-2.9, -2.4, -1.9, -1.35, -0.85, -0.35, 0.1]) {
    ctx.beginPath();
    ctx.moveTo(cx, y + 6);
    ctx.quadraticCurveTo(cx + Math.cos(a) * fin * 0.6, y - 18 + Math.sin(a) * 6, cx + Math.cos(a) * fin, y + 10 + Math.sin(a) * 12);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
  circulo(ctx, coco, cx - 4, y + 12, 3.6);
  circulo(ctx, coco, cx + 5, y + 13, 3.6);
};

/** Una torre petrolera: patas que se estrechan, travesaños en X y un mechero. */
const dibujarTorre = (ctx, o, prog, ahora) => {
  const y = SUELO - o.h;
  const cx = o.x + o.w / 2;
  ctx.strokeStyle = tramo(["#6a5a82", "#554870", "#3a3056", "#1f1a34"], prog);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(o.x, SUELO);
  ctx.lineTo(cx - 4, y);
  ctx.moveTo(o.x + o.w, SUELO);
  ctx.lineTo(cx + 4, y);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  const tramos = Math.max(3, Math.floor(o.h / 38));
  for (let k = 0; k < tramos; k += 1) {
    const f0 = k / tramos;
    const f1 = (k + 1) / tramos;
    const a0 = o.w * 0.5 * (1 - f0 * 0.85);
    const a1 = o.w * 0.5 * (1 - f1 * 0.85);
    const y0 = SUELO - o.h * f0;
    const y1 = SUELO - o.h * f1;
    ctx.moveTo(cx - a0, y0);
    ctx.lineTo(cx + a1, y1);
    ctx.moveTo(cx + a0, y0);
    ctx.lineTo(cx - a1, y1);
    ctx.moveTo(cx - a1, y1);
    ctx.lineTo(cx + a1, y1);
  }
  ctx.stroke();
  // El mechero: una llama que se mueve.
  const a = 1 + Math.sin(ahora * 9 + o.ventanas) * 0.2;
  elipse(ctx, "rgba(255,140,50,0.95)", cx, y - 9 * a, 5, 11 * a);
  elipse(ctx, "rgba(255,232,150,0.98)", cx, y - 6 * a, 2.6, 6 * a);
};

/** Una grúa de puerto: el mástil, la pluma larga y un contenedor colgando. */
const dibujarGrua = (ctx, o, prog, ahora) => {
  const y = SUELO - o.h;
  const mastil = o.x + o.w * 0.3;
  const oscuro = tramo(["#5a4a7e", "#4a3d68", "#342b4d", "#1f1a30"], prog);
  ctx.fillStyle = tramo(["#e2483d", "#c0403f", "#7a3050", "#2a1c3c"], prog);
  ctx.fillRect(mastil - 6, y, 12, o.h);
  ctx.fillRect(o.x - 4, y - 6, o.w + 8, 9);
  // El enrejado del mástil.
  ctx.strokeStyle = oscuro;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let ay = SUELO - 12; ay > y + 10; ay -= 20) {
    ctx.moveTo(mastil - 6, ay);
    ctx.lineTo(mastil + 6, ay - 20);
  }
  ctx.stroke();
  // El contenedor, que se mece del cable.
  const mece = Math.sin(ahora * 1.8 + o.ventanas) * 3;
  const cx = o.x + o.w * 0.82 + mece;
  ctx.beginPath();
  ctx.moveTo(o.x + o.w * 0.82, y + 3);
  ctx.lineTo(cx - 8, y + 30);
  ctx.moveTo(o.x + o.w * 0.82, y + 3);
  ctx.lineTo(cx + 8, y + 30);
  ctx.stroke();
  ctx.fillStyle = tramo(["#3a8dde", "#3a6ab0", "#3a4a82", "#1c2250"], prog);
  ctx.fillRect(cx - 12, y + 30, 24, 14);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  for (let k = -8; k <= 8; k += 8) {
    ctx.beginPath();
    ctx.moveTo(cx + k, y + 30);
    ctx.lineTo(cx + k, y + 44);
    ctx.stroke();
  }
  if (Math.sin(ahora * 4 + o.ventanas) > 0) circulo(ctx, "#ff4a3d", mastil, y - 12, 3);
};



/* —— Lo que vuela ————————————————————————————————————————————————————— */

const dibujarPapagayo = (ctx, o) => {
  const { x, y } = forma(o).circulo;
  // El hilo, hasta la calle: es lo que hace que se lea como papagayo y no como rombo.
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 22);
  ctx.quadraticCurveTo(x + 40, (y + SUELO) / 2, x + 90, SUELO);
  ctx.stroke();
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
  ctx.ellipse(x, y, 13, 7, 0, 0, TAU);
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
  circulo(ctx, "#6b6670", x - 14, y - 1, 4);
};

/** La paloma: gris, con el cuello verdoso, que bate las alas mirando hacia la guacamaya. */
const dibujarPaloma = (ctx, o) => {
  const { x, y } = forma(o).circulo;
  const ala = Math.sin(o.fase * 11);
  ctx.save();
  ctx.translate(x, y);
  // Ala de atrás.
  ctx.fillStyle = "#8d8aa0";
  ctx.beginPath();
  ctx.moveTo(2, -2);
  ctx.quadraticCurveTo(10, -14 - ala * 10, 20, -8 - ala * 12);
  ctx.quadraticCurveTo(10, -3, 2, 1);
  ctx.fill();
  elipse(ctx, "#b5b2c4", 0, 1, 13, 7.5);
  elipse(ctx, "#cfcce0", 2, 3, 8, 4);
  // Cola y cabeza.
  ctx.fillStyle = "#9a97ad";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(20, -3);
  ctx.lineTo(20, 5);
  ctx.closePath();
  ctx.fill();
  circulo(ctx, "#a9a6bc", -12, -3, 5.2);
  circulo(ctx, "#4f9a8a", -9, -1, 3);
  ctx.fillStyle = "#e8b04a";
  ctx.beginPath();
  ctx.moveTo(-16.5, -4);
  ctx.lineTo(-21, -2.5);
  ctx.lineTo(-16.5, -1.6);
  ctx.fill();
  circulo(ctx, "#ff7a3d", -13.4, -4.4, 1.2);
  // Ala de adelante.
  ctx.fillStyle = "#a3a0b8";
  ctx.beginPath();
  ctx.moveTo(-2, -1);
  ctx.quadraticCurveTo(4, -16 - ala * 12, 14, -11 - ala * 14);
  ctx.quadraticCurveTo(6, -4, 0, 2);
  ctx.fill();
  ctx.restore();
};

const dibujarAbeja = (ctx, o) => {
  const { x, y } = forma(o).circulo;
  const zumbido = Math.sin(o.fase * 38) * 3;
  elipse(ctx, "rgba(235,245,255,0.6)", x - 2, y - 7 - zumbido, 5, 3, -0.5);
  elipse(ctx, "rgba(235,245,255,0.6)", x + 3, y - 7 + zumbido, 5, 3, 0.5);
  elipse(ctx, "#ffc928", x, y, 8.5, 6);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, 8.5, 6, 0, 0, TAU);
  ctx.clip();
  ctx.fillStyle = "#1c1822";
  ctx.fillRect(x - 3.4, y - 7, 2.8, 14);
  ctx.fillRect(x + 1.6, y - 7, 2.8, 14);
  ctx.restore();
  circulo(ctx, "#1c1822", x - 8, y, 3.2);
  ctx.fillStyle = "#1c1822";
  ctx.beginPath();
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 12, y + 0.8);
  ctx.lineTo(x + 8, y + 1.6);
  ctx.fill();
};

/** El grillo: verde oliva, con las patas de atrás dobladas y las antenas largas. */
const dibujarGrillo = (ctx, o) => {
  const { x, y } = forma(o).circulo;
  const alto = Math.abs(Math.sin(o.fase * o.ritmo)); // 0 en la calle, 1 arriba
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.3 + alto * 0.5);
  ctx.strokeStyle = "#4a5a2a";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(4, 3);
  ctx.lineTo(12, -4);
  ctx.lineTo(16, 6 + (1 - alto) * 3);
  ctx.moveTo(-1, 4);
  ctx.lineTo(3, 9);
  ctx.moveTo(-9, -5);
  ctx.quadraticCurveTo(-18, -16, -26, -12);
  ctx.moveTo(-8, -3);
  ctx.quadraticCurveTo(-18, -8, -24, -3);
  ctx.stroke();
  ctx.lineCap = "butt";
  elipse(ctx, "#6a7a32", 2, 0, 12, 6.2);
  elipse(ctx, "#8a9a46", 0, -2, 8, 2.6, -0.1);
  circulo(ctx, "#5a6a2a", -9, -1.5, 4.6);
  circulo(ctx, "#fff", -10.6, -2.6, 1.3);
  circulo(ctx, "#111", -10.9, -2.6, 0.7);
  ctx.restore();
};

const COLORES_AVION = ["#e2483d", "#3a8dde", "#2fbf71", "#f07c2b"];

/** El avión: blanco con una franja y la cola de color, que cruza de derecha a izquierda. */
const dibujarAvion = (ctx, o) => {
  const color = COLORES_AVION[Math.floor(o.fase) % COLORES_AVION.length];
  ctx.save();
  ctx.translate(o.x, o.y);
  // La estela, detrás.
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(52, -3);
  ctx.lineTo(120, -3);
  ctx.moveTo(52, 4);
  ctx.lineTo(96, 4);
  ctx.stroke();
  // La cola (a la derecha) y el ala.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(34, -2);
  ctx.lineTo(54, -22);
  ctx.lineTo(60, -22);
  ctx.lineTo(54, -2);
  ctx.fill();
  ctx.fillStyle = "#d9d6e6";
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.lineTo(30, 20);
  ctx.lineTo(38, 20);
  ctx.lineTo(28, 4);
  ctx.fill();
  // El fuselaje.
  ctx.fillStyle = "#f6f4fa";
  ctx.beginPath();
  ctx.moveTo(-50, 2);
  ctx.quadraticCurveTo(-44, -9, -28, -9);
  ctx.lineTo(44, -7);
  ctx.quadraticCurveTo(56, -4, 56, 2);
  ctx.quadraticCurveTo(50, 8, 30, 8);
  ctx.lineTo(-30, 8);
  ctx.quadraticCurveTo(-46, 8, -50, 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(-46, 1, 98, 2.4);
  // Las ventanillas, la cabina y el motor.
  ctx.fillStyle = "#4a5a82";
  for (let k = -22; k < 38; k += 9) ctx.fillRect(k, -4, 4, 3);
  ctx.beginPath();
  ctx.moveTo(-42, -2);
  ctx.quadraticCurveTo(-38, -7, -30, -6);
  ctx.lineTo(-30, -2);
  ctx.fill();
  ctx.fillStyle = "#b9b5cc";
  ctx.fillRect(2, 9, 16, 5);
  ctx.restore();
};

/** El aviso de un avión que va a entrar: un triángulo que parpadea en el borde, a su altura. */
const dibujarAviso = (ctx, o, ancho, ahora) => {
  const x = ancho - 26;
  ctx.save();
  ctx.globalAlpha = Math.floor(ahora * 8) % 2 === 0 ? 1 : 0.35;
  ctx.fillStyle = "#ffcf33";
  ctx.beginPath();
  ctx.moveTo(x - 15, o.y);
  ctx.lineTo(x + 7, o.y - 14);
  ctx.lineTo(x + 7, o.y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1c1822";
  ctx.font = "800 15px 'Host Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("!", x + 2, o.y + 5);
  // Una línea tenue por donde va a pasar.
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#ffcf33";
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 18, o.y);
  ctx.lineTo(x - 260, o.y);
  ctx.stroke();
  ctx.restore();
};

const dibujarTormenta = (ctx, o, conRayos, rayo) => {
  const { x, y, w, h } = o;
  ctx.fillStyle = "#4a4766";
  ctx.beginPath();
  ctx.ellipse(x, y + 6, w / 2, h / 3, 0, 0, TAU);
  ctx.arc(x - w / 4, y - 4, h / 2.6, 0, TAU);
  ctx.arc(x + w / 6, y - 10, h / 2.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(x + w / 6, y - 14, h / 3, 0, TAU);
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

/* —— Las rocas de Canaima ———————————————————————————————————————————— */

/**
 * Una columna de roca que cuelga del techo o se alza del suelo, con el extremo libre
 * quebrado. La forma sale de `o.forma`, así que la misma roca se ve igual en cada
 * fotograma. El motor da la caja con que choca; el dibujo la rellena entera.
 */
const dibujarRoca = (ctx, o, prog) => {
  const rng = mulberry32(o.forma);
  const arriba = Math.min(o.y, o.y + o.h);
  const abajo = Math.max(o.y, o.y + o.h);
  const colgante = o.desde === "arriba";
  // El extremo libre es el de abajo si cuelga y el de arriba si se alza.
  const libre = colgante ? abajo : arriba;
  const pegado = colgante ? arriba : abajo;
  const sentido = colgante ? -1 : 1; // hacia dentro de la roca desde el extremo libre
  const dientes = 6;

  ctx.fillStyle = tramo(["#6a5a52", "#554848", "#3a3040", "#1c1626"], prog);
  ctx.beginPath();
  ctx.moveTo(o.x, pegado);
  ctx.lineTo(o.x, libre + sentido * 4);
  // Los dientes se hunden hacia dentro de la caja: la roca nunca sobresale de lo que choca.
  for (let k = 1; k <= dientes; k += 1) {
    const xk = o.x + (o.w * k) / dientes;
    ctx.lineTo(xk - o.w / dientes / 2, libre + sentido * (4 + rng() * 14));
    ctx.lineTo(xk, libre + sentido * rng() * 6);
  }
  ctx.lineTo(o.x + o.w, pegado);
  ctx.closePath();
  ctx.fill();

  // Una cara más clara a la izquierda y líneas de estrato.
  ctx.fillStyle = "rgba(255,230,200,0.1)";
  ctx.fillRect(o.x, arriba, o.w * 0.24, abajo - arriba);
  ctx.strokeStyle = "rgba(10,6,16,0.22)";
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 5; k += 1) {
    const y = arriba + ruido(o.forma + k) * (abajo - arriba);
    ctx.beginPath();
    ctx.moveTo(o.x + o.w * (0.08 + ruido(k) * 0.1), y);
    ctx.lineTo(o.x + o.w * (0.78 + ruido(k + 4) * 0.15), y + (ruido(k + 7) - 0.5) * 8);
    ctx.stroke();
  }
};

/* —— Los obstáculos de Coro, Mérida y Barinas ———————————————————————————— */

/** El cardón de los médanos: un tronco grueso con costillas y brazos que suben. */
const dibujarCardon = (ctx, o, prog) => {
  const cx = o.x + o.w / 2;
  const y = SUELO - o.h;
  const verde = tramo(["#4f8a3e", "#457a3a", "#2c4a34", "#101c16"], prog);
  const costilla = "rgba(20,40,20,0.3)";
  const tronco = o.w * 0.5;
  const columna = (x, y0, y1, ancho) => {
    ctx.fillStyle = verde;
    ctx.beginPath();
    ctx.moveTo(x - ancho / 2, y1);
    ctx.lineTo(x - ancho / 2, y0 + ancho / 2);
    ctx.arc(x, y0 + ancho / 2, ancho / 2, Math.PI, 0);
    ctx.lineTo(x + ancho / 2, y1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = costilla;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const f of [-0.22, 0, 0.22]) {
      ctx.moveTo(x + ancho * f, y0 + ancho * 0.4);
      ctx.lineTo(x + ancho * f, y1);
    }
    ctx.stroke();
  };
  // Los brazos: un codo horizontal y la subida.
  const brazo = (lado, altura, largo) => {
    const bx = cx + lado * o.w * 0.42;
    const by = SUELO - altura;
    ctx.fillStyle = verde;
    ctx.fillRect(Math.min(cx, bx), by - tronco * 0.35, Math.abs(bx - cx), tronco * 0.7);
    columna(bx, by - largo, by + tronco * 0.3, tronco * 0.7);
  };
  brazo(1, o.h * 0.45, o.h * 0.28);
  if (o.ventanas % 3) brazo(-1, o.h * 0.6, o.h * 0.22);
  columna(cx, y, SUELO, tronco);
};

/** Una torre del teleférico: dos patas que se juntan, travesaños y el brazo con poleas. */
const dibujarPilon = (ctx, o, prog) => {
  const y = SUELO - o.h;
  const cx = o.x + o.w / 2;
  const metal = tramo(["#8a8c9a", "#767888", "#44465c", "#1a1a28"], prog);
  ctx.strokeStyle = metal;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(o.x, SUELO);
  ctx.lineTo(cx - 3, y + 8);
  ctx.moveTo(o.x + o.w, SUELO);
  ctx.lineTo(cx + 3, y + 8);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const tramos = Math.max(3, Math.floor(o.h / 40));
  for (let k = 0; k < tramos; k += 1) {
    const f0 = k / tramos;
    const f1 = (k + 1) / tramos;
    const a0 = (o.w / 2) * (1 - f0 * 0.9);
    const a1 = (o.w / 2) * (1 - f1 * 0.9);
    ctx.moveTo(cx - a0, SUELO - o.h * f0);
    ctx.lineTo(cx + a1, SUELO - o.h * f1);
    ctx.moveTo(cx + a0, SUELO - o.h * f0);
    ctx.lineTo(cx - a1, SUELO - o.h * f1);
  }
  ctx.stroke();
  // El brazo de arriba, a rayas rojas y blancas, con sus dos poleas.
  const brazoW = o.w * 1.5;
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(cx - brazoW / 2, y, brazoW, 7);
  ctx.fillStyle = "#d9423a";
  for (let k = 0; k < 4; k += 1) ctx.fillRect(cx - brazoW / 2 + (k * brazoW) / 4, y, brazoW / 8, 7);
  circulo(ctx, metal, cx - brazoW / 2 + 4, y - 3, 4);
  circulo(ctx, metal, cx + brazoW / 2 - 4, y - 3, 4);
};

/** El remolino de arena: un embudo que sale del suelo, gira y suelta granos. */
const dibujarRemolino = (ctx, o, ahora) => {
  const f = forma(o).rect;
  const base = SUELO;
  const cima = f.y;
  const cx = f.x + f.w / 2;
  const capas = 9;
  for (let k = 0; k < capas; k += 1) {
    const t = k / (capas - 1); // 0 abajo, 1 arriba
    const y = base - (base - cima) * t;
    const ancho = 10 + t * t * 46;
    const desvio = Math.sin(o.fase * 3 + t * 4) * (4 + t * 10);
    // Más oscuro que la arena de detrás: es un obstáculo y se tiene que ver.
    ctx.fillStyle = `rgba(150,98,52,${0.72 - t * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(cx + desvio, y, ancho, 6 + t * 5, 0, 0, TAU);
    ctx.fill();
  }
  // Las líneas del giro.
  ctx.strokeStyle = "rgba(92,56,26,0.7)";
  ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k += 1) {
    ctx.beginPath();
    for (let t = 0; t <= 1.001; t += 0.1) {
      const y = base - (base - cima) * t;
      const ancho = 10 + t * t * 46;
      ctx.lineTo(cx + Math.sin(o.fase * 6 + t * 9 + k * 2.1) * ancho * 0.9, y);
    }
    ctx.stroke();
  }
  // Granos que salen despedidos.
  ctx.fillStyle = "rgba(110,70,34,0.85)";
  for (let k = 0; k < 8; k += 1) {
    const a = ahora * 4 + k * 0.8 + o.fase;
    const t = (k / 8 + ahora * 0.3) % 1;
    ctx.fillRect(cx + Math.cos(a) * (14 + t * 50), base - (base - cima) * t, 2, 2);
  }
};

/** La cabina del teleférico, colgada de su cable, con ventanas y el techo rojo. */
const dibujarCabina = (ctx, o, prog) => {
  const r = forma(o).rect;
  const cx = r.x + r.w / 2;
  const enganche = r.y - 16;
  // El cable: un tramo inclinado que pasa por el enganche. No choca: es parte del dibujo.
  ctx.strokeStyle = tramo(["#3a3a4a", "#34344a", "#22223a", "#0c0c18"], prog);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - 260, enganche + 52);
  ctx.lineTo(cx + 260, enganche - 52);
  ctx.stroke();
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx, enganche);
  ctx.lineTo(cx, r.y);
  ctx.stroke();
  circulo(ctx, "#3a3a4a", cx, enganche, 3.2);
  // La cabina.
  ctx.fillStyle = tramo(["#d9423a", "#c03a3a", "#6a2a40", "#2a1426"], prog);
  ctx.beginPath();
  ctx.moveTo(r.x + 3, r.y);
  ctx.lineTo(r.x + r.w - 3, r.y);
  ctx.lineTo(r.x + r.w, r.y + 6);
  ctx.lineTo(r.x + r.w, r.y + r.h - 3);
  ctx.quadraticCurveTo(r.x + r.w, r.y + r.h, r.x + r.w - 3, r.y + r.h);
  ctx.lineTo(r.x + 3, r.y + r.h);
  ctx.quadraticCurveTo(r.x, r.y + r.h, r.x, r.y + r.h - 3);
  ctx.lineTo(r.x, r.y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tramo(["#cfe6f5", "#b9d4e8", "#5a6a8a", "#1e2440"], prog);
  for (let k = 0; k < 3; k += 1) ctx.fillRect(r.x + 4 + k * 12.5, r.y + 8, 9, 10);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(r.x, r.y + r.h - 9, r.w, 3);
};

/** El cóndor de los Andes: negro, collar blanco y las alas abiertas con los dedos. */
const dibujarCondor = (ctx, o) => {
  const { x, y } = forma(o).circulo;
  const ala = Math.sin(o.fase * 2.2) * 6;
  ctx.fillStyle = "#15131a";
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 2);
    ctx.quadraticCurveTo(x + lado * 0 - 6, y - 16 - ala, x - 2 + lado * 34, y - 10 - ala);
    // Las plumas de la punta, abiertas como dedos.
    for (let d = 0; d < 4; d += 1) {
      ctx.lineTo(x + lado * (34 - d * 3), y - 10 - ala + d * 3 + 3);
      ctx.lineTo(x + lado * (31 - d * 3), y - 8 - ala + d * 3);
    }
    ctx.quadraticCurveTo(x + lado * 12, y + 2, x + 4, y + 2);
    ctx.closePath();
    ctx.fill();
  }
  elipse(ctx, "#15131a", x, y, 14, 7);
  // El collar blanco y la cabeza roja, sin plumas.
  elipse(ctx, "#f2efe8", x - 11, y - 2, 4, 3.4);
  circulo(ctx, "#b84a3a", x - 16, y - 3, 3.2);
  ctx.fillStyle = "#e8d6a0";
  ctx.beginPath();
  ctx.moveTo(x - 18.5, y - 3.5);
  ctx.lineTo(x - 22, y - 2);
  ctx.lineTo(x - 18.5, y - 1.5);
  ctx.fill();
  // El blanco del ala.
  ctx.fillStyle = "rgba(240,236,228,0.8)";
  ctx.fillRect(x - 2, y - 9 - ala * 0.6, 12, 2);
};

/** La garza blanca del llano: cuello en ese, pico amarillo y patas largas detrás. */
const dibujarGarza = (ctx, o) => {
  const { x, y } = forma(o).circulo;
  const ala = Math.sin(o.fase * 6);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#2a2a28";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.lineTo(24, 4);
  ctx.moveTo(8, 3);
  ctx.lineTo(23, 6);
  ctx.stroke();
  // Ala de atrás, cuerpo, ala de delante.
  ctx.fillStyle = "#dfe4ea";
  ctx.beginPath();
  ctx.moveTo(2, -1);
  ctx.quadraticCurveTo(8, -12 - ala * 9, 18, -9 - ala * 10);
  ctx.quadraticCurveTo(10, -2, 3, 2);
  ctx.fill();
  elipse(ctx, "#f8f9fb", 2, 0, 10, 5);
  ctx.strokeStyle = "#f8f9fb";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, -1);
  ctx.quadraticCurveTo(-12, -4, -10, -9);
  ctx.quadraticCurveTo(-9, -13, -14, -13);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.fillStyle = "#f0c020";
  ctx.beginPath();
  ctx.moveTo(-16, -14.5);
  ctx.lineTo(-25, -13);
  ctx.lineTo(-16, -11.8);
  ctx.fill();
  circulo(ctx, "#111", -14.6, -13.6, 0.8);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-1, -1);
  ctx.quadraticCurveTo(4, -14 - ala * 11, 14, -12 - ala * 13);
  ctx.quadraticCurveTo(7, -3, 0, 2);
  ctx.fill();
  ctx.restore();
};

/**
 * La térmica: una columna de aire caliente que sube. No se choca con ella, así que tiene
 * que verse bien: un velo cálido de arriba abajo y ondas que suben, con flechitas.
 */
const dibujarTermica = (ctx, o, ahora) => {
  const x0 = o.x - o.w / 2;
  const g = ctx.createLinearGradient(x0, 0, x0 + o.w, 0);
  g.addColorStop(0, "rgba(255,200,120,0)");
  g.addColorStop(0.5, "rgba(255,200,120,0.18)");
  g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x0, 0, o.w, SUELO);
  ctx.strokeStyle = "rgba(255,244,214,0.55)";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  for (let k = 0; k < 5; k += 1) {
    const cx = x0 + o.w * (0.18 + k * 0.16);
    const fase = (ahora * 0.9 + k * 0.37) % 1;
    for (let r = 0; r < 3; r += 1) {
      const y = SUELO - ((fase + r / 3) % 1) * (SUELO - 40);
      ctx.beginPath();
      ctx.moveTo(cx - 6, y + 6);
      ctx.lineTo(cx, y);
      ctx.lineTo(cx + 6, y + 6);
      ctx.stroke();
    }
  }
  ctx.lineCap = "butt";
};

const ESTILOS = {
  edificio: dibujarBloque,
  palmera: dibujarPalmera,
  torre: dibujarTorre,
  grua: dibujarGrua,
  cardon: dibujarCardon,
  pilon: dibujarPilon,
};

/* —— Lo que se ve de un obstáculo cualquiera ————————————————————————————— */

/**
 * Dibuja un obstáculo. `c` lleva el reloj de la partida (`prog`), el real (`ahora`), el
 * ancho de la pantalla, si hay que quitar destellos (`reducido`) y el plumaje (para el
 * color de los rayos).
 */
export const dibujarObstaculo = (ctx, o, c) => {
  switch (o.tipo) {
    case "edificio":
      (ESTILOS[o.estilo] ?? dibujarBloque)(ctx, o, c.prog, c.ahora);
      break;
    case "papagayo":
      dibujarPapagayo(ctx, o);
      break;
    case "zamuro":
      dibujarZamuro(ctx, o);
      break;
    case "paloma":
      dibujarPaloma(ctx, o);
      break;
    case "abeja":
      dibujarAbeja(ctx, o);
      break;
    case "grillo":
      dibujarGrillo(ctx, o);
      break;
    case "avion":
      if (o.espera > 0) dibujarAviso(ctx, o, c.ancho, c.ahora);
      else dibujarAvion(ctx, o);
      break;
    case "roca":
      dibujarRoca(ctx, o, c.prog);
      break;
    case "remolino":
      dibujarRemolino(ctx, o, c.ahora);
      break;
    case "cabina":
      dibujarCabina(ctx, o, c.prog);
      break;
    case "condor":
      dibujarCondor(ctx, o);
      break;
    case "garza":
      dibujarGarza(ctx, o);
      break;
    case "termica":
      dibujarTermica(ctx, o, c.ahora);
      break;
    default:
      dibujarTormenta(ctx, o, !c.reducido, c.plumaje?.rayo);
  }
};

/* —— El jefe y sus piedras ——————————————————————————————————————————————— */

const TINTA = "rgba(38,22,40,0.9)";

/** Un rectángulo de esquinas redondas, como trazado (sin pintar). */
const redondo = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** Rellena el trazado actual y le pone el contorno de caricatura. */
const pintar = (ctx, color, grosor = 1.6) => {
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = grosor;
  ctx.stroke();
};

/** Un brazo o una pierna: un trazo grueso con su contorno, de punta redonda. */
const miembro = (ctx, x1, y1, x2, y2, grosor, color) => {
  ctx.lineCap = "round";
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = grosor + 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = grosor;
  ctx.stroke();
  ctx.lineCap = "butt";
};

/** Una piedra en el aire: gris, con una cara iluminada, su giro y una estela corta. */
export const dibujarPiedra = (ctx, s) => {
  // La estela: dos sombras de la piedra, hacia atrás de por donde viene.
  const v = Math.hypot(s.vx, s.vy) || 1;
  for (const [d, a] of [
    [10, 0.22],
    [20, 0.1],
  ]) {
    circulo(ctx, `rgba(90,80,100,${a})`, s.x - (s.vx / v) * d, s.y - (s.vy / v) * d, s.r * (1 - d / 40));
  }
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.giro);
  ctx.beginPath();
  ctx.moveTo(-s.r, -2);
  ctx.lineTo(-s.r * 0.5, -s.r);
  ctx.lineTo(s.r * 0.6, -s.r * 0.9);
  ctx.lineTo(s.r, 1);
  ctx.lineTo(s.r * 0.4, s.r);
  ctx.lineTo(-s.r * 0.6, s.r * 0.8);
  ctx.closePath();
  pintar(ctx, "#77707e", 1.4);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(-s.r * 0.7, -1.5);
  ctx.lineTo(-s.r * 0.4, -s.r * 0.75);
  ctx.lineTo(s.r * 0.25, -s.r * 0.6);
  ctx.lineTo(-s.r * 0.15, -0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

/** Las piedras que le quedan, amontonadas a sus pies: el montón baja con su aguante. */
const MONTON = [
  [13, -2.5, 4.2],
  [21, -2.5, 4.6],
  [29, -2, 3.8],
  [17, -8.5, 4],
  [25, -8, 4.2],
  [21, -14, 3.8],
];

/**
 * El jefe: un muchacho en lo alto de la loma, con gorra, franela vinotinto con el 7 y
 * tirachinas. Respira mientras espera; antes de cada tiro apunta a la guacamaya, frunce
 * el ceño y estira la liga, y una línea punteada tenue marca hacia dónde saldrá la
 * piedra. A sus pies, el montón de piedras que le quedan, que baja con su aguante.
 */
export const dibujarJefe = (ctx, p, gx, ahora, prog) => {
  const j = p.jefe;
  if (!j) return;
  const { x, y } = j;
  const cargando = j.estado === "carga";
  const k = cargando ? 1 - j.carga / j.cargaMax : 0; // 0 → 1 mientras tensa la liga
  const vida = Math.max(0, j.vida ?? 1);
  const respira = Math.sin(ahora * 3) * 1.2;
  const objetivo = Math.max(60, Math.min(SUELO - 40, p.y + p.vy * 0.3));

  const piel = tramo(["#c98a5a", "#b57a52", "#7a5a62", "#33263a"], prog);
  const camisa = tramo(["#b0243c", "#9c2238", "#621d3e", "#261124"], prog);
  const camisaLuz = tramo(["#d4404e", "#be3a48", "#7e2a48", "#34172c"], prog);
  const short = tramo(["#2f5aa8", "#2a4d92", "#23356a", "#0f1530"], prog);
  const gorra = tramo(["#f2b632", "#dca02c", "#8a6a40", "#33281e"], prog);
  const madera = tramo(["#8a5a2e", "#7a4f2a", "#4e3630", "#21161c"], prog);
  const piedra = tramo(["#8a8390", "#77707e", "#4e4858", "#24202c"], prog);

  // La sombra en la loma y el montón de piedras.
  elipse(ctx, "rgba(20,10,30,0.28)", x + 6, y + 1, 30, 4.5);
  const quedan = Math.ceil(vida * MONTON.length);
  for (let i = 0; i < quedan; i += 1) {
    const [dx, dy, r] = MONTON[i];
    ctx.beginPath();
    ctx.ellipse(x + dx, y + dy, r, r * 0.8, 0, 0, TAU);
    pintar(ctx, piedra, 1.2);
  }

  // El brazo del tirachinas: el hombro, y hacia dónde apunta. En espera, relajado
  // hacia abajo; cargando, hacia donde estará la guacamaya.
  const hombro = { x: x - 7, y: y - 56 + respira * 0.5 };
  const reposo = Math.PI * 0.68 + Math.sin(ahora * 2) * 0.04;
  const apunta = Math.atan2(objetivo - hombro.y, gx - hombro.x);
  const a = cargando ? reposo + (apunta - reposo) * Math.min(1, k * 3) : reposo;
  const mano = { x: hombro.x + Math.cos(a) * 21, y: hombro.y + Math.sin(a) * 21 };
  // La bolsita de la liga: atrás de la horquilla, más lejos cuanto más se estira.
  const tiro = cargando ? 5 + k * 17 : 3;
  const bolsa = { x: mano.x - Math.cos(a) * tiro, y: mano.y - Math.sin(a) * tiro };

  // La línea de puntería, solo mientras carga.
  if (cargando) {
    ctx.save();
    ctx.strokeStyle = `rgba(255,236,170,${0.12 + 0.5 * k})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 10]);
    ctx.beginPath();
    ctx.moveTo(mano.x, mano.y);
    ctx.lineTo(gx, objetivo);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y);
  const b = respira * 0.5; // el pecho sube y baja

  // Las piernas, las medias y los zapatos de goma, que miran hacia la guacamaya.
  for (const px of [-5, 5]) {
    miembro(ctx, px, -24, px, -8, 6, piel);
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(px - 3, -11, 6, 3);
    redondo(ctx, px - 7, -8, 12, 7, 3.2);
    pintar(ctx, "#f4f1ea", 1.4);
    ctx.fillStyle = "#c8283c";
    ctx.fillRect(px - 4, -6, 6, 1.6);
  }

  // El short y la franela, con su luz del lado del sol.
  redondo(ctx, -12, -37 + b, 24, 16, 5);
  pintar(ctx, short);
  redondo(ctx, -14, -66 + b, 28, 33, 9);
  pintar(ctx, camisa);
  ctx.save();
  redondo(ctx, -14, -66 + b, 28, 33, 9);
  ctx.clip();
  ctx.fillStyle = camisaLuz;
  ctx.fillRect(-14, -66 + b, 8, 33);
  ctx.restore();
  // El cuello y el 7.
  ctx.strokeStyle = "#f4f1ea";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-6, -65 + b);
  ctx.lineTo(0, -59 + b);
  ctx.lineTo(6, -65 + b);
  ctx.stroke();
  ctx.fillStyle = "#f4f1ea";
  ctx.font = "800 15px 'Host Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("7", 1, -40 + b);

  // La cabeza: oreja, cara, el pelo que asoma, la gorra con la visera hacia la izquierda.
  const cy = -78 + b;
  circulo(ctx, piel, 9, cy + 2, 3.6);
  ctx.beginPath();
  ctx.arc(0, cy, 12.5, 0, TAU);
  pintar(ctx, piel);
  for (const [hx, hy, hr] of [
    [9.5, cy - 4, 3.4],
    [11.5, cy + 1, 2.8],
    [6, cy - 7, 3],
  ]) {
    circulo(ctx, "#2a1a16", hx, hy, hr);
  }
  ctx.beginPath();
  ctx.arc(1, cy - 3, 13, Math.PI * 1.02, Math.PI * 1.98);
  ctx.closePath();
  pintar(ctx, gorra);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(-6, cy - 13, 3, 9);
  ctx.beginPath();
  ctx.ellipse(-13, cy - 3.5, 10, 2.8, -0.08, 0, TAU);
  pintar(ctx, gorra, 1.4);
  circulo(ctx, TINTA, 1, cy - 16, 1.7);

  // La cara: mira hacia la guacamaya; cargando, el ceño fruncido y los dientes apretados.
  const mira = Math.max(-1.4, Math.min(1.4, (objetivo - (y + cy)) / 120));
  for (const ex of [-7.5, -1.5]) {
    elipse(ctx, "#ffffff", ex, cy + 1, 2.7, 3.1);
    circulo(ctx, "#1c1822", ex - 1, cy + 1.3 + mira, 1.5);
  }
  ctx.strokeStyle = "#2a1a16";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  const ceno = cargando ? 1.8 : -0.4;
  ctx.moveTo(-10.5, cy - 3.5 - ceno * 0.3);
  ctx.lineTo(-5.5, cy - 3 + ceno);
  ctx.moveTo(-3.5, cy - 3 + ceno);
  ctx.lineTo(1, cy - 3.8 - ceno * 0.3);
  ctx.stroke();
  // La nariz y la boca.
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(-11.5, cy + 4.5, 1.8, Math.PI * 0.5, Math.PI * 1.4);
  ctx.stroke();
  if (cargando) {
    redondo(ctx, -9, cy + 7, 7, 3.2, 1.2);
    pintar(ctx, "#ffffff", 1.1);
    ctx.beginPath();
    ctx.moveTo(-5.5, cy + 7);
    ctx.lineTo(-5.5, cy + 10.2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-9.5, cy + 8);
    ctx.quadraticCurveTo(-5.5, cy + 10.5, -2, cy + 7);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
  elipse(ctx, "rgba(255,110,110,0.32)", -3, cy + 5.5, 2.8, 1.8);
  ctx.restore();

  // El tirachinas: la horquilla de madera en la mano, girada hacia donde apunta.
  ctx.save();
  ctx.translate(mano.x, mano.y);
  ctx.rotate(a);
  // En este marco, +x es hacia donde apunta; el mango va hacia abajo en la pantalla.
  const abajo = Math.cos(a) < 0 ? -1 : 1;
  ctx.lineCap = "round";
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-1, 9 * abajo);
  ctx.moveTo(0, 0);
  ctx.lineTo(6, -6);
  ctx.moveTo(0, 0);
  ctx.lineTo(6, 6);
  ctx.stroke();
  ctx.strokeStyle = madera;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.restore();

  // La liga, de las dos puntas a la bolsita, y la piedra si está cargando.
  const punta = (s) => ({
    x: mano.x + Math.cos(a) * 6 - Math.sin(a) * 6 * s,
    y: mano.y + Math.sin(a) * 6 + Math.cos(a) * 6 * s,
  });
  const p1 = punta(1);
  const p2 = punta(-1);
  ctx.strokeStyle = "#e8c95a";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(bolsa.x, bolsa.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  if (cargando) {
    ctx.beginPath();
    ctx.arc(bolsa.x, bolsa.y, 4.4, 0, TAU);
    pintar(ctx, piedra, 1.2);
  }

  // Los brazos: el que sostiene el tirachinas y el que tira de la liga (en espera, en
  // la cintura).
  const otroHombro = { x: x + 7, y: y - 56 + b };
  const otraMano = cargando ? bolsa : { x: x + 13, y: y - 38 + b };
  miembro(ctx, otroHombro.x, otroHombro.y, otraMano.x, otraMano.y, 6, piel);
  circulo(ctx, TINTA, otraMano.x, otraMano.y, 4.4);
  circulo(ctx, piel, otraMano.x, otraMano.y, 3);
  miembro(ctx, hombro.x, hombro.y, mano.x, mano.y, 6.5, piel);
  circulo(ctx, TINTA, mano.x, mano.y, 4.6);
  circulo(ctx, piel, mano.x, mano.y, 3.2);

  // Su aguante, sobre la cabeza: una píldora que se vacía conforme se acaba el minuto.
  const largo = 64;
  const bx = x - largo / 2 + 2;
  const by = y - 112;
  redondo(ctx, bx - 3, by - 3, largo + 6, 11, 5.5);
  ctx.fillStyle = "rgba(20,14,30,0.6)";
  ctx.fill();
  if (vida > 0) {
    const g = ctx.createLinearGradient(bx, 0, bx + largo, 0);
    g.addColorStop(0, vida > 0.3 ? "#ffdd55" : "#ff7a5a");
    g.addColorStop(1, vida > 0.3 ? "#f2a90f" : "#e2483d");
    redondo(ctx, bx, by, Math.max(5, largo * vida), 5, 2.5);
    ctx.fillStyle = g;
    ctx.fill();
  }
};
