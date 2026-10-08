/**
 * Los siete escenarios: lo que hay detrás y debajo de la guacamaya en cada vuelo.
 *
 * Todos cuentan la misma tarde -- el reloj del juego es el reloj del cielo: a los 0
 * segundos hay sol alto y a los 60 es de noche --, pero cada uno con su paisaje y su
 * suelo: la Cota Mil en Caracas, la Catedral en Barquisimeto, el mar en Margarita, el
 * Lago y sus torres en el Zulia, el puerto y la pista en La Guaira, la loma del chopo,
 * los médanos de Coro, la Sierra Nevada y el páramo de Mérida, el llano de Barinas y los
 * tepuyes de Canaima.
 *
 * Cada escenario es un objeto con:
 * - `cielo`: dos degradados de cuatro colores (de la tarde a la noche), arriba y abajo;
 * - `sol`: los colores del sol según cae;
 * - `estrellas`: cuántas se ven de noche (1 es lo normal, 0 ninguna);
 * - `fondo(...)`: lo que va entre el cielo y los obstáculos, por capas con paralaje;
 * - `suelo(...)`: la calle, la playa o el agua donde termina el mundo.
 *
 * Nada de esto cuenta para chocar: es decorado. El decorado que se repite sale de
 * `ruido(índice)`, no de nada guardado: el mismo tramo sale igual cada vez que se pasa.
 */

import { ALTO, SUELO } from "./motor";
import { TAU, circulo, cresta, dibujarSierra, elipse, palmera, ruido, teselas, tramo } from "./pintura";

/* —— Caracas ———————————————————————————————————————————————————————— */

const SIERRA_LEJOS = ["#a07ab8", "#7b5aa6", "#4a3a72", "#262040"];
const SIERRA_CERCA = ["#4f8f55", "#3c7347", "#27493a", "#152820"];
const CIUDAD = ["#6e5a8c", "#56466f", "#3a3052", "#221c33"];

const caracas = {
  cielo: {
    arriba: ["#f2a65a", "#d9655b", "#6a3f7a", "#1d1a3a"],
    abajo: ["#ffd89a", "#f6a15f", "#c46a6f", "#3a2a52"],
  },
  sol: ["#fff4c2", "#ffd36b", "#ff9a4a", "#ff7a3a"],
  estrellas: 1,
  fondo(ctx, p, escena, prog) {
    const { ancho } = escena;
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
  },
  suelo(ctx, p, escena, prog) {
    const { ancho } = escena;
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
  },
};

/* —— Barquisimeto ——————————————————————————————————————————————————— */

const CERROS_SECOS = ["#b98a6a", "#8f6657", "#53394f", "#2b2036"];
const CERROS_CERCA = ["#a58a52", "#7d6a45", "#463d3a", "#241f26"];
const CASAS_BAJAS = ["#9a6f7c", "#7b5668", "#4a3753", "#241d33"];
const CONCRETO = ["#f3dcc0", "#e2b79a", "#9a7a8e", "#3f3556"];

/** La Catedral: un cono de concreto con nervaduras, la cruz arriba y su base ancha. */
const catedral = (ctx, cx, prog) => {
  const alto = 190;
  ctx.fillStyle = tramo(CONCRETO, prog);
  ctx.fillRect(cx - 92, SUELO - 24, 184, 24);
  ctx.beginPath();
  ctx.moveTo(cx - 52, SUELO - 20);
  ctx.quadraticCurveTo(cx - 36, SUELO - 118, cx + 4, SUELO - alto);
  ctx.quadraticCurveTo(cx + 40, SUELO - 118, cx + 58, SUELO - 20);
  ctx.closePath();
  ctx.fill();
  // Las nervaduras: líneas que bajan desde la punta.
  ctx.strokeStyle = "rgba(60,40,70,0.28)";
  ctx.lineWidth = 1.4;
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx + 4, SUELO - alto + 6);
    ctx.quadraticCurveTo(cx + i * 11, SUELO - 100, cx + 3 + i * 17, SUELO - 22);
    ctx.stroke();
  }
  // La cruz.
  ctx.strokeStyle = tramo(CONCRETO, prog);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 4, SUELO - alto - 20);
  ctx.lineTo(cx + 4, SUELO - alto + 4);
  ctx.moveTo(cx - 5, SUELO - alto - 12);
  ctx.lineTo(cx + 13, SUELO - alto - 12);
  ctx.stroke();
  // Las luces de la base, que se encienden con la noche.
  ctx.fillStyle = `rgba(255,214,130,${0.1 + prog * 0.8})`;
  for (let x = cx - 84; x < cx + 84; x += 14) ctx.fillRect(x, SUELO - 17, 6, 9);
};

const barquisimeto = {
  cielo: {
    arriba: ["#f4b25a", "#e07b4f", "#7a3b6f", "#1b1838"],
    abajo: ["#ffe0a3", "#f9a86a", "#cf7a76", "#3c2b55"],
  },
  sol: ["#fff1b8", "#ffc85f", "#ff8c45", "#ff6a3a"],
  estrellas: 1,
  fondo(ctx, p, escena, prog) {
    const { ancho } = escena;
    dibujarSierra(ctx, ancho, p.recorrido * 0.05, SUELO - 190, 55, 2.2, tramo(CERROS_SECOS, prog));
    dibujarSierra(ctx, ancho, p.recorrido * 0.12, SUELO - 120, 38, 5.3, tramo(CERROS_CERCA, prog));
    // Las casas bajas del valle: la misma tira de la ciudad, pero a media altura.
    const desplaz = (p.recorrido * 0.4) % escena.tramo;
    ctx.fillStyle = tramo(CASAS_BAJAS, prog);
    for (let rep = 0; rep < 2 + Math.ceil(ancho / escena.tramo); rep += 1) {
      for (const b of escena.bloques) {
        const x = b.x - desplaz + rep * escena.tramo;
        if (x > ancho || x + b.w < 0) continue;
        ctx.fillRect(x, SUELO - b.h * 0.5, b.w, b.h * 0.5);
      }
    }
    // La Catedral, una vez cada tanto, entre las casas.
    teselas(ancho, p.recorrido * 0.34, 1700, (x) => catedral(ctx, x + 900, prog));
  },
  suelo(ctx, p, escena, prog) {
    const { ancho } = escena;
    ctx.fillStyle = tramo(["#4a3a40", "#3a2e3a", "#2a2230", "#18141f"], prog);
    ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
    ctx.fillStyle = "#e9c25a";
    ctx.fillRect(0, SUELO - 3, ancho, 3);
    // Las palmeras del separador, en primer plano y sin color.
    teselas(ancho, p.recorrido * 0.9, 210, (x, i) => {
      const alto = 38 + ruido(i) * 22;
      palmera(ctx, x + 60, SUELO - 2, alto, tramo(["#2c4a2f", "#223a2a", "#16281f", "#0c1612"], prog));
    });
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    const off = (p.recorrido * 1.6) % 60;
    for (let x = -off; x < ancho; x += 60) ctx.fillRect(x, SUELO + 32, 28, 3);
  },
};

