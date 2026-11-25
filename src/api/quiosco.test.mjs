/**
 * Qué sale por el quiosco (`/datos`, guardado en el borde) y qué va directo a la API.
 * `node src/api/quiosco.test.mjs`. Lo que se vigila: que nada con sesión, nada que
 * escriba y nada personal (publicidad, estadísticas, comentarios) acabe en el borde.
 */
import { ID_DE_LA_PORTADA, LISTADO_DE_LA_PORTADA, leerDelHtml, soltarDelHtml, vaPorElQuiosco } from "./quiosco.js";

let fallos = 0;
const check = (nombre, ok) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}`);
  if (!ok) fallos++;
};

console.log("por el quiosco");
for (const ruta of [
  "/posts", "/posts?page=1&limit=100", "/posts/la-noticia-de-hoy", "/formats", "/topics", "/places", "/cinta",
  "/monedas", "/monedas/VES/historia", "/headlines", "/canal", "/social", "/lvbp/hoy", "/analitica/mas-leidas",
  "/resumen/ultimo", "/resumen/2026-11-17", "/resumen/2026-11-17/manana", "/juegos/clave/hoy", "/equipo/fotos",
]) {
  check(ruta, vaPorElQuiosco(ruta));
}

console.log("directo a la API");
check("con sesión, aunque sea una lectura pública",
  !vaPorElQuiosco("/posts", { headers: { Authorization: "Bearer x" } }));
check("con sesión escrita en minúsculas", !vaPorElQuiosco("/posts", { headers: { authorization: "Bearer x" } }));
check("lo que escribe", !vaPorElQuiosco("/posts", { method: "POST" }));
check("en Node (pruebas, api/pieza.js)", !vaPorElQuiosco("/posts", { enNavegador: false }));
for (const ruta of [
  "/posts/la-noticia/comments", "/posts/la-noticia/document", "/posts/12/bookmark", "/publicidad/espacios",
  "/analitica/eventos", "/analitica/pagina", "/me", "/admin/posts", "/auth/login", "/resumen/puente/pendiente",
  "/newsletter/subscribe", "/contact", "/user/me", "/headlines/version", "/lvbp",
]) {
  check(ruta, !vaPorElQuiosco(ruta));
}

// Lo que trae el HTML (`api/portada.js`): se usa solo si es la lectura pedida y se puede
// leer; si no, nulo y la página pide como siempre.
console.log("lo que ya viene en el HTML");
{
  const respuesta = { data: [{ id: 1, title: "</script> & \"x\"" }], meta: { pages: 1 } };
  const nodos = new Map();
  const conBloque = (texto) => {
    nodos.clear();
    if (texto !== null) nodos.set(ID_DE_LA_PORTADA, { textContent: texto, remove: () => nodos.delete(ID_DE_LA_PORTADA) });
  };
  globalThis.document = { getElementById: (id) => nodos.get(id) ?? null };
  try {
    conBloque(JSON.stringify({ lectura: LISTADO_DE_LA_PORTADA, respuesta }));
    const leida = leerDelHtml(ID_DE_LA_PORTADA, LISTADO_DE_LA_PORTADA);
    check("la de la portada, tal cual", leida?.data?.[0]?.title === "</script> & \"x\"");
    check("leer no la quita (React prepara el estado dos veces en modo estricto)", nodos.has(ID_DE_LA_PORTADA));
    check("de otra lectura: nada", leerDelHtml(ID_DE_LA_PORTADA, "/posts?page=2&limit=100") === null);
    soltarDelHtml(ID_DE_LA_PORTADA);
    check("soltarla la quita: la próxima vez se pide", !nodos.has(ID_DE_LA_PORTADA) && leerDelHtml(ID_DE_LA_PORTADA, LISTADO_DE_LA_PORTADA) === null);
    conBloque(null);
    check("sin bloque: nada", leerDelHtml(ID_DE_LA_PORTADA, LISTADO_DE_LA_PORTADA) === null);
    conBloque('{"lectura": "/posts?page=1&limit=100", "respuesta": {"data": [');
    check("roto (cortado a medias): nada, sin lanzar", leerDelHtml(ID_DE_LA_PORTADA, LISTADO_DE_LA_PORTADA) === null);
    conBloque("");
    check("vacío: nada", leerDelHtml(ID_DE_LA_PORTADA, LISTADO_DE_LA_PORTADA) === null);
    conBloque(JSON.stringify(respuesta));
    check("sin decir qué lectura es: nada", leerDelHtml(ID_DE_LA_PORTADA, LISTADO_DE_LA_PORTADA) === null);
  } finally {
    delete globalThis.document;
  }
  check("sin documento (Node): nada, sin lanzar",
    leerDelHtml(ID_DE_LA_PORTADA, LISTADO_DE_LA_PORTADA) === null && soltarDelHtml(ID_DE_LA_PORTADA) === undefined);
}

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
