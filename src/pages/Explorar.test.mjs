/**
 * Explorar pintado (`renderToString`, ver `scripts/pruebas/pintar.mjs`): que busque en el
 * servidor lo escrito y que avise cuando la lista viene cortada. `npm test`.
 *
 * Las piezas y los temas llegan por dos hooks que piden en un `useEffect`, que aquí no
 * corre: se cambian por dobles. El de las piezas apunta con qué se le llamó.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { sustituir } from "../../scripts/pruebas/dobles.mjs";
import { pintarEn, textoDe } from "../../scripts/pruebas/pintar.mjs";
import { traducir } from "../i18n/motor.js";
import { piezasFromApi } from "../lib/pieza.js";

const PIEZAS = "src/hooks/usePieces.js";
const llamadas = [];
let respuesta = {};

sustituir({
  [PIEZAS]: {
    usePieces: (opciones) => {
      llamadas.push(opciones);
      return { status: "success", items: [], total: 0, truncated: false, error: null, faltan: 0, buscando: false, ...respuesta };
    },
  },
  "src/hooks/useTaxonomy.js": {
    useTaxonomy: () => ({
      formats: [],
      topics: [],
      geoTop: "Mundo",
      continentes: [],
      regiones: {},
      ancestros: {},
      slugPorNombre: {},
      conteoPorNombre: {},
      status: "success",
      error: null,
      ready: true,
    }),
  },
});
const { Explorar } = await import("./Explorar.jsx");

const es = (clave, vars) => traducir("es", clave, vars);
const abrir = async (direccion, con = {}) => {
  respuesta = con;
  llamadas.length = 0;
  return textoDe(await pintarEn(direccion, "explorar", createElement(Explorar)));
};
const noticias = (n) =>
  piezasFromApi(
    Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      slug: `n-${i + 1}`,
      format: "noticia",
      title: `El dólar sube ${i + 1}`,
      excerpt: "",
      published_at: "2026-09-10T12:00:00Z",
      topics: [],
    })),
  );

describe("el buscador", () => {
  test("lo escrito en la dirección va al servidor (`q`), no se filtra entre las quinientas", async () => {
    await abrir("/explorar?q=d%C3%B3lar", { items: noticias(2) });
    assert.ok(llamadas.length > 0);
    assert.ok(llamadas.every((o) => o?.q === "dólar"));
  });

  test("sin resultados, el campo sigue ahí para corregir lo escrito", async () => {
    respuesta = {}; // el servidor no encontró nada
    const html = await pintarEn("/explorar?q=zzz", "explorar", createElement(Explorar));
    assert.match(html, /id="explorer-search"[^>]*value="zzz"|value="zzz"[^>]*id="explorer-search"/);
    assert.ok(textoDe(html).includes(es("comun.sinResultados")));
  });

  test("mientras llega la respuesta no dice «sin resultados» ni cuántas hay", async () => {
    const texto = await abrir("/explorar?q=oro", { buscando: true });
    assert.ok(!texto.includes(es("comun.sinResultados")));
    assert.ok(!texto.includes(es("listados.explorar.conteo", { n: 0 })));
  });
});

describe("la lista cortada", () => {
  test("sin buscar, avisa de que son las más recientes y de cómo encontrar las anteriores", async () => {
    const texto = await abrir("/explorar", { items: noticias(3), truncated: true });
    assert.ok(texto.includes(es("listados.explorar.soloRecientes")));
  });

  test("buscando, pide afinar la búsqueda", async () => {
    const texto = await abrir("/explorar?q=d%C3%B3lar", { items: noticias(3), truncated: true });
    assert.ok(texto.includes(es("listados.listado.soloRecientesBusqueda")));
    assert.ok(!texto.includes(es("listados.explorar.soloRecientes")));
  });

  test("entera, no dice nada", async () => {
    const texto = await abrir("/explorar", { items: noticias(3) });
    assert.ok(!texto.includes(es("listados.explorar.soloRecientes")));
  });
});