/* —— Margarita —————————————————————————————————————————————————————— */

const MAR_LEJOS = ["#58c7c4", "#3b9db4", "#27527f", "#101d4a"];
const MAR_CERCA = ["#2fa9b3", "#237f9c", "#1a3f6e", "#0b1538"];
const ISLA = ["#7d6aa8", "#5d4a8c", "#38306a", "#1d1a45"];

const velero = (ctx, x, y, tam, prog, ahora, i) => {
  const mece = Math.sin(ahora * 1.4 + i) * 2;
  ctx.save();
  ctx.translate(x, y + mece);
  ctx.rotate(Math.sin(ahora * 1.1 + i) * 0.03);
  ctx.fillStyle = tramo(["#6b3f3a", "#563337", "#3a2a40", "#1c1630"], prog);
  ctx.beginPath();
  ctx.moveTo(-tam, 0);
  ctx.lineTo(tam, 0);
  ctx.lineTo(tam * 0.7, tam * 0.35);
  ctx.lineTo(-tam * 0.7, tam * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tramo(["#fff2dc", "#f6c9a5", "#b8879c", "#5a4a7a"], prog);
  ctx.beginPath();
  ctx.moveTo(0, -tam * 2.1);
  ctx.lineTo(tam * 0.9, -tam * 0.15);
  ctx.lineTo(0, -tam * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tramo(["#ffb482", "#e8826c", "#9a5a86", "#42356a"], prog);
  ctx.beginPath();
  ctx.moveTo(-tam * 0.1, -tam * 1.7);
  ctx.lineTo(-tam * 0.9, -tam * 0.15);
  ctx.lineTo(-tam * 0.1, -tam * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const margarita = {
  cielo: {
    arriba: ["#ffb86b", "#f0707a", "#6a4a9a", "#1a2150"],
    abajo: ["#ffe7a8", "#ffb277", "#d98a9a", "#3a3a78"],
  },
  sol: ["#fff6c8", "#ffd878", "#ff9f55", "#ff7a4a"],
  estrellas: 1,
  fondo(ctx, p, escena, prog, ahora) {
    const { ancho } = escena;
    // Una isla lejana y el horizonte.
    dibujarSierra(ctx, ancho, p.recorrido * 0.03, SUELO - 112, 20, 3.4, tramo(ISLA, prog));
    const horizonte = SUELO - 104;
    const mar = ctx.createLinearGradient(0, horizonte, 0, SUELO);
    mar.addColorStop(0, tramo(MAR_LEJOS, prog));
    mar.addColorStop(1, tramo(MAR_CERCA, prog));
    ctx.fillStyle = mar;
    ctx.fillRect(0, horizonte, ancho, SUELO - horizonte);
    // El camino del sol sobre el agua: rayitas que brillan bajo él.
    const sx = ancho * 0.7;
    ctx.fillStyle = `rgba(255,226,160,${0.5 * (1 - prog * 0.8)})`;
    for (let k = 0; k < 9; k += 1) {
      const y = horizonte + 6 + k * 10;
      const w = 10 + k * 5 + Math.sin(ahora * 2 + k) * 4;
      ctx.fillRect(sx - w / 2, y, w, 2);
    }
    // Veleros que pasan despacio.
    teselas(ancho, p.recorrido * 0.07, 520, (x, i) => {
      const tam = 7 + ruido(i) * 5;
      velero(ctx, x + 120 + ruido(i + 9) * 200, horizonte + 24 + ruido(i + 3) * 40, tam, prog, ahora, i);
    });
    // Las palmeras de la costa, en silueta.
    teselas(ancho, p.recorrido * 0.34, 240, (x, i) => {
      if (ruido(i + 1) < 0.35) return;
      palmera(ctx, x + 60, SUELO - 6, 64 + ruido(i) * 36, tramo(["#2f5b45", "#274a3d", "#183029", "#0c1613"], prog));
    });
  },
  suelo(ctx, p, escena, prog, ahora) {
    const { ancho } = escena;
    // La playa: arena que se enfría con la noche y la espuma que va y viene.
    ctx.fillStyle = tramo(["#f0d49a", "#d9ac84", "#7a6275", "#2c2742"], prog);
    ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
    ctx.fillStyle = tramo(["#ffffff", "#ffeedd", "#c9b8d8", "#6a6a98"], prog);
    ctx.beginPath();
    ctx.moveTo(0, SUELO + 6);
    for (let x = 0; x <= ancho + 8; x += 8) {
      ctx.lineTo(x, SUELO - 2 + Math.sin(x * 0.05 + ahora * 2 + p.recorrido * 0.01) * 2.4);
    }
    ctx.lineTo(ancho, SUELO + 6);
    ctx.closePath();
    ctx.fill();
    // Conchitas y granos que pasan.
    ctx.fillStyle = "rgba(120,80,60,0.28)";
    teselas(ancho, p.recorrido * 1.1, 90, (x, i) => ctx.fillRect(x + ruido(i) * 60, SUELO + 22 + ruido(i + 5) * 22, 4, 2));
  },
};

/* —— Zulia —————————————————————————————————————————————————————————— */

const NUBES_ZULIA = ["#8a5a78", "#58406e", "#2e2750", "#14122e"];
const AGUA_ZULIA = ["#3a3a68", "#2c2c58", "#1c1c44", "#0b0b24"];

/** Una torre petrolera: patas inclinadas, travesaños y, a veces, el mechero encendido. */
const torreDeFondo = (ctx, x, alto, color, llama, ahora) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - alto * 0.2, SUELO - 46);
  ctx.lineTo(x, SUELO - 46 - alto);
  ctx.lineTo(x + alto * 0.2, SUELO - 46);
  for (let k = 1; k <= 5; k += 1) {
    const y = SUELO - 46 - (alto * k) / 6;
    const a = alto * 0.2 * (1 - k / 6.2);
    ctx.moveTo(x - a, y);
    ctx.lineTo(x + a, y);
  }
  ctx.stroke();
  if (llama) {
    const a = 1 + Math.sin(ahora * 9 + x) * 0.18;
    ctx.fillStyle = "rgba(255,150,60,0.9)";
    ctx.beginPath();
    ctx.ellipse(x, SUELO - 46 - alto - 7 * a, 3.4, 8 * a, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,230,140,0.95)";
    ctx.beginPath();
    ctx.ellipse(x, SUELO - 46 - alto - 5 * a, 1.8, 4.5 * a, 0, 0, TAU);
    ctx.fill();
  }
};

const zulia = {
  cielo: {
    arriba: ["#6a3f6b", "#44305f", "#241f4d", "#0a0a24"],
    abajo: ["#e69a6a", "#b0627a", "#503c6c", "#1a1840"],
  },
  sol: ["#ffd9a0", "#ffa96a", "#ff7a5a", "#d9525a"],
  estrellas: 0.6,
  fondo(ctx, p, escena, prog, ahora, { reducido }) {
    const { ancho } = escena;
    // Las nubes oscuras del Catatumbo, enormes y lentas.
    teselas(ancho, p.recorrido * 0.03, 360, (x, i) => {
      elipse(ctx, tramo(NUBES_ZULIA, prog), x + 120, 64 + ruido(i) * 90, 150 + ruido(i + 4) * 80, 34 + ruido(i + 2) * 22);
    });
    // Los relámpagos: de vez en cuando el cielo entero se enciende. Solo adorno.
    if (!reducido) {
      const ciclo = ahora * 1.3;
      const f = ruido(Math.floor(ciclo)) > 0.8 ? Math.max(0, 1 - (ciclo % 1) * 3.4) : 0;
      if (f > 0) {
        ctx.fillStyle = `rgba(215,195,255,${0.28 * f})`;
        ctx.fillRect(0, 0, ancho, SUELO);
        ctx.strokeStyle = `rgba(245,235,255,${0.9 * f})`;
        ctx.lineWidth = 2.4;
        const bx = ruido(Math.floor(ciclo) + 3) * ancho;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        let y = 0;
        let x = bx;
        while (y < SUELO - 140) {
          y += 22 + ruido(y + bx) * 16;
          x += (ruido(y * 3 + bx) - 0.5) * 36;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    // El lago, sus torres y el puente largo.
    const agua = SUELO - 46;
    ctx.fillStyle = tramo(AGUA_ZULIA, prog);
    ctx.fillRect(0, agua, ancho, SUELO - agua);
    const sombra = tramo(["#4a3a5e", "#352c52", "#1e1a3c", "#0b0a1c"], prog);
    // El puente: la calzada baja, las pilas y, cada tanto, un pilón con sus cables.
    teselas(ancho, p.recorrido * 0.22, 1900, (x) => {
      ctx.fillStyle = sombra;
      ctx.fillRect(x, agua - 30, 1900, 5);
      for (let k = 0; k < 1900; k += 70) ctx.fillRect(x + k, agua - 25, 5, 25);
      for (const t of [380, 950, 1520]) {
        ctx.strokeStyle = sombra;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x + t - 9, agua - 25);
        ctx.lineTo(x + t - 3, agua - 96);
        ctx.moveTo(x + t + 9, agua - 25);
        ctx.lineTo(x + t + 3, agua - 96);
        ctx.moveTo(x + t - 5, agua - 70);
        ctx.lineTo(x + t + 5, agua - 70);
        for (let c = 1; c <= 4; c += 1) {
          ctx.moveTo(x + t, agua - 94);
          ctx.lineTo(x + t - c * 60, agua - 28);
          ctx.moveTo(x + t, agua - 94);
          ctx.lineTo(x + t + c * 60, agua - 28);
        }
        ctx.stroke();
      }
    });
    teselas(ancho, p.recorrido * 0.38, 520, (x, i) => {
      if (ruido(i + 11) < 0.25) return;
      torreDeFondo(ctx, x + 140, 80 + ruido(i) * 50, sombra, ruido(i + 7) > 0.45, ahora);
    });
  },
  suelo(ctx, p, escena, prog, ahora) {
    const { ancho } = escena;
    // La orilla: agua oscura con el reflejo de los mecheros y rayas que se mueven.
    ctx.fillStyle = tramo(["#2c2c58", "#222248", "#16163a", "#08081c"], prog);
    ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
    ctx.fillStyle = "#6a5a9a";
    ctx.fillRect(0, SUELO - 2, ancho, 2);
    ctx.fillStyle = "rgba(255,150,80,0.22)";
    teselas(ancho, p.recorrido * 0.9, 150, (x, i) => {
      const w = 26 + ruido(i) * 40;
      ctx.fillRect(x + ruido(i + 3) * 80, SUELO + 12 + ruido(i + 8) * 26, w, 2);
    });
    ctx.fillStyle = "rgba(180,170,255,0.16)";
    for (let k = 0; k < 4; k += 1) {
      const y = SUELO + 10 + k * 11;
      const off = (p.recorrido * (0.5 + k * 0.2) + Math.sin(ahora + k) * 6) % 60;
      for (let x = -off; x < ancho; x += 60) ctx.fillRect(x, y, 24, 2);
    }
  },
};

/* —— La Guaira ——————————————————————————————————————————————————————— */

const LITORAL_LEJOS = ["#7fa8c8", "#5f86b0", "#3a4a82", "#1a2152"];
const LITORAL_CERCA = ["#4f9a68", "#3b7e58", "#245040", "#11261f"];
const MAR_PUERTO = ["#4a9ec4", "#2f78a4", "#1f4678", "#0c1a46"];

/** Una grúa pórtico del puerto: dos patas, la pluma larga y un contenedor colgando. */
const grúaDeFondo = (ctx, x, color, acento) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 22, SUELO - 22);
  ctx.lineTo(x - 22, SUELO - 120);
  ctx.moveTo(x + 22, SUELO - 22);
  ctx.lineTo(x + 22, SUELO - 120);
  ctx.moveTo(x - 22, SUELO - 120);
  ctx.lineTo(x + 22, SUELO - 120);
  ctx.moveTo(x - 90, SUELO - 120);
  ctx.lineTo(x + 70, SUELO - 120);
  ctx.moveTo(x - 90, SUELO - 120);
  ctx.lineTo(x - 22, SUELO - 150);
  ctx.lineTo(x + 40, SUELO - 120);
  ctx.stroke();
  ctx.fillStyle = acento;
  ctx.fillRect(x - 70, SUELO - 112, 22, 12);
};

const laguaira = {
  cielo: {
    arriba: ["#f6b45e", "#e8756a", "#7a4a8a", "#1d1d44"],
    abajo: ["#ffe1a0", "#ffab72", "#d7808a", "#3b3a6a"],
  },
  sol: ["#fff2bd", "#ffd070", "#ff9650", "#ff7345"],
  estrellas: 1,
  fondo(ctx, p, escena, prog, ahora) {
    const { ancho } = escena;
    dibujarSierra(ctx, ancho, p.recorrido * 0.05, SUELO - 215, 70, 0.7, tramo(LITORAL_LEJOS, prog));
    // La montaña cae al mar: más alta y más empinada, con las casas del cerro.
    dibujarSierra(ctx, ancho, p.recorrido * 0.13, SUELO - 140, 62, 2.9, tramo(LITORAL_CERCA, prog));
    teselas(ancho, p.recorrido * 0.13, 70, (x, i) => {
      const xx = x + ruido(i) * 50;
      const y = cresta(xx + p.recorrido * 0.13, SUELO - 140, 62, 2.9) + 10 + ruido(i + 4) * 36;
      if (y > SUELO - 60) return;
      ctx.fillStyle = tramo(["#fff0d8", "#f3c9a2", "#a88aa0", "#483c62"], prog);
      ctx.fillRect(xx, y, 5, 4);
      if (prog > 0.5) {
        ctx.fillStyle = `rgba(255,220,140,${(prog - 0.5) * 1.6})`;
        ctx.fillRect(xx + 1, y + 1, 2, 2);
      }
    });
    // El mar y el puerto: grúas, pilas de contenedores y el faro.
    const orilla = SUELO - 40;
    ctx.fillStyle = tramo(MAR_PUERTO, prog);
    ctx.fillRect(0, orilla, ancho, SUELO - orilla);
    const silueta = tramo(["#4a3a5e", "#352c52", "#1e1a3c", "#0b0a1c"], prog);
    teselas(ancho, p.recorrido * 0.34, 760, (x, i) => {
      grúaDeFondo(ctx, x + 150, silueta, tramo(["#e2483d", "#b8403f", "#6a3050", "#2a1c3c"], prog));
      grúaDeFondo(ctx, x + 430, silueta, tramo(["#3a8dde", "#3a6ab0", "#3a4a82", "#1c2250"], prog));
      const colores = ["#e2483d", "#3a8dde", "#f2b632", "#2fbf71"];
      for (let k = 0; k < 4; k += 1) {
        ctx.fillStyle = tramo([colores[(k + i) & 3], "#1a1630"], 0.15 + prog * 0.7);
        ctx.fillRect(x + 560 + k * 26, SUELO - 60, 24, 14);
        if (k % 2 === 0) ctx.fillRect(x + 560 + k * 26, SUELO - 74, 24, 14);
      }
      // El faro.
      ctx.fillStyle = silueta;
      ctx.fillRect(x + 700, SUELO - 78, 8, 40);
      circulo(ctx, `rgba(255,236,150,${0.4 + 0.5 * Math.abs(Math.sin(ahora * 1.6))})`, x + 704, SUELO - 82, 3.4);
    });
  },
  suelo(ctx, p, escena, prog, ahora) {
    const { ancho } = escena;
    // Maiquetía: la pista, con sus luces de borde y la raya del centro.
    ctx.fillStyle = tramo(["#4a4452", "#38323f", "#262232", "#14121e"], prog);
    ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
    ctx.fillStyle = "#e9e3d0";
    ctx.fillRect(0, SUELO - 2, ancho, 2);
    const off = p.recorrido % 52;
    for (let x = -off; x < ancho; x += 52) {
      const encendida = Math.floor((x + p.recorrido) / 52) % 2 === 0;
      circulo(ctx, encendida ? "#5ab4ff" : "#2a5a8a", x + 3, SUELO + 6, 2.6);
    }
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    const off2 = (p.recorrido * 1.6) % 90;
    for (let x = -off2; x < ancho; x += 90) ctx.fillRect(x, SUELO + 32, 46, 4);
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.2 * Math.sin(ahora * 3)})`;
    ctx.fillRect(0, SUELO + 50, ancho, 1);
  },
};

/* —— Canaima ———————————————————————————————————————————————————————— */

const TEPUY_LEJOS = ["#8fb0b0", "#6f94a0", "#42627a", "#1d3048"];
const TEPUY_MEDIO = ["#6f9a86", "#527f78", "#2f5560", "#142835"];
const SELVA = ["#4f9a58", "#3b7d4a", "#235a3a", "#10281f"];
const SELVA_OSCURA = ["#2f6a40", "#255a3a", "#163f2c", "#08170f"];

/** Un tepuy: una mesa de paredes casi verticales, con su cima plana y un chorro de agua. */
const tepuy = (ctx, x, base, ancho, alto, color, cascada, prog) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x + ancho * 0.07, base - alto * 0.9);
  ctx.lineTo(x + ancho * 0.12, base - alto);
  ctx.lineTo(x + ancho * 0.88, base - alto);
  ctx.lineTo(x + ancho * 0.93, base - alto * 0.9);
  ctx.lineTo(x + ancho, base);
  ctx.closePath();
  ctx.fill();
  // Los pliegues de la pared.
  ctx.strokeStyle = "rgba(20,30,50,0.14)";
  ctx.lineWidth = 2;
  for (let k = 1; k < 6; k += 1) {
    ctx.beginPath();
    ctx.moveTo(x + (ancho * k) / 6, base - alto);
    ctx.lineTo(x + (ancho * k) / 6 + (k % 2 ? 6 : -6), base);
    ctx.stroke();
  }
  if (cascada) {
    const g = ctx.createLinearGradient(0, base - alto, 0, base);
    g.addColorStop(0, `rgba(255,255,255,${0.9 - prog * 0.3})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x + ancho * 0.3, base - alto, 3, alto);
  }
};

