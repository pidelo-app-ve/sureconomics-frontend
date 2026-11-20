/**
 * Qué pieza va en cada sitio de la portada (`bloquesDePortada.js`). `npm test`.
 *
 * Lo que se vigila: que ninguna pieza salga dos veces en la portada (arriba y otra vez
 * en su sección), que cada sección enseñe lo que dice `PREVIEW` y crezca lo que dice
 * `PASO`, que «Al punto» intercale entrevistas y podcast, y que con un filtro puesto la
 * portada se vuelva una lista de resultados.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AL_PUNTO, ANALISIS_EN_PLANA, EN_LA_COLUMNA, PREVIEW } from "./apertura.js";
import { PASO, anunciosDeTanda, bloquesDePortada, primeraPlanaDe } from "./bloquesDePortada.js";

/** Piezas ya convertidas (`piezaFromApi`), solo con lo que se mira aquí. La 1 es la más reciente. */
let reloj = Date.parse("2026-11-18T12:00:00Z");
const pieza = (id, formatoApi, extra = {}) => {
  reloj -= 60_000;
  return { id: String(id), formatoApi, fechaIso: new Date(reloj).toISOString(), imagenUrl: null, ...extra };
};
const varias = (n, formatoApi, desde) => Array.from({ length: n }, (_, i) => pieza(desde + i, formatoApi));

/** La portada entera tal como la arma `Home` sin filtro y sin «Cargar más». */
const portada = (pieces, { isFiltered = false, results = pieces, cargadas = {} } = {}) => {
  const plana = primeraPlanaDe(pieces, isFiltered);
  const blocks = bloquesDePortada({ results, ...plana, isFiltered, cargadas });
  return { plana, blocks };
};
const ids = (lista) => lista.map((p) => p.id);
const bloque = (blocks, formatoApi) => blocks.find((b) => b.formatoApi === formatoApi);

const UN_POCO_DE_TODO = () => [
  ...varias(20, "noticia", 100),
  ...varias(8, "articulo", 200),
  ...varias(6, "editorial", 300),
  ...varias(5, "entrevista", 400),
  ...varias(4, "informe", 500),
  ...varias(5, "podcast", 600),
];

describe("la primera plana", () => {
  test("sin piezas no hay nada que poner arriba", () => {
    const { plana, blocks } = portada([]);
    assert.equal(plana.apertura.principal, null);
    assert.deepEqual(plana.analisis, []);
    assert.equal(plana.editorialDelDia, null);
    assert.deepEqual(blocks, []);
  });

  test("manda la noticia más reciente; su columna, las siguientes", () => {
    const { plana } = portada(UN_POCO_DE_TODO());
    assert.equal(plana.apertura.principal.id, "100");
    assert.deepEqual(ids(plana.apertura.secundarias), ["101", "102", "103"].slice(0, EN_LA_COLUMNA));
  });

  test("los análisis son los artículos más recientes; la editorial del día, la más reciente", () => {
    const { plana } = portada(UN_POCO_DE_TODO());
    assert.deepEqual(ids(plana.analisis), ["200", "201"].slice(0, ANALISIS_EN_PLANA));
    assert.equal(plana.editorialDelDia.id, "300");
  });

  test("una editorial fijada como apertura no se repite como editorial del día", () => {
    const fijada = pieza(999, "editorial", { enPortada: true, destacadaHasta: new Date(Date.now() + 3_600_000) });
    const { plana } = portada([fijada, ...varias(3, "editorial", 300), ...varias(5, "noticia", 100)]);
    assert.equal(plana.apertura.principal.id, "999");
    assert.equal(plana.apertura.fijada, true);
    assert.equal(plana.editorialDelDia.id, "300");
  });

  test("con un filtro puesto la primera plana se retira", () => {
    const { plana } = portada(UN_POCO_DE_TODO(), { isFiltered: true });
    assert.equal(plana.apertura.principal, null);
    assert.deepEqual(plana.analisis, []);
  });
});

