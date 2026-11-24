/**
 * El plan B de una foto con tallas (`useFotoConRespaldo`): si la talla no carga, la
 * original, una sola vez. `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

const { montarGancho, act } = await import("../../scripts/pruebas/montar.mjs");
const { useFotoConRespaldo } = await import("./useFotoConRespaldo.js");

const FOTO = {
  src: "/media/image/2026/11/banco.jpg",
  srcSet: "/media/image/2026/11/banco-640.jpg 640w, /media/image/2026/11/banco.jpg 900w",
  sizes: "640px",
};

test("con tallas: las pasa tal cual, con su plan B", async () => {
  const g = await montarGancho((p) => useFotoConRespaldo(p), FOTO);
  assert.equal(g.valor.srcSet, FOTO.srcSet);
  assert.equal(g.valor.sizes, FOTO.sizes);
  assert.equal(typeof g.valor.onError, "function");
  await g.desmontar();
});

test("si la talla falla: solo la original, y sin otro onError (no hay bucle)", async () => {
  const g = await montarGancho((p) => useFotoConRespaldo(p), FOTO);
  await act(async () => g.valor.onError());
  assert.deepEqual(g.valor, { src: FOTO.src });
  await g.pintar();
  assert.deepEqual(g.valor, { src: FOTO.src });
  await g.desmontar();
});

test("otra foto en la misma <img>: vuelve a probar sus tallas", async () => {
  const g = await montarGancho((p) => useFotoConRespaldo(p), FOTO);
  await act(async () => g.valor.onError());
  const otra = { src: "/media/image/2026/11/otra.jpg", srcSet: "/media/image/2026/11/otra-640.jpg 640w", sizes: "640px" };
  await g.pintar(otra);
  assert.equal(g.valor.srcSet, otra.srcSet);
  await g.desmontar();
});

test("sin tallas: solo src, sin onError", async () => {
  const g = await montarGancho((p) => useFotoConRespaldo(p), { src: FOTO.src });
  assert.deepEqual(g.valor, { src: FOTO.src });
  await g.desmontar();
});
