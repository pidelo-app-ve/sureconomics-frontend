/**
 * La portada servida desde el borde (`api/portada.js`), con el shell y la API simulados.
 *
 * Sin runtime de pruebas: `node api/portada.test.mjs`, o `npm run test:og`.
 *
 * Lo que se vigila, sobre todo los fallos: con la API caída sale la aplicación con la
 * cabecera de la portada (nunca un error); sin shell, al archivo estático; un titular con
 * caracteres raros no rompe el HTML ni mete código; `/en` sale en inglés y con su
 * canónica; la foto que se precarga es la misma que pinta la página; y en el HTML va lo
 * que la página enseña al cargar, ni una pieza más.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import handler, {
  DATOS_URL,
  ORDEN_DE_SECCIONES,
  TEXTOS,
  armarPortada,
  loQuePintaLaPortada,
  rutaDeFormato,
  titularDe,
} from "./portada.js";
import { olvidarShell, textoLlano } from "./_comun.js";
import {
  AL_PUNTO,
  PREVIEW,
  SIZES_PRINCIPAL,
  elegirApertura,
  paraLaApertura,
  precargaDeLaApertura,
} from "../src/lib/apertura.js";
import { ANCHOS_DE_TARJETA, imagenSrcSet } from "../src/lib/fotoDePieza.js";
import { anchoDeSizes, tallaElegida } from "../scripts/pruebas/anchoDeSizes.mjs";

// El shell viaja con la función (`dist/app.html`). Aquí, sin archivo: cada prueba decide
// qué shell llega, por el respaldo de la red (el `fetch` simulado). Al final, con archivo.
process.env.SHELL_ARCHIVO = "";

const SHELL = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <script type="application/ld+json">{"@context": "https://schema.org", "@graph": [{"@type": "NewsMediaOrganization", "@id": "https://www.sureconomics.com/#medio"}, {"@type": "WebSite", "@id": "https://www.sureconomics.com/#sitio"}]}</script>
    <title>SurEconomics — Economía, mercados e inversión</title>
    <!-- og:generico -->
    <meta property="og:image" content="https://www.sureconomics.com/brand/og-default.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <!-- /og:generico -->
  </head>
  <body><div id="root"></div><script type="module" src="/assets/index-abc123.js"></script></body>
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

const conFetch = async (impl, fn) => {
  const previo = globalThis.fetch;
  globalThis.fetch = impl;
  olvidarShell();
  try { return await fn(); } finally { globalThis.fetch = previo; olvidarShell(); }
};

const contar = (texto, patron) => (texto.match(patron) || []).length;

/** El shell de `/app.html` y, para lo demás, `datos` (o lo que diga `api`). */
const fetchCon = ({ datos = [], api = null, shell = SHELL, shellStatus = 200 } = {}) => async (url) => {
  if (String(url).endsWith("/app.html")) {
    if (shell instanceof Error) throw shell;
    return { ok: shellStatus === 200, status: shellStatus, text: async () => shell };
  }
  if (api) return api(url);
  return { ok: true, status: 200, json: async () => ({ data: datos, meta: { total: datos.length, pages: 1 } }) };
};

/** El contenido de `#root`. */
const raiz = (html) => {
  const desde = html.indexOf('<div id="root">');
  const hasta = html.indexOf("</div><script", desde);
  return desde === -1 ? "" : html.slice(desde + '<div id="root">'.length, hasta);
};

const fichas = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

const HORA = Date.parse("2026-11-18T12:00:00Z");
const fecha = (horasAtras) => new Date(HORA - horasAtras * 3600_000).toISOString();

/** Una fila como las da `/posts`. */
const fila = (n, extra = {}) => ({
  id: n,
  slug: `pieza-${n}`,
  title: `Titular número ${n}`,
  excerpt: `<p>Entradilla de la pieza ${n}.</p>`,
  format: "noticia",
  published_at: fecha(n),
  image_asset: { url: `/media/image/2026/11/foto-${n}.jpg`, width: 1536, height: 1024 },
  ...extra,
});

/** Una página 1 como la de producción: todos los formatos, ordenada por fecha. */
const tanda = (formato, desde, cuantas) =>
  Array.from({ length: cuantas }, (_, i) => fila(desde + i, { format: formato }));
