/**
 * Esperar a las hojas de estilos a medio bajar (`esperarHojas.js`). `npm test`.
 *
 * Lo que se vigila: que sin hojas pendientes no se espere nada, que con una a medio bajar
 * se espere a su `load` (o a su `error`), que nunca se espere más del tope, y que una
 * hoja colgada solo retrase una vez.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { esperarHojas } from "./esperarHojas.js";

/** Un `<link rel="stylesheet">` de mentira: `sheet` null mientras baja. */
const enlace = ({ cargada }) => {
  const oyentes = {};
  return {
    sheet: cargada ? {} : null,
    addEventListener: (tipo, f) => ((oyentes[tipo] ||= []).push(f)),
    disparar: (tipo) => (oyentes[tipo] || []).forEach((f) => f()),
  };
};
const documento = (enlaces) => ({ querySelectorAll: () => enlaces });
const resuelta = async (promesa) => {
  let lista = false;
  promesa.then(() => (lista = true));
  await new Promise((ok) => setTimeout(ok, 5));
  return lista;
};

test("sin hojas pendientes no espera", async () => {
  assert.equal(await resuelta(esperarHojas({ doc: documento([enlace({ cargada: true })]) })), true);
  assert.equal(await resuelta(esperarHojas({ doc: documento([]) })), true);
});

test("con una hoja a medio bajar espera a que llegue", async () => {
  const bajando = enlace({ cargada: false });
  const espera = esperarHojas({ doc: documento([enlace({ cargada: true }), bajando]) });
  assert.equal(await resuelta(espera), false, "aún no llegó");
  bajando.disparar("load");
  assert.equal(await resuelta(espera), true);
});

test("una hoja que falla tampoco deja la página colgada", async () => {
  const mala = enlace({ cargada: false });
  const espera = esperarHojas({ doc: documento([mala]) });
  assert.equal(await resuelta(espera), false);
  mala.disparar("error");
  assert.equal(await resuelta(espera), true);
});

test("nunca espera más del tope", async () => {
  const espera = esperarHojas({ doc: documento([enlace({ cargada: false })]), tope: 20 });
  assert.equal(await resuelta(espera), false);
  await new Promise((ok) => setTimeout(ok, 30));
  assert.equal(await resuelta(espera), true);
});

test("una hoja colgada retrasa una sola vez, y como mucho el tope", async () => {
  const colgada = enlace({ cargada: false });
  const doc = documento([colgada]);
  const t0 = Date.now();
  await esperarHojas({ doc, tope: 40 });
  const primera = Date.now() - t0;
  assert.ok(primera >= 35 && primera < 400, `la primera espera el tope: ${primera} ms`);
  // La siguiente página ya no la espera: se dio por perdida.
  assert.equal(await resuelta(esperarHojas({ doc, tope: 40 })), true);
  // Y una hoja nueva que sigue bajando sí se espera.
  const nueva = enlace({ cargada: false });
  const espera = esperarHojas({ doc: documento([colgada, nueva]), tope: 1000 });
  assert.equal(await resuelta(espera), false);
  nueva.disparar("load");
  assert.equal(await resuelta(espera), true);
});

test("el tope de serie es corto (una hoja colgada no puede parar la navegación)", async () => {
  const { TOPE_HOJAS_MS } = await import("./esperarHojas.js");
  assert.ok(TOPE_HOJAS_MS <= 3000, String(TOPE_HOJAS_MS));
});

test("sin document (en el servidor o en una prueba) no espera", async () => {
  assert.equal(await resuelta(esperarHojas({ doc: null })), true);
});
