/**
 * «Ir al boletín» del pie (`Footer`) en la portada (`scripts/pruebas/dom.mjs`): lleva al
 * bloque `#boletin` sin escribir el ancla en la dirección (que el router tomaba por una
 * navegación) y le da el foco. `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement, Fragment } from "react";
import { traducir } from "../i18n/motor.js";

const { pintar, pantalla, fireEvent, act } = await import("../../scripts/pruebas/dom.mjs");
const { Footer } = await import("./Footer.jsx");

/** La portada mínima: el bloque del boletín (como `NewsletterBlock`) y el pie. */
const Portada = () =>
  createElement(
    Fragment,
    null,
    createElement("section", { id: "boletin", tabIndex: -1 }, "Entorno en Viñetas"),
    createElement(Footer)
  );

const enlace = () => pantalla.getByRole("link", { name: traducir("es", "pie.irAlBoletin") });

test("en la portada, lleva al bloque del boletín, le da el foco y no toca la dirección", async () => {
  const { router } = pintar(createElement(Portada), { ruta: "/" });
  const bloque = document.getElementById("boletin");
  const llamadas = [];
  bloque.scrollIntoView = (opciones) => llamadas.push(opciones);
  const antes = router.state.location.key;
  let evitado = null;
  window.addEventListener("click", (e) => (evitado = e.defaultPrevented), { once: true });
  await act(async () => fireEvent.click(enlace()));
  assert.equal(evitado, true, "sin ancla en la dirección");
  assert.deepEqual(llamadas, [{ block: "start" }]);
  assert.ok(document.activeElement === bloque, "el foco en el bloque del boletín");
  assert.equal(router.state.location.hash, "");
  assert.equal(router.state.location.key, antes, "ni una entrada más en el historial");
});

test("abrirlo en otra pestaña (Ctrl) se deja al navegador", async () => {
  pintar(createElement(Portada), { ruta: "/" });
  let evitado = null;
  window.addEventListener("click", (e) => (evitado = e.defaultPrevented), { once: true });
  await act(async () => fireEvent.click(enlace(), { ctrlKey: true }));
  assert.equal(evitado, false);
});

test("si el bloque aún no está, el enlace hace lo de siempre", async () => {
  pintar(createElement(Footer), { ruta: "/" });
  let evitado = null;
  window.addEventListener("click", (e) => (evitado = e.defaultPrevented), { once: true });
  await act(async () => fireEvent.click(enlace()));
  assert.equal(evitado, false);
});