const canaima = {
  cielo: {
    arriba: ["#8cc0b0", "#5d9a9c", "#2f5f78", "#0e2236"],
    abajo: ["#f6e8b8", "#d7dba8", "#82ad98", "#27493f"],
  },
  sol: ["#fffbe0", "#f6edb0", "#e2d890", "#bfc88a"],
  estrellas: 0.7,
  fondo(ctx, p, escena, prog, ahora) {
    const { ancho } = escena;
    teselas(ancho, p.recorrido * 0.04, 1500, (x, i) => {
      tepuy(ctx, x + 100 + ruido(i) * 200, SUELO - 40, 360 + ruido(i + 1) * 120, 260 + ruido(i + 2) * 70, tramo(TEPUY_LEJOS, prog), ruido(i + 5) > 0.35, prog);
      tepuy(ctx, x + 820 + ruido(i + 7) * 200, SUELO - 40, 300 + ruido(i + 8) * 100, 200 + ruido(i + 9) * 60, tramo(TEPUY_LEJOS, prog), false, prog);
    });
    teselas(ancho, p.recorrido * 0.1, 1100, (x, i) => {
      tepuy(ctx, x + 300 + ruido(i + 20) * 200, SUELO - 30, 260 + ruido(i + 21) * 90, 130 + ruido(i + 22) * 50, tramo(TEPUY_MEDIO, prog), false, prog);
    });
    // La neblina: bandas claras que se arrastran despacio entre los tepuyes.
    for (let k = 0; k < 3; k += 1) {
      const y = SUELO - 150 + k * 46;
      const bruma = `rgba(235,245,235,${0.16 + k * 0.05})`;
      teselas(ancho, p.recorrido * (0.06 + k * 0.03) + ahora * 6 * (k + 1), 520, (x, i) => {
        elipse(ctx, bruma, x + 260, y + ruido(i + k) * 16, 280, 20 + k * 6);
      });
    }
    // La selva baja: copas redondas en dos tonos.
    teselas(ancho, p.recorrido * 0.28, 120, (x, i) => {
      const r = 34 + ruido(i) * 26;
      circulo(ctx, tramo(SELVA_OSCURA, prog), x + 50, SUELO - 6, r);
    });
  },
  suelo(ctx, p, escena, prog) {
    const { ancho } = escena;
    // El dosel de la selva visto desde arriba: copas a todo lo ancho.
    ctx.fillStyle = tramo(SELVA_OSCURA, prog);
    ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
    teselas(ancho, p.recorrido * 1.0, 74, (x, i) => {
      const r = 22 + ruido(i) * 14;
      circulo(ctx, tramo(SELVA, prog), x + 36, SUELO + 4 + ruido(i + 3) * 6, r);
    });
    teselas(ancho, p.recorrido * 1.3, 110, (x, i) => {
      circulo(ctx, "rgba(255,255,255,0.08)", x + ruido(i) * 60, SUELO + 22 + ruido(i + 2) * 22, 10 + ruido(i + 4) * 8);
    });
  },
};

