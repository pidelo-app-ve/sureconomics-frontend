/**
 * La paginación común (`Pagination.jsx`), en pantalla (`scripts/pruebas/dom.mjs`): la usan
 * los listados del sitio y las tablas del panel. `npm test`.
 *
 * Qué páginas ofrece se prueba también al pulsar, no solo la lista de números: la página
 * en la que se está, los botones de los extremos apagados, adónde lleva cada clic y que
 * pulsar la página actual no pida nada.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { pintar, pantalla, fireEvent, within } = await import("../../../scripts/pruebas/dom.mjs");
const { Pagination } = await import("./Pagination.jsx");

/** La paginación en `page` de `totalPages`; devuelve las páginas que pidió cada clic. */
const abrir = (props) => {
  const pedidas = [];
  pintar(createElement(Pagination, { onPageChange: (p) => pedidas.push(p), ...props }));
  return pedidas;
};
const boton = (nombre) => pantalla.getByRole("button", { name: nombre });

test("en una página del medio: la actual marcada, los extremos a mano y cada clic a su sitio", () => {
  const pedidas = abrir({ page: 5, totalPages: 10 });
  const nav = pantalla.getByRole("navigation", { name: "Paginación" });
  const numeros = within(nav)
    .getAllByRole("button")
    .map((b) => b.textContent)
    .filter((t) => /^\d+$/.test(t));
  assert.deepEqual(numeros, ["1", "3", "4", "5", "6", "7", "10"]);
  assert.equal(boton("Ir a página 5").getAttribute("aria-current"), "page");
  assert.equal(boton("Ir a página 6").getAttribute("aria-current"), null);

  fireEvent.click(boton("Página siguiente"));
  fireEvent.click(boton("Página anterior"));
  fireEvent.click(boton("Ir a página 10"));
  fireEvent.click(boton("Ir a página 5")); // la actual: nada
  assert.deepEqual(pedidas, [6, 4, 10]);
});

test("en los extremos se apaga lo que no lleva a ningún sitio, y una página que ya no existe es la última", () => {
  const { unmount } = pintar(createElement(Pagination, { page: 1, totalPages: 3, onPageChange: () => {} }));
  assert.equal(boton("Página anterior").disabled, true);
  assert.equal(boton("Página siguiente").disabled, false);
  unmount();

  const pedidas = abrir({ page: 15, totalPages: 4 });
  assert.equal(boton("Ir a página 4").getAttribute("aria-current"), "page");
  assert.equal(boton("Página siguiente").disabled, true);
  fireEvent.click(boton("Página anterior"));
  assert.deepEqual(pedidas, [3]);

  pintar(createElement(Pagination, { page: 1, totalPages: 1, onPageChange: () => {} }));
  assert.equal(pantalla.getAllByRole("navigation").length, 1, "la de una sola página no pinta nada");
});

test("la compacta (la de arriba de las listas del panel) lleva solo «Anterior» y «Siguiente»", () => {
  const pedidas = abrir({ page: 2, totalPages: 5, compacta: true, etiqueta: "Paginación (arriba)" });
  const nav = pantalla.getByRole("navigation", { name: "Paginación (arriba)" });
  assert.deepEqual(
    within(nav).getAllByRole("button").map((b) => b.getAttribute("aria-label")),
    ["Página anterior", "Página siguiente"],
  );
  fireEvent.click(boton("Página siguiente"));
  assert.deepEqual(pedidas, [3]);
});
