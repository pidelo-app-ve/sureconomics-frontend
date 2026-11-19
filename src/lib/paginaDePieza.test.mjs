/**
 * Lo que decide la página de una pieza sin pintar nada (`paginaDePieza.js`), y las
 * señales para Google que acaban en el `<head>` (`useMetaPagina` → `applyPageMeta`).
 * `npm test`.
 */
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../i18n/diccionarios.js";
import { traducir } from "../i18n/motor.js";
import { piezaFromApi } from "./pieza.js";
import { applyPageMeta } from "./seo.js";
import { senalesDeLaPagina } from "../i18n/useMetaPagina.js";
import { consultaCanonica, esPaginaDeFiltro } from "./canonica.js";
import { sinPrefijo } from "../i18n/motor.js";
import { documentoDePrueba } from "../../scripts/pruebas/cabeza.mjs";
import {
  SE_LEEN,
  estadoDeLaRespuesta,
  estadoDelFallo,
  metaDeLaPieza,
  minutosDeLectura,
  tomarPiezaDelHtml,
} from "./paginaDePieza.js";

const t = (clave, vars) => traducir("es", clave, vars);
const palabras = (n) => Array.from({ length: n }, (_, i) => `p${i}`).join(" ");

afterEach(() => {
  delete globalThis.document;
});

describe("minutos de lectura", () => {
  test("sin texto no hay minutos (ni con párrafos vacíos)", () => {
    assert.equal(minutosDeLectura(""), null);
    assert.equal(minutosDeLectura(null), null);
    assert.equal(minutosDeLectura(undefined), null);
    assert.equal(minutosDeLectura("<p></p><p> </p>"), null);
  });

  test("menos de un minuto se dice como uno", () => {
    assert.equal(minutosDeLectura("<p>Hola</p>"), 1);
    assert.equal(minutosDeLectura(palabras(50)), 1);
  });

  test("a 220 palabras por minuto, redondeando", () => {
    assert.equal(minutosDeLectura(palabras(220)), 1);
    assert.equal(minutosDeLectura(palabras(329)), 1);
    assert.equal(minutosDeLectura(palabras(330)), 2);
    assert.equal(minutosDeLectura(palabras(2200)), 10);
  });

  test("las etiquetas no son palabras, pero separan", () => {
    assert.equal(minutosDeLectura(`<p><strong>${palabras(220)}</strong></p>`), 1);
    // 330 palabras separadas solo por `<br>`: si la etiqueta no hiciera de espacio
    // serían una sola palabra (un minuto) y no dos minutos.
    assert.equal(minutosDeLectura(palabras(330).replace(/ /g, "<br>")), 2);
  });

  test("un texto enorme no se cuelga y da una cifra con sentido", () => {
    const enorme = `<p>${palabras(500_000)}</p>`;
    assert.equal(minutosDeLectura(enorme), Math.round(500_000 / 220));
  });

  test("solo se cuentan en lo que se lee", () => {
    assert.deepEqual([...SE_LEEN].sort(), ["articulo", "editorial", "informe", "noticia"]);
    assert.equal(SE_LEEN.has("entrevista"), false);
    assert.equal(SE_LEEN.has("podcast"), false);
  });
});

describe("la pieza que viene dentro del HTML", () => {
  const conNodo = (texto) => {
    globalThis.document = { getElementById: (id) => (id === "se-pieza" ? { textContent: texto } : null) };
  };

  test("sin documento (o sin el nodo) no hay pieza", () => {
    assert.equal(tomarPiezaDelHtml("x"), null);
    globalThis.document = { getElementById: () => null };
    assert.equal(tomarPiezaDelHtml("x"), null);
  });

  test("se usa si es la de esta dirección", () => {
    conNodo(JSON.stringify({ slug: "x", title: "T" }));
    assert.deepEqual(tomarPiezaDelHtml("x"), { slug: "x", title: "T" });
  });

  test("no se usa si es de otra pieza", () => {
    conNodo(JSON.stringify({ slug: "otra" }));
    assert.equal(tomarPiezaDelHtml("x"), null);
  });

  test("un JSON roto o vacío no rompe la página", () => {
    conNodo("{roto");
    assert.equal(tomarPiezaDelHtml("x"), null);
    conNodo("");
    assert.equal(tomarPiezaDelHtml("x"), null);
    conNodo("null");
    assert.equal(tomarPiezaDelHtml("x"), null);
  });

  test("no la borra al leerla (React la lee dos veces en modo estricto)", () => {
    let borrada = false;
    globalThis.document = {
      getElementById: () => ({ textContent: JSON.stringify({ slug: "x" }), remove: () => (borrada = true) }),
    };
    tomarPiezaDelHtml("x");
    assert.ok(tomarPiezaDelHtml("x"));
    assert.equal(borrada, false);
  });
});

