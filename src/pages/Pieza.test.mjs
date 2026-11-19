/**
 * La página de una pieza, pintada como la ve el lector al abrirla (`renderToString`, ver
 * `scripts/pruebas/pintar.mjs`). `npm test`.
 *
 * La pieza llega como en producción: dentro del HTML (`<script id="se-pieza">`, lo pone
 * `api/pieza.js`). Sin ella la página empieza cargando y la pide a la API en un efecto,
 * que aquí no corre: lo que pasa después (404, error) se prueba por partes, con
 * `estadoDeLaRespuesta`/`estadoDelFallo` (`lib/paginaDePieza.test.mjs`) y pintando los
 * estados (`components/piece/EstadosDeLaPieza.jsx`) aquí abajo.
 */
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { pintarEn, textoDe } from "../../scripts/pruebas/pintar.mjs";
import { cargarIdioma, traducir } from "../i18n/motor.js";
import { Pieza } from "./Pieza.jsx";
import { PiezaCargando, PiezaConError, PiezaNoEncontrada } from "../components/piece/EstadosDeLaPieza.jsx";

const PATRONES = ["noticias/:slug", "articulos/:slug", "editorial/:slug", "entrevistas/:slug", "informes/:slug", "podcast/:slug"];

const fila = (extra = {}) => ({
  id: 7,
  slug: "el-bolivar-cae",
  format: "noticia",
  title: "El bolívar cae otra vez",
  excerpt: "<p>La entradilla de la noticia.</p>",
  content: "<p>Primer párrafo del cuerpo.</p><p>Segundo párrafo.</p>",
  published_at: "2026-11-10T12:00:00Z",
  updated_at: "2026-11-10T12:00:00Z",
  byline: "Ana Pérez",
  topics: [{ id: 1, slug: "economia", name: "Economía" }],
  places: [{ id: 2, slug: "venezuela", name: "Venezuela" }],
  ...extra,
});

const FOTO = { url: "/media/image/2026/11/bolivar.jpg", width: 1600, height: 900, credit: "Foto: Reuters" };

/**
 * Pinta `direccion` con `filaDelHtml` metida en el HTML, como la sirve `api/pieza.js`
 * (o sin nada, si es null). El `document` solo existe mientras se pinta.
 */
const abrir = async (direccion, filaDelHtml) => {
  const patron = PATRONES.find((p) => direccion.replace(/^\/en(?=\/)/, "").startsWith(`/${p.split("/")[0]}/`));
  globalThis.document = {
    getElementById: (id) => (id === "se-pieza" && filaDelHtml ? { textContent: JSON.stringify(filaDelHtml) } : null),
  };
  try {
    return await pintarEn(direccion, patron, createElement(Pieza));
  } finally {
    delete globalThis.document;
  }
};

const titularDe = (html) => /<h1[^>]*class="se-piece__title"[^>]*>([\s\S]*?)<\/h1>/.exec(html);
const en = (clave, vars) => traducir("en", clave, vars);
const es = (clave, vars) => traducir("es", clave, vars);

before(async () => {
  await cargarIdioma("en");
});

describe("una pieza normal", () => {
  test("titular, entradilla, cuerpo, firma y minutos de lectura", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", fila());
    const texto = textoDe(html);
    assert.equal(textoDe(titularDe(html)[1]), "El bolívar cae otra vez");
    assert.match(texto, /La entradilla de la noticia\./);
    assert.match(texto, /Primer párrafo del cuerpo\. Segundo párrafo\./);
    assert.match(texto, /Ana Pérez/);
    assert.match(texto, /1 min de lectura/);
    // La línea de «cuánto queda» solo en lo que se lee.
    assert.match(html, /class="se-leyendo"/);
  });

  test("las migas: inicio, la sección y el lugar", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", fila());
    const migas = /<nav class="se-piece__crumbs"[\s\S]*?<\/nav>/.exec(html)[0];
    assert.match(migas, /href="\/"/);
    assert.match(migas, /href="\/articulos\?formato=noticias"/);
    assert.match(migas, /href="\/explorar\?donde=Venezuela"/);
  });

  test("en español no hay aviso de idioma", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", fila());
    assert.doesNotMatch(html, /se-aviso-idioma/);
  });

  test("sin versión en inglés no ofrece «Read in English»", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", fila());
    assert.doesNotMatch(html, /se-piece__idioma/);
  });

  test("con versión en inglés, el botón lleva a la misma pieza en /en", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", fila({ en_ingles: true, title_en: "The bolivar falls again", content_en: "<p>Body.</p>" }));
    const boton = /<a[^>]*class="se-piece__idioma"[^>]*>/.exec(html)?.[0];
    assert.ok(boton, "falta el botón de idioma");
    assert.match(boton, /href="\/en\/noticias\/el-bolivar-cae"/);
    assert.match(boton, /hreflang="en"/i);
    assert.match(textoDe(html), new RegExp(es("piezas.idioma.leer")));
  });

  test("los comentarios, solo donde la sección los admite", async () => {
    const titulo = es("piezas.comentarios.titulo");
    assert.ok(titulo !== "piezas.comentarios.titulo", "la clave de los comentarios cambió de nombre");
    assert.ok(textoDe(await abrir("/noticias/el-bolivar-cae", fila())).includes(titulo));
    const cerrada = await abrir("/noticias/el-bolivar-cae", fila({ content_format: { allows_comments: false } }));
    assert.ok(!textoDe(cerrada).includes(titulo));
  });
});

