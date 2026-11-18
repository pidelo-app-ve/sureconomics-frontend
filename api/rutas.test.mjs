/**
 * Que cada ruta de la aplicación tenga su regla en `vercel.json`.
 *
 * Sin runtime de pruebas: `node api/rutas.test.mjs`, o `npm run test:rutas`.
 *
 * Desde la auditoría del 17-nov-2026 (B-11) el borde solo manda a la aplicación las
 * direcciones que existen; lo demás va a `api/no-encontrada.js`, con un 404. Una ruta
 * nueva en `src/routes.jsx` sin su línea en `vercel.json` se seguiría viendo bien (la
 * aplicación la pinta igual), pero respondería 404 y el buscador la olvidaría sin que
 * nadie lo notara. Esta prueba lo nota.
 *
 * Las reglas de la lista tienen la forma `/(expresión)` y van a `/index.html`: así se
 * pueden leer como expresiones de JavaScript sin la librería de Vercel
 * (`path-to-regexp`, con `strict`: la barra final no se da por supuesta).
 */
import { readFileSync } from "node:fs";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");
const config = JSON.parse(leer("../vercel.json"));
const fuente = leer("../src/routes.jsx");

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle ? "  → " + detalle : ""}`);
  if (!ok) fallos++;
};

const lista = config.rewrites
  .filter((r) => r.destination === "/index.html" && !r.has && /^\/\(.*\)$/.test(r.source))
  .map((r) => new RegExp(`^\\/${r.source.slice(1)}$`));
const aLaAplicacion = (camino) => lista.some((rx) => rx.test(camino));
const a404 = (camino) => !aLaAplicacion(camino);

// Las rutas, con un valor de muestra en cada parámetro.
const muestra = (p) => p.replace(/:fecha/g, "2026-11-17").replace(/:edicion/g, "manana").replace(/:[A-Za-z]+/g, "una-de-prueba");
const caminos = (trozo) => [...trozo.matchAll(/path: "([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== "*");
const publicas = fuente.slice(fuente.indexOf("const rutasPublicas"), fuente.indexOf("export const router"));
const [antesDeCuenta, cuenta] = publicas.split('path: "cuenta",');
const admin = fuente.slice(fuente.indexOf('path: "/admin",'));

const reales = ["/"];
for (const p of caminos(antesDeCuenta)) reales.push(`/${muestra(p)}`);
reales.push("/cuenta");
for (const p of caminos(cuenta)) reales.push(`/cuenta/${muestra(p)}`);
for (const r of [...reales]) reales.push(r === "/" ? "/en" : `/en${r}`);
reales.push("/admin", "/admin/login");
for (const p of caminos(admin)) if (!p.startsWith("/")) reales.push(`/admin/${muestra(p)}`);

console.log("cada ruta de src/routes.jsx va a la aplicación (también con barra final)");
check("se leyeron las rutas", reales.length > 100, `${reales.length}`);
for (const r of reales) {
  const conBarra = r.endsWith("/") ? r : `${r}/`;
  check(r, aLaAplicacion(r) && aLaAplicacion(conBarra));
}

console.log("lo inventado no");
for (const r of ["/esta-pagina-no-existe", "/en/esta-pagina-no-existe", "/noticia", "/cuenta/no-existe", "/juegos/otro", "/wp-admin", "/en/en", "/noticias/a/b"]) {
  check(r, a404(r));
}

console.log("lo que va antes de la lista sigue ahí");
const fuentes = config.rewrites.map((r) => r.source);
check("las piezas, por su función", fuentes.includes("/:seccion(noticias|articulos|editorial|entrevistas|informes|podcast)/:slug"));
check("y la 404 al final", config.rewrites.at(-1).destination === "/api/no-encontrada");
// La portada en inglés, por su función; con `?_s=1` (la función no pudo leer el shell), al
// archivo. `/` no va aquí: lo lleva `middleware.js`, porque para `/` Vercel sirve antes el
// `index.html` y una reescritura no se aplicaría nunca.
const indice = (destino, conS) => config.rewrites.findIndex((r) => r.source === "/en{/}?" && r.destination === destino && Boolean(r.has) === conS);
check("/en, por la función de la portada", indice("/api/portada?lang=en", false) !== -1);
check("/en?_s=1, al archivo, antes", indice("/index.html", true) !== -1 && indice("/index.html", true) < indice("/api/portada?lang=en", false));
check("y las dos antes de la lista", indice("/api/portada?lang=en", false) < config.rewrites.findIndex((r) => r.source === "/((?:en/?)?)"));
check("ninguna reescritura de / (no se aplicaría)", !config.rewrites.some((r) => r.source === "/"));
check("/ lo lleva middleware.js", /matcher: "\/"/.test(leer("../middleware.js")) && leer("../middleware.js").includes("/api/portada"));
check("/noticias a su listado", config.redirects.some((r) => r.source === "/noticias{/}?" && r.destination === "/articulos?formato=noticias"));

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
