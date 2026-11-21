/**
 * Cómo salen las impresiones de publicidad. `npm run test:lotes`.
 *
 * Un reloj y unos temporizadores de mentira, y un servidor de mentira que contesta como
 * el backend nuevo (`/vistos` existe) o como uno anterior (404).
 */
import { CUPO_MS, ESPERA_MAXIMA_MS, RUTA_UNA, RUTA_VARIAS, crearEnvioDeVistos } from "./envioDeVistos.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};
const esperarPromesas = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

/** Un navegador y un servidor de mentira. `backend`: "nuevo" | "viejo". */
const montar = ({ backend = "nuevo", beaconSale = true, recordado = null } = {}) => {
  const servidor = { backend };
  let ahora = 0;
  let siguiente = 1;
  const timers = new Map();
  const beacons = [];
  const fetches = [];
  const almacenado = { valor: recordado };
  const envio = crearEnvioDeVistos({
    base: "https://api",
    beacon: (url, cuerpo) => {
      if (!beaconSale) return false;
      beacons.push({ ruta: url.replace("https://api", ""), cuerpo, en: ahora });
      return true;
    },
    peticion: (url, cuerpo) => {
      const ruta = url.replace("https://api", "");
      fetches.push({ ruta, cuerpo, en: ahora });
      const existe = ruta === RUTA_UNA || (ruta === RUTA_VARIAS && servidor.backend === "nuevo");
      return Promise.resolve({ ok: existe, status: existe ? 204 : 404 });
    },
    reloj: () => ahora,
    programar: (fn, ms) => {
      const id = siguiente++;
      timers.set(id, { fn, en: ahora + ms });
      return id;
    },
    cancelar: (id) => timers.delete(id),
    almacen: { leer: () => almacenado.valor, escribir: (v) => (almacenado.valor = v) },
  });
  const avanzar = (ms) => {
    const fin = ahora + ms;
    for (;;) {
      const due = [...timers.entries()].filter(([, t]) => t.en <= fin).sort((a, b) => a[1].en - b[1].en)[0];
      if (!due) break;
      timers.delete(due[0]);
      ahora = due[1].en;
      due[1].fn();
    }
    ahora = fin;
  };
  /** Todo lo que salió (beacon o fetch), como [ruta, fichas]. */
  const salidas = () =>
    [...beacons.map((b) => ({ ...b, via: "beacon" })), ...fetches.map((f) => ({ ...f, via: "fetch" }))]
      .sort((a, b) => a.en - b.en)
      .map((s) => [s.ruta, s.cuerpo.split("\n"), s.via, s.en]);
  return { envio, avanzar, beacons, fetches, salidas, almacenado, servidor, ahora: () => ahora };
};

console.log("la primera de cada página, al momento");
{
  const m = montar();
  m.envio.ver("f1", { clave: "banner|A", pagina: "/" });
  check("sale sola y en el acto a /visto", m.beacons.length === 1 && m.beacons[0].ruta === RUTA_UNA && m.beacons[0].cuerpo === "f1", m.salidas());
  m.envio.ver("f2", { clave: "rail|B", pagina: "/" });
  m.envio.ver("f3", { clave: "banner|C", pagina: "/" });
  check("las rotaciones esperan", m.salidas().length === 1, m.salidas());
  m.avanzar(ESPERA_MAXIMA_MS - 1);
  check("… menos de cinco segundos", m.salidas().length === 1, m.salidas());
  m.avanzar(1);
  const s = m.salidas();
  check("y salen juntas a /vistos", s.length === 2 && s[1][0] === RUTA_VARIAS && s[1][1].join() === "f2,f3", s);
  m.avanzar(40_000);
  m.envio.ver("f4", { clave: "banner|D", pagina: "/noticias/x" });
  check("otra página: su primera, al momento",
    m.salidas().some((s) => s[0] === RUTA_UNA && s[1].join() === "f4" && s[3] === m.ahora()), m.salidas());
}