describe("con y sin foto", () => {
  test("sin foto, la cabecera va a una columna (sin hueco vacío a la derecha)", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", fila());
    assert.match(html, /class="se-piece__head"/);
    assert.doesNotMatch(html, /se-piece__head--media/);
    assert.doesNotMatch(html, /se-piece__head-media/);
  });

  test("con foto, la cabecera lleva la foto al lado del titular", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", fila({ image_asset: FOTO }));
    assert.match(html, /se-piece__head se-piece__head--media/);
    const media = /<div class="se-piece__head-media">[\s\S]*?<\/div>/.exec(html)?.[0] ?? "";
    assert.match(media, /<img[^>]*src="\/media\/image\/2026\/11\/bolivar[^"]*\.jpg"/);
  });

  test("una foto con una dirección rara (otro dominio disfrazado) no se pinta", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", fila({ image_asset: { ...FOTO, url: "//malo.example/x.jpg" } }));
    assert.doesNotMatch(html, /malo\.example/);
    assert.doesNotMatch(html, /se-piece__head--media/);
  });

  test("la entrevista no lleva foto en la cabecera: su portada es el video", async () => {
    const html = await abrir("/entrevistas/el-bolivar-cae", fila({ format: "entrevista", image_asset: FOTO }));
    assert.ok(titularDe(html), "la entrevista no se pintó");
    assert.doesNotMatch(html, /se-piece__head--media/);
    // Ni minutos de lectura ni la línea de lo que queda: se ve, no se lee.
    assert.doesNotMatch(textoDe(html), /min de lectura/);
    assert.doesNotMatch(html, /class="se-leyendo"/);
  });

  test("un informe se maqueta «a fondo»", async () => {
    const html = await abrir("/informes/el-bolivar-cae", fila({ format: "informe" }));
    assert.match(html, /class="se-piece se-piece--a-fondo"/);
  });
});

describe("una pieza en inglés", () => {
  test("sin traducción: lo avisa antes del titular y marca el texto como español", async () => {
    const html = await abrir("/en/noticias/el-bolivar-cae", fila());
    const aviso = html.indexOf("se-aviso-idioma");
    assert.ok(aviso > 0, "falta el aviso");
    assert.ok(aviso < html.indexOf("se-piece__title"), "el aviso va antes del titular");
    assert.match(textoDe(html), new RegExp(en("idioma.aviso.soloEspanol.titulo")));
    const h1 = /<h1[^>]*class="se-piece__title"[^>]*>/.exec(html)[0];
    assert.match(h1, /lang="es"/);
    assert.equal(textoDe(titularDe(html)[1]), "El bolívar cae otra vez");
    // No promete un inglés que no hay.
    assert.doesNotMatch(html, /se-piece__idioma/);
  });

  test("sin traducción, las migas y los enlaces siguen en /en", async () => {
    const html = await abrir("/en/noticias/el-bolivar-cae", fila());
    const migas = /<nav class="se-piece__crumbs"[\s\S]*?<\/nav>/.exec(html)[0];
    assert.match(migas, /href="\/en"/);
    assert.match(migas, /href="\/en\/articulos\?formato=noticias"/);
  });

  test("traducida por Claude y sin revisar: lo dice, con enlace al original", async () => {
    const html = await abrir(
      "/en/noticias/el-bolivar-cae",
      fila({ en_ingles: true, traduccion_automatica: true, title_en: "The bolivar falls again", content_en: "<p>Body in English.</p>" })
    );
    assert.equal(textoDe(titularDe(html)[1]), "The bolivar falls again");
    assert.match(textoDe(html), /Body in English\./);
    assert.match(textoDe(html), new RegExp(en("idioma.aviso.automatica.titulo")));
    const aviso = /<aside class="se-aviso-idioma"[\s\S]*?<\/aside>/.exec(html)[0];
    assert.match(aviso, /<a hrefLang="es" href="\/noticias\/el-bolivar-cae">/);
    const h1 = /<h1[^>]*class="se-piece__title"[^>]*>/.exec(html)[0];
    assert.doesNotMatch(h1, /lang=/);
  });

  test("traducida y revisada: sin aviso", async () => {
    const html = await abrir(
      "/en/noticias/el-bolivar-cae",
      fila({ en_ingles: true, traduccion_automatica: false, title_en: "The bolivar falls again", content_en: "<p>Body.</p>" })
    );
    assert.doesNotMatch(html, /se-aviso-idioma/);
    assert.equal(textoDe(titularDe(html)[1]), "The bolivar falls again");
  });

  test("una traducción a medias (sin `en_ingles`) sale entera en español", async () => {
    const html = await abrir("/en/noticias/el-bolivar-cae", fila({ title_en: "Half done" }));
    assert.equal(textoDe(titularDe(html)[1]), "El bolívar cae otra vez");
    assert.doesNotMatch(html, /Half done/);
  });
});

