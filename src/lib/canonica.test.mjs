/**
 * La consulta que entra en la canónica, y qué direcciones son un filtro (`noindex`).
 * `npm test`.
 */
import { consultaCanonica, esPaginaDeFiltro } from "./canonica.js";
import { PAGINAS_FIJAS, SECCION_DE, enIngles, urlDe } from "../../api/sitemap.js";
import { SITIO } from "./seo.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

check("sin consulta, nada", consultaCanonica("") === "" && consultaCanonica(undefined) === "");
check("el ?v= de compartir no entra", consultaCanonica("?v=tn9n4o") === "");
check("ni el asunto del contacto", consultaCanonica("?asunto=Advertising — formato B") === "");
check("ni las etiquetas de campaña", consultaCanonica("?utm_source=whatsapp&utm_medium=resumen") === "");
check("ni los filtros", consultaCanonica("?ver=podcast") === "");
let r = consultaCanonica("?formato=noticias");
check("el formato sí, porque es otra sección", r === "?formato=noticias", r);
r = consultaCanonica("?v=abc&formato=articulos&utm_source=x");
check("el formato solo, aunque venga mezclado", r === "?formato=articulos", r);
check("un formato vacío no entra", consultaCanonica("?formato=") === "");

// —— Qué dirección es un filtro (y sale con `noindex, follow`) ——
console.log("\nfiltros: noindex");
const filtro = (url) => {
  const u = new URL(url, SITIO);
  return esPaginaDeFiltro(u.pathname, u.search);
};
for (const url of [
  "/explorar?tema=Infraestructura",
  "/en/explorar?tema=Infraestructura",
  "/en/explorar?donde=Venezuela",
  "/explorar?q=petróleo",
  "/explorar?tema=A&tema=B&donde=Chile",
  "/explorar?utm_source=x",
  "/explorar/?pagina=2",
  "/explorar?q=",
  "/contacto?asunto=Advertising — formato B",
  "/en/contacto?asunto=Consultoría",
  "/?buscar=1",
  "/en?buscar=1",
  "/articulos?formato=noticias&q=dólar",
  "/clave?c=economia",
  "/en/clave?c=economia",
]) {
  check(url, filtro(url) === true);
}

console.log("\nno son filtro: se indexan");
for (const url of [
  "/",
  "/en",
  "/explorar",
  "/en/explorar",
  "/contacto",
  "/en/contacto",
  "/clave",
  "/articulos?formato=noticias",
  "/en/articulos?formato=editorial",
  "/articulos?formato=noticias&pagina=2",
  "/audiovisual?ver=podcast",
  "/en/audiovisual?ver=entrevistas",
  "/noticias/una-pieza?v=tn9n4o",
  "/noticias/una-pieza?utm_source=whatsapp&utm_medium=resumen",
  "/?utm_source=instagram",
  "/contacto?utm_source=x",
  "/monedas",
  "/resumen/2026-11-09/manana",
  // Una ruta que se llama «explorar» por dentro no es `/explorar`.
  "/noticias/explorar?tema=x",
]) {
  check(url, filtro(url) === false);
}
check("sin ruta ni consulta, no es filtro", esPaginaDeFiltro(undefined, undefined) === false);

// Cada dirección del sitemap, en los dos idiomas, y una pieza de cada formato: ninguna
// puede salir como filtro, o Google dejaría de indexar una página que le mandamos.
console.log("\nel sitemap entero se indexa");
const delSitemap = [
  ...PAGINAS_FIJAS.flatMap((ruta) => [ruta, enIngles(ruta)]),
  ...Object.keys(SECCION_DE).map((format) => urlDe({ format, slug: "una-pieza" })),
  ...Object.keys(SECCION_DE).map((format) => enIngles(new URL(urlDe({ format, slug: "una-pieza" })).pathname)),
];
const marcadas = delSitemap.filter(filtro);
check(`${delSitemap.length} direcciones del sitemap, ninguna es filtro`, marcadas.length === 0, marcadas);

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