const MUCHAS = [
  ...tanda("noticia", 1, 40),
  ...tanda("articulo", 101, 8),
  ...tanda("editorial", 201, 6),
  ...tanda("entrevista", 301, 4),
  ...tanda("podcast", 401, 4),
  ...tanda("informe", 501, 3),
].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));

const enlaces = (html) => [...html.matchAll(/<h3><a href="([^"]+)">/g)].map((m) => m[1]);

console.log("la portada, con titulares");
await conFetch(fetchCon({ datos: MUCHAS }), async () => {
  const res = respuestaFalsa();
  await handler({ query: {} }, res);
  const h = res.body;
  const dentro = raiz(h);
  check("responde 200", res.code === 200);
  check("HTML", res.headers["Content-Type"] === "text/html; charset=utf-8");
  check("guardada como el listado",
    res.headers["Cache-Control"] === "public, s-maxage=30, stale-while-revalidate=60, stale-if-error=86400", res.headers["Cache-Control"]);
  check("marca portada", res.headers["X-Pieza-Meta"] === "portada");
  check("dice de dónde salió el shell", res.headers["X-Shell"] === "red", res.headers["X-Shell"]);
  check("un solo <title>, el de la portada",
    contar(h, /<title>/g) === 1 && h.includes(`<title>${TEXTOS.es.titulo}</title>`));
  check("descripción real", h.includes(`<meta name="description" content="${TEXTOS.es.descripcion}" />`));
  check("canónica a /", contar(h, /rel="canonical"/g) === 1 && h.includes('<link rel="canonical" href="https://www.sureconomics.com/" />'));
  check("hreflang es, en y x-default",
    h.includes('hreflang="es" href="https://www.sureconomics.com/"') &&
      h.includes('hreflang="en" href="https://www.sureconomics.com/en"') &&
      h.includes('hreflang="x-default" href="https://www.sureconomics.com/"'));
  check("og:type website", h.includes('<meta property="og:type" content="website" />'));
  check("twitter:site, una vez", contar(h, /name="twitter:site" content="@Sur_economics"/g) === 1);
  check("la tarjeta genérica, una sola vez", contar(h, /property="og:image"/g) === 1 && !h.includes("og:generico"));
  check("sigue indexable", h.includes('content="index, follow') && !h.includes("noindex"));
  check("en español", h.includes('<html lang="es">'));

  // Lo que pinta la página: la plana (apertura, 3 secundarias, la editorial del día y 2
  // análisis) y la entrada de cada sección (11 noticias, 5 artículos, 4 editoriales, 4 de
  // Al punto, 2 informes), sin repetir nada.
  const vistos = enlaces(dentro);
  const esperados = [
    "/noticias/pieza-1", "/noticias/pieza-2", "/noticias/pieza-3", "/noticias/pieza-4",
    "/editorial/pieza-201", "/articulos/pieza-101", "/articulos/pieza-102",
    ...Array.from({ length: 11 }, (_, i) => `/noticias/pieza-${5 + i}`),
    ...[103, 104, 105, 106, 107].map((n) => `/articulos/pieza-${n}`),
    ...[202, 203, 204, 205].map((n) => `/editorial/pieza-${n}`),
    "/entrevistas/pieza-301", "/podcast/pieza-401", "/entrevistas/pieza-302", "/podcast/pieza-402",
    "/informes/pieza-501", "/informes/pieza-502",
  ];
  check("exactamente lo que pinta la página, en su orden", vistos.join() === esperados.join(), `${vistos.length}: ${vistos.join(" ")}`);
  check("sin repetidos", new Set(vistos).size === vistos.length);
  check("la plana: «Lo más reciente» si nada está fijado, como React",
    dentro.includes('<section><h2>Lo más reciente</h2><article><h3><a href="/noticias/pieza-1">Titular número 1</a></h3><p>Entradilla de la pieza 1.</p>'));
  check("las secciones con su nombre y su enlace",
    dentro.includes('<h2><a href="/articulos?formato=noticias">Noticias</a></h2>') &&
      dentro.includes('<h2><a href="/audiovisual">Al punto</a></h2>') &&
      dentro.includes('<h2><a href="/articulos?formato=informes">Informes y reportes</a></h2>'));
  check("cada titular con su sección enlazada", dentro.includes('<a href="/articulos?formato=noticias">Noticias</a> · <time'));
  check("y su fecha", /<time datetime="2026-11-18T10:00:00\.000Z">18 de noviembre de 2026<\/time>/.test(dentro));
  check("el h1 de la portada", dentro.includes(`<h1>${TEXTOS.es.encabezado}</h1>`));
  check("la descripción, al pie como en la página", dentro.includes(`<footer><p>${TEXTOS.es.descripcion}</p></footer>`));
  check("recortado a la vista, sin display:none",
    dentro.startsWith('<div class="se-portada-previa">') &&
      /\.se-portada-previa\{position:absolute;[^}]*width:1px;height:1px;[^}]*clip-path:inset\(50%\)/.test(h) && !/display:\s*none/.test(h) && !/visibility:\s*hidden/.test(h));
  check("con salida a los 9 s si React no llega",
    /animation:se-portada-previa 0s linear 9s forwards/.test(h) && /@keyframes se-portada-previa\{to\{width:auto;height:auto;[^}]*clip-path:none/.test(h));
  check("la aplicación sigue ahí", h.includes('src="/assets/index-abc123.js"'));

  // La precarga: el mismo srcset y sizes que pinta `CardMedia` en la apertura.
  const srcset = imagenSrcSet("/media/image/2026/11/foto-1.jpg", ANCHOS_DE_TARJETA, 1536);
  const precargas = contar(h, /<link rel="preload" as="image"/g);
  check("una precarga de imagen", precargas === 1, String(precargas));
  check("con el srcset y sizes de la apertura",
    h.includes(`<link rel="preload" as="image" imagesrcset="${srcset}" imagesizes="${SIZES_PRINCIPAL}" fetchpriority="high" />`));
  check("srcset con las tallas de R2", srcset === "/media/image/2026/11/foto-1-640.jpg 640w, /media/image/2026/11/foto-1-1100.jpg 1100w, /media/image/2026/11/foto-1-1400.jpg 1400w", srcset);
  check("la precarga va en la <head>", h.indexOf('rel="preload" as="image"') < h.indexOf("</head>"));

  const [delMedio, deLaPortada] = fichas(h);
  check("la ficha del medio y el sitio (del shell) sigue",
    delMedio?.["@graph"]?.some((n) => n["@type"] === "NewsMediaOrganization") &&
      delMedio?.["@graph"]?.some((n) => n["@type"] === "WebSite"));
  const grafo = deLaPortada?.["@graph"] ?? [];
  const pagina = grafo.find((n) => n["@type"] === "WebPage");
  const lista = grafo.find((n) => n["@type"] === "ItemList");
  check("WebPage atada al sitio y al medio",
    pagina?.isPartOf?.["@id"] === "https://www.sureconomics.com/#sitio" && pagina?.publisher?.["@id"] === "https://www.sureconomics.com/#medio");
  check("ItemList con lo mismo que el HTML", lista?.itemListElement?.length === esperados.length && lista.numberOfItems === esperados.length);
  check("con direcciones absolutas y en orden",
    lista?.itemListElement?.map((e) => e.url.replace("https://www.sureconomics.com", "")).join() === esperados.join() &&
      lista.itemListElement[0].position === 1);
});