describe("el estado tras pedir la pieza", () => {
  test("una fila con slug es la pieza", () => {
    const fila = { id: 1, slug: "x" };
    assert.deepEqual(estadoDeLaRespuesta(fila), { status: "success", fila });
  });

  test("lo que no es una pieza se trata como «no existe»", () => {
    for (const raro of [null, undefined, "", "texto", 0, {}, [], { slug: "" }, { id: 3 }]) {
      assert.deepEqual(estadoDeLaRespuesta(raro), { status: "missing", fila: null }, JSON.stringify(raro));
    }
  });

  test("solo un 404 es «no existe»", () => {
    assert.deepEqual(estadoDelFallo({ status: 404 }), { status: "missing", fila: null });
  });

  test("lo demás es pasajero y se puede reintentar (sin red, 429, 500, 502)", () => {
    const sinRed = new TypeError("Failed to fetch");
    for (const err of [sinRed, { status: 0 }, { status: 429 }, { status: 500 }, { status: 502 }, { status: 410 }, null]) {
      const estado = estadoDelFallo(err);
      assert.equal(estado.status, "error", JSON.stringify(err));
      assert.equal(estado.error, err);
    }
  });
});

describe("el título y la descripción", () => {
  const pieza = (fila) => piezaFromApi({ id: 1, slug: "x", format: "noticia", title: "El titular", ...fila });

  test("una 404 lo dice, sin canónica", () => {
    const meta = metaDeLaPieza({ status: "missing", pieza: null, t });
    assert.equal(meta.noEncontrada, true);
    assert.match(meta.title, /SurEconomics/);
    assert.equal(meta.title, t("piezas.noEncontrada.meta.titulo", { marca: "SurEconomics" }));
  });

  test("el meta título manda sobre el titular; si no hay, el titular", () => {
    assert.match(metaDeLaPieza({ status: "success", pieza: pieza({ meta_title: "Para Google" }), t }).title, /^Para Google/);
    assert.match(metaDeLaPieza({ status: "success", pieza: pieza({}), t }).title, /^El titular/);
  });

  test("la descripción: meta, resumen, tema y por último la marca", () => {
    const d = (fila) => metaDeLaPieza({ status: "success", pieza: pieza(fila), t }).description;
    assert.equal(d({ meta_description: "Meta", excerpt: "<p>Resumen</p>" }), "Meta");
    assert.equal(d({ excerpt: "<p>Resumen</p>" }), "Resumen");
    assert.equal(d({ topics: [{ id: 1, slug: "economia", name: "Economía" }] }), "Economía");
    assert.equal(d({}), "SurEconomics");
  });

  test("la firma: la de la pieza, o la marca en una editorial o sin firma", () => {
    const autor = (fila) => metaDeLaPieza({ status: "success", pieza: pieza(fila), t }).autor;
    assert.equal(autor({ byline: "Ana Pérez" }), "Ana Pérez");
    assert.equal(autor({}), "SurEconomics");
    assert.equal(autor({ format: "editorial", byline: "Ana Pérez" }), "SurEconomics");
  });

  test("sin inglés, `soloEspanol`; con inglés, no", () => {
    assert.equal(metaDeLaPieza({ status: "success", pieza: pieza({}), t }).soloEspanol, true);
    assert.equal(metaDeLaPieza({ status: "success", pieza: pieza({ en_ingles: true, title_en: "T" }), t }).soloEspanol, false);
  });

  test("mientras carga (o con error) no hay título que poner", () => {
    assert.deepEqual(metaDeLaPieza({ status: "loading", pieza: null, t }), { soloEspanol: true });
    assert.deepEqual(metaDeLaPieza({ status: "error", pieza: null, t }), { soloEspanol: true });
  });
});

