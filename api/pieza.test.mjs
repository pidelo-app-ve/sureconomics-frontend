/**
 * Las meta etiquetas de una pieza, con la API y el shell simulados.
 *
 * Sin runtime de pruebas: `node api/pieza.test.mjs`, o `npm run test:og`.
 *
 * Existe porque una `<head>` equivocada se ve perfecta para una persona y es
 * invisible para todo rastreador. Los casos que importan no son los del camino
 * feliz sino los de fallo: la función tiene que devolver la aplicación intacta
 * cuando la API no responde, porque estas rutas antes eran archivos estáticos que
 * no podían fallar.
 */
import handler, { descripcionDe, esNuestroShell, inyectar } from "./pieza.js";

const SHELL = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Sur Economics — Economía, mercados e inversión</title>
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

const conFetch = async (impl, fn) => {
  const previo = globalThis.fetch;
  globalThis.fetch = impl;
  try { return await fn(); } finally { globalThis.fetch = previo; }
};

const fetchNormal = (pieza) => async (url) => {
  if (String(url).endsWith("/index.html")) {
    return { ok: true, status: 200, text: async () => SHELL };
  }
  return { ok: true, status: 200, json: async () => ({ data: pieza }) };
};

const PIEZA = {
  title: 'Concertación "tripartita" & el salario real en Uruguay',
  excerpt: "<p>Los <strong>consejos de salarios</strong> cerraron con un reajuste real del 1,8&nbsp;% sin trasladarse a precios, lo que reabre la discusión sobre indexación en un año electoral y sobre el margen que deja la meta de inflación del banco central para sostener el poder de compra.</p>",
  image_asset: { url: "https://res.cloudinary.com/pjr7bqzt/image/upload/v1787613820/sureconomics/foto.jpg" },
  published_at: "2026-08-25T15:00:00+00:00",
  topics: [{ name: "Trabajo y Migración" }],
};

// —— 1. El camino feliz ——
await conFetch(fetchNormal(PIEZA), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "articulos", slug: "concertacion-tripartita" } }, res);
  const h = res.body;
  check("responde 200", res.code === 200);
  check("el título es el de la pieza",
    /<title>Concertación &quot;tripartita&quot; &amp; el salario real en Uruguay — SurEconomics<\/title>/.test(h),
    (h.match(/<title>.*?<\/title>/) || [])[0]);
  check("og:title escapado",
    h.includes('property="og:title" content="Concertación &quot;tripartita&quot; &amp; el salario real en Uruguay"'));
  check("og:description sin etiquetas HTML",
    /og:description" content="Los consejos de salarios cerraron con un reajuste real del 1,8 %/.test(h),
    (h.match(/og:description" content="([^"]{0,60})/) || [])[1]);
  check("la descripción se recorta con puntos suspensivos",
    (h.match(/og:description" content="([^"]*)"/) || [])[1]?.endsWith("…"));
  check("og:image a 1200x630 y en jpg fijo, no f_auto",
    h.includes("f_jpg,q_auto,c_fill,w_1200,h_630/v1787613820/sureconomics/foto.jpg")
    && !h.includes("f_auto"));
  check("secure_url y type declarados",
    h.includes('og:image:secure_url') && h.includes('content="image/jpeg"'));
  check("tarjeta grande cuando hay foto", h.includes('name="twitter:card" content="summary_large_image"'));
  check("og:url canónica al dominio real",
    h.includes('property="og:url" content="https://www.sureconomics.com/articulos/concertacion-tripartita"'));
  check("canonical presente", h.includes('rel="canonical" href="https://www.sureconomics.com/articulos/concertacion-tripartita"'));
  check("fecha de publicación", h.includes('article:published_time" content="2026-08-25T15:00:00+00:00"'));
  check("sección tomada del tema", h.includes('article:section" content="Trabajo y Migración"'));
  check("el bundle sigue intacto", h.includes('src="/assets/index-abc123.js"'));
  check("una sola etiqueta title", (h.match(/<title>/g) || []).length === 1);
  check("se cachea en el borde", /s-maxage=600/.test(res.headers["Cache-Control"]));
});

// —— 2. Sin fotografía: tarjeta pequeña, no una grande vacía ——
await conFetch(fetchNormal({ ...PIEZA, image_asset: null }), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "noticias", slug: "sin-foto" } }, res);
  check("sin foto no promete tarjeta grande",
    !res.body.includes("summary_large_image") && res.body.includes('content="summary"'));
  check("sin foto no emite og:image", !res.body.includes("og:image"));
});

// —— 3. Falla abierto: la página funciona aunque la API no ——
const casos = [
  ["la API no responde", async (url) => {
    if (String(url).endsWith("/index.html")) return { ok: true, text: async () => SHELL };
    throw new Error("ECONNREFUSED");
  }, "api-sin-respuesta"],
  ["la API devuelve 404", async (url) => {
    if (String(url).endsWith("/index.html")) return { ok: true, text: async () => SHELL };
    return { ok: false, status: 404 };
  }, "api-404"],
  ["la API devuelve 500", async (url) => {
    if (String(url).endsWith("/index.html")) return { ok: true, text: async () => SHELL };
    return { ok: false, status: 500 };
  }, "api-500"],
];
for (const [nombre, impl, marca] of casos) {
  await conFetch(impl, async () => {
    const res = respuestaFalsa();
    await handler({ query: { seccion: "noticias", slug: "x" } }, res);
    check(`${nombre}: 200 con la app intacta`,
      res.code === 200 && res.body.includes('id="root"') && res.headers["X-Pieza-Meta"] === marca,
      res.headers["X-Pieza-Meta"]);
    check(`${nombre}: no se cachea largo`, res.headers["Cache-Control"] === "public, s-maxage=30");
  });
}

// —— 2b. La descripción sale de donde la haya ——
//
// Tres de ochenta y cuatro piezas en producción tenían resumen. Sin respaldo, la
// previsualización de las otras ochenta y una va sin descripción, que es la
// versión que un teléfono es más propenso a no dibujar.
check("usa el resumen cuando lo hay",
  descripcionDe({ excerpt: "<p>El resumen.</p>", content: "<p>El cuerpo.</p>" }) === "El resumen.");
check("un resumen vacío no cuenta como resumen",
  descripcionDe({ excerpt: "<p></p>", content: "<p>El cuerpo.</p>" }) === "El cuerpo.");
check("cae al cuerpo cuando no hay nada más",
  descripcionDe({ content: "<p>La coyuntura política actual tiene un diagnóstico revelador.</p>" })
    === "La coyuntura política actual tiene un diagnóstico revelador.");
check("prefiere meta_description al cuerpo",
  descripcionDe({ meta_description: "Para buscadores.", content: "<p>Cuerpo.</p>" }) === "Para buscadores.");
check("sin nada devuelve nulo", descripcionDe({}) === null);
check("el cuerpo largo se recorta",
  descripcionDe({ content: "<p>" + "palabra ".repeat(80) + "</p>" }).endsWith("…"));

await conFetch(fetchNormal({ ...PIEZA, excerpt: "<p></p>", content: "<p>El cuerpo entra como descripción.</p>" }), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "noticias", slug: "sin-resumen" } }, res);
  check("una pieza sin resumen sí emite og:description",
    res.body.includes('og:description" content="El cuerpo entra como descripción."'));
});