// —— 2. La API caída ——
console.log("la API caída");
for (const [nombre, api, motivo] of [
  ["no contesta", async () => { throw new Error("ECONNRESET"); }, "api-sin-respuesta"],
  ["contesta 502", async () => ({ ok: false, status: 502, json: async () => ({}) }), "api-502"],
  ["contesta otra cosa", async () => ({ ok: true, status: 200, json: async () => ({ error: "x" }) }), "api-sin-lista"],
  ["contesta HTML", async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("<html>"); } }), "api-sin-respuesta"],
]) {
  await conFetch(fetchCon({ api }), async () => {
    const res = respuestaFalsa();
    await handler({ query: {} }, res);
    check(`${nombre}: 200 con la aplicación`, res.code === 200 && res.body.includes('src="/assets/index-abc123.js"'));
    check(`${nombre}: con la cabecera de la portada`,
      res.body.includes(`<title>${TEXTOS.es.titulo}</title>`) && res.body.includes('rel="canonical" href="https://www.sureconomics.com/"'));
    check(`${nombre}: #root vacío, sin precarga ni estilo`,
      res.body.includes('<div id="root"></div>') && !res.body.includes("preload\" as=\"image") && !res.body.includes("se-portada-previa"));
    check(`${nombre}: guardada poco`, res.headers["Cache-Control"] === "public, s-maxage=30");
    check(`${nombre}: dice por qué`, res.headers["X-Pieza-Meta"] === `portada-sin-datos-${motivo}`, res.headers["X-Pieza-Meta"]);
  });
}

