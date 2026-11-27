/**
 * El logo de la cabecera (`Navbar`) en pantalla (`scripts/pruebas/dom.mjs`): estando ya en
 * la portada sube arriba sin navegar; con una consulta (`?buscar=1`) o desde otra página,
 * navega como siempre. `npm test`.
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { pintar, pantalla, fireEvent, act } = await import("../../scripts/pruebas/dom.mjs");
const { Navbar } = await import("./Navbar.jsx");

let subidas;
let scrollToDeVerdad;
let matchMediaDeVerdad;
beforeEach(() => {
  subidas = [];
  scrollToDeVerdad = window.scrollTo;
  matchMediaDeVerdad = window.matchMedia;
  window.scrollTo = (opciones) => subidas.push(opciones);
});
afterEach(() => {
  window.scrollTo = scrollToDeVerdad;
  window.matchMedia = matchMediaDeVerdad;
});

const logo = () => pantalla.getAllByRole("link").find((a) => a.classList.contains("se-header__brand"));

/** Pulsa el logo y dice si el clic se quedó sin su efecto de navegar (`preventDefault`). */
const pulsar = async (opciones = {}) => {
  let evitado = null;
  const mirar = (e) => {
    evitado = e.defaultPrevented;
  };
  window.addEventListener("click", mirar);
  await act(async () => {
    fireEvent.click(logo(), { button: 0, ...opciones });
  });
  window.removeEventListener("click", mirar);
  return evitado;
};

test("en la portada, el logo sube arriba con suavidad y no navega", async () => {
  const { router } = pintar(createElement(Navbar), { ruta: "/" });
  const antes = router.state.location.key;
  assert.equal(await pulsar(), true);
  assert.deepEqual(subidas, [{ top: 0, behavior: "smooth" }]);
  assert.equal(router.state.location.key, antes, "la misma entrada: no hubo navegación");
});

test("con menos movimiento pedido, sube sin animación", async () => {
  window.matchMedia = (consulta) => ({ matches: consulta.includes("reduce"), addEventListener() {}, removeEventListener() {} });
  pintar(createElement(Navbar), { ruta: "/" });
  await pulsar();
  assert.deepEqual(subidas, [{ top: 0, behavior: "auto" }]);
});

test("en la portada en inglés (/en), igual", async () => {
  const { router } = pintar(createElement(Navbar), { ruta: "/en" });
  const antes = router.state.location.key;
  assert.equal(await pulsar(), true);
  assert.equal(subidas.length, 1);
  assert.equal(router.state.location.key, antes);
});

test("con el buscador abierto (?buscar=1), el logo sigue navegando a la portada limpia", async () => {
  const { router } = pintar(createElement(Navbar), { ruta: "/?buscar=1" });
  assert.equal(await pulsar(), true, "lo evita el router, que navega él");
  assert.equal(router.state.location.pathname, "/");
  assert.equal(router.state.location.search, "");
  assert.deepEqual(subidas, []);
});

test("desde otra página, navega a la portada como siempre", async () => {
  const { router } = pintar(createElement(Navbar), { ruta: "/noticias/una-pieza" });
  await pulsar();
  assert.equal(router.state.location.pathname, "/");
  assert.deepEqual(subidas, []);
});

test("con Ctrl o Cmd (abrir en otra pestaña), no se toca", async () => {
  const { router } = pintar(createElement(Navbar), { ruta: "/" });
  const antes = router.state.location.key;
  assert.equal(await pulsar({ ctrlKey: true }), false);
  assert.equal(await pulsar({ metaKey: true }), false);
  assert.deepEqual(subidas, []);
  assert.equal(router.state.location.key, antes);
});
