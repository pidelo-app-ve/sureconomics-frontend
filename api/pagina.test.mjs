/**
 * Las páginas fijas en inglés (`api/pagina.js`), con el shell simulado.
 *
 * Sin runtime de pruebas: `node api/pagina.test.mjs`, o `npm run test:og`.
 *
 * Hasta el 25-nov-2026, `/en/informes` llegaba al buscador con `<html lang="es">`, sin
 * canónica y sin `hreflang`: para Google, una copia en español de `/informes`.
 */
import handler, { PAGINAS, armarPagina } from "./pagina.js";
import { PAGINAS_FIJAS, enIngles } from "./sitemap.js";
import { olvidarShell } from "./_comun.js";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SHELL = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <title>SurEconomics — Economía, mercados e inversión</title>
    <!-- og:generico -->
    <meta property="og:locale" content="es_LA" />
    <meta property="og:image" content="https://www.sureconomics.com/brand/og-default.jpg" />
    <!-- /og:generico -->
  </head>
  <body><div id="root"></div><script src="/assets/index-abc123.js"></script></body>
</html>`;

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle ? "  → " + detalle : ""}`);
  if (!ok) fallos++;
};

const respuestaFalsa = () => {
  const r = { headers: {}, code: 0, body: "" };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.send = (b) => { r.body = b; return r; };
  r.redirect = (c, destino) => { r.code = c; r.location = destino; return r; };
  return r;
};

// El shell, del archivo (como en Vercel); sin red.
const carpeta = mkdtempSync(join(tmpdir(), "se-pagina-"));
writeFileSync(join(carpeta, "app.html"), SHELL);
process.env.SHELL_ARCHIVO = join(carpeta, "app.html");
globalThis.fetch = async (url) => {
  throw new Error(`no debería ir a la red: ${url}`);
};

const pedir = async (query) => {
  olvidarShell();
  const res = respuestaFalsa();
  await handler({ query }, res);
  return res;
};
const canonicaDe = (h) => (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
const cuenta = (h, trozo) => h.split(trozo).length - 1;

console.log("una sección en inglés dice que es inglés, y cuál es su versión española");
{
  const res = await pedir({ ruta: "informes", lang: "en" });
  const h = res.body;
  check("200 y X-Shell archivo", res.code === 200 && res.headers["X-Shell"] === "archivo", `${res.code} ${res.headers["X-Shell"]}`);
  check('<html lang="en">', h.includes('<html lang="en">') && !h.includes('<html lang="es">'));
  check("canónica propia", canonicaDe(h) === "https://www.sureconomics.com/en/informes", canonicaDe(h));
  check("hreflang es, en y x-default",
    h.includes('hreflang="es" href="https://www.sureconomics.com/informes"') &&
      h.includes('hreflang="en" href="https://www.sureconomics.com/en/informes"') &&
      h.includes('hreflang="x-default" href="https://www.sureconomics.com/informes"'));
  check("og:locale en_US, y uno solo", h.includes('content="en_US"') && cuenta(h, 'property="og:locale"') === 1);
  check("la tarjeta en inglés", h.includes("<title>SurEconomics — Economics, markets and investing</title>"));
  check("una sola og:image (sin el bloque genérico)", cuenta(h, 'property="og:image"') === 1);
  check("indexable: una sola etiqueta robots, la del shell", cuenta(h, 'name="robots"') === 1 && !h.includes("noindex"));
  check("guardada en el borde", /s-maxage=3600/.test(res.headers["Cache-Control"]));
}
{
  // El enlace que circula: solo `formato` cuenta para la canónica.
  const h = (await pedir({ ruta: "articulos", lang: "en", formato: "noticias", utm_source: "wa", pagina: "2" })).body;
  check("la canónica lleva formato y nada más",
    canonicaDe(h) === "https://www.sureconomics.com/en/articulos?formato=noticias", canonicaDe(h));
  check("y los hreflang también", h.includes('hreflang="es" href="https://www.sureconomics.com/articulos?formato=noticias"'));
}
{
  const h = (await pedir({ ruta: "explorar", lang: "en", tema: "Infraestructura" })).body;
  check("un filtro: noindex, sin canónica ni hreflang, como la página al cargar",
    h.includes('content="noindex, follow"') && !canonicaDe(h) && !h.includes("hreflang") && cuenta(h, 'name="robots"') === 1);
  check("un filtro: en inglés igual", h.includes('<html lang="en">'));
  const limpia = (await pedir({ ruta: "explorar", lang: "en" })).body;
  check("sin filtro: su canónica", canonicaDe(limpia) === "https://www.sureconomics.com/en/explorar", canonicaDe(limpia));
}

console.log("lo que no es una página fija");
{
  const res = await pedir({ ruta: "cuenta/entrar", lang: "en" });
  check("otra ruta: la 404 en inglés", res.code === 404 && res.body.includes("Page not found"), `${res.code}`);
  const sin = await pedir({ lang: "en" });
  check("sin ruta: la 404", sin.code === 404, `${sin.code}`);
}

console.log("si el shell no es nuestro, al archivo estático");
{
  writeFileSync(join(carpeta, "app.html"), "<html>otra cosa</html>");
  const res = await pedir({ ruta: "articulos", lang: "en", formato: "noticias" });
  check("307 a la misma con ?_s=1, sin perder la consulta",
    res.code === 307 && res.location === "/en/articulos?formato=noticias&_s=1", `${res.code} ${res.location}`);
  const sola = await pedir({ ruta: "informes", lang: "en" });
  check("sin consulta: ?_s=1", sola.location === "/en/informes?_s=1", sola.location);
  writeFileSync(join(carpeta, "app.html"), SHELL);
}

console.log("el mapa del sitio y estas páginas dicen lo mismo");
for (const fija of PAGINAS_FIJAS.filter((r) => r !== "/")) {
  const [camino, consulta = ""] = fija.split(/(?=\?)/);
  const ruta = camino.slice(1);
  const ok = PAGINAS.has(ruta);
  const h = ok ? armarPagina(SHELL, { ruta, consulta, idioma: "en" }) : "";
  const esperada = `https://www.sureconomics.com${enIngles(fija)}`;
  check(`${enIngles(fija)}: por aquí, con la canónica del mapa`, ok && canonicaDe(h) === esperada, canonicaDe(h));
}

process.env.SHELL_ARCHIVO = "";
console.log(fallos ? `\n  ${fallos} fallo(s)` : "\n  todo verde");
process.exit(fallos ? 1 : 0);