// —— 3b. El shell: lo que rompió esto en producción ——
//
// La primera versión pedía el shell a VERCEL_URL, que tiene protección de
// despliegue, así que recibía la página de autenticación de Vercel —487 KB de
// HTML ajeno— y la servía con nuestras etiquetas encima. Ahora se comprueba que
// lo recibido sea esta aplicación, y si no, se devuelve al archivo estático.
const LOGIN_DE_VERCEL = `<!DOCTYPE html><html lang="en-US"><head><title>Login</title>` +
  `</head><body>${"x".repeat(500)}<script src="/_next/static/chunks/a.js"></script></body></html>`;

const shells = [
  ["el shell no responde", async () => { throw new Error("ECONNREFUSED"); }, "shell-sin-respuesta"],
  ["llega la página de Vercel", async () => ({ ok: true, text: async () => LOGIN_DE_VERCEL }), "shell-no-reconocido"],
  ["llega algo vacío", async () => ({ ok: true, text: async () => "" }), "shell-no-reconocido"],
  ["llega un HTML enorme", async () => ({ ok: true, text: async () => "y".repeat(200000) }), "shell-no-reconocido"],
];
for (const [nombre, impl, marca] of shells) {
  await conFetch(impl, async () => {
    const res = respuestaFalsa();
    await handler({ query: { seccion: "noticias", slug: "x" } }, res);
    check(`${nombre}: redirige al estático, no lo sirve`,
      res.code === 307 && res.location === "/noticias/x?_s=1" && res.headers["X-Pieza-Meta"] === marca,
      `${res.code} ${res.location ?? ""} ${res.headers["X-Pieza-Meta"] ?? ""}`);
    check(`${nombre}: nunca devuelve HTML ajeno`, !res.body);
  });
}

check("el shell propio se reconoce", esNuestroShell(SHELL));
check("el de Vercel no", !esNuestroShell(LOGIN_DE_VERCEL));

// —— 4. Una sección que no existe no inventa etiquetas ——
await conFetch(fetchNormal(PIEZA), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "recetas", slug: "x" } }, res);
  check("sección desconocida devuelve el shell",
    res.code === 200 && !res.body.includes("og:title"), res.headers["X-Pieza-Meta"]);
});

// —— 5. Inyección de HTML por el título ——
const sucio = inyectar(SHELL, {
  titulo: '</title><script>alert(1)</script>',
  descripcion: '" onload="alert(2)',
  url: "https://www.sureconomics.com/noticias/x",
});
check("no se puede cerrar el title desde el contenido", !sucio.includes("<script>alert(1)"));
check("no se puede escapar de un atributo", !sucio.includes('onload="alert(2)"'));

console.log(fallos ? `\n  ${fallos} fallo(s)` : "\n  todo verde");
process.exit(fallos ? 1 : 0);
