/**
 * El buscador (`ContentExplorer`) en pantalla (`scripts/pruebas/dom.mjs`): el botón se
 * enciende al momento aunque la página aún no haya aplicado el filtro, la página lo recibe
 * entero (también con dos toques seguidos), y las cifras de cada opción son siempre las de
 * la selección de la página. `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement, useState } from "react";
import { traducir } from "../../i18n/motor.js";

const { pintar, pantalla, fireEvent, act, within } = await import("../../../scripts/pruebas/dom.mjs");
const { ContentExplorer } = await import("./ContentExplorer.jsx");

const pieza = (id, temas, geos = []) => ({ id: String(id), titulo: `Pieza ${id}`, temas, geos });
const PIEZAS = [
  pieza(1, ["Petróleo"], ["Venezuela"]),
  pieza(2, ["Petróleo"], ["Colombia"]),
  pieza(3, ["Inflación"], ["Venezuela"]),
  pieza(4, ["Inflación", "Petróleo"], ["Venezuela"]),
];
const ARBOL = { geoTop: "Mundo", continentes: ["América"], regiones: { América: ["Venezuela", "Colombia"] }, ancestros: {} };

/**
 * La página de mentira: guarda la selección, y con `aplicar: false` no la aplica (como una
 * página que aún está preparando la lista). `vistas` apunta cada `onChange`.
 */
const vistas = [];
let aplicarAhora = true;
let fijar = null;
const Pagina = () => {
  const [seleccion, setSeleccion] = useState({ temas: new Set(), geos: new Set() });
  fijar = setSeleccion;
  return createElement(ContentExplorer, {
    pieces: PIEZAS,
    temasDisponibles: ["Petróleo", "Inflación", "Turismo"],
    ...ARBOL,
    temas: seleccion.temas,
    geos: seleccion.geos,
    query: "",
    onChange: (siguiente) => {
      vistas.push({ temas: [...siguiente.temas], geos: [...siguiente.geos] });
      if (aplicarAhora) setSeleccion(siguiente);
    },
    onQueryChange: () => {},
    total: 0,
  });
};

const abrirTemas = () => fireEvent.click(pantalla.getByRole("button", { name: /Tema/ }));
const opcion = (nombre) => within(pantalla.getByRole("group", { name: /temas/i })).getByRole("button", { name: new RegExp(nombre) });
/** La ficha de lo elegido, que lo quita al pulsarla. */
const ficha = (valor) => pantalla.queryByRole("button", { name: traducir("es", "portada.explorador.quitar", { valor }) });
const cifra = (boton) => boton.querySelector(".se-explorer__n").textContent;

const empezar = ({ aplicar = true } = {}) => {
  vistas.length = 0;
  aplicarAhora = aplicar;
  pintar(createElement(Pagina));
  abrirTemas();
};

test("al pulsar, la opción se enciende y la página recibe la selección", async () => {
  empezar();
  await act(async () => fireEvent.click(opcion("Petróleo")));
  assert.ok(!document.querySelector(".se-explorer").classList.contains("se-explorer--pendiente"), "ya aplicada: nada atenuado");
  assert.equal(opcion("Petróleo").getAttribute("aria-pressed"), "true");
  assert.deepEqual(vistas, [{ temas: ["Petróleo"], geos: [] }]);
  assert.ok(ficha("Petróleo"), "y su ficha para quitarlo");
});

test("el botón se enciende aunque la página aún no lo haya aplicado", async () => {
  empezar({ aplicar: false });
  await act(async () => fireEvent.click(opcion("Inflación")));
  assert.equal(opcion("Inflación").getAttribute("aria-pressed"), "true");
  assert.ok(opcion("Inflación").classList.contains("se-explorer__opt--on"));
  // Y mientras la página no lo aplica, el buscador lo dice (las cifras y la lista se atenúan).
  const raiz = document.querySelector(".se-explorer");
  assert.ok(raiz.classList.contains("se-explorer--pendiente"));
  await act(async () => fijar({ temas: new Set(["Inflación"]), geos: new Set() }));
  assert.ok(!raiz.classList.contains("se-explorer--pendiente"), "aplicado: vuelve a como estaba");
  // El rótulo del desplegable también.
  assert.ok(pantalla.getByRole("button", { name: /Inflación/, expanded: true }));
});

test("dos toques antes de que la página aplique nada: la página recibe los dos", async () => {
  empezar({ aplicar: false });
  await act(async () => fireEvent.click(opcion("Petróleo")));
  await act(async () => fireEvent.click(opcion("Inflación")));
  assert.deepEqual(vistas.at(-1), { temas: ["Petróleo", "Inflación"], geos: [] });
  assert.equal(opcion("Petróleo").getAttribute("aria-pressed"), "true");
  assert.equal(opcion("Inflación").getAttribute("aria-pressed"), "true");
  // Y quitar uno parte de lo que se ve, no de lo que la página tenía.
  await act(async () => fireEvent.click(opcion("Petróleo")));
  assert.deepEqual(vistas.at(-1), { temas: ["Inflación"], geos: [] });
});

test("pulsar y quitar antes de que la página aplique nada (misma selección): no se queda atenuado", async () => {
  // Como /explorar: la dirección final es la misma y la página devuelve el mismo objeto.
  empezar({ aplicar: false });
  await act(async () => fireEvent.click(opcion("Petróleo")));
  const raiz = document.querySelector(".se-explorer");
  assert.ok(raiz.classList.contains("se-explorer--pendiente"));
  await act(async () => fireEvent.click(opcion("Petróleo")));
  assert.deepEqual(vistas.at(-1), { temas: [], geos: [] });
  assert.ok(!raiz.classList.contains("se-explorer--pendiente"), "ya coincide con la página");
  assert.equal(opcion("Petróleo").getAttribute("aria-pressed"), "false");
});

test("si la página cambia la selección por su cuenta (limpiar, atrás), manda la página", async () => {
  empezar({ aplicar: false });
  await act(async () => fireEvent.click(opcion("Petróleo")));
  assert.equal(opcion("Petróleo").getAttribute("aria-pressed"), "true");
  await act(async () => fijar({ temas: new Set(["Inflación"]), geos: new Set() }));
  assert.equal(opcion("Petróleo").getAttribute("aria-pressed"), "false");
  assert.equal(opcion("Inflación").getAttribute("aria-pressed"), "true");
});

test("las cifras son las de la selección de la página, no las del toque a medias", async () => {
  empezar({ aplicar: false });
  // Sin lugar elegido: Petróleo 3, Inflación 2; Turismo no tiene piezas y no sale.
  assert.equal(cifra(opcion("Petróleo")), "3");
  assert.equal(cifra(opcion("Inflación")), "2");
  assert.equal(pantalla.queryByRole("button", { name: /Turismo/ }), null);
  // La página aplica Colombia: las cifras de los temas pasan a contar solo allí.
  await act(async () => fijar({ temas: new Set(), geos: new Set(["Colombia"]) }));
  assert.equal(cifra(opcion("Petróleo")), "1");
  assert.equal(pantalla.queryByRole("button", { name: /Inflación/ }), null);
});

test("Limpiar apaga todo y se lo dice a la página", async () => {
  empezar();
  await act(async () => fireEvent.click(opcion("Petróleo")));
  await act(async () => fireEvent.click(pantalla.getByRole("button", { name: "Limpiar" })));
  assert.deepEqual(vistas.at(-1), { temas: [], geos: [] });
  assert.equal(ficha("Petróleo"), null);
});
