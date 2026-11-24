/**
 * La página de una pieza en pantalla (`scripts/pruebas/dom.mjs`), cuando el HTML no la
 * trae y la pide a la API: lo que pasa **después** del primer pintado, que
 * `Pieza.test.mjs` (con `renderToString`) no puede ver. `npm test`.
 *
 * Todas las respuestas son del backend de verdad, grabadas (`src/pruebas/respuestas/`):
 * la pieza, su 404 y lo que la página pide alrededor (formatos, temas, lugares, monedas,
 * lo más leído, la barra de titulares y los huecos de publicidad). Así, si la API cambia
 * la forma de una pieza, la prueba lo ve antes que el lector.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { traducir } from "../i18n/motor.js";

const { pintar, pantalla, fireEvent, asentar, servidor, grabada } = await import("../../scripts/pruebas/dom.mjs");
const { Pieza } = await import("./Pieza.jsx");

const pieza = grabada("piezas/pieza.json");
const SLUG = pieza.data.slug;
const es = (clave) => traducir("es", clave);

/** Lo que la página pide alrededor de la pieza, grabado. */
const alrededor = () => {
  for (const [ruta, archivo] of [
    ["/datos/formats", "sitio/formatos"],
    ["/datos/topics", "sitio/temas"],
    ["/datos/places", "sitio/lugares"],
    ["/datos/monedas", "sitio/monedas"],
    ["/datos/analitica/mas-leidas", "sitio/mas-leidas"],
    ["/datos/headlines", "sitio/titulares"],
    ["/publicidad/espacios", "sitio/publicidad-pieza"],
  ]) {
    servidor.contestar("GET", ruta, grabada(`${archivo}.json`));
  }
};

const abrir = (slug) => pintar(createElement(Pieza), { ruta: `/noticias/${slug}`, patron: "noticias/:slug", sitio: true });

test("una pieza de la API se pinta con su título, su entradilla y su cuerpo", async () => {
  alrededor();
  servidor.contestar("GET", `/datos/posts/${SLUG}`, pieza);
  abrir(SLUG);
  const titulo = await pantalla.findByRole("heading", { level: 1, name: pieza.data.title });
  assert.ok(titulo);
  assert.ok(pantalla.getByText("La medida rige desde el lunes."));
  assert.ok(pantalla.getByText("El Banco Central de Venezuela subió la tasa de encaje legal."));
  assert.deepEqual(servidor.sinRespuesta, []);
});

test("una que no existe (404 de la API) dice que no se encontró, sin «Reintentar»", async () => {
  alrededor();
  servidor.contestar("GET", "/datos/posts/no-existe", grabada("piezas/no-existe.json"));
  abrir("no-existe");
  await pantalla.findByRole("heading", { level: 1, name: es("piezas.noEncontrada.titulo") });
  assert.equal(pantalla.queryByRole("button", { name: es("comun.reintentar") }), null);
});

test("con la API caída lo dice y «Reintentar» la vuelve a pedir (no es «no encontrada»)", async () => {
  alrededor();
  let veces = 0;
  servidor.contestar("GET", `/datos/posts/${SLUG}`, () => {
    veces += 1;
    return veces === 1 ? { estado: 502, cuerpo: { success: false, error: { message: "Bad gateway" } } } : pieza;
  });
  abrir(SLUG);
  await pantalla.findByText(es("piezas.errorCarga"));
  await asentar();
  assert.equal(pantalla.queryByRole("heading", { level: 1, name: es("piezas.noEncontrada.titulo") }), null);

  fireEvent.click(pantalla.getByRole("button", { name: es("comun.reintentar") }));
  await pantalla.findByRole("heading", { level: 1, name: pieza.data.title });
  assert.equal(veces, 2);
});
