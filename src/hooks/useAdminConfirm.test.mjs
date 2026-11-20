/**
 * El diálogo de confirmación del panel (`useAdminConfirm`), con sus efectos corriendo de
 * verdad (`scripts/pruebas/montar.mjs`). `npm test`.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { montarGancho, act } = await import("../../scripts/pruebas/montar.mjs");
const { useAdminConfirm } = await import("./useAdminConfirm.jsx");
const { eliminarPieza } = await import("../components/admin/editorDePieza/guardado.js");

/** En qué quedó una promesa sin esperarla: `"pendiente"` o su valor. */
const estadoDe = async (promesa) => {
  const marca = Symbol("pendiente");
  const r = await Promise.race([promesa, new Promise((s) => setTimeout(() => s(marca), 0))]);
  return r === marca ? "pendiente" : r;
};

describe("un diálogo a la vez", () => {
  // Era un fallo (20-nov-2026): un solo `resolverRef`, y cada `confirm()` nuevo lo
  // pisaba. La pregunta de eliminar abierta y, encima, la de salir sin guardar (con
  // «Atrás»): la de eliminar no se resolvía nunca.
  test("abrir otro con uno abierto resuelve el primero como «no»", async () => {
    const g = await montarGancho(() => useAdminConfirm());
    let primera;
    await act(async () => {
      primera = g.valor.confirm({ title: "Eliminar pieza", description: "" });
    });
    assert.equal(await estadoDe(primera), "pendiente");
    await act(async () => {
      g.valor.confirm({ title: "Salir sin guardar", description: "" });
    });
    assert.equal(await estadoDe(primera), false);
    await g.desmontar();
  });

  test("el editor no se queda con el candado tomado si la pregunta de eliminar se pisa", async () => {
    const g = await montarGancho(() => useAdminConfirm());
    const avisos = [];
    const d = {
      isCreate: false,
      numericPostId: 7,
      enMarcha: { current: false },
      confirm: g.valor.confirm,
      dialogo: { title: "Eliminar pieza" },
      setActionState: () => {},
      toastError: (m) => avisos.push(m),
    };
    let eliminando;
    await act(async () => {
      eliminando = eliminarPieza(d);
    });
    assert.equal(d.enMarcha.current, true);
    await act(async () => {
      g.valor.confirm({ title: "Salir sin guardar", description: "" });
    });
    await eliminando;
    assert.equal(d.enMarcha.current, false);
    await g.desmontar();
  });
});
