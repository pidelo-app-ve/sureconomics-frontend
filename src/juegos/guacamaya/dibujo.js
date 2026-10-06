/**
 * Cómo se ve «Vuela, guacamaya»: el dibujo de cada fotograma en un canvas 2D.
 *
 * Todo a mano, con trazados, sin imágenes ni librerías: el juego entero pesa unos pocos
 * kilobytes y no pide nada a la red. Cada vuelo tiene su escenario (`escenarios.js`) y
 * sus obstáculos (`obstaculos.js`); aquí queda lo que se comparte: el cielo y el sol, la
 * guacamaya con el plumaje que lleve, los mangos, el viento, la niebla y el orden en que
 * se pinta todo.
 *
 * El reloj del juego es el reloj del cielo: a los 0 segundos hay sol alto y a los 60 es
 * de noche. El jugador ve el tiempo que le queda sin mirar el número.
 *
 * Lo que es decorado (estrellas, cordillera, edificios del fondo) sale de una semilla
 * fija y no de la del día: el paisaje de cada vuelo es siempre el mismo, lo que cambia
 * cada día es el vuelo.
 */

import { ALTO, DURACION, SUELO, mulberry32, xDeLaGuacamaya } from "./motor";
import { ESCENARIOS } from "./escenarios";
import { dibujarJefe, dibujarObstaculo, dibujarPiedra } from "./obstaculos";
import { PLUMAJE_BASE } from "./plumajes";
import { TAU, circulo, elipse, tramo } from "./pintura";

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

/* —— Un fotograma —————————————————————————————————————————————————————— */

/** La niebla de Canaima: lo lejano se pierde. Cuánto se ve un obstáculo a esa distancia. */
const VISTA_NIEBLA = [230, 340];
const visibilidad = (dx) => {
  const t = (dx - VISTA_NIEBLA[0]) / (VISTA_NIEBLA[1] - VISTA_NIEBLA[0]);
  return 1 - 0.88 * Math.max(0, Math.min(1, t));
};

/** El viento: rayas que cruzan la pantalla, hacia arriba si levanta y hacia abajo si hunde. */
const dibujarViento = (ctx, p, ancho, ahora) => {
  const r = p.rafaga;
  if (!r || (r.fase !== "aviso" && r.fase !== "activa")) return;
  const fuerza = r.fase === "activa" ? 0.55 : 0.22 + 0.2 * Math.abs(Math.sin(ahora * 10));
  const pendiente = r.signo < 0 ? -0.28 : 0.28;
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${fuerza})`;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  const n = Math.ceil(ancho / 90) + 4;
  for (let k = 0; k < n; k += 1) {
    const largo = 60 + ((k * 37) % 70);
    const x = ancho + 80 - ((ahora * (r.fase === "activa" ? 900 : 380) + k * 131) % (ancho + 240));
    const y = 70 + ((k * 97) % (SUELO - 140));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + largo, y + largo * pendiente);
    ctx.stroke();
  }
  // Una flecha en el borde izquierdo: hacia dónde empuja, para quien no mira las rayas.
  if (r.fase === "activa") {
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.3 * Math.sin(ahora * 8)})`;
    const ax = 26;
    const ay = SUELO / 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay + r.signo * 22);
    ctx.lineTo(ax - 14, ay - r.signo * 6);
    ctx.lineTo(ax + 14, ay - r.signo * 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

/**
 * Dibuja el estado `p` del motor. `ahora` es el reloj real (para titilar luces y batir
 * alas aunque el juego esté en la portada); `reducido` quita los destellos y la estela;
 * `plumaje` es el que lleva puesto la guacamaya.
 */
export const dibujar = (ctx, p, escena, ahora, { reducido = false, plumaje = PLUMAJE_BASE } = {}) => {
  const { ancho } = escena;
  const prog = p.t / DURACION;
  const esc = ESCENARIOS[p.nivel?.escenario] ?? ESCENARIOS.caracas;
  const opciones = { reducido };

  // El cielo.
  const cielo = ctx.createLinearGradient(0, 0, 0, SUELO);
  cielo.addColorStop(0, tramo(esc.cielo.arriba, prog));
  cielo.addColorStop(1, tramo(esc.cielo.abajo, prog));
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, ancho, ALTO);

  // Las estrellas, a partir de la mitad del vuelo.
  const noche = Math.max(0, (prog - 0.55) / 0.45);
  if (noche > 0) {
    const cuantas = Math.round(escena.estrellas.length * esc.estrellas);
    for (let i = 0; i < cuantas; i += 1) {
      const e = escena.estrellas[i];
      ctx.fillStyle = `rgba(255,248,230,${noche * e.brillo})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, TAU);
      ctx.fill();
    }
  }

  // El sol, que baja hacia el horizonte.
  const sx = ancho * 0.7;
  const sy = ALTO * 0.24 + (SUELO - 120 - ALTO * 0.24) * Math.pow(prog, 1.1);
  const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, 120);
  halo.addColorStop(0, "rgba(255,236,170,0.55)");
  halo.addColorStop(1, "rgba(255,236,170,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(sx - 120, sy - 120, 240, 240);
  circulo(ctx, tramo(esc.sol, prog), sx, sy, 32);

  // El paisaje de este vuelo.
  esc.fondo(ctx, p, escena, prog, ahora, opciones);

  // Lo que hay que esquivar. En la niebla, lo lejano apenas se adivina.
  const gx = xDeLaGuacamaya(p);
  const niebla = Boolean(p.nivel?.niebla);
  const contexto = { prog, ahora, ancho, reducido, plumaje };
  for (const o of p.obstaculos) {
    if (niebla) ctx.globalAlpha = visibilidad(o.x - gx);
    dibujarObstaculo(ctx, o, contexto);
  }
  ctx.globalAlpha = 1;

  // El jefe y sus piedras.
  if (p.jefe) {
    dibujarJefe(ctx, p, gx, ahora, prog);
    for (const s of p.piedras) dibujarPiedra(ctx, s);
  }

  // Lo que hay que recoger.
  for (const m of p.mangosEnVuelo) {
    if (niebla) ctx.globalAlpha = Math.max(0.35, visibilidad(m.x - gx));
    dibujarMango(ctx, m.x, m.y, m.fase);
  }
  ctx.globalAlpha = 1;

  // La bruma de la niebla: más espesa a la derecha, donde está lo que viene.
  if (niebla) {
    const bruma = ctx.createLinearGradient(gx + 60, 0, ancho, 0);
    bruma.addColorStop(0, "rgba(232,244,236,0)");
    bruma.addColorStop(1, `rgba(232,244,236,${0.5 - prog * 0.2})`);
    ctx.fillStyle = bruma;
    ctx.fillRect(gx + 60, 0, ancho - gx - 60, SUELO);
  }

  // El suelo del escenario.
  esc.suelo(ctx, p, escena, prog, ahora, opciones);

  // La guacamaya. Parpadea mientras es invulnerable tras un golpe.
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

  // El viento, por encima de todo menos de los números.
  if (!reducido) dibujarViento(ctx, p, ancho, ahora);

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
