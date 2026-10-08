/**
 * El motor de «Vuela, guacamaya», sin navegador. `npm run test:guacamaya`.
 *
 *   npm run test:guacamaya                    las comprobaciones, con pocas partidas
 *   npm run test:guacamaya -- --calibrar      la tabla de dificultad con más partidas
 *
 * Además de lo de siempre (el vuelo del día es el mismo para todos, nunca hay una pared
 * imposible, dura un minuto), esto mide **cuánta dificultad tiene cada vuelo** con un
 * piloto automático: mira lo que viene dentro de lo que se ve en pantalla, imagina unos
 * cuantos aleteos y elige el que no choca. No es una persona: no se cansa, no se
 * distrae y no se asusta, así que llega mucho más lejos que cualquiera. Por eso lo que
 * se pide aquí son **bandas** (el primer vuelo lo supera casi siempre, el sexto solo a
 * veces) y no cifras exactas: lo que importa es la escalera, no el número.
 */
import {
  ALTO,
  DURACION,
  RADIO,
  SUELO,
  VIDAS,
  aletear,
  avanzar,
  crearPartida,
  estrellasDe,
  forma,
  gravedadEn,
  impulsoDeAleteo,
  semillaDelDia,
  semillaDe,
  xDeLaGuacamaya,
} from "./motor.js";
import { NIVELES } from "./niveles.js";
import { migrar } from "./registro.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

const CALIBRAR = process.argv.includes("--calibrar");
const ANCHO = 480; // un teléfono en vertical: unos 346 unidades de camino por delante de la guacamaya
const DT = 1 / 60;

/* —— El piloto automático ——————————————————————————————————————————————— */

const PASO = 0.05;
const PASOS = 20; // un segundo de futuro
/**
 * Los aleteos que imagina: ninguno, uno solo en distintos momentos, y series con ritmo
 * (para subir o sostener la altura). Los hay a todas las cadencias que da un dedo.
 */
const PLANES = (() => {
  const planes = [[]];
  for (let k = 0; k <= 10; k += 1) planes.push([k * PASO]);
  for (const ritmo of [0.1, 0.14, 0.2, 0.28, 0.4]) {
    for (const inicio of [0, 0.05, 0.1]) {
      const plan = [];
      for (let t = inicio; t < PASOS * PASO; t += ritmo) plan.push(t);
      planes.push(plan);
    }
  }
  return planes;
})();


/** Cómo estará `o` dentro de `tau` segundos, mirando solo lo que el motor hace con él. */
const futuro = (o, tau, vel) => {
  const c = { ...o, fase: (o.fase || 0) + tau };
  if (o.tipo === "avion") {
    const libre = Math.max(0, tau - Math.max(0, o.espera));
    c.espera = o.espera - tau;
    c.x = o.x - (vel + o.extra) * libre;
  } else {
    c.x = o.x - (vel + (o.extra || 0)) * tau;
  }
  return c;
};

const velocidadAhora = (p) => {
  const prog = p.t / DURACION;
  return p.nivel.vel[0] + (p.nivel.vel[1] - p.nivel.vel[0]) * prog;
};

