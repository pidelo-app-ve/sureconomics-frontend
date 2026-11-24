/**
 * La portada en pantalla (`scripts/pruebas/dom.mjs`), con sus ganchos de verdad pidiendo a
 * la API: lo que `Home.test.mjs` (con dobles de `usePieces` y `renderToString`) no puede
 * ver, que la lista que manda el backend llega entera hasta la primera plana. `npm test`.
 *
 * Todas las respuestas son del backend, grabadas (`src/pruebas/respuestas/portada/` y
 * `sitio/`): cuatro piezas publicadas (tres noticias y un artículo, una por segundo) y lo
 * que la portada pide alrededor (canal, temas, monedas, titulares, publicidad…).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { traducir } from "../i18n/motor.js";

const { pintar, pantalla, servidor, grabada } = await import("../../scripts/pruebas/dom.mjs");
const { Home } = await import("./Home.jsx");

test("con la lista que manda la API, la primera plana abre con la noticia más reciente", async () => {
  const piezas = grabada("portada/piezas.json");
  for (const [ruta, archivo] of [
    ["/datos/posts", "portada/piezas"],
    ["/datos/canal", "portada/canal"],
    ["/publicidad/espacios", "portada/publicidad"],
    ["/datos/formats", "sitio/formatos"],
    ["/datos/topics", "sitio/temas"],
    ["/datos/places", "sitio/lugares"],
    ["/datos/monedas", "sitio/monedas"],
    ["/datos/analitica/mas-leidas", "sitio/mas-leidas"],
    ["/datos/headlines", "sitio/titulares"],
  ]) {
    servidor.contestar("GET", ruta, grabada(`${archivo}.json`));
  }
  pintar(createElement(Home), { ruta: "/", sitio: true });

  const masReciente = piezas.data.find((p) => p.format === "noticia").title;
  assert.equal(masReciente, "El BCV sube la tasa de encaje");
  const apertura = await pantalla.findByRole("heading", { name: masReciente });
  assert.ok(apertura.closest(".se-plana__principal"), "va de principal en la primera plana");
  // Las otras también llegan a la página, y nada se queda «cargando» ni da error.
  for (const p of piezas.data) assert.ok(pantalla.getAllByText(p.title).length >= 1, `falta «${p.title}»`);
  assert.equal(pantalla.queryByText(traducir("es", "portada.inicio.noSePudoCargar")), null);
  assert.equal(pantalla.queryByText(traducir("es", "portada.inicio.cargando")), null);
  assert.deepEqual(servidor.a("/datos/posts").map((p) => p.consulta), [{ page: "1", limit: "100" }]);
  assert.deepEqual(servidor.sinRespuesta, []);
});
