/**
 * El aviso de los cambios de página (`AvisoDeRuta`) en pantalla (`scripts/pruebas/dom.mjs`):
 * el foco y el anuncio llegan, pero después del pintado de la página nueva y no dentro del
 * cambio de ruta (eso retrasaba lo que el lector ve). `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement, Fragment, useEffect } from "react";
import { useLocation } from "react-router-dom";

const { pintar, act, fireEvent, waitFor } = await import("../../scripts/pruebas/dom.mjs");
const { AvisoDeRuta } = await import("./AvisoDeRuta.jsx");

/** El marco de `Layout`: el contenido enfocable con su `h1` (la ruta), y el aviso. */
const Marco = ({ conCampo = false }) => {
  const titulo = useLocation().pathname;
  useEffect(() => {
    document.title = `${titulo} — SurEconomics`;
  });
  return createElement(
    Fragment,
    null,
    createElement(
      "div",
      { id: "contenido", tabIndex: -1 },
      createElement("h1", null, titulo),
      conCampo ? createElement("input", { "aria-label": "Buscar", autoFocus: true }) : null
    ),
    createElement(AvisoDeRuta, { destinoId: "contenido" })
  );
};

const region = () => document.querySelector(".se-aviso-de-ruta");

test("tras un toque y un cambio de ruta: foco al contenido y anuncio, pero después del pintado", async () => {
  const { router } = pintar(createElement(Marco));
  const contenido = document.getElementById("contenido");
  fireEvent.pointerDown(document.body);
  await act(async () => {
    await router.navigate("/noticias/otra");
  });
  // El cambio de ruta ya está hecho y sus efectos han corrido: el foco aún no se movió.
  assert.equal(router.state.location.pathname, "/noticias/otra");
  assert.ok(document.activeElement !== contenido, "el foco no se mueve dentro del cambio de ruta");
  // Después del pintado, sí; y medio segundo más tarde, el anuncio.
  await waitFor(() => assert.ok(document.activeElement === contenido, "el foco en el contenido"));
  await waitFor(() => assert.equal(region().textContent, "/noticias/otra — SurEconomics"));
});

test("sin un gesto antes (la primera carga, una redirección), ni foco ni anuncio", async () => {
  const { router } = pintar(createElement(Marco));
  await act(async () => {
    await router.navigate("/otra");
  });
  await new Promise((r) => setTimeout(r, 700));
  assert.ok(document.activeElement === document.body, "el foco sigue en el body");
  assert.equal(region().textContent, "");
});

test("si la página nueva ya enfocó algo suyo (un campo con autoFocus), se respeta", async () => {
  const { router } = pintar(createElement(Marco, { conCampo: true }));
  fireEvent.pointerDown(document.body);
  await act(async () => {
    await router.navigate("/buscar");
  });
  const campo = document.querySelector("input");
  campo.focus();
  await waitFor(() => assert.ok(region().textContent));
  assert.ok(document.activeElement === campo, "el foco sigue en el campo");
});

test("dos cambios seguidos: solo cuenta el último, y no se queda nada a medias", async () => {
  const { router } = pintar(createElement(Marco));
  const contenido = document.getElementById("contenido");
  fireEvent.pointerDown(document.body);
  await act(async () => {
    await router.navigate("/a");
    await router.navigate("/b");
  });
  await waitFor(() => assert.ok(document.activeElement === contenido, "el foco en el contenido"));
  await waitFor(() => assert.equal(region().textContent, "/b — SurEconomics"));
});
