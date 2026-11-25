/**
 * La columna de Última hora que pinta el HTML de la portada (`ultimaHoraEnHtml`, en
 * `api/portada.js`) es la que pinta React (`UltimaHoraColumna`). `npm test`.
 *
 * Por qué importa: en el teléfono va encima de la apertura. Si la del HTML midiera otra
 * cosa que la de React, la foto saltaría al montar. Se comparan las cajas (etiqueta y
 * clases, en orden) y los textos, en los dos casos: con titulares del día (en español, con
 * los titulares dentro del HTML, como llegan) y sin ellos (en inglés, con las noticias que
 * no están arriba, y su marca «ES»).
 *
 * La hora, en la de Caracas: la del servidor lo es siempre, y la de la página es la del lector.
 */
process.env.TZ = "America/Caracas";

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const AHORA = Date.now();
const atras = (min) => new Date(AHORA - min * 60_000).toISOString();
const ITEMS = [
  { id: 11, title: "Recién llegado & <cosas>", published_at: atras(12.5) },
  { id: 12, title: "Uno largo que seguro ocupa dos líneas en la columna del teléfono", published_at: atras(40.5) },
  { id: 13, title: "Fijado arriba", pinned: true, published_at: atras(200) },
  { id: 14, title: "De esta mañana", published_at: atras(300) },
];

// El documento con el bloque que deja la función: el almacén de titulares en español lo
// toma al crearse (`useHeadlines`). El inglés no tiene: pinta las noticias.
const bloque = JSON.stringify({
  lectura: "/headlines?lang=es&limit=40",
  generada: new Date(AHORA).toISOString(),
  respuesta: { data: { items: ITEMS, version: 5 }, success: true },
});
const nodos = new Map([["se-ultima-hora", { textContent: bloque, remove: () => nodos.delete("se-ultima-hora") }]]);
/** Solo mientras se pinta: hay módulos que, al cargarse, toman `document` por un navegador. */
const conDocumento = async (pintar) => {
  globalThis.document = { getElementById: (id) => nodos.get(id) ?? null, querySelector: () => null };
  try {
    return await pintar();
  } finally {
    delete globalThis.document;
  }
};

const { pintarEn } = await import("../../../scripts/pruebas/pintar.mjs");
const { cargarIdioma } = await import("../../i18n/motor.js");
const { piezasFromApi } = await import("../../lib/pieza.js");
const { UltimaHoraColumna } = await import("./UltimaHoraColumna.jsx");
const { ultimaHoraEnHtml } = await import("../../../api/portada.js");

/** Etiqueta y clases de cada caja, y los textos, en orden (`section` y `div` son la misma caja). */
const forma = (html) => {
  const desde = html.indexOf('class="se-plana__uh"');
  const trozo = html.slice(html.lastIndexOf("<", desde)).replace(/<!-- -->/g, "");
  const partes = [];
  for (const m of trozo.matchAll(/<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)/g)) {
    if (m[4] !== undefined) {
      const texto = m[4].replace(/\s+/g, " ").trim();
      if (texto) partes.push(`"${texto}"`);
    } else if (!m[1]) {
      const clase = /class="([^"]*)"/.exec(m[3])?.[1] ?? "";
      partes.push(`${m[2] === "section" ? "div" : m[2]}.${clase}`);
    }
  }
  return partes;
};

const filas = [21, 22, 23, 24, 25, 26, 27].map((id) => ({
  id,
  slug: `noticia-${id}`,
  format: "noticia",
  title: `Noticia ${id} «con» comillas`,
  excerpt: "",
  published_at: atras(id * 60),
  topics: [],
  en_ingles: id === 22,
  title_en: id === 22 ? "News 22 in English" : undefined,
}));

/** La columna como la monta `PrimeraPlana`: las piezas se convierten al pintar, en el idioma de la página. */
const Columna = () => createElement(UltimaHoraColumna, { recientes: piezasFromApi(filas) });

describe("Última hora del HTML = la de React", () => {
  test("con titulares del día (español)", async () => {
    const react = await conDocumento(() => pintarEn("/", "", createElement(Columna)));
    const previa = ultimaHoraEnHtml({ items: ITEMS, recientes: filas, idioma: "es", ahora: Date.now() });
    assert.match(react, /se-plana__uh-nota/, "React no tomó los titulares del HTML");
    assert.deepEqual(forma(previa), forma(react));
  });

  test("sin titulares (inglés): las noticias, con su marca «ES»", async () => {
    await cargarIdioma("en");
    const react = await conDocumento(() => pintarEn("/en", "", createElement(Columna)));
    const previa = ultimaHoraEnHtml({ items: [], recientes: filas, idioma: "en", ahora: Date.now() });
    assert.match(react, /se-marca-idioma/);
    assert.deepEqual(forma(previa), forma(react));
  });
});
