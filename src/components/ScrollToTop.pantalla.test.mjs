/**
 * `ScrollToTop` en pantalla (`scripts/pruebas/dom.mjs`), con el router del sitio
 * (`v7_startTransition`): sube al cambiar de ruta, no al cambiar solo la consulta, y lo
 * hace en el mismo commit de la página nueva, antes de los efectos que corren tras pintar.
 * `npm test`.
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createElement, useEffect } from "react";
import { useLocation } from "react-router-dom";

const { pintar, act } = await import("../../scripts/pruebas/dom.mjs");
const { default: ScrollToTop } = await import("./ScrollToTop.jsx");

let orden;
let scrollToDeVerdad;
beforeEach(() => {
  orden = [];
  scrollToDeVerdad = window.scrollTo;
  window.scrollTo = (x, y) => orden.push(`arriba ${x},${y}`);
});
afterEach(() => {
  window.scrollTo = scrollToDeVerdad;
});

/** Una página cuyo efecto normal (el que corre tras pintar) apunta cuándo corre. */
const Pagina = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    orden.push(`efecto ${pathname}${search}`);
  }, [pathname, search]);
  return null;
};

const navegar = (router, a) => act(async () => router.navigate(a));

test("al cambiar de ruta sube, y antes de los efectos de la página nueva", async () => {
  const { router } = pintar(createElement(ScrollToTop, null, createElement(Pagina)), { ruta: "/" });
  orden.length = 0;
  await navegar(router, "/noticias/una");
  assert.deepEqual(orden, ["arriba 0,0", "efecto /noticias/una"]);
});

test("si solo cambia la consulta (un filtro, una página de la lista), no se mueve", async () => {
  const { router } = pintar(createElement(ScrollToTop, null, createElement(Pagina)), { ruta: "/explorar" });
  orden.length = 0;
  await navegar(router, "/explorar?tema=Petr%C3%B3leo");
  assert.deepEqual(orden, ["efecto /explorar?tema=Petr%C3%B3leo"]);
});
