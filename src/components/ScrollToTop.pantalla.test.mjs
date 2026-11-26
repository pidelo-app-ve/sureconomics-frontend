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

/* —— Atrás y adelante (arreglo del 26-nov-2026) —— */

/** Una ventana con altura: `scrollTo` la mueve y `scrollY` la lee, como en el navegador. */
const conAltura = () => {
  let y = 0;
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => y });
  window.scrollTo = (a, b) => {
    y = typeof a === "object" ? a.top : b;
    orden.push(`a ${y}`);
  };
  /** El lector baja hasta `hasta` y toca algo (un enlace): queda apuntado. */
  return (hasta) => {
    y = hasta;
    window.dispatchEvent(new window.Event("pointerdown"));
  };
};

test("atrás devuelve la altura de la portada; adelante, la de la pieza; varias veces", async () => {
  const bajar = conAltura();
  const { router } = pintar(createElement(ScrollToTop, null, createElement(Pagina)), { ruta: "/" });
  bajar(1500);
  await navegar(router, "/noticias/una");
  assert.equal(window.scrollY, 0, "la pieza empieza arriba");
  bajar(420);
  await navegar(router, -1);
  assert.equal(router.state.location.pathname, "/");
  assert.equal(window.scrollY, 1500, "la portada, donde estaba");
  await navegar(router, 1);
  assert.equal(window.scrollY, 420, "la pieza, donde se dejó");
  for (let i = 0; i < 3; i++) {
    await navegar(router, -1);
    assert.equal(window.scrollY, 1500);
    await navegar(router, 1);
    assert.equal(window.scrollY, 420);
  }
});

test("volver a la portada con un enlace (no con atrás) la abre arriba", async () => {
  const bajar = conAltura();
  const { router } = pintar(createElement(ScrollToTop, null, createElement(Pagina)), { ruta: "/" });
  bajar(1500);
  await navegar(router, "/noticias/una");
  bajar(300);
  await navegar(router, "/");
  assert.equal(window.scrollY, 0);
});

test("atrás a una entrada sin altura apuntada: arriba, como una página nueva", async () => {
  conAltura();
  const { router } = pintar(createElement(ScrollToTop, null, createElement(Pagina)), {
    ruta: "/",
  });
  // En la primera pieza no se apunta nada (ni toque ni desplazamiento): sin altura que restaurar.
  await navegar(router, "/noticias/una");
  await navegar(router, "/noticias/dos");
  await navegar(router, -1);
  assert.equal(router.state.location.pathname, "/noticias/una");
  assert.equal(window.scrollY, 0);
});

test("mientras la página vuelve corta (los datos aún no llegan), no se pisa la altura buena", async () => {
  // Como el navegador: no se puede bajar más de lo que mide la página.
  let y = 0;
  let alto = 6000;
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => y });
  window.scrollTo = (a, b) => {
    y = Math.min(typeof a === "object" ? a.top : b, Math.max(0, alto - 800));
  };
  const { router } = pintar(createElement(ScrollToTop, null, createElement(Pagina)), { ruta: "/" });
  y = 2600;
  window.dispatchEvent(new window.Event("pointerdown"));
  await navegar(router, "/noticias/una");
  // Vuelve con la portada aún «cargando»: la altura se recorta y el navegador avisa del desplazamiento.
  alto = 1400;
  await navegar(router, -1);
  assert.equal(window.scrollY, 600);
  window.dispatchEvent(new window.Event("scroll"));
  await new Promise((r) => setTimeout(r, 250));
  // Otra vez adelante y atrás, ya con la portada entera: vuelve a 2600, no a 600.
  await navegar(router, 1);
  alto = 6000;
  await navegar(router, -1);
  assert.equal(window.scrollY, 2600);
});
