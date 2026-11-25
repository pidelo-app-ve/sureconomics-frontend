/**
 * `useHeadlines` con los titulares de Última hora dentro del HTML de la portada
 * (`api/portada.js` los deja en `#se-ultima-hora`). `npm test`.
 *
 * Lo que se vigila: que la columna salga con ellos desde el primer pintado, sin pedir la
 * lista, pero preguntando enseguida la versión (si la redacción ocultó algo desde que se
 * armó la página, se entera como siempre); y que sin bloque (o de otro idioma) se pida.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sustituir } from "../../../scripts/pruebas/dobles.mjs";

const pedidas = [];
const version = 12;

sustituir({
  "src/features/titulares/api.js": {
    getTitulares: async (peticion) => {
      pedidas.push(["lista", peticion.lang]);
      return { items: [{ id: 99, title: "Pedido", published_at: "2026-11-25T12:00:00Z" }], version };
    },
    getVersionTitulares: async () => {
      pedidas.push(["version"]);
      return { version };
    },
  },
});

/** El documento, con el bloque que deja la función (o sin él). */
const nodos = new Map();
const conBloque = (lang, items) => {
  nodos.clear();
  const bloque = {
    lectura: `/headlines?lang=${lang}&limit=40`,
    generada: new Date().toISOString(),
    respuesta: { data: { items, version: 12 }, success: true },
  };
  nodos.set("se-ultima-hora", { textContent: JSON.stringify(bloque), remove: () => nodos.delete("se-ultima-hora") });
};
globalThis.document = {
  visibilityState: "visible",
  getElementById: (id) => nodos.get(id) ?? null,
  addEventListener() {},
  removeEventListener() {},
};

const { montarGancho, act } = await import("../../../scripts/pruebas/montar.mjs");
const { precargarTitulares, useHeadlines } = await import("./useHeadlines.js");

const esperar = (ms) => act(() => new Promise((s) => setTimeout(s, ms)));

describe("Última hora con sus titulares dentro del HTML", () => {
  test("salen en el primer pintado, sin pedir la lista, y se mira la versión enseguida", async () => {
    conBloque("es", [
      { id: 1, title: "Más viejo", published_at: "2026-11-25T10:00:00Z" },
      { id: 2, title: "Más nuevo", published_at: "2026-11-25T11:00:00Z" },
    ]);
    const estados = [];
    const g = await montarGancho(() => {
      const e = useHeadlines();
      estados.push(e);
      return e;
    });
    await esperar(0);
    assert.equal(estados[0].status, "success");
    // En el orden de siempre: lo más reciente arriba.
    assert.deepEqual(estados[0].items.map((i) => i.title), ["Más nuevo", "Más viejo"]);
    assert.deepEqual(pedidas, [["version"]]);
    assert.equal(nodos.size, 0, "el bloque se usa una vez y se quita");
    await g.desmontar();
  });

  test("sin bloque de su idioma, pide la lista como siempre", async () => {
    // Hay bloque, pero del español: el inglés empieza de cero y la pide.
    conBloque("es", [{ id: 3, title: "En español", published_at: "2026-11-25T09:00:00Z" }]);
    pedidas.length = 0;
    precargarTitulares("en");
    await esperar(0);
    assert.deepEqual(pedidas, [["lista", "en"]]);
    assert.equal(nodos.size, 1, "el bloque del español se queda donde estaba");
  });
});
