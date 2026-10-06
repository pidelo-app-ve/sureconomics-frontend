/**
 * El motor de idiomas, en Node y con diccionarios de mentira. `npm run test:i18n`.
 */
import {
  cargarIdioma,
  fijarIdioma,
  formatearFecha,
  formatearNumero,
  idiomaDeRuta,
  registrarCargador,
  registrarDiccionario,
  rutaEnIdioma,
  sinPrefijo,
  tActual,
  traducir,
} from "./motor.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

registrarDiccionario("es", {
  nav: { inicio: "Inicio", hola: "Hola, {nombre}" },
  comun: { resultados: { one: "{n} resultado", other: "{n} resultados" } },
  "clave.con.puntos": "entera",
  soloEs: "Solo en español",
});
registrarCargador("en", async () => ({
  nav: { inicio: "Home", hola: "Hi, {nombre}" },
  comun: { resultados: { one: "{n} result", other: "{n} results" } },
}));

// 1. Traducir
check("clave anidada", traducir("es", "nav.inicio") === "Inicio");
check("clave entera con puntos", traducir("es", "clave.con.puntos") === "entera");
check("variables", traducir("es", "nav.hola", { nombre: "Ana" }) === "Hola, Ana");
check("variable que falta se deja ver", traducir("es", "nav.hola", {}) === "Hola, {nombre}");
check("plural uno", traducir("es", "comun.resultados", { n: 1 }) === "1 resultado");
check("plural otros", traducir("es", "comun.resultados", { n: 2 }) === "2 resultados");
check("plural con miles formateados", traducir("es", "comun.resultados", { n: 1500 }) === "1500 resultados" || traducir("es", "comun.resultados", { n: 1500 }) === "1.500 resultados", traducir("es", "comun.resultados", { n: 1500 }));
check("clave inexistente devuelve la clave", traducir("es", "no.existe") === "no.existe");

// 2. Inglés: antes de cargarlo cae al español; después, traduce
check("inglés sin cargar cae al español", traducir("en", "nav.inicio") === "Inicio");
await cargarIdioma("en");
check("inglés cargado", traducir("en", "nav.inicio") === "Home");
check("inglés: plural", traducir("en", "comun.resultados", { n: 1 }) === "1 result");
check("inglés: falta la clave, cae al español", traducir("en", "soloEs") === "Solo en español");

// 3. Nodos de React dentro de un texto
const nodo = { $$typeof: Symbol.for("react.element"), type: "a", props: {}, key: null };
const partes = traducir("es", "nav.hola", { nombre: nodo });
check("con un nodo devuelve una lista", Array.isArray(partes) && partes.length === 2 && partes[0] === "Hola, " && partes[1].type === "a" && partes[1].key !== null, partes);

// 4. Idioma actual
fijarIdioma("en");
check("tActual usa el idioma del documento", tActual("nav.inicio") === "Home");
fijarIdioma("es");

// 5. Direcciones
check("idiomaDeRuta /en", idiomaDeRuta("/en") === "en");
check("idiomaDeRuta /en/x", idiomaDeRuta("/en/noticias/x") === "en");
check("idiomaDeRuta /entorno NO es inglés", idiomaDeRuta("/entorno") === "es");
check("sinPrefijo", sinPrefijo("/en/noticias/x") === "/noticias/x" && sinPrefijo("/en") === "/" && sinPrefijo("/noticias") === "/noticias");
check("rutaEnIdioma a inglés", rutaEnIdioma("/noticias/x", "en") === "/en/noticias/x");
check("rutaEnIdioma raíz", rutaEnIdioma("/", "en") === "/en" && rutaEnIdioma("/en", "es") === "/");
check("rutaEnIdioma conserva la consulta", rutaEnIdioma("/articulos?formato=noticias", "en") === "/en/articulos?formato=noticias");
check("rutaEnIdioma no duplica", rutaEnIdioma("/en/noticias", "en") === "/en/noticias");
check("rutaEnIdioma deja lo externo", rutaEnIdioma("https://x.com/a", "en") === "https://x.com/a" && rutaEnIdioma("#ancla", "en") === "#ancla");

// 6. Fechas y cifras
check("fecha corta es", formatearFecha("2026-08-01T12:00:00Z", "corta", "es") === "1 ago 2026", formatearFecha("2026-08-01T12:00:00Z", "corta", "es"));
check("fecha corta en", formatearFecha("2026-08-01T12:00:00Z", "corta", "en") === "Aug 1, 2026", formatearFecha("2026-08-01T12:00:00Z", "corta", "en"));
check("fecha larga es", formatearFecha("2026-09-05", "larga", "es") === "5 de septiembre de 2026", formatearFecha("2026-09-05", "larga", "es"));
check("sept → sep", formatearFecha("2026-09-05", "corta", "es") === "5 sep 2026", formatearFecha("2026-09-05", "corta", "es"));
check("solo día no cambia con la zona", formatearFecha("2026-08-01", "diaMes", "en") === "Aug 1");
check("fecha inválida", formatearFecha("no", "corta") === "" && formatearFecha(null) === "");
check("número en", formatearNumero(1234.5, "en") === "1,234.5");

console.log(fallos ? `\n  ${fallos} fallo(s)` : "\n  todo verde");
process.exit(fallos ? 1 : 0);