/* —— La loma del chopo ———————————————————————————————————————————————— */

const LOMA_LEJOS = ["#a07a9a", "#7a5a8a", "#4a3a6a", "#221c40"];
const LOMA_CERCA = ["#6a9a52", "#527f46", "#2f5a3a", "#14281f"];

const mangoFrondoso = (ctx, x, base, alto, prog) => {
  ctx.fillStyle = tramo(["#5a3a2a", "#47302a", "#2c2030", "#140f1c"], prog);
  ctx.fillRect(x - 6, base - alto * 0.6, 12, alto * 0.6);
  const copa = tramo(["#3f7a3a", "#336a38", "#1f4a30", "#0c1e18"], prog);
  circulo(ctx, copa, x, base - alto * 0.78, alto * 0.34);
  circulo(ctx, copa, x - alto * 0.26, base - alto * 0.62, alto * 0.24);
  circulo(ctx, copa, x + alto * 0.28, base - alto * 0.64, alto * 0.25);
  ctx.fillStyle = tramo(["#ffb21f", "#e8921f", "#a0602a", "#402a30"], prog);
  for (const [dx, dy] of [
    [-0.18, -0.7],
    [0.16, -0.58],
    [0.04, -0.9],
    [-0.3, -0.55],
  ]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * alto, base + dy * alto, 4, 5.5, 0.3, 0, TAU);
    ctx.fill();
  }
};

