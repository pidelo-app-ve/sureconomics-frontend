/**
 * La 404 servida desde el borde (`api/no-encontrada.js`), con el shell simulado.
 *
 * Sin runtime de pruebas: `node api/no-encontrada.test.mjs`, o `npm run test:og`.
 *
 * Lo que se vigila: que responde 404 siempre (con la aplicación o sin ella), que dice
 * `noindex` una sola vez, y que sus textos son los de `src/i18n/`.
 */
import { readFileSync } from "node:fs";
import handler, { TEXTOS, olvidarShell, paginaMinima, shellNoEncontrada } from "./no-encontrada.js";

// Sin el archivo empaquetado (`dist/app.html`): el shell llega por el respaldo de la red,
// que aquí es el `fetch` simulado.
process.env.SHELL_ARCHIVO = "";

const SHELL = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <title>SurEconomics — Economía, mercados e inversión</title>
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
  return r;
};

const conFetch = async (impl, fn) => {
  const previo = globalThis.fetch;
  globalThis.fetch = impl;
  try { return await fn(); } finally { globalThis.fetch = previo; }
};

const contar = (texto, patron) => (texto.match(patron) || []).length;

console.log("con la aplicación");
let pedidas = 0;
await conFetch(async () => { pedidas++; return { ok: true, status: 200, text: async () => SHELL }; }, async () => {
  const res = respuestaFalsa();
  await handler({ query: {} }, res);
  check("responde 404", res.code === 404);
  check("es la aplicación", res.body.includes('<div id="root"></div>') && res.body.includes("/assets/index-abc123.js"));
  check("un solo robots, y dice noindex",
    contar(res.body, /<meta name="robots"/g) === 1 && res.body.includes('content="noindex, follow"'));
  check("el título es el de la 404", res.body.includes(`<title>${TEXTOS.es.pestana}</title>`));
  check("en español", res.body.includes('<html lang="es">'));
  check("X-Robots-Tag noindex", res.headers["X-Robots-Tag"] === "noindex");
  check("guardada en el borde", /s-maxage=\d+/.test(res.headers["Cache-Control"] ?? ""));

  const en = respuestaFalsa();
  await handler({ query: { lang: "en" } }, en);
  check("/en: 404 en inglés", en.code === 404 && en.body.includes('<html lang="en">') && en.body.includes(`<title>${TEXTOS.en.pestana}</title>`));
  check("el shell se pide una vez y se reutiliza", pedidas === 1, `${pedidas} peticiones`);
});

console.log("sin la aplicación");
olvidarShell();
await conFetch(async () => { throw new Error("sin red"); }, async () => {
  const res = respuestaFalsa();
  await handler({ query: {} }, res);
  check("sin red: 404 igual, con la página mínima", res.code === 404 && res.body.includes(TEXTOS.es.volver));
  check("la mínima dice noindex", res.body.includes('content="noindex, follow"'));
});
olvidarShell();
await conFetch(async () => ({ ok: true, status: 200, text: async () => "<html>login de otro</html>" }), async () => {
  const res = respuestaFalsa();
  await handler({ query: { lang: "en" } }, res);
  check("un HTML que no es el nuestro no se sirve", res.code === 404 && !res.body.includes("login de otro") && res.body.includes(TEXTOS.en.volver));
});

console.log("piezas sueltas");
check("sin robots en el shell, lo añade",
  shellNoEncontrada(SHELL.replace(/\s*<meta name="robots"[^>]*>/, "")).includes('content="noindex, follow"'));
check("la mínima en inglés enlaza a /en", paginaMinima("en").includes('href="/en"'));

console.log("los textos son los de src/i18n");
for (const idioma of ["es", "en"]) {
  const dicc = JSON.parse(readFileSync(new URL(`../src/i18n/${idioma}/piezas.json`, import.meta.url), "utf8")).piezas;
  const t = TEXTOS[idioma];
  check(`${idioma}: pestaña`, t.pestana === dicc.paginaNoEncontrada.meta.titulo.replace("{marca}", "SurEconomics"));
  check(`${idioma}: título`, t.titulo === dicc.paginaNoEncontrada.titulo);
  check(`${idioma}: texto`, t.texto === dicc.paginaNoEncontrada.texto);
  check(`${idioma}: volver`, t.volver === dicc.noEncontrada.volver);
}

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
