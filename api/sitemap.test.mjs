/**
 * Los mapas del sitio, con la API simulada. `node api/sitemap.test.mjs`, o `npm run test:sitemap`.
 */
import handler, { enIngles, mapaCompleto, mapaDeNoticias, urlDe } from "./sitemap.js";

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
  return r;
};

const AHORA = Date.parse("2026-10-05T18:00:00Z");
const pieza = (n, horasAtras, extra = {}) => ({
  slug: `pieza-${n}`,
  format: n % 2 ? "noticia" : "articulo",
  title: `Titular ${n} & "comillas"`,
  published_at: new Date(AHORA - horasAtras * 3600 * 1000).toISOString(),
  updated_at: new Date(AHORA - horasAtras * 3600 * 1000 + 60000).toISOString(),
  ...extra,
});

// 1. La dirección de cada pieza, por formato.
check("noticia -> /noticias/slug", urlDe({ format: "noticia", slug: "a" }) === "https://www.sureconomics.com/noticias/a");
check("formato desconocido -> nada", urlDe({ format: "otro", slug: "a" }) === null);

// 2. El mapa completo.
const piezas = [pieza(1, 2), pieza(2, 30), pieza(3, 100)];
const completo = mapaCompleto(piezas);
check("es XML de sitemap", completo.startsWith('<?xml') && completo.includes("sitemaps.org/schemas/sitemap/0.9"));
check("lleva las tres piezas", ["pieza-1", "pieza-2", "pieza-3"].every((s) => completo.includes(s)));
check("lleva la portada", completo.includes("<loc>https://www.sureconomics.com/</loc>"));
check("ni cuenta ni panel", !completo.includes("/cuenta") && !completo.includes("/admin"));
check("con su última edición", completo.includes("<lastmod>"));
check("las consultas escapadas", completo.includes("/articulos?formato=noticias"));
check("cada página fija también en inglés", completo.includes("<loc>https://www.sureconomics.com/en</loc>") && completo.includes("<loc>https://www.sureconomics.com/en/informes</loc>"));
check("con sus dos idiomas enlazados", completo.includes('hreflang="en" href="https://www.sureconomics.com/en/informes"') && completo.includes('hreflang="x-default" href="https://www.sureconomics.com/informes"'));
check("las piezas sin versión en inglés", !completo.includes("/en/noticias/pieza-1"));
check("enIngles", enIngles("/") === "/en" && enIngles("/articulos?formato=noticias") === "/en/articulos?formato=noticias");

// 3. El de noticias: solo 48 horas, y escapado.
const noticias = mapaDeNoticias(piezas, AHORA);
check("noticias: solo las de 48 h", noticias.includes("pieza-1") && noticias.includes("pieza-2") && !noticias.includes("pieza-3"));
check("noticias: nombre del medio e idioma", noticias.includes("<news:name>SurEconomics</news:name>") && noticias.includes("<news:language>es</news:language>"));
check("noticias: título escapado", noticias.includes("Titular 1 &amp; &quot;comillas&quot;"));

// 4. El manejador pide todas las páginas de la API.
const conFetch = async (impl, fn) => {
  const previo = globalThis.fetch;
  globalThis.fetch = impl;
  try { return await fn(); } finally { globalThis.fetch = previo; }
};
const pedidas = [];
await conFetch(async (url) => {
  pedidas.push(String(url));
  const n = Number(new URL(url).searchParams.get("page"));
  return { ok: true, status: 200, json: async () => ({ meta: { pages: 3 }, data: [pieza(n * 10, 1)] }) };
}, async () => {
  const res = respuestaFalsa();
  await handler({ query: {} }, res);
  check("pide las tres páginas", pedidas.length === 3, pedidas.map((u) => new URL(u).searchParams.get("page")).join(","));
  check("200 con XML", res.code === 200 && res.headers["Content-Type"].startsWith("application/xml"));
  check("y las piezas de las tres", ["pieza-10", "pieza-20", "pieza-30"].every((s) => res.body.includes(s)));
  check("se cachea en el borde", /s-maxage=1800/.test(res.headers["Cache-Control"]));
});

// 5. Si la API cae, 503 y no un mapa a medias.
await conFetch(async () => { throw new Error("ECONNREFUSED"); }, async () => {
  const res = respuestaFalsa();
  await handler({ query: { tipo: "noticias" } }, res);
  check("API caída: 503 con Retry-After", res.code === 503 && res.headers["Retry-After"]);
});

console.log(fallos ? `\n  ${fallos} fallo(s)` : "\n  todo verde");
process.exit(fallos ? 1 : 0);