/** Decide si aletear ahora. `vision` es cuánto del camino por delante se ve. */
const decidir = (p, vision) => {
  const gx = xDeLaGuacamaya(p);
  const vel = velocidadAhora(p);
  const vistos = p.obstaculos.filter((o) => o.x < gx + vision && o.x > gx - 140);
  const piedras = p.piedras;
  // Las formas de todo, en cada paso del futuro.
  const sombras = [];
  for (let k = 0; k <= PASOS; k += 1) {
    const tau = k * PASO;
    const lista = [];
    for (const o of vistos) {
      const f = forma(futuro(o, tau, vel));
      if (f) lista.push(f);
    }
    for (const s of piedras) {
      lista.push({ circulo: { x: s.x + s.vx * tau, y: s.y + s.vy * tau + 0.5 * s.g * tau * tau, r: s.r } });
    }
    sombras.push(lista);
  }
  // La gravedad de cada paso: el clima de ahora, con las térmicas donde estarán entonces.
  const termicas = vistos.filter((o) => o.tipo === "termica");
  const gravedades = [];
  for (let k = 0; k <= PASOS; k += 1) {
    gravedades.push(gravedadEn(p, gx, termicas.map((o) => futuro(o, k * PASO, vel))));
  }
  const impulso = impulsoDeAleteo(p);
  // Hacia dónde conviene estar si nada apremia: hacia el mango más cercano que se alcance.
  const mango = p.mangosEnVuelo.filter((m) => m.x > gx && m.x < gx + vision * 0.7).sort((a, b) => a.x - b.x)[0];
  const comodo = mango ? mango.y : ALTO * 0.45;

  let mejor = null;
  for (const plan of PLANES) {
    let y = p.y;
    let vy = p.vy;
    let costo = 0;
    const pendientes = [...plan];
    for (let k = 1; k <= PASOS; k += 1) {
      const tau = k * PASO;
      // Un paso de la guacamaya: los aleteos del plan caen en el paso que les toca.
      while (pendientes.length && pendientes[0] <= tau - PASO + 1e-9) {
        vy = impulso;
        pendientes.shift();
      }
      vy = Math.min(620, vy + 1500 * gravedades[k] * PASO);
      if (gravedades[k] < 0) vy = Math.max(-420, vy);
      y += vy * PASO;
      if (y < RADIO) y = RADIO;
      if (p.invulnerable > tau) continue;
      if (y + RADIO >= SUELO) {
        costo += 1000 * (1 - tau / (PASOS * PASO)) + 200;
        break;
      }
      let choque = false;
      for (const f of sombras[k]) {
        if (f.rect) {
          const nx = Math.max(f.rect.x, Math.min(gx, f.rect.x + f.rect.w));
          const ny = Math.max(f.rect.y, Math.min(y, f.rect.y + f.rect.h));
          choque = (gx - nx) ** 2 + (y - ny) ** 2 < RADIO * RADIO;
        } else {
          choque = (gx - f.circulo.x) ** 2 + (y - f.circulo.y) ** 2 < (RADIO + f.circulo.r) ** 2;
        }
        if (choque) break;
      }
      if (choque) {
        costo += 1000 * (1 - tau / (PASOS * PASO)) + 200;
        break;
      }
      if (k === PASOS) costo += Math.abs(y - comodo) * 0.05 + (SUELO - y < 60 ? 15 : 0);
    }
    // Un aleteo de más cuesta un poco: así no revolotea sin motivo.
    costo += plan.length * 0.4;
    if (!mejor || costo < mejor.costo) mejor = { costo, plan };
  }
  return mejor.plan.length > 0 && mejor.plan[0] < PASO * 0.5;
};

/** Una partida entera con el piloto automático. Devuelve cómo acabó. */
const jugar = (nivel, semilla, vision = ANCHO - xDeLaGuacamaya({ ancho: ANCHO }) - 20) => {
  const p = crearPartida({ ancho: ANCHO, semilla, nivel });
  let tick = 0;
  while (!p.terminada && tick < DURACION * 70) {
    if (tick % 3 === 0 && decidir(p, vision)) aletear(p);
    avanzar(p, DT);
    tick += 1;
  }
  return p;
};

/* —— 1. Lo que no puede fallar ——————————————————————————————————————————— */

console.log("\n  Lo que se promete\n");

for (const n of NIVELES) {
  const foto = (semilla) => {
    const p = crearPartida({ ancho: ANCHO, semilla, nivel: n.id });
    const vistos = [];
    for (let t = 0; t < DURACION * 60; t += 1) {
      avanzar(p, DT);
      if (t % 30 === 0) vistos.push(p.obstaculos.map((o) => `${o.tipo}@${Math.round(o.x)}`).join("|"));
      if (p.terminada) break;
    }
    return JSON.stringify([p.mangosSalidos, vistos.slice(0, 40)]);
  };
  const semilla = semillaDelDia("2026-10-06", n.id);
  check(`vuelo ${n.id} (${n.clave}): el mismo día, el mismo vuelo`, foto(semilla) === foto(semilla));
  check(`vuelo ${n.id}: otro día, otro vuelo`, foto(semilla) !== foto(semillaDelDia("2026-10-07", n.id)) || n.jefe);
}
check("el primer vuelo conserva la semilla de siempre", semillaDelDia("2026-10-06", 1) === semillaDe("guacamaya-2026-10-06"));