describe("las secciones de abajo", () => {
  test("ninguna pieza sale dos veces en la portada", () => {
    const { plana, blocks } = portada(UN_POCO_DE_TODO());
    const arriba = [plana.apertura.principal, ...plana.apertura.secundarias, ...plana.analisis, plana.editorialDelDia];
    const todas = [...ids(arriba), ...blocks.flatMap((b) => ids(b.items))];
    assert.equal(new Set(todas).size, todas.length, `repetidas: ${todas.filter((x, i) => todas.indexOf(x) !== i)}`);
  });

  test("en el orden de siempre, con «Al punto» en el sitio de las entrevistas", () => {
    const { blocks } = portada(UN_POCO_DE_TODO());
    assert.deepEqual(blocks.map((b) => b.formatoApi), ["noticia", "articulo", "editorial", "alpunto", "informe"]);
  });

  test("cada sección enseña su entrada (`PREVIEW`) en una sola tanda", () => {
    const { blocks } = portada(UN_POCO_DE_TODO());
    // 20 noticias menos las 4 de arriba: 16, de las que se ven 11.
    assert.equal(bloque(blocks, "noticia").items.length, PREVIEW.noticia);
    assert.equal(bloque(blocks, "noticia").todos.length, 20 - 1 - EN_LA_COLUMNA);
    // 8 artículos menos los 2 análisis: 6, de los que se ven 5.
    assert.equal(bloque(blocks, "articulo").items.length, PREVIEW.articulo);
    assert.equal(bloque(blocks, "informe").items.length, Math.min(4, PREVIEW.informe));
    for (const b of blocks) {
      assert.equal(b.tandas.length, 1, b.formatoApi);
      assert.equal(b.expandido, false);
    }
  });

  test("«Ver los N» cuenta también lo que ya está arriba", () => {
    const { blocks } = portada(UN_POCO_DE_TODO());
    assert.equal(bloque(blocks, "editorial").total, 6);
    assert.ok(!ids(bloque(blocks, "editorial").todos).includes("300"));
    assert.equal(bloque(blocks, "noticia").total, 20);
  });

  test("«Al punto» intercala entrevistas y podcast, y suma los dos totales", () => {
    const { blocks } = portada(UN_POCO_DE_TODO());
    const alPunto = bloque(blocks, "alpunto");
    assert.deepEqual(ids(alPunto.todos.slice(0, 4)), ["400", "600", "401", "601"]);
    assert.equal(alPunto.items.length, AL_PUNTO.cuantas);
    assert.equal(alPunto.total, 10);
    assert.equal(bloque(blocks, "entrevista"), undefined);
    assert.equal(bloque(blocks, "podcast"), undefined);
  });

  test("solo podcast (sin entrevistas) también es «Al punto»", () => {
    const { blocks } = portada([...varias(5, "noticia", 100), ...varias(3, "podcast", 600)]);
    assert.deepEqual(ids(bloque(blocks, "alpunto").todos), ["600", "601", "602"]);
  });

  test("las secciones sin piezas no salen", () => {
    const { blocks } = portada(varias(10, "noticia", 100));
    assert.deepEqual(blocks.map((b) => b.formatoApi), ["noticia"]);
  });

  test("una entrevista fijada como apertura no abre también su sección", () => {
    const fijada = pieza(999, "entrevista", { enPortada: true, destacadaHasta: new Date(Date.now() + 3_600_000) });
    const { blocks } = portada([fijada, ...varias(5, "noticia", 100), ...varias(2, "entrevista", 400)]);
    assert.ok(!ids(bloque(blocks, "alpunto").todos).includes("999"));
  });
});

describe("«Cargar más»", () => {
  test("cada pulsación trae `PASO` más, en su propia tanda", () => {
    const pieces = [...varias(60, "noticia", 100)];
    const una = portada(pieces, { cargadas: { noticia: PASO.noticia } }).blocks[0];
    assert.equal(una.items.length, PREVIEW.noticia + PASO.noticia);
    assert.deepEqual(una.tandas.map((t) => t.length), [PREVIEW.noticia, PASO.noticia]);
    assert.equal(una.expandido, true);
    const dos = portada(pieces, { cargadas: { noticia: 2 * PASO.noticia } }).blocks[0];
    assert.deepEqual(dos.tandas.map((t) => t.length), [PREVIEW.noticia, PASO.noticia, PASO.noticia]);
  });

  test("al acabarse, la última tanda trae lo que queda y no se inventa nada", () => {
    const pieces = varias(20, "noticia", 100); // 16 abajo
    const b = portada(pieces, { cargadas: { noticia: 3 * PASO.noticia } }).blocks[0];
    assert.equal(b.items.length, 16);
    assert.deepEqual(b.tandas.map((t) => t.length), [PREVIEW.noticia, 16 - PREVIEW.noticia]);
  });

  test("cargar más en una sección no cambia las otras", () => {
    const { blocks } = portada(UN_POCO_DE_TODO(), { cargadas: { articulo: PASO.articulo } });
    assert.equal(bloque(blocks, "noticia").expandido, false);
    assert.equal(bloque(blocks, "articulo").expandido, true);
  });
});

describe("con un filtro puesto", () => {
  test("todo lo que coincide, en una sola tanda y sin recortar", () => {
    const pieces = UN_POCO_DE_TODO();
    const results = pieces.filter((p) => p.formatoApi === "noticia");
    const { blocks } = portada(pieces, { isFiltered: true, results });
    assert.deepEqual(blocks.map((b) => b.formatoApi), ["noticia"]);
    assert.equal(blocks[0].items.length, 20);
    assert.equal(blocks[0].tandas.length, 1);
  });

  test("entrevistas y podcast van cada una en su grupo (son resultados, no «Al punto»)", () => {
    const pieces = UN_POCO_DE_TODO();
    const { blocks } = portada(pieces, { isFiltered: true });
    assert.ok(bloque(blocks, "entrevista"));
    assert.ok(bloque(blocks, "podcast"));
    assert.equal(bloque(blocks, "alpunto"), undefined);
  });

  test("sin resultados no hay bloques", () => {
    const { blocks } = portada(UN_POCO_DE_TODO(), { isFiltered: true, results: [] });
    assert.deepEqual(blocks, []);
  });
});

describe("los anuncios entre tandas", () => {
  test("se numeran por hueco, en el orden de la página, sin repetir entre secciones", () => {
    const blocks = [
      { formatoApi: "noticia", tandas: [[1], [2], [3]] },
      { formatoApi: "articulo", tandas: [[1], [2]] },
      { formatoApi: "editorial", tandas: [[1], [2]] },
    ];
    const espacioDe = (f) => (f === "articulo" ? "ARTICULOS" : "PORTADA");
    assert.deepEqual(anunciosDeTanda(blocks, espacioDe), {
      noticia: { espacio: "PORTADA", desdes: [1, 2] },
      articulo: { espacio: "ARTICULOS", desdes: [1] },
      editorial: { espacio: "PORTADA", desdes: [3] },
    });
  });

  test("sin «Cargar más» no hay anuncios de tanda", () => {
    assert.deepEqual(anunciosDeTanda([{ formatoApi: "noticia", tandas: [[1]] }], () => "X"), {
      noticia: { espacio: "X", desdes: [] },
    });
  });
});