console.log("\nbackend nuevo y cliente nuevo");
{
  const m = montar({ backend: "nuevo" });
  m.envio.ver("a", { pagina: "/" });
  m.envio.ver("b", { pagina: "/" });
  m.envio.ver("c", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  await esperarPromesas();
  check("sin saber aún, el lote va por fetch (que ve la respuesta)", m.fetches.length === 1 && m.fetches[0].ruta === RUTA_VARIAS, m.fetches);
  check("y se recuerda que /vistos existe", m.almacenado.valor === "si");
  m.envio.ver("d", { pagina: "/" });
  m.envio.ver("e", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  const ultimo = m.fetches.at(-1);
  check("con la pestaña viva sigue por fetch (para ver si un día da 404)",
    m.fetches.length === 2 && ultimo.ruta === RUTA_VARIAS && ultimo.cuerpo === "d\ne", m.salidas());
  check("sin repetir nada a /visto", m.beacons.filter((b) => b.ruta === RUTA_UNA).length === 1, m.salidas());
}

console.log("\nbackend viejo (sin /vistos) y cliente nuevo");
{
  const m = montar({ backend: "viejo" });
  m.envio.ver("a", { pagina: "/" });
  m.envio.ver("b", { pagina: "/" });
  m.envio.ver("c", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  await esperarPromesas();
  const unaAUna = m.beacons.filter((x) => x.ruta === RUTA_UNA).map((x) => x.cuerpo);
  check("con 404 vuelven a salir una a una a /visto", unaAUna.join() === "a,b,c", m.salidas());
  check("y se recuerda durante la sesión", m.almacenado.valor === "no");
  m.envio.ver("d", { pagina: "/" });
  m.envio.ver("e", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  check("el siguiente lote ya no pregunta: una a una",
    m.fetches.length === 1 && m.beacons.slice(-2).map((x) => `${x.ruta}:${x.cuerpo}`).join() === `${RUTA_UNA}:d,${RUTA_UNA}:e`,
    m.salidas());
}
{
  const m = montar({ backend: "viejo", recordado: "no" });
  m.envio.ver("a", { pagina: "/" });
  m.envio.ver("b", { pagina: "/" });
  m.envio.ver("c", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  check("lo recordado de antes en la sesión vale", m.fetches.length === 0 && m.beacons.every((x) => x.ruta === RUTA_UNA), m.salidas());
}

console.log("\nel backend se revierte con la pestaña abierta");
{
  const m = montar({ backend: "nuevo" });
  m.envio.ver("a", { pagina: "/" });
  m.envio.ver("b", { pagina: "/" });
  m.envio.ver("c", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  await esperarPromesas();
  check("primero aprende que /vistos existe", m.almacenado.valor === "si", m.almacenado);

  m.servidor.backend = "viejo"; // vuelta atrás del backend: /vistos da 404
  m.envio.ver("d", { pagina: "/" });
  m.envio.ver("e", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  await esperarPromesas();
  check("el lote siguiente va por fetch y ve el 404", m.fetches.at(-1).ruta === RUTA_VARIAS && m.fetches.at(-1).cuerpo === "d\ne", m.salidas());
  const reenviadas = m.beacons.filter((x) => x.ruta === RUTA_UNA).map((x) => x.cuerpo);
  check("se reenvía ficha a ficha a /visto: no se pierde nada", reenviadas.join() === "a,d,e", m.salidas());
  check("y cambia a «no»", m.almacenado.valor === "no", m.almacenado);

  m.envio.ver("f", { pagina: "/" });
  m.envio.ver("g", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  check("desde entonces, una a una sin preguntar", m.fetches.length === 2 && m.beacons.slice(-2).every((x) => x.ruta === RUTA_UNA), m.salidas());
}

console.log("\nal ocultar o cerrar la pestaña");
{
  const m = montar({ backend: "nuevo" });
  m.envio.ver("a", { pagina: "/" });
  m.envio.ver("b", { pagina: "/" });
  m.envio.ver("c", { pagina: "/" });
  m.envio.vaciar({ saliendo: true });
  check("sin saber si hay /vistos, una a una a /visto por beacon (vale con cualquier backend)",
    m.fetches.length === 0 && m.beacons.map((x) => `${x.ruta}:${x.cuerpo}`).join() === `${RUTA_UNA}:a,${RUTA_UNA}:b,${RUTA_UNA}:c`,
    m.salidas());
}
{
  const m = montar({ backend: "nuevo", recordado: "si" });
  m.envio.ver("a", { pagina: "/" });
  m.envio.ver("b", { pagina: "/" });
  m.envio.ver("c", { pagina: "/" });
  m.envio.vaciar({ saliendo: true });
  check("sabiendo que hay /vistos, juntas por beacon", m.beacons.at(-1).ruta === RUTA_VARIAS && m.beacons.at(-1).cuerpo === "b\nc", m.salidas());
}

console.log("\nsi el beacon no sale");
{
  const m = montar({ beaconSale: false, recordado: "si" });
  m.envio.ver("a", { pagina: "/" });
  check("la suelta cae a fetch con keepalive", m.fetches.length === 1 && m.fetches[0].ruta === RUTA_UNA, m.salidas());
  m.envio.ver("b", { pagina: "/" });
  m.envio.ver("c", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  check("y el lote también", m.fetches.length === 2 && m.fetches[1].ruta === RUTA_VARIAS, m.salidas());
}

console.log("\nel cupo de 30 s cuenta lo mismo que sin juntar");
{
  // La pieza X en el banner: rotación de la página «/» (sale a los 5 s) y, 30 s después de
  // verla, primera de la página siguiente. Se vieron con 30 s entre una y otra: tienen
  // que llegar con 30 s o más, o el cupo descartaría la segunda.
  const m = montar({ recordado: "si" });
  m.envio.ver("primera", { clave: "banner|Y", pagina: "/" });
  m.avanzar(1000);
  m.envio.ver("x1", { clave: "banner|X", pagina: "/" }); // vista en 1 s, sale en 6 s
  m.avanzar(ESPERA_MAXIMA_MS);
  m.avanzar(CUPO_MS - ESPERA_MAXIMA_MS); // ahora = 31 s
  m.envio.ver("x2", { clave: "banner|X", pagina: "/otra" });
  const salidaX1 = m.salidas().find((s) => s[1].includes("x1"));
  check("no sale antes de 30 s después de la anterior", !m.salidas().some((s) => s[1].includes("x2")), m.salidas());
  m.avanzar(10_000);
  const salidaX2 = m.salidas().find((s) => s[1].includes("x2"));
  check("sale cuando ya pasaron (más el margen)", salidaX2 && salidaX2[3] - salidaX1[3] >= CUPO_MS, [salidaX1, salidaX2]);
}
{
  // Vistas a menos de 30 s: antes la segunda llegaba a menos de 30 s y el cupo la
  // descartaba. Si se retrasara, podría llegar a 30 s o más y contar de más.
  const m = montar({ recordado: "si" });
  m.envio.ver("x1", { clave: "banner|X", pagina: "/" }); // primera, sale en 0
  m.avanzar(28_000);
  m.envio.ver("x2", { clave: "banner|X", pagina: "/" }); // rotación, pero misma pieza a 28 s
  check("la misma pieza vista a menos de 30 s sale en el acto, sin esperar", m.salidas().some((s) => s[1].includes("x2") && s[3] === 28_000), m.salidas());
}
{
  const m = montar({ recordado: "si" });
  m.envio.ver("x1", { clave: "banner|X", pagina: "/" });
  m.avanzar(1000);
  m.envio.ver("y1", { clave: "rail|Y", pagina: "/" });
  m.avanzar(1000);
  m.envio.vaciar({ saliendo: true });
  check("al cerrar sale todo, también lo que esperaba", m.salidas().some((s) => s[1].includes("y1")), m.salidas());
}

console.log("\ntopes");
{
  const m = montar({ recordado: "si" });
  m.envio.ver("cero", { pagina: "/" });
  for (let i = 0; i < 30; i++) m.envio.ver(`f${i}`, { pagina: "/" });
  const lote = m.fetches.find((b) => b.ruta === RUTA_VARIAS);
  check("con treinta esperando salen ya, sin esperar al reloj", lote && lote.cuerpo.split("\n").length === 30, m.salidas());
  m.envio.ver("con espacio", { pagina: "/" });
  m.envio.ver("", { pagina: "/" });
  m.avanzar(ESPERA_MAXIMA_MS);
  check("lo que no es una ficha no viaja", !m.salidas().some((s) => s[1].includes("con espacio")), m.salidas());
}

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
