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
const { PASOS_CANAL, recorridoCanal } = await import("./guias/guiaCanal.js");
const { PASOS_CUENTA, recorridoCuenta } = await import("./guias/guiaCuenta.js");
const { PASOS_PROPUESTA, recorridoPropuesta } = await import("./guias/guiaPropuesta.js");
const { PASOS_PERFIL, recorridoPerfil } = await import("./guias/guiaPerfil.js");
const { readFileSync } = await import("node:fs");
const diccionario = (lang) => JSON.parse(readFileSync(new URL(`../i18n/${lang}/cuenta.json`, import.meta.url), "utf8"));
const buscar = (dic, clave) => clave.split(".").reduce((nodo, parte) => (nodo == null ? undefined : nodo[parte]), dic);

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

a.iniciar();
b.iniciar();
check("abrir una guía cierra la otra", a.pasoActivo() === null && b.pasoActivo() === 0);
b.irAPaso(null);

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

console.log("guía del Canal de YouTube");
check("empieza sin anclaje y acaba en «Guía»", PASOS_CANAL[0].clave === undefined && PASOS_CANAL.at(-1).clave === "guia");
check("todos con título y texto", PASOS_CANAL.every((p) => p.titulo && (p.texto || p.puntos?.length)));
check("puntos con la forma «Nombre: qué es»", PASOS_CANAL.every((p) => (p.puntos ?? []).every((t) => t.includes(": "))));
check("anclaje data-tour-canal", recorridoCanal.atributo === "data-tour-canal");

// Las guías de la cuenta: los textos son claves, y tienen que existir en los dos idiomas.
const DIC = { es: diccionario("es"), en: diccionario("en") };
for (const [nombre, pasos, recorrido, ultimo] of [
  ["la bienvenida a la cuenta", PASOS_CUENTA, recorridoCuenta, "ayuda"],
  ["«Proponer una pieza»", PASOS_PROPUESTA, recorridoPropuesta, "guia"],
  ["«Mi perfil»", PASOS_PERFIL, recorridoPerfil, "guia"],
]) {
  console.log(`guía de ${nombre}`);
  check("se traduce", recorrido.traducir === true);
  check(`empieza sin anclaje y acaba en «${ultimo}»`, pasos[0].clave === undefined && pasos.at(-1).clave === ultimo);
  check("todos con título y texto", pasos.every((p) => p.titulo && (p.texto || p.puntos?.length)));
  const claves = pasos.flatMap((p) => [p.titulo, p.texto, ...(p.puntos ?? [])]).filter(Boolean);
  for (const lang of ["es", "en"]) {
    const faltan = claves.filter((c) => typeof buscar(DIC[lang], c) !== "string");
    check(`todas las claves existen en ${lang}`, faltan.length === 0, faltan);
  }
  const puntos = pasos.flatMap((p) => p.puntos ?? []);
  check("puntos con la forma «Nombre: qué es» (es)", puntos.every((c) => buscar(DIC.es, c)?.includes(": ")));
}
check("los pasos del menú lo abren en el teléfono", PASOS_CUENTA.filter((p) => p.abrirMenu).length === 6);

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
