/**
 * Las guías paso a paso. `npm run test:recorrido`.
 */

// Lo justo del navegador: localStorage y eventos.
const almacen = new Map();
globalThis.window = new EventTarget();
window.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => almacen.set(k, String(v)),
  removeItem: (k) => almacen.delete(k),
};

const { crearRecorrido } = await import("./recorridoVista.js");
const { PASOS_TITULARES, recorridoTitulares } = await import("./guias/guiaTitulares.js");
const { PASOS_RESUMEN, recorridoResumen } = await import("./guias/guiaResumen.js");

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

console.log("crearRecorrido");
const a = crearRecorrido("prueba-a", [{ titulo: "Uno" }, { titulo: "Dos" }]);
const b = crearRecorrido("prueba-b", [{ titulo: "Otro" }]);
let avisos = 0;
const soltar = a.suscribir(() => avisos++);

check("empieza cerrada", a.pasoActivo() === null);
a.iniciar();
check("iniciar va al primer paso", a.pasoActivo() === 0 && a.definicionActual()?.titulo === "Uno");
check("la otra guía no se entera", b.pasoActivo() === null);
check("avisa a quien escucha", avisos === 1);
a.irAPaso(1);
check("avanza", a.definicionActual()?.titulo === "Dos");
a.irAPaso(5);
check("fuera de rango = cerrada", a.pasoActivo() === null);
a.irAPaso(null);
soltar();
a.iniciar();
check("tras soltar ya no avisa", avisos === 4, avisos);
check("el paso sobrevive en el almacén", almacen.get("sureconomics_recorrido_prueba-a") === "0");
check("su atributo de anclaje", a.atributo === "data-tour-prueba-a");
a.irAPaso(null);
check("cerrar borra el paso", !almacen.has("sureconomics_recorrido_prueba-a"));

console.log("guía de Titulares");
check("el primer paso explica la página, sin anclaje", PASOS_TITULARES[0].clave === undefined);
check("el último vuelve al botón «Guía»", PASOS_TITULARES.at(-1).clave === "guia");
check("todos con título", PASOS_TITULARES.every((p) => p.titulo && (p.texto || p.puntos?.length)));
check("puntos con la forma «Nombre: qué es»", PASOS_TITULARES.every((p) => (p.puntos ?? []).every((t) => t.includes(": "))));
check("anclaje data-tour-titulares", recorridoTitulares.atributo === "data-tour-titulares");

console.log("guía del Resumen diario");
check("empieza sin anclaje y acaba en «Guía»", PASOS_RESUMEN[0].clave === undefined && PASOS_RESUMEN.at(-1).clave === "guia");
check("todos con título y texto", PASOS_RESUMEN.every((p) => p.titulo && (p.texto || p.puntos?.length)));
check("puntos con la forma «Nombre: qué es»", PASOS_RESUMEN.every((p) => (p.puntos ?? []).every((t) => t.includes(": "))));
check("anclaje data-tour-resumen", recorridoResumen.atributo === "data-tour-resumen");

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