/**
 * De la página al `<head>`: lo que `Pieza` le pide a `useMetaPagina` y lo que este pone
 * con `applyPageMeta`, en un documento de mentira (los efectos no corren en Node).
 */
describe("las señales para Google de una pieza", () => {
  const SITIO = "https://www.sureconomics.com";
  const head = (direccion, lang, meta, previo) => {
    const doc = previo ?? documentoDePrueba();
    globalThis.document = doc;
    const u = new URL(direccion, SITIO);
    const base = sinPrefijo(u.pathname) + consultaCanonica(u.search);
    applyPageMeta(senalesDeLaPagina({ base, filtro: esPaginaDeFiltro(u.pathname, u.search), lang, ...meta }));
    return doc;
  };
  const metaDe = (fila, status = "success") =>
    metaDeLaPieza({ status, pieza: status === "success" ? piezaFromApi({ id: 1, slug: "x", format: "noticia", title: "T", ...fila }) : null, t });

  test("pieza normal en español: se indexa, canónica propia y los dos idiomas si hay inglés", () => {
    const doc = head("/noticias/x", "es", metaDe({ en_ingles: true, title_en: "T" }));
    assert.match(doc.meta("robots"), /^index, follow/);
    assert.equal(doc.enlace("canonical"), `${SITIO}/noticias/x`);
    assert.deepEqual(doc.alternativas(), {
      es: `${SITIO}/noticias/x`,
      en: `${SITIO}/en/noticias/x`,
      "x-default": `${SITIO}/noticias/x`,
    });
    assert.equal(doc.meta("og:type"), "article");
    assert.equal(doc.documentElement.lang, "es");
  });

  test("sin inglés, la española no declara un /en que no existe", () => {
    const doc = head("/noticias/x", "es", metaDe({}));
    assert.match(doc.meta("robots"), /^index/);
    assert.equal(doc.enlace("canonical"), `${SITIO}/noticias/x`);
    assert.deepEqual(doc.alternativas(), {});
  });

  test("en /en sin traducción: noindex y la canónica al español", () => {
    const doc = head("/en/noticias/x", "en", metaDe({}));
    assert.equal(doc.meta("robots"), "noindex, follow");
    assert.equal(doc.enlace("canonical"), `${SITIO}/noticias/x`);
    assert.equal(doc.documentElement.lang, "en");
  });

  test("en /en con traducción: se indexa con su propia canónica", () => {
    const doc = head("/en/noticias/x", "en", metaDe({ en_ingles: true, title_en: "T" }));
    assert.match(doc.meta("robots"), /^index/);
    assert.equal(doc.enlace("canonical"), `${SITIO}/en/noticias/x`);
  });

  test("el ?v= de compartir no entra en la canónica", () => {
    const doc = head("/noticias/x?v=abc123", "es", metaDe({}));
    assert.equal(doc.enlace("canonical"), `${SITIO}/noticias/x`);
  });

  test("una 404 tras una pieza: noindex y se quita la canónica que había", () => {
    const doc = head("/noticias/x", "es", metaDe({ en_ingles: true, title_en: "T" }));
    assert.ok(doc.enlace("canonical"));
    head("/noticias/no-existe", "es", metaDe({}, "missing"), doc);
    assert.equal(doc.meta("robots"), "noindex, follow");
    assert.equal(doc.enlace("canonical"), null);
    assert.equal(doc.meta("og:url"), null);
    assert.deepEqual(doc.alternativas(), {});
  });

  test("un error pasajero en español no pone noindex (la pieza existe)", () => {
    const doc = head("/noticias/x", "es", metaDe({}, "error"));
    assert.match(doc.meta("robots"), /^index/);
  });
});