// Dura un minuto: sin tocar nada, la guacamaya cae a la calle; con un piloto sin vidas no llega.
{
  const p = crearPartida({ ancho: ANCHO, semilla: 1, nivel: 1 });
  let t = 0;
  while (!p.terminada && t < 600) {
    avanzar(p, DT);
    t += 1;
  }
  check("sin aletear se pierde enseguida: la calle cuesta vidas", p.terminada && !p.llego && p.t < 15, p.t);
}

// Nunca una pared imposible: los pasos entre rocas y el hueco sobre un edificio siempre caben.
{
  let peor = Infinity;
  let peorEdificio = Infinity;
  for (let s = 1; s <= 40; s += 1) {
    const p = crearPartida({ ancho: ANCHO, semilla: s, nivel: NIVELES.find((n) => n.clave === "canaima").id });
    const q = crearPartida({ ancho: ANCHO, semilla: s, nivel: 1 });
    for (let t = 0; t < DURACION * 60; t += 1) {
      avanzar(p, DT);
      avanzar(q, DT);
      if (p.obstaculos.some((o) => o.tipo === "roca")) {
        const arriba = p.obstaculos.filter((o) => o.tipo === "roca" && o.desde === "arriba");
        for (const a of arriba) {
          const b = p.obstaculos.find((o) => o.tipo === "roca" && o.desde === "abajo" && o.x === a.x);
          if (b) peor = Math.min(peor, b.y - (a.y + a.h));
        }
      }
      for (const o of q.obstaculos) if (o.tipo === "edificio") peorEdificio = Math.min(peorEdificio, SUELO - o.h);
      if (p.terminada || q.terminada) break;
    }
  }
  check("el paso entre dos rocas nunca baja de 180 unidades", peor >= 180, peor);
  check("sobre un edificio siempre quedan 230 unidades", peorEdificio >= 230 - 1e-6, peorEdificio);
}

// El avión avisa antes de cruzar y no choca mientras espera.
{
  const p = crearPartida({ ancho: ANCHO, semilla: 7, nivel: 5 });
  let visto = null;
  for (let t = 0; t < DURACION * 60 && !visto; t += 1) {
    avanzar(p, DT);
    visto = p.obstaculos.find((o) => o.tipo === "avion");
  }
  check("el primer avión espera fuera de la pantalla antes de entrar", !!visto && visto.espera > 0 && visto.x > ANCHO, visto);
  check("mientras espera no tiene forma para chocar", !!visto && forma(visto) === null);
}

// El jefe: tira piedras, avisa antes y no tira en el último tramo.
{
  const p = crearPartida({ ancho: ANCHO, semilla: 3, nivel: NIVELES.find((n) => n.clave === "loma").id });
  let avisos = 0;
  let enCarga = false;
  let ultima = 0;
  for (let t = 0; t < DURACION * 60 && !p.terminada; t += 1) {
    if ((t % 3) === 0 && decidir(p, ANCHO - xDeLaGuacamaya(p) - 20)) aletear(p);
    const antes = p.jefe.lanzadas;
    avanzar(p, DT);
    if (p.jefe.estado === "carga" && !enCarga) avisos += 1;
    enCarga = p.jefe.estado === "carga";
    if (p.jefe.lanzadas > antes) ultima = p.t;
  }
  check("el jefe levanta el brazo antes de cada tanda", avisos > 5 && p.jefe.lanzadas >= avisos, { avisos, lanzadas: p.jefe.lanzadas });
  check("la última piedra sale antes de los últimos tres segundos", ultima < DURACION - 3 + 1.2, ultima);
  check("en el vuelo del jefe no sale ningún otro obstáculo", p.obstaculos.length === 0);
}

// Las estrellas: llegar, sin golpes, con mangos.
{
  const p = { llego: false, golpes: 0, mangos: 9, mangosSalidos: 9 };
  check("sin llegar, cero estrellas", estrellasDe(p) === 0);
  check("llegando sin golpes y con mangos, tres", estrellasDe({ ...p, llego: true }) === 3);
  check("llegando con un golpe, una o dos", estrellasDe({ ...p, llego: true, golpes: 1 }) === 2 && estrellasDe({ ...p, llego: true, golpes: 1, mangos: 1 }) === 1);
}

/* —— 2. La escalera de dificultad ——————————————————————————————————————— */