// —— 3. Sin shell ——
console.log("sin shell: al archivo estático");
for (const [nombre, opciones] of [
  ["no contesta", { shell: new Error("timeout") }],
  ["la página de acceso de Vercel", { shell: "<html><body>Log in to Vercel</body></html>" + " ".repeat(300) }],
  ["la 404 del sitio (es la aplicación, pero con noindex)", { shellStatus: 404 }],
]) {
  await conFetch(fetchCon({ datos: MUCHAS, ...opciones }), async () => {
    const res = respuestaFalsa();
    await handler({ query: {} }, res);
    check(`${nombre}: 307 a /?_s=1`, res.code === 307 && res.location === "/?_s=1", `${res.code} ${res.location}`);
    const en = respuestaFalsa();
    await handler({ query: { lang: "en" } }, en);
    check(`${nombre}: /en a /en?_s=1`, en.code === 307 && en.location === "/en?_s=1", `${en.code} ${en.location}`);
  });
}

// —— 4. La apertura ——
console.log("la apertura y su foto");
{
  const enUnaHora = new Date(HORA + 3600_000).toISOString();
  const haceUnaHora = new Date(HORA - 3600_000).toISOString();
  const sinFoto = (n, extra = {}) => fila(n, { image_asset: null, ...extra });

  // Sin principal la página no pinta la plana (ni su columna de opinión), y las secciones
  // de abajo igual se saltan los dos análisis y la editorial del día: se replica tal cual.
  const sinNoticias = armarPortada(SHELL, {
    filas: [1, 2, 3].map((n) => fila(n, { format: "articulo" })).concat([4, 5].map((n) => fila(n, { format: "editorial" }))),
    ahora: HORA,
  });
  check("sin noticias ni fijada: sin plana ni precarga, y lo de abajo como en la página",
    !sinNoticias.includes("<h2>Lo más reciente</h2>") && !sinNoticias.includes('rel="preload" as="image"') &&
      enlaces(raiz(sinNoticias)).join() === "/articulos/pieza-3,/editorial/pieza-5", enlaces(raiz(sinNoticias)).join());

  const sinFotos = armarPortada(SHELL, { filas: [sinFoto(1), sinFoto(2)], ahora: HORA });
  check("apertura sin foto: sin precarga", sinFotos.includes("<h2>Lo más reciente</h2>") && !sinFotos.includes('rel="preload" as="image"'));

  const conFotoDetras = armarPortada(SHELL, { filas: [sinFoto(1), sinFoto(2), fila(3)], ahora: HORA });
  check("la más reciente sin foto cede a la tercera con foto",
    conFotoDetras.includes('<h2>Lo más reciente</h2><article><h3><a href="/noticias/pieza-3">') && conFotoDetras.includes("foto-3-640.jpg"));

  const fijada = armarPortada(SHELL, {
    filas: [fila(1), fila(2, { format: "informe", en_portada: true, destacada_hasta: enUnaHora })],
    ahora: HORA,
  });
  check("la fijada manda, sea del formato que sea, y el <h2> dice «Apertura»",
    fijada.includes('<h2>Apertura</h2><article><h3><a href="/informes/pieza-2">') && fijada.includes("foto-2-640.jpg"));

  const vencida = armarPortada(SHELL, {
    filas: [fila(1), fila(2, { format: "informe", en_portada: true, destacada_hasta: haceUnaHora })],
    ahora: HORA,
  });
  check("una fijada que ya venció no manda (aunque la API diga en_portada)",
    vencida.includes('<h2>Lo más reciente</h2><article><h3><a href="/noticias/pieza-1">'));

  const short = armarPortada(SHELL, {
    filas: [fila(1, { video_asset: { url: "https://www.youtube.com/shorts/abcdefghijk" } })],
    ahora: HORA,
  });
  check("abre con un short: sin precarga", !short.includes('rel="preload" as="image"'));

  const ajena = armarPortada(SHELL, {
    filas: [fila(1, { image_asset: null, featured_image_url: "https://otro.medio.com/foto.jpg" })],
    ahora: HORA,
  });
  check("foto de otra web: precarga con href, sin srcset",
    ajena.includes('<link rel="preload" as="image" href="https://otro.medio.com/foto.jpg" fetchpriority="high" />'));

  const peligrosa = armarPortada(SHELL, {
    filas: [fila(1, { image_asset: null, featured_image_url: "javascript:alert(1)" })],
    ahora: HORA,
  });
  check("una foto javascript: no se precarga", !peligrosa.includes("javascript:") && !peligrosa.includes('rel="preload" as="image"'));

  // La misma regla que la página: con las filas convertidas por `paraLaApertura`.
  const filas = [sinFoto(1), fila(2), fila(3, { format: "articulo" })];
  const { principal, secundarias } = elegirApertura(filas.map(paraLaApertura), null, HORA);
  check("elegirApertura (lib) con filas de la API", principal?.id === "2" && secundarias.map((p) => p.id).join() === "1");
  const precarga = precargaDeLaApertura(principal);
  check("precargaDeLaApertura: srcset de tarjeta y sizes de la apertura",
    precarga?.imagesizes === SIZES_PRINCIPAL && precarga?.imagesrcset === imagenSrcSet("/media/image/2026/11/foto-2.jpg", ANCHOS_DE_TARJETA, 1536) && !precarga.href);
}

