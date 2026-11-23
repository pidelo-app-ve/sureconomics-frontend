/**
 * Qué sale por el quiosco (`/datos`, guardado en el borde) y qué va directo a la API.
 * `node src/api/quiosco.test.mjs`. Lo que se vigila: que nada con sesión, nada que
 * escriba y nada personal (publicidad, estadísticas, comentarios) acabe en el borde.
 */
import { vaPorElQuiosco } from "./quiosco.js";

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

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