const PARTIDAS = CALIBRAR ? 40 : 12;
console.log(`\n  Dificultad con el piloto automático (${PARTIDAS} vuelos por nivel, ancho ${ANCHO})\n`);
console.log("      vuelo            llega   3 vidas   mangos   golpes");
const tasas = [];
for (const n of NIVELES) {
  let llegan = 0;
  let intactas = 0;
  let mangos = 0;
  let salidos = 0;
  let golpes = 0;
  for (let s = 1; s <= PARTIDAS; s += 1) {
    const p = jugar(n.id, semillaDe(`calibrar-${n.id}-${s}`));
    if (p.llego) llegan += 1;
    if (p.llego && p.golpes === 0) intactas += 1;
    mangos += p.mangos;
    salidos += p.mangosSalidos;
    golpes += p.golpes;
  }
  const tasa = llegan / PARTIDAS;
  tasas.push(tasa);
  console.log(
    `      ${String(n.id).padStart(1)} ${n.clave.padEnd(14)} ${String(Math.round(tasa * 100)).padStart(4)} %  ${String(Math.round((intactas / PARTIDAS) * 100)).padStart(5)} %  ${String(Math.round((mangos / Math.max(1, salidos)) * 100)).padStart(5)} %  ${(golpes / PARTIDAS).toFixed(1).padStart(6)}`
  );
}

// Las bandas, por lugar y no por número (el número de un vuelo puede cambiar). El piloto
// es mejor que cualquier persona, así que Canaima y el jefe se piden difíciles incluso
// para él.
const BANDAS = {
  caracas: [0.8, 1.0],
  barquisimeto: [0.8, 1.0],
  margarita: [0.65, 0.95],
  zulia: [0.5, 0.9],
  laguaira: [0.35, 0.85],
  loma: [0.3, 0.8],
  // Coro: el piloto ve el viento antes que nadie y lo compensa perfecto; una persona
  // no. Por eso para él es más fácil de lo que se siente al jugarlo.
  coro: [0.4, 0.98],
  merida: [0.22, 0.72],
  barinas: [0.2, 0.7],
  canaima: [0.12, 0.55],
};
const tasaDe = {};
NIVELES.forEach((n, i) => {
  tasaDe[n.clave] = tasas[i];
  const banda = BANDAS[n.clave];
  check(`vuelo ${n.id} (${n.clave}): tiene banda de dificultad`, Boolean(banda));
  if (!banda) return;
  const [min, max] = banda;
  check(`vuelo ${n.id} (${n.clave}): el piloto llega entre el ${Math.round(min * 100)} % y el ${Math.round(max * 100)} % de las veces`, tasas[i] >= min && tasas[i] <= max, Math.round(tasas[i] * 100));
});
check(
  "la escalera sube: Canaima es más difícil que Caracas y que La Guaira",
  tasaDe.canaima < tasaDe.caracas && tasaDe.canaima < tasaDe.laguaira
);
// Contra el promedio y no uno a uno: con doce vuelos por nivel la tasa de cada uno se
// mueve bastante, y una comparación uno a uno fallaría por azar.
check(
  "Canaima es más difícil que los tres vuelos anteriores (Coro, Mérida y Barinas) en promedio",
  tasaDe.canaima < (tasaDe.coro + tasaDe.merida + tasaDe.barinas) / 3
);
check("Canaima cierra el juego", NIVELES[NIVELES.length - 1].clave === "canaima");

/* —— 3. El progreso guardado con números se convierte a claves ————————————————— */

const viejo = { dia: "2026-10-01", racha: 2, record: 300, ultimo: 6, niveles: { 1: { record: 300, estrellas: 3, llego: true }, 6: { record: 120, estrellas: 1, llego: true }, 7: { record: 90, estrellas: 0, llego: false } } };
const nuevo = migrar(viejo);
check("migrar: el 6 de antes era Canaima", nuevo.vuelos.canaima?.record === 120);
check("migrar: el 7 de antes era la loma", nuevo.vuelos.loma?.record === 90);
check("migrar: el último vuelo pasa a clave", nuevo.ultimo === "canaima");
check("migrar: lo ya convertido no se toca", migrar(nuevo) === nuevo);

console.log(fallos ? `\n  ${fallos} fallo(s)` : "\n  todo verde");
process.exit(fallos ? 1 : 0);
