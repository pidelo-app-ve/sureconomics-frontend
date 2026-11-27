/**
 * `trasElPintado`: después del siguiente pintado, una sola vez, con reserva si el navegador
 * no pinta (pestaña oculta) y cancelable. Con una ventana de mentira cuyo «pintado» lo
 * decide la prueba. `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { RESERVA_MS, trasElPintado } from "./trasElPintado.js";

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** Una ventana que guarda los `requestAnimationFrame` hasta que la prueba «pinta». */
const ventanaDePrueba = () => {
  const cuadros = new Map();
  let siguiente = 1;
  return {
    requestAnimationFrame: (fn) => {
      cuadros.set(siguiente, fn);
      return siguiente++;
    },
    cancelAnimationFrame: (id) => cuadros.delete(id),
    pintar: () => {
      const ahora = [...cuadros.values()];
      cuadros.clear();
      ahora.forEach((fn) => fn(0));
    },
    pendientes: () => cuadros.size,
  };
};

test("espera al pintado y corre después de él, no en el mismo cuadro", async () => {
  const ventana = ventanaDePrueba();
  const orden = [];
  trasElPintado(() => orden.push("hecho"), ventana);
  await espera(20);
  assert.deepEqual(orden, [], "sin pintado, todavía nada");
  ventana.pintar();
  orden.push("pintado");
  assert.deepEqual(orden, ["pintado"], "no dentro del requestAnimationFrame");
  await espera(5);
  assert.deepEqual(orden, ["pintado", "hecho"]);
});

test("una sola vez, aunque después venza la reserva", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const ventana = ventanaDePrueba();
  let veces = 0;
  trasElPintado(() => veces++, ventana);
  ventana.pintar();
  t.mock.timers.tick(1);
  assert.equal(veces, 1);
  t.mock.timers.tick(RESERVA_MS * 2);
  assert.equal(veces, 1);
});

test("con la pestaña oculta (no hay pintado), lo hace al vencer la reserva", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const ventana = ventanaDePrueba();
  let veces = 0;
  trasElPintado(() => veces++, ventana);
  t.mock.timers.tick(RESERVA_MS - 1);
  assert.equal(veces, 0);
  t.mock.timers.tick(1);
  assert.equal(veces, 1);
  assert.equal(ventana.pendientes(), 0, "y suelta el cuadro que esperaba");
  // Si luego la pestaña vuelve y pinta, no se repite.
  ventana.pintar();
  t.mock.timers.tick(10);
  assert.equal(veces, 1);
});

test("cancelar antes del pintado o antes del reloj: no hace nada", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const ventana = ventanaDePrueba();
  let veces = 0;
  const cancelar = trasElPintado(() => veces++, ventana);
  cancelar();
  ventana.pintar();
  t.mock.timers.tick(RESERVA_MS * 2);
  assert.equal(veces, 0);
  // Pintado ya, pero cancelado antes de su `setTimeout`.
  const otra = trasElPintado(() => veces++, ventana);
  ventana.pintar();
  otra();
  t.mock.timers.tick(RESERVA_MS * 2);
  assert.equal(veces, 0);
});

test("sin requestAnimationFrame (o sin ventana), solo con la reserva", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let veces = 0;
  trasElPintado(() => veces++, {});
  trasElPintado(() => veces++, undefined);
  t.mock.timers.tick(RESERVA_MS);
  assert.equal(veces, 2);
});