const loma = {
  cielo: {
    arriba: ["#f0a05a", "#d0604f", "#5f3170", "#161433"],
    abajo: ["#ffd08a", "#f08a60", "#b9607a", "#33264d"],
  },
  sol: ["#fff0b8", "#ffc56a", "#ff8a48", "#ff6038"],
  estrellas: 1,
  fondo(ctx, p, escena, prog) {
    const { ancho } = escena;
    dibujarSierra(ctx, ancho, p.recorrido * 0.05, SUELO - 195, 52, 6.1, tramo(LOMA_LEJOS, prog));
    dibujarSierra(ctx, ancho, p.recorrido * 0.13, SUELO - 120, 34, 1.9, tramo(LOMA_CERCA, prog));
    // Mangos lejanos que pasan.
    teselas(ancho, p.recorrido * 0.3, 330, (x, i) => {
      if (ruido(i) < 0.3) return;
      mangoFrondoso(ctx, x + 120, SUELO - 4, 60 + ruido(i + 2) * 30, prog);
    });
    // La loma del jefe: fija a la derecha, con su mango detrás.
    const lx = ancho - 40;
    mangoFrondoso(ctx, lx + 12, SUELO - 82, 130, prog);
    ctx.fillStyle = tramo(["#6f8f4a", "#587a42", "#34553a", "#16301f"], prog);
    ctx.beginPath();
    ctx.moveTo(lx - 130, SUELO);
    ctx.quadraticCurveTo(lx - 80, SUELO - 98, lx - 20, SUELO - 98);
    ctx.quadraticCurveTo(lx + 60, SUELO - 98, lx + 140, SUELO);
    ctx.closePath();
    ctx.fill();
  },
  suelo(ctx, p, escena, prog) {
    const { ancho } = escena;
    ctx.fillStyle = tramo(["#5a7a3e", "#476a3c", "#2c4a34", "#102018"], prog);
    ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
    ctx.fillStyle = tramo(["#8a6a3e", "#6e5638", "#3c3030", "#17121a"], prog);
    ctx.fillRect(0, SUELO + 30, ancho, 16);
    ctx.strokeStyle = tramo(["#3f6a30", "#315a2e", "#1c3c28", "#0a1810"], prog);
    ctx.lineWidth = 2;
    teselas(ancho, p.recorrido * 1.0, 38, (x, i) => {
      const h = 7 + ruido(i) * 7;
      ctx.beginPath();
      ctx.moveTo(x, SUELO + 12 + ruido(i + 2) * 8);
      ctx.lineTo(x - 3, SUELO + 12 + ruido(i + 2) * 8 - h);
      ctx.moveTo(x, SUELO + 12 + ruido(i + 2) * 8);
      ctx.lineTo(x + 3, SUELO + 12 + ruido(i + 2) * 8 - h);
      ctx.stroke();
    });
  },
};