// —— 4b. La talla de la foto de la apertura (24-nov-2026) ——
//
// `SIZES_PRINCIPAL` tiene que decir lo que mide la caja de la foto (`primeraPlana.css`): si
// se queda corto la foto se ve blanda, y si se pasa se baja una talla de más. Decía `50vw` en
// escritorio: a 1440 pedía la de 1100 para una caja de 628. La caja, medida a mano en el CSS
// (contenedor de 1440 con 24/32/40 px de margen; rejilla 2fr/1fr de 960 y 3/6/3 de 1200):
console.log("la talla de la foto de la apertura");
{
  const CAJA = [
    [390, 390], [412, 412], [800, 736], [960, 577], [1024, 609], [1199, 722],
    [1200, 517], [1366, 594], [1440, 628], [1600, 624], [1920, 704], [2560, 704],
  ];
  const fuera = CAJA.filter(([ventana, caja]) => {
    const dice = anchoDeSizes(SIZES_PRINCIPAL, ventana);
    return dice < caja || dice > caja * 1.06 + 2;
  });
  check("el sizes cubre la caja sin pasarse más de un 6 %", fuera.length === 0,
    fuera.map(([v, c]) => `${v}: caja ${c}, sizes ${anchoDeSizes(SIZES_PRINCIPAL, v)}`));

  // Con las tallas de una foto grande (el PNG de 1.733 px de la redacción):
  const grande = imagenSrcSet("/media/image/2026/11/grande.png", ANCHOS_DE_TARJETA, 1733);
  check("teléfono de 390 a 3x: la de 1400, como antes (pide 1170)",
    tallaElegida(grande, SIZES_PRINCIPAL, 390, 3).w === 1400);
  check("escritorio de 1440 a 1x: la de 640 y no la de 1100 (caja de 628)",
    tallaElegida(grande, SIZES_PRINCIPAL, 1440, 1).w === 640);
  check("escritorio de 1440 a 2x: la de 1400 (pide 1256)",
    tallaElegida(grande, SIZES_PRINCIPAL, 1440, 2).w === 1400);

  // Una foto de menos de 640 px (el 15 % de las de noviembre, casi todas de 560 a 625) no
  // tiene más tallas que las de 160 y 320, que en la apertura se verían borrosas: va la
  // original, en la `<img>` y en la precarga, la misma.
  const chica = armarPortada(SHELL, {
    filas: [fila(1, { image_asset: { url: "/media/image/2026/11/chica-2c0996951c9a.jpg", width: 599, height: 399 } })],
    ahora: HORA,
  });
  check("apertura de 599 px: precarga de la original, sin srcset",
    chica.includes('<link rel="preload" as="image" href="/media/image/2026/11/chica-2c0996951c9a.jpg" fetchpriority="high" />'));
  // De 640 a 1099 px (la mitad de las de noviembre): solo la de 640, nunca la original.
  const media = armarPortada(SHELL, {
    filas: [fila(1, { image_asset: { url: "/media/image/2026/11/media-80a1e74ace4e.jpg", width: 661, height: 464 } })],
    ahora: HORA,
  });
  check("apertura de 661 px: precarga de la talla de 640",
    media.includes('imagesrcset="/media/image/2026/11/media-80a1e74ace4e-640.jpg 640w"'));
  // Una pieza vieja sin ancho guardado: las tres tallas, como las pide `CardMedia`
  // (si una no existe, la tarjeta cae al relleno de color; la precarga solo se pierde).
  const vieja = precargaDeLaApertura(paraLaApertura(fila(1, { image_asset: { url: "/media/image/2026/09/vieja.jpg" } })));
  check("apertura sin ancho guardado: el mismo srcset que la <img>",
    vieja?.imagesrcset === imagenSrcSet("/media/image/2026/09/vieja.jpg", ANCHOS_DE_TARJETA, null));
  const svg = precargaDeLaApertura(paraLaApertura(fila(1, { image_asset: { url: "/media/image/2026/11/g.svg", width: 1200 } })));
  check("apertura en SVG: la original, sin srcset", svg?.href === "/media/image/2026/11/g.svg" && !svg.imagesrcset);
}

