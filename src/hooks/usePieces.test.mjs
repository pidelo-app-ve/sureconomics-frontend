/**
 * `usePieces` con lo escrito en el buscador (`q`), con sus efectos corriendo de verdad
 * (`scripts/pruebas/montar.mjs`). `npm test`.
 *
 * `getPieces` es un doble que apunta cada petición y contesta con lo que la prueba le
 * deja en `respuestas`: así se ve qué se le pide al servidor, cuándo y cuántas veces.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sustituir } from "../../scripts/pruebas/dobles.mjs";

const pedidas = [];
/** `(peticion) => { filas, total, pages }`; por omisión, una página con una pieza. */
let responder = () => ({ filas: [], total: 0, pages: 1 });

/** Lo demás del servicio, para quien lo importe de paso (la portada, el canal…): no se usa. */
const sinUso = async () => {
  throw new Error("no se usa en esta prueba");
};

sustituir({
  // La portada elige su apertura con esto; aquí no importa y su módulo trae el visor de
  // vídeos, que mira `document` al cargarse.
  "src/components/home/PrimeraPlana.jsx": {
    elegirApertura: () => ({ principal: null, secundarias: [] }),
    precargarApertura: () => {},
  },
  "src/services/publicContentService.js": {
    ...Object.fromEntries(
      ["getFormats", "getFotosDelEquipo", "getRedes", "getCanal", "getTopics", "getPlaces", "getMasLeidas",
        "getPieceFila", "getPiece", "getRelatedFilas"].map((n) => [n, sinUso]),
    ),
    getPieces: async (peticion) => {
      pedidas.push(peticion);
      return responder(peticion);
    },
  },
});

const { montarGancho, act } = await import("../../scripts/pruebas/montar.mjs");
const { usePieces } = await import("./usePieces.js");

const fila = (id, title, format = "noticia") => ({
  id,
  slug: `p-${id}`,
  format,
  title,
  excerpt: "",
  published_at: new Date(Date.parse("2026-11-20T12:00:00Z") - id * 60_000).toISOString(),
  topics: [],
});

const esperar = (ms) => act(() => new Promise((s) => setTimeout(s, ms)));

/** Una lista de `n` páginas: cada petición devuelve su página con una pieza. */
const paginas = (n, prefijo) => ({ page }) => ({ filas: [fila(page, `${prefijo} ${page}`)], total: n, pages: n });

beforeEach(() => {
  pedidas.length = 0;
});

describe("buscar en el servidor", () => {
  test("lo escrito va al servidor como `q`, sin espacios de más y una vez dejada de escribir", async () => {
    // Un formato que ninguna otra prueba pide: la lista sin buscar se guarda un minuto.
    responder = paginas(1, "Base");
    const g = await montarGancho((p) => usePieces(p), { format: "editorial" });
    await esperar(0);
    assert.deepEqual(pedidas.map((p) => p.q), [undefined]);
    assert.equal(g.valor.items.length, 1);

    responder = paginas(1, "Encontrada");
    pedidas.length = 0;
    for (const q of ["d", "dó", "dól", "  dólar   hoy "]) await g.pintar({ q });
    // Mientras se escribe, nada se pide y se sigue viendo lo de antes, avisando de que viene otra.
    assert.equal(pedidas.length, 0);
    assert.equal(g.valor.status, "success");
    assert.equal(g.valor.buscando, true);
    assert.equal(g.valor.items[0].titulo, "Base 1");

    await esperar(350);
    assert.equal(pedidas.length, 1);
    assert.deepEqual(
      { q: pedidas[0].q, format: pedidas[0].format, page: pedidas[0].page, limit: pedidas[0].limit },
      { q: "dólar hoy", format: "editorial", page: 1, limit: 100 },
    );
    assert.equal(g.valor.buscando, false);
    assert.equal(g.valor.items[0].titulo, "Encontrada 1");
    await g.desmontar();
  });

  test("más de quinientas que coinciden: trae cinco páginas y avisa (`truncated`)", async () => {
    responder = paginas(1, "Base");
    const g = await montarGancho((p) => usePieces(p), { format: "informe" });
    await esperar(0);
    responder = paginas(7, "Dólar");
    pedidas.length = 0;
    await g.pintar({ q: "dólar" });
    await esperar(350);
    assert.deepEqual(pedidas.map((p) => p.page).sort(), [1, 2, 3, 4, 5]);
    assert.ok(pedidas.every((p) => p.q === "dólar"));
    assert.equal(g.valor.truncated, true);
    assert.equal(g.valor.items.length, 5);
    await g.desmontar();
  });

  test("borrar lo escrito vuelve a la lista de siempre sin esperar", async () => {
    responder = paginas(1, "Base");
    const g = await montarGancho((p) => usePieces(p), { format: "articulo", q: "cobre" });
    await esperar(350);
    assert.equal(pedidas.at(-1).q, "cobre");
    pedidas.length = 0;
    await g.pintar({ q: "   " });
    await esperar(0);
    assert.deepEqual(pedidas.map((p) => p.q), [undefined]);
    assert.equal(g.valor.buscando, false);
    await g.desmontar();
  });

  test("si la búsqueda falla, se queda lo que se veía y deja de decir que busca", async () => {
    responder = paginas(1, "Base");
    const g = await montarGancho((p) => usePieces(p), { format: "entrevista" });
    await esperar(0);
    responder = () => {
      throw Object.assign(new Error("Bad gateway"), { status: 502 });
    };
    await g.pintar({ q: "oro" });
    await esperar(350);
    assert.equal(g.valor.status, "success");
    assert.equal(g.valor.buscando, false);
    assert.equal(g.valor.items[0].titulo, "Base 1");
    await g.desmontar();
  });

  test("la portada no busca en el servidor", async () => {
    responder = paginas(1, "Portada");
    const g = await montarGancho((p) => usePieces(p), { portada: true, q: "cobre" });
    await esperar(350);
    assert.ok(pedidas.length > 0);
    assert.ok(pedidas.every((p) => p.q === undefined));
    await g.desmontar();
  });
});