/* —— Los médanos de Coro ——————————————————————————————————————————————— */

const ARENA_LEJOS = ["#f0c98a", "#e2a46c", "#9a6a6e", "#3a2c48"];
const ARENA_MEDIO = ["#e8b673", "#d48f5a", "#8a5a5e", "#2e2440"];
const ARENA_CERCA = ["#f3c98b", "#e09c62", "#9c6660", "#352a44"];
const SOMBRA_DUNA = ["#c98f55", "#b06e48", "#6c4652", "#1e1a30"];
const CARDON_FONDO = ["#5e7a46", "#4e6440", "#33403c", "#141a1c"];

/** Una duna: una cresta suave, con la cara de sombra del lado del viento. */
const duna = (ctx, ancho, desplaz, base, amp, semilla, luz, sombra) => {
  const y = (x) => base - amp * (0.6 + 0.4 * Math.sin((x + desplaz) * 0.0045 + semilla)) * Math.abs(Math.sin((x + desplaz) * 0.0021 + semilla * 1.7));
  ctx.fillStyle = luz;
  ctx.beginPath();
  ctx.moveTo(0, SUELO);
  for (let x = 0; x <= ancho + 8; x += 8) ctx.lineTo(x, y(x));
  ctx.lineTo(ancho, SUELO);
  ctx.closePath();
  ctx.fill();
  // La sombra: una banda bajo la cresta, más oscura, como cae la luz de la tarde.
  ctx.fillStyle = sombra;
  ctx.beginPath();
  ctx.moveTo(0, SUELO);
  for (let x = 0; x <= ancho + 8; x += 8) ctx.lineTo(x, y(x) + 10 + amp * 0.12);
  ctx.lineTo(ancho, SUELO);
  ctx.closePath();
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
};

/** Un cardón de silueta: tronco y uno o dos brazos que suben. */
const cardonDeFondo = (ctx, x, base, alto, color, i) => {
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(3, alto * 0.11);
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x, base - alto);
  const brazo = (lado, y0, largo) => {
    ctx.moveTo(x, base - y0);
    ctx.lineTo(x + lado * alto * 0.22, base - y0);
    ctx.lineTo(x + lado * alto * 0.22, base - y0 - largo);
  };
  brazo(1, alto * 0.45, alto * 0.3);
  if (ruido(i + 3) > 0.4) brazo(-1, alto * 0.6, alto * 0.22);
  ctx.stroke();
  ctx.lineCap = "butt";
};

/** Una cabra en el médano: cuerpo, patas, cuernos. Pequeña y de silueta. */
const cabra = (ctx, x, y, color, ahora, i) => {
  ctx.fillStyle = color;
  elipse(ctx, color, x, y - 6, 7, 4);
  circulo(ctx, color, x + 7, y - 9, 2.6);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const paso = Math.sin(ahora * 3 + i) * 1.2;
  for (const dx of [-4, -1.5, 2.5, 5]) {
    ctx.moveTo(x + dx, y - 3);
    ctx.lineTo(x + dx + (dx > 0 ? paso : -paso), y + 1);
  }
  ctx.moveTo(x + 7.5, y - 11);
  ctx.quadraticCurveTo(x + 6, y - 15, x + 3.5, y - 14);
  ctx.stroke();
};

const coro = {
  cielo: {
    arriba: ["#5fb3e8", "#e8a25a", "#8a4a6a", "#1d1a3a"],
    abajo: ["#fbe7b0", "#ffc27a", "#d6826a", "#3a2a52"],
  },
  sol: ["#fffbe0", "#ffe08a", "#ffa255", "#ff7a3a"],
  estrellas: 1,
  fondo(ctx, p, escena, prog, ahora, { reducido }) {
    const { ancho } = escena;
    // La sierra de San Luis, lejos y pálida.
    dibujarSierra(ctx, ancho, p.recorrido * 0.03, SUELO - 200, 34, 2.6, tramo(["#c9a7b4", "#b08a9e", "#5c4a6e", "#24203e"], prog));
    // Los médanos, en tres capas.
    duna(ctx, ancho, p.recorrido * 0.06, SUELO - 120, 90, 1.1, tramo(ARENA_LEJOS, prog), tramo(SOMBRA_DUNA, prog));
    duna(ctx, ancho, p.recorrido * 0.14, SUELO - 70, 70, 3.7, tramo(ARENA_MEDIO, prog), tramo(SOMBRA_DUNA, prog));
    // Cardones y cabras sobre la capa del medio.
    teselas(ancho, p.recorrido * 0.14, 300, (x, i) => {
      if (ruido(i) > 0.35) cardonDeFondo(ctx, x + 60 + ruido(i + 1) * 120, SUELO - 40, 46 + ruido(i + 2) * 40, tramo(CARDON_FONDO, prog), i);
      if (ruido(i + 9) > 0.7) cabra(ctx, x + 200, SUELO - 44, tramo(["#6e4a36", "#5a3c2e", "#3a2a34", "#16121c"], prog), ahora, i);
    });
    duna(ctx, ancho, p.recorrido * 0.3, SUELO - 22, 44, 5.2, tramo(ARENA_CERCA, prog), tramo(SOMBRA_DUNA, prog));
    // La arena que vuela: rayitas bajas que corren, siempre (es Coro).
    if (!reducido) {
      ctx.fillStyle = "rgba(255,236,200,0.35)";
      const n = Math.ceil(ancho / 70);
      for (let k = 0; k < n; k += 1) {
        const x = ancho - ((ahora * 260 + k * 97) % (ancho + 120));
        const y = SUELO - 30 - ((k * 53) % 140);
        ctx.fillRect(x, y, 26 + (k % 3) * 10, 1.6);
      }
    }
  },
  suelo(ctx, p, escena, prog) {
    const { ancho } = escena;
    ctx.fillStyle = tramo(["#eab878", "#d8965e", "#8e5e5c", "#2a2238"], prog);
    ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
    // Las ondas que el viento dibuja en la arena.
    ctx.strokeStyle = tramo(["#c98f55", "#b06e48", "#6c4652", "#1a1628"], prog);
    ctx.lineWidth = 1.4;
    for (let fila = 0; fila < 4; fila += 1) {
      const y0 = SUELO + 10 + fila * 12;
      const off = (p.recorrido * (1 + fila * 0.15)) % 40;
      ctx.beginPath();
      for (let x = -off; x < ancho + 40; x += 40) {
        ctx.moveTo(x, y0);
        ctx.quadraticCurveTo(x + 10, y0 - 4, x + 20, y0);
      }
      ctx.stroke();
    }
  },
};