// —— 5. Caracteres raros (XSS) ——
console.log("titulares con caracteres raros");
{
  const malo = fila(1, {
    title: '</script><script>alert(1)</script> "comillas" & <b>negrita</b> US$&nbsp;36 $& $\' $$',
    excerpt: '<p onclick="alert(2)">Entradilla con <img src=x onerror=alert(3)></p>',
    slug: 'pieza-"><script>alert(4)</script>',
  });
  const h = armarPortada(SHELL, { filas: [malo, fila(2)], ahora: HORA });
  const dentro = raiz(h);
  check("ningún <script> nuevo fuera de los suyos", contar(h, /<script/g) === 3, String(contar(h, /<script/g)));
  check("ningún manejador ni etiqueta de la API", !/onclick|onerror|<img|<b>/i.test(h));
  check("el titular, escapado", dentro.includes("&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt; &quot;comillas&quot; &amp; &lt;b&gt;negrita&lt;/b&gt;"));
  check("los $ llegan tal cual (reemplazo por función)", dentro.includes("US$&amp;nbsp;36 $&amp; $' $$"));
  check("el slug, codificado en el enlace", dentro.includes('href="/noticias/pieza-%22%3E%3Cscript%3Ealert(4)%3C%2Fscript%3E"'));
  const json = h.slice(h.indexOf('{"@context":"https://schema.org","@graph":[{"@type":"WebPage"'));
  const barra = String.fromCharCode(92);
  check("en la ficha JSON, < escapado", json.includes(`${barra}u003c/script>`) && !json.slice(0, json.indexOf("</script>")).includes("<"));
  check("la ficha se puede leer", fichas(h)[1]?.["@graph"]?.[1]?.itemListElement?.[0]?.name?.startsWith("</script>"));
}

console.log("entidades del editor");
{
  check("textoLlano deshace las entidades una vez",
    textoLlano("P&amp;G &lt;b&gt; &quot;x&quot; &#8364; &#x41; a&nbsp;b &bogus; &#0; &#xD800; &amp;lt;") ===
      'P&G <b> "x" € A a b &bogus; &#0; &#xD800; &lt;', textoLlano("P&amp;G &lt;b&gt; &amp;lt;"));
  const h = armarPortada(SHELL, {
    filas: [fila(1, { excerpt: "<p>P&amp;G &lt;script&gt;alert(1)&lt;/script&gt; &amp;lt;img&amp;gt;</p>" })],
    ahora: HORA,
  });
  const dentro = raiz(h);
  check("en el HTML, una sola vez escapadas (sin &amp;amp;)",
    dentro.includes("<p>P&amp;G &lt;script&gt;alert(1)&lt;/script&gt; &amp;lt;img&amp;gt;</p>"), dentro.slice(0, 400));
  check("y sin abrir etiquetas", !/<script>alert|<img/.test(h));
}

