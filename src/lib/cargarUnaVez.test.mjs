/**
 * Una carga perezosa compartida (`cargarUnaVez.js`). `npm test`.
 *
 * Lo que se vigila: que dos llamadas den la misma promesa (la segunda espera a la primera,
 * hoja de estilos incluida, en vez de pedir otra carga que Vite no espera) y que, si la
 * carga falla, la siguiente llamada vuelva a probar.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cargarUnaVez } from "./cargarUnaVez.js";

test("dos llamadas comparten la misma promesa y cargan una sola vez", async () => {
  let veces = 0;
  const cargar = cargarUnaVez(async () => {
    veces++;
    return { modulo: "uno" };
  });
  const a = cargar();
  const b = cargar();
  assert.equal(a, b);
  assert.deepEqual(await a, { modulo: "uno" });
  assert.equal(cargar(), a, "ya cargada, sigue siendo la misma");
  assert.equal(veces, 1);
});

test("la segunda llamada, hecha mientras la primera sigue en camino, espera a la primera", async () => {
  let soltar;
  const cargar = cargarUnaVez(() => new Promise((ok) => (soltar = ok)));
  const orden = [];
  const primera = cargar().then(() => orden.push("primera"));
  const segunda = cargar().then(() => orden.push("segunda"));
  await Promise.resolve();
  assert.deepEqual(orden, [], "nadie termina antes de que llegue la carga");
  soltar("listo");
  await Promise.all([primera, segunda]);
  assert.deepEqual(orden, ["primera", "segunda"]);
});

test("tras un fallo se puede reintentar, y el reintento se comparte otra vez", async () => {
  let veces = 0;
  const cargar = cargarUnaVez(async () => {
    veces++;
    if (veces === 1) throw new Error("sin red");
    return "bien";
  });
  const fallida = cargar();
  await assert.rejects(fallida, /sin red/);
  const reintento = cargar();
  assert.notEqual(reintento, fallida);
  assert.equal(await reintento, "bien");
  assert.equal(cargar(), reintento);
  assert.equal(veces, 2);
});

test("quien llamó mientras la carga estaba en camino también ve el fallo", async () => {
  let fallar;
  const cargar = cargarUnaVez(() => new Promise((_, mal) => (fallar = mal)));
  const a = cargar();
  const b = cargar();
  fallar(new Error("sin red"));
  await assert.rejects(a, /sin red/);
  await assert.rejects(b, /sin red/);
});