/* —— Mérida ———————————————————————————————————————————————————————————— */

const ROCA_LEJOS = ["#8a8fb8", "#7a7aa8", "#4a4a7a", "#1e2044"];
const ROCA_MEDIO = ["#6a7a8a", "#5e687e", "#3c4462", "#161a34"];
const PARAMO = ["#8a9a5a", "#768650", "#3e4a40", "#141c1c"];
const NIEVE = ["#ffffff", "#fbe8e0", "#c8c4e0", "#6a6e98"];

/** Una cordillera de picos: triángulos irregulares con su capa de nieve arriba. */
const picos = (ctx, ancho, desplaz, base, alto, semilla, color, nieve) => {
  teselas(ancho, desplaz, 260, (x, i) => {
    const r = ruido(i * 1.7 + semilla);
    const h = alto * (0.65 + r * 0.45);
    const w = 260 + ruido(i + semilla) * 120;
    const cx = x + w * 0.45;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 60, base);
    ctx.lineTo(cx - w * 0.12, base - h * 0.72);
    ctx.lineTo(cx, base - h);
    ctx.lineTo(cx + w * 0.16, base - h * 0.66);
    ctx.lineTo(x + w + 60, base);
    ctx.closePath();
    ctx.fill();
    // La nieve: la punta, con un borde mordido.
    ctx.fillStyle = nieve;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.08, base - h * 0.8);
    ctx.lineTo(cx, base - h);
    ctx.lineTo(cx + w * 0.1, base - h * 0.78);
    ctx.lineTo(cx + w * 0.05, base - h * 0.82);
    ctx.lineTo(cx + w * 0.01, base - h * 0.76);
    ctx.lineTo(cx - w * 0.04, base - h * 0.83);
    ctx.closePath();
    ctx.fill();
  });
};

/** Un frailejón: tallo peludo, roseta de hojas plateadas y sus flores amarillas. */
const frailejon = (ctx, x, base, alto, prog, i) => {
  ctx.fillStyle = tramo(["#7a6a4a", "#665a44", "#3e3a3a", "#18161c"], prog);
  ctx.fillRect(x - 3, base - alto, 6, alto);
  const hoja = tramo(["#c9d4b0", "#b0b89a", "#6a7266", "#262c2c"], prog);
  for (let k = -3; k <= 3; k += 1) {
    elipse(ctx, hoja, x + k * 2.6, base - alto - 2 + Math.abs(k) * 1.2, 2.6, 8, k * 0.32);
  }
  if (ruido(i + 4) > 0.4) {
    circulo(ctx, tramo(["#ffd23f", "#f0b83a", "#8a6a3a", "#2a2220"], prog), x + 5, base - alto - 12, 2.2);
    circulo(ctx, tramo(["#ffd23f", "#f0b83a", "#8a6a3a", "#2a2220"], prog), x - 4, base - alto - 14, 1.8);
  }
};

const merida = {
  cielo: {
    arriba: ["#78b2e6", "#e39a7a", "#5a4a8a", "#141a3a"],
    abajo: ["#e8f2fa", "#f7c9a8", "#b88aa8", "#2e3260"],
  },
  sol: ["#ffffff", "#fff1c8", "#ffb27a", "#ff8a5a"],
  estrellas: 1,
  fondo(ctx, p, escena, prog, ahora) {
    const { ancho } = escena;
    // La Sierra Nevada: dos filas de picos con nieve.
    picos(ctx, ancho, p.recorrido * 0.03, SUELO - 70, 300, 1.3, tramo(ROCA_LEJOS, prog), tramo(NIEVE, prog));
    picos(ctx, ancho, p.recorrido * 0.07, SUELO - 50, 210, 4.2, tramo(ROCA_MEDIO, prog), tramo(NIEVE, prog));
    // El teleférico al fondo: torres, el cable y cabinas que suben y bajan.
    const metal = tramo(["#5a5a6a", "#4a4a5e", "#2e2e44", "#14141e"], prog);
    teselas(ancho, p.recorrido * 0.11, 900, (x) => {
      const torres = [
        [x + 120, SUELO - 120],
        [x + 520, SUELO - 220],
        [x + 900, SUELO - 300],
      ];
      ctx.strokeStyle = metal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [tx, ty] of torres) {
        ctx.moveTo(tx - 7, ty + 70);
        ctx.lineTo(tx, ty);
        ctx.lineTo(tx + 7, ty + 70);
        ctx.moveTo(tx - 12, ty);
        ctx.lineTo(tx + 12, ty);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(torres[0][0], torres[0][1]);
      for (const [tx, ty] of torres.slice(1)) ctx.lineTo(tx, ty);
      ctx.stroke();
      // Dos cabinas que se mueven por el cable.
      for (const desfase of [0.25, 0.7]) {
        const k = (ahora * 0.04 + desfase) % 1;
        const tramoCable = k < 0.5 ? 0 : 1;
        const f = (k % 0.5) * 2;
        const [ax, ay] = torres[tramoCable];
        const [bx, by] = torres[tramoCable + 1];
        const cx = ax + (bx - ax) * f;
        const cy = ay + (by - ay) * f;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + 7);
        ctx.stroke();
        ctx.fillStyle = tramo(["#d9423a", "#c03a3a", "#6a2a40", "#2a1426"], prog);
        ctx.fillRect(cx - 5, cy + 7, 10, 8);
      }
    });
    // El páramo: lomas de hierba dorada.
    dibujarSierra(ctx, ancho, p.recorrido * 0.16, SUELO - 40, 26, 2.2, tramo(PARAMO, prog));
    teselas(ancho, p.recorrido * 0.16, 140, (x, i) => {
      if (ruido(i) > 0.45) frailejon(ctx, x + 40, SUELO - 22 + ruido(i + 2) * 8, 16 + ruido(i + 1) * 12, prog, i);
    });
  },
  suelo(ctx, p, escena, prog) {
    const { ancho } = escena;
    ctx.fillStyle = tramo(["#7a8a52", "#66764a", "#36423a", "#121a1a"], prog);
    ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
    // Manchas de nieve y frailejones en primer plano.
    teselas(ancho, p.recorrido * 1.0, 160, (x, i) => {
      elipse(ctx, tramo(NIEVE, prog), x + 50 + ruido(i) * 60, SUELO + 18 + ruido(i + 1) * 20, 24 + ruido(i + 2) * 20, 4);
    });
    teselas(ancho, p.recorrido * 1.0, 110, (x, i) => {
      if (ruido(i + 7) > 0.5) frailejon(ctx, x + 30, SUELO + 8, 18 + ruido(i) * 10, prog, i);
    });
  },
};

