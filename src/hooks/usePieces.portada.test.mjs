/**
 * La portada con su primera página dentro del HTML (`api/portada.js` la deja en
 * `#se-portada`; ver `leerDelHtml` en `src/api/quiosco.js`). `npm test`.
 *
 * Aparte de `usePieces.test.mjs` porque la portada se guarda un minuto en el módulo
 * (`guardado`) y aquí cada prueba tiene que empezar sin ella: el reloj avanza dos minutos
 * entre una y otra.
 *
 * `getPortadaDelHtml` es un doble: lo que hay en el documento lo prueba `quiosco.test.mjs`
 * (que falte, que esté roto, que sea de otra lectura: en todos los casos, nulo).
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sustituir } from "../../scripts/pruebas/dobles.mjs";

const pedidas = [];
/** Lo que «trae el HTML»: la primera página con la forma de `getPieces`, o nulo. */
let enElHtml = null;
let soltadas = 0;

const sinUso = async () => {
  throw new Error("no se usa en esta prueba");
};

sustituir({
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
      return { filas: [fila(9, "Pedida")], total: 1, pages: 1 };
    },
    getPortadaDelHtml: () => enElHtml,
    // Como el documento: una vez soltada, ya no está.
    soltarPortadaDelHtml: () => {
      soltadas += 1;
      enElHtml = null;
    },
  },
});

const { montarGancho, act } = await import("../../scripts/pruebas/montar.mjs");
const { usePieces } = await import("./usePieces.js");

const fila = (id, title) => ({
  id,
  slug: `p-${id}`,
  format: "noticia",
  title,
  excerpt: "",
  published_at: "2026-11-20T12:00:00Z",
  topics: [],
});

const esperar = (ms) => act(() => new Promise((s) => setTimeout(s, ms)));

const ahoraDeVerdad = Date.now;
let adelanto = 0;
Date.now = () => ahoraDeVerdad() + adelanto;

/** El gancho montado, con el estado de cada pintado (el primero es el que importa). */
const montarPortada = async () => {
  const estados = [];
  const g = await montarGancho((p) => {
    const valor = usePieces(p);
    estados.push(valor.status);
    return valor;
  }, { portada: true });
  return { g, estados };
};

beforeEach(() => {
  pedidas.length = 0;
  soltadas = 0;
  enElHtml = null;
  // Lo guardado de la prueba anterior ya está viejo (se guarda un minuto).
  adelanto += 120_000;
});

describe("la portada con su primera página en el HTML", () => {
  test("pinta en el primer pintado, sin «Cargando…», y no la pide", async () => {
    enElHtml = { filas: [fila(1, "Del HTML")], total: 1, pages: 1, meta: { total: 1, pages: 1 } };
    const { g, estados } = await montarPortada();
    await esperar(0);
    assert.equal(estados[0], "success");
    assert.ok(!estados.includes("loading"));
    assert.equal(g.valor.items[0].titulo, "Del HTML");
    assert.deepEqual(pedidas, []);
    assert.equal(soltadas, 1);
    await g.desmontar();
  });

  test("vieja (la del borde si la función falló, o un reloj adelantado): se pinta y se cambia por la de ahora", async () => {
    enElHtml = { filas: [fila(1, "Del HTML, de ayer")], total: 1, pages: 1, meta: { total: 1, pages: 1 }, vieja: true };
    const { g, estados } = await montarPortada();
    await esperar(0);
    // Sin «Cargando…» en medio: lo que ya se veía se queda hasta que llega la de ahora.
    assert.equal(estados[0], "success");
    assert.ok(!estados.includes("loading"));
    assert.deepEqual(pedidas.map((p) => ({ page: p.page, limit: p.limit })), [{ page: 1, limit: 100 }]);
    assert.equal(g.valor.items[0].titulo, "Pedida");
    assert.equal(soltadas, 1);
    await g.desmontar();
  });

  test("con más páginas, sigue con el resto como siempre, pero no repite la primera", async () => {
    enElHtml = { filas: [fila(1, "Del HTML")], total: 600, pages: 6, meta: { total: 600, pages: 6 } };
    const { g } = await montarPortada();
    await esperar(0);
    assert.ok(pedidas.length > 0);
    assert.ok(!pedidas.some((p) => p.page === 1 && p.limit === 100 && !p.format && !p.topic));
    assert.equal(g.valor.items[0].titulo, "Del HTML");
    await g.desmontar();
  });

  test("sin bloque (o roto, o de otra lectura): pide la primera página como siempre", async () => {
    const { g, estados } = await montarPortada();
    await esperar(0);
    assert.equal(estados[0], "loading");
    assert.deepEqual(pedidas.map((p) => ({ page: p.page, limit: p.limit })), [{ page: 1, limit: 100 }]);
    assert.equal(g.valor.items[0].titulo, "Pedida");
    assert.equal(soltadas, 0);
    await g.desmontar();
  });

  test("vale una vez: al volver a la portada sin recargar, se pide", async () => {
    enElHtml = { filas: [fila(1, "Del HTML")], total: 1, pages: 1, meta: { total: 1, pages: 1 } };
    const primera = await montarPortada();
    await esperar(0);
    await primera.g.desmontar();
    assert.deepEqual(pedidas, []);
    adelanto += 120_000;
    const otra = await montarPortada();
    await esperar(0);
    assert.deepEqual(pedidas.map((p) => p.page), [1]);
    assert.equal(otra.g.valor.items[0].titulo, "Pedida");
    await otra.g.desmontar();
  });

  test("otra lista (Artículos) no lo mira", async () => {
    enElHtml = { filas: [fila(1, "Del HTML")], total: 1, pages: 1, meta: { total: 1, pages: 1 } };
    const g = await montarGancho((p) => usePieces(p), { format: "articulo" });
    await esperar(0);
    assert.deepEqual(pedidas.map((p) => p.format), ["articulo"]);
    assert.equal(g.valor.items[0].titulo, "Pedida");
    assert.equal(soltadas, 0);
    await g.desmontar();
  });
});