describe("mientras carga", () => {
  test("sin la pieza en el HTML: pantalla de alto, sin titular y sin «Cargando» todavía", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", null);
    assert.match(html, /se-cargando-pantalla/);
    assert.equal(titularDe(html), null);
    assert.doesNotMatch(textoDe(html), new RegExp(es("comun.cargando")));
  });

  test("la pieza del HTML es de otra dirección: no se usa, se carga", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", fila({ slug: "otra-pieza" }));
    assert.match(html, /se-cargando-pantalla/);
    assert.doesNotMatch(html, /El bolívar cae otra vez/);
  });

  test("un formato equivocado en la dirección no pinta la pieza (la página redirige a la buena)", async () => {
    const html = await abrir("/articulos/el-bolivar-cae", fila());
    assert.equal(titularDe(html), null);
    assert.doesNotMatch(html, /se-piece__body|El bolívar cae otra vez/);
  });
});

describe("texto raro de la redacción", () => {
  test("etiquetas en el titular se escapan: se ven como texto", async () => {
    const titulo = `<script>alert("x")</script> <img src=x onerror=alert(1)>`;
    const html = await abrir("/noticias/el-bolivar-cae", fila({ title: titulo }));
    assert.doesNotMatch(html, /<script>alert/);
    assert.doesNotMatch(html, /<img src=x/);
    assert.equal(textoDe(titularDe(html)[1]), titulo);
  });

  test("emojis, eñes, comillas y escritura de derecha a izquierda pasan tal cual", async () => {
    const titulo = "Dólar 💸 «sube» — مرحبا — ñandú & “cía”";
    const html = await abrir("/noticias/el-bolivar-cae", fila({ title: titulo }));
    assert.equal(textoDe(titularDe(html)[1]), titulo);
  });

  test("un cuerpo enorme se pinta entero y cuenta sus minutos", async () => {
    const parrafo = `<p>${"palabra ".repeat(200).trim()}</p>`;
    const html = await abrir("/noticias/el-bolivar-cae", fila({ content: parrafo.repeat(500) }));
    assert.equal((html.match(/palabra/g) ?? []).length, 100_000);
    assert.match(textoDe(html), /455 min de lectura/);
  });

  test("una pieza casi vacía (sin entradilla, cuerpo, firma ni temas) se pinta igual", async () => {
    const html = await abrir("/noticias/el-bolivar-cae", { id: 7, slug: "el-bolivar-cae", format: "noticia", title: "Solo el titular" });
    assert.equal(textoDe(titularDe(html)[1]), "Solo el titular");
    assert.doesNotMatch(html, /se-piece__lead--head/);
    assert.doesNotMatch(textoDe(html), /min de lectura/);
  });
});

describe("los estados sin pieza", () => {
  const solo = (direccion, elemento) => pintarEn(direccion, "*", elemento);

  test("no existe: lo dice y lleva a la portada, en su idioma", async () => {
    const enEs = textoDe(await solo("/x", createElement(PiezaNoEncontrada)));
    assert.match(enEs, new RegExp(es("piezas.noEncontrada.titulo")));
    assert.match(await solo("/x", createElement(PiezaNoEncontrada)), /<a[^>]*href="\/"[^>]*class="se-piece__back"|class="se-piece__back"[^>]*href="\/"/);
    const enEn = await solo("/en/x", createElement(PiezaNoEncontrada));
    assert.match(textoDe(enEn), new RegExp(en("piezas.noEncontrada.titulo")));
    assert.match(enEn, /href="\/en"/);
  });

  test("error pasajero: lo dice y ofrece reintentar", async () => {
    const html = await solo("/x", createElement(PiezaConError, { error: { status: 502, message: "Bad gateway" }, onRetry: () => {} }));
    assert.match(textoDe(html), new RegExp(es("piezas.errorCarga")));
    assert.match(html, /<button/);
  });

  test("cargando: nada al principio, el aviso cuando ya tarda", async () => {
    const pronto = await solo("/x", createElement(PiezaCargando, { cargando: false }));
    assert.doesNotMatch(textoDe(pronto), new RegExp(es("comun.cargando")));
    const tarde = await solo("/x", createElement(PiezaCargando, { cargando: true }));
    assert.match(textoDe(tarde), new RegExp(es("comun.cargando")));
  });
});