/* —— El llano de Barinas ———————————————————————————————————————————————— */

const LLANO_LEJOS = ["#9ab86a", "#86a05a", "#4a5e44", "#18221c"];
const LLANO_CERCA = ["#7aa84a", "#6a9442", "#3a5236", "#121c16"];
const MATA = ["#3f6a32", "#355a2e", "#20362a", "#0a1410"];

/** Una vaca o un caballo de silueta, paciendo. */
const animal = (ctx, x, y, color, tipo) => {
  ctx.fillStyle = color;
  if (tipo === "vaca") {
    ctx.fillRect(x - 10, y - 12, 20, 9);
    ctx.fillRect(x + 8, y - 11, 6, 5);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(x - 5, y - 11, 6, 4);
    ctx.fillStyle = color;
  } else {
    ctx.fillRect(x - 10, y - 13, 19, 7);
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 13);
    ctx.lineTo(x + 14, y - 22);
    ctx.lineTo(x + 17, y - 19);
    ctx.lineTo(x + 11, y - 10);
    ctx.closePath();
    ctx.fill();
  }
  for (const dx of [-8, -4, 4, 7]) ctx.fillRect(x + dx, y - 4, 1.8, 6);
};

/** Un chigüire: redondo, sin cola, el hocico chato. */
const chiguire = (ctx, x, y, color) => {
  elipse(ctx, color, x, y - 5, 8, 5);
  elipse(ctx, color, x + 7, y - 7, 4, 3.2);
  ctx.fillStyle = color;
  ctx.fillRect(x - 5, y - 2, 2, 3);
  ctx.fillRect(x + 3, y - 2, 2, 3);
};

const barinas = {
  cielo: {
    arriba: ["#4aa0e0", "#f0a050", "#a04a5a", "#2a1a3a"],
    abajo: ["#fff3c4", "#ffd08a", "#e08a6a", "#4a2a4a"],
  },
  sol: ["#ffffff", "#fff4b0", "#ffb05a", "#ff7a3a"],
  // El sol del llano: más grande y con más halo que en ninguna otra parte.
  solGrande: true,
  estrellas: 1,
  fondo(ctx, p, escena, prog, ahora, { reducido }) {
    const { ancho } = escena;
    // El horizonte plano del llano, con las matas de monte a lo lejos.
    const horizonte = SUELO - 70;
    ctx.fillStyle = tramo(LLANO_LEJOS, prog);
    ctx.fillRect(0, horizonte, ancho, SUELO - horizonte);
    teselas(ancho, p.recorrido * 0.05, 420, (x, i) => {
      const r = 26 + ruido(i) * 22;
      for (let k = 0; k < 4; k += 1) circulo(ctx, tramo(MATA, prog), x + 80 + k * r * 0.8, horizonte + 4 - ruido(i + k) * 10, r * (0.6 + ruido(i + k + 3) * 0.4));
    });
    // Morichales: palmas llaneras en grupo.
    teselas(ancho, p.recorrido * 0.12, 360, (x, i) => {
      if (ruido(i + 1) < 0.3) return;
      for (let k = 0; k < 3; k += 1) {
        palmera(ctx, x + 60 + k * 26, horizonte + 22, 62 + ruido(i + k) * 30, tramo(["#3a5a32", "#304c2c", "#1c3024", "#0a140e"], prog));
      }
    });
    // El calor que ondula sobre el horizonte.
    if (!reducido) {
      ctx.strokeStyle = `rgba(255,240,200,${0.18 * (1 - prog)})`;
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 3; k += 1) {
        const y = horizonte - 6 - k * 5;
        ctx.beginPath();
        for (let x = 0; x <= ancho; x += 12) ctx.lineTo(x, y + Math.sin(x * 0.05 + ahora * 3 + k) * 1.4);
        ctx.stroke();
      }
    }
    // El pasto cercano y los animales del hato.
    ctx.fillStyle = tramo(LLANO_CERCA, prog);
    ctx.fillRect(0, SUELO - 34, ancho, 34);
    const silueta = tramo(["#4a3a2a", "#3e3226", "#262024", "#0e0c12"], prog);
    teselas(ancho, p.recorrido * 0.35, 420, (x, i) => {
      const r = ruido(i + 5);
      if (r < 0.3) animal(ctx, x + 120, SUELO - 14, silueta, "vaca");
      else if (r < 0.55) animal(ctx, x + 260, SUELO - 14, silueta, "caballo");
      if (ruido(i + 8) > 0.5) {
        chiguire(ctx, x + 340, SUELO - 10, tramo(["#8a5a3c", "#7a4e36", "#3e2c2a", "#14100e"], prog));
        chiguire(ctx, x + 360, SUELO - 8, tramo(["#7a4e36", "#6a4430", "#362628", "#100c0c"], prog));
      }
    });
  },
  suelo(ctx, p, escena, prog, ahora) {
    const { ancho } = escena;
    ctx.fillStyle = tramo(["#6a9a3e", "#5a8638", "#324a30", "#101a12"], prog);
    ctx.fillRect(0, SUELO, ancho, ALTO - SUELO);
    // La charca del llano, donde se bañan los chigüires.
    teselas(ancho, p.recorrido * 1.0, 520, (x, i) => {
      if (ruido(i) < 0.5) return;
      elipse(ctx, tramo(["#6ab0d8", "#5a96c0", "#33506e", "#101a2c"], prog), x + 200, SUELO + 26, 70, 9);
      chiguire(ctx, x + 175, SUELO + 22, tramo(["#8a5a3c", "#7a4e36", "#3e2c2a", "#14100e"], prog));
    });
    // Las matas de pasto, que pasan.
    ctx.strokeStyle = tramo(["#4a7a2e", "#3e6a2a", "#243c24", "#0a140c"], prog);
    ctx.lineWidth = 1.6;
    teselas(ancho, p.recorrido * 1.0, 30, (x, i) => {
      const h = 6 + ruido(i) * 8;
      const y = SUELO + 8 + ruido(i + 2) * 30;
      const meneo = Math.sin(ahora * 2 + i) * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3 + meneo, y - h);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 3 + meneo, y - h);
      ctx.stroke();
    });
  },
};

export const ESCENARIOS = { caracas, barquisimeto, margarita, zulia, laguaira, canaima, loma, coro, merida, barinas };
