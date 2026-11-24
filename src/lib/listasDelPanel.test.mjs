/**
 * Lo común de las listas del panel (`listasDelPanel.js`). Corre con `npm test` (o
 * `node --test src/lib/listasDelPanel.test.mjs`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { hoyEnCaracas, limpiarBusqueda, lineaDePaginas, paginaQueExiste, trozoDeLista } from "./listasDelPanel.js";

test("lo escrito en el buscador, sin espacios de más", () => {
  assert.equal(limpiarBusqueda("  tasa   Selic \t"), "tasa Selic");
  assert.equal(limpiarBusqueda("   "), "");
  assert.equal(limpiarBusqueda(null), "");
  assert.equal(limpiarBusqueda("5%  y _"), "5% y _"); // los comodines los escapa el servidor
});

test("la línea de las páginas nunca dice «de 0»", () => {
  assert.equal(lineaDePaginas({ pagina: 2, paginas: 5, total: 87 }), "Página 2 de 5 — 87 en total");
  assert.equal(lineaDePaginas({ pagina: 1, paginas: 0, total: 0 }), "Página 1 de 1 — 0 en total");
  assert.equal(lineaDePaginas({}), "Página 1 de 1 — 0 en total");
});

test("un trozo de la lista ajusta la página que ya no existe", () => {
  const lista = Array.from({ length: 45 }, (_, i) => i + 1);
  assert.deepEqual(trozoDeLista(lista, 3, 20), { pagina: 3, paginas: 3, filas: [41, 42, 43, 44, 45] });
  assert.equal(trozoDeLista(lista, 999, 20).pagina, 3);
  assert.equal(trozoDeLista(lista, "x", 20).pagina, 1);
  assert.deepEqual(trozoDeLista([], 4, 20), { pagina: 1, paginas: 1, filas: [] });
});

test("hoy en Caracas cambia a la medianoche de allí, no a la de UTC", () => {
  assert.equal(hoyEnCaracas(new Date("2026-11-24T03:59:00Z")), "2026-11-23");
  assert.equal(hoyEnCaracas(new Date("2026-11-24T04:00:00Z")), "2026-11-24");
});

test("la página que existe, si la pedida se quedó fuera", () => {
  assert.equal(paginaQueExiste(999, 3), 3);
  assert.equal(paginaQueExiste(2, 3), null);
  assert.equal(paginaQueExiste(5, 0), null); // sin nada, la 1 que ya se pidió
});