// —— 6. /en ——
console.log("/en");
{
  const filas = [
    fila(1, { en_ingles: true, title_en: "Headline in English", excerpt_en: "<p>An English lead.</p>" }),
    fila(2),
    fila(3, { format: "entrevista" }),
  ];
  await conFetch(fetchCon({ datos: filas }), async () => {
    const res = respuestaFalsa();
    await handler({ query: { lang: "en" } }, res);
    const h = res.body;
    const dentro = raiz(h);
    check("200", res.code === 200);
    check("<html lang=en>", h.includes('<html lang="en">'));
    check("título y descripción en inglés",
      h.includes(`<title>${TEXTOS.en.titulo}</title>`) && h.includes(`<meta name="description" content="${TEXTOS.en.descripcion}" />`));
    check("canónica a /en", h.includes('<link rel="canonical" href="https://www.sureconomics.com/en" />'));
    check("hreflang a las dos", h.includes('hreflang="en" href="https://www.sureconomics.com/en"') && h.includes('hreflang="es" href="https://www.sureconomics.com/"'));
    check("og:locale en_US", h.includes('content="en_US"'));
    check("la traducida, en inglés", dentro.includes('<a href="/en/noticias/pieza-1">Headline in English</a>') && dentro.includes("An English lead."));
    check("la que no tiene inglés, en español (como la página)", dentro.includes('<a href="/en/noticias/pieza-2">Titular número 2</a>'));
    check("secciones en inglés y bajo /en",
      dentro.includes('<a href="/en/articulos?formato=noticias">News</a>') && dentro.includes('<a href="/en/audiovisual?ver=entrevistas">Interviews</a>'));
    check("fecha en inglés", dentro.includes(">November 18, 2026</time>"));
    check("los rótulos en inglés", dentro.includes(`<h2>${TEXTOS.en.recientes}</h2>`) && dentro.includes('<h2><a href="/en/audiovisual">Al punto</a></h2>'));
    check("ItemList con direcciones /en", fichas(h)[1]?.["@graph"]?.[1]?.itemListElement?.[0]?.url === "https://www.sureconomics.com/en/noticias/pieza-1");
  });
}

// —— 7. Lo demás ——
console.log("lo demás");
check("titularDe: formato desconocido o sin slug, fuera",
  titularDe(fila(1, { format: "otro" })) === null && titularDe(fila(1, { slug: "" })) === null && titularDe(fila(1, { title: "  " })) === null);
check("rutaDeFormato como la de la página",
  rutaDeFormato("noticia") === "/articulos?formato=noticias" && rutaDeFormato("informe") === "/articulos?formato=informes" &&
    rutaDeFormato("podcast") === "/audiovisual?ver=podcast" && rutaDeFormato("raro") === "/articulos");
check("los datos, por el quiosco y con la clave de la portada", DATOS_URL === "https://www.sureconomics.com/datos/posts?page=1&limit=100");

{
  const previo = process.env.PORTADA_HTML;
  process.env.PORTADA_HTML = "no";
  await conFetch(fetchCon({ datos: MUCHAS }), async () => {
    const res = respuestaFalsa();
    await handler({ query: {} }, res);
    check("interruptor PORTADA_HTML=no: el shell tal cual", res.code === 200 && res.body === SHELL && res.headers["X-Pieza-Meta"] === "portada-apagada");
  });
  if (previo === undefined) delete process.env.PORTADA_HTML;
  else process.env.PORTADA_HTML = previo;
}

// El shell se guarda: dos portadas seguidas, una sola lectura de /app.html.
{
  let lecturas = 0;
  const base = fetchCon({ datos: MUCHAS });
  await conFetch(async (url) => { if (String(url).endsWith("/app.html")) lecturas++; return base(url); }, async () => {
    await handler({ query: {} }, respuestaFalsa());
    await handler({ query: { lang: "en" } }, respuestaFalsa());
  });
  check("el shell se lee una vez y se guarda", lecturas === 1, String(lecturas));
}

// Los textos son los de la página.
{
  const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), "utf8"));
  for (const idioma of ["es", "en"]) {
    const portada = leer(`../src/i18n/${idioma}/portada.json`).portada;
    const comun = leer(`../src/i18n/${idioma}/comun.json`);
    const marca = (s) => s.replace("{marca}", "SurEconomics");
    const t = TEXTOS[idioma];
    check(`${idioma}: textos iguales a src/i18n`,
      t.titulo === marca(portada.meta.titulo) &&
        t.descripcion === comun.marca.descripcion &&
        t.encabezado === marca(portada.inicio.encabezado) &&
        t.apertura === portada.apertura.apertura &&
        t.recientes === portada.apertura.loMasReciente &&
        t.alPunto === comun.nav.alPunto);
  }
}

// Que la página use la misma regla y la misma precarga (no una copia).
{
  const plana = readFileSync(new URL("../src/components/home/PrimeraPlana.jsx", import.meta.url), "utf8");
  check("PrimeraPlana usa lib/apertura",
    plana.includes('from "../../lib/apertura"') && plana.includes("precargaDeLaApertura(") && !/const elegirApertura\s*=/.test(plana));
  const tarjeta = readFileSync(new URL("../src/components/home/CardMedia.jsx", import.meta.url), "utf8");
  check("CardMedia usa los anchos de fotoDePieza", /export const ANCHOS = ANCHOS_DE_TARJETA;/.test(tarjeta));
}

// Los topes son los de la página, no una copia.
{
  // Desde el 19-nov-2026 los usa `lib/bloquesDePortada.js`, que es donde `Home` decide
  // qué pieza va en cada sitio; ni uno ni otro los copia.
  const home = readFileSync(new URL("../src/pages/Home.jsx", import.meta.url), "utf8");
  const bloques = readFileSync(new URL("../src/lib/bloquesDePortada.js", import.meta.url), "utf8");
  check("Home toma PREVIEW, AL_PUNTO y ANALISIS_EN_PLANA de lib/apertura (por lib/bloquesDePortada)",
    /import \{ AL_PUNTO, ANALISIS_EN_PLANA, PREVIEW, elegirApertura \} from "\.\/apertura";/.test(bloques) &&
      /from "\.\.\/lib\/bloquesDePortada";/.test(home) &&
      !/const (PREVIEW|AL_PUNTO|ANALISIS_EN_PLANA)\s*=/.test(home + bloques));
  check("PREVIEW y AL_PUNTO, los de la portada", PREVIEW.noticia === 11 && AL_PUNTO.cuantas === 4);
  const pieza = readFileSync(new URL("../src/lib/pieza.js", import.meta.url), "utf8");
  const meta = pieza.slice(pieza.indexOf("export const FORMATO_META = {"), pieza.indexOf("\n};", pieza.indexOf("export const FORMATO_META = {")));
  const claves = [...meta.matchAll(/^ {2}([a-z]+): \{/gm)].map((m) => m[1]);
  check("el orden de las secciones, el de FORMATO_META", claves.join() === ORDEN_DE_SECCIONES.join(), claves.join());
  const vacia = loQuePintaLaPortada([]);
  check("sin piezas: ni plana ni secciones", vacia.plana === null && vacia.secciones.length === 0);
}

// El shell empaquetado con la función: del disco, sin tocar la red.
console.log("el shell, del archivo");
{
  const carpeta = mkdtempSync(join(tmpdir(), "se-portada-"));
  writeFileSync(join(carpeta, "app.html"), SHELL);
  process.env.SHELL_ARCHIVO = join(carpeta, "app.html");
  let alShell = 0;
  const base = fetchCon({ datos: MUCHAS });
  const res = respuestaFalsa();
  await conFetch(async (url) => { if (String(url).endsWith("/app.html")) alShell++; return base(url); },
    () => handler({ query: {} }, res));
  check("del archivo: 200, X-Shell archivo y sin pedir el shell a la red",
    res.code === 200 && res.headers["X-Shell"] === "archivo" && alShell === 0, `${res.headers["X-Shell"]} ${alShell}`);

  process.env.SHELL_ARCHIVO = join(carpeta, "no-esta.html");
  const respaldo = respuestaFalsa();
  await conFetch(fetchCon({ datos: MUCHAS }), () => handler({ query: {} }, respaldo));
  check("sin archivo: el respaldo de la red", respaldo.code === 200 && respaldo.headers["X-Shell"] === "red");

  writeFileSync(join(carpeta, "malo.html"), "<html>no es la aplicación</html>");
  process.env.SHELL_ARCHIVO = join(carpeta, "malo.html");
  const malo = respuestaFalsa();
  await conFetch(fetchCon({ datos: MUCHAS }), () => handler({ query: {} }, malo));
  check("un archivo que no es la aplicación no se sirve: la red", malo.code === 200 && malo.headers["X-Shell"] === "red");
  process.env.SHELL_ARCHIVO = "";
}

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo verde");
