/**
 * El diálogo de confirmación del panel (`useAdminConfirm`), con sus efectos corriendo de
 * verdad (`scripts/pruebas/montar.mjs`). `npm test`.
 *
 * `AdminConfirmDialog` es un doble que no pinta nada y deja sus props en `dialogo`: así
 * se pulsan «Confirmar» y «Cancelar» como lo haría quien escribe.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { sustituir } from "../../../scripts/pruebas/dobles.mjs";

let dialogo = null;
sustituir({
  "src/ui/admin/AdminConfirmDialog.jsx": {
    AdminConfirmDialog: (props) => {
      dialogo = props;
      return null;
    },
  },
});

const { montarGancho, act } = await import("../../../scripts/pruebas/montar.mjs");
const { useAdminConfirm } = await import("./useAdminConfirm.jsx");
const { eliminarPieza } = await import("../../components/admin/editorDePieza/guardado.js");

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

  // Era un fallo (segunda revisión, 20-nov-2026): `close` respondía a la promesa que
  // estuviera guardada, fuera de quien fuera. Se borra, y mientras la guardia de salida
  // abre su pregunta: al acabar el borrado, `close(true)` le decía «sí» a la guardia.
  test("lo que acaba tarde solo cierra y responde su propio diálogo", async () => {
    const g = await montarGancho(() => useAdminConfirm(), {}, { pintar: (v) => createElement(v.ConfirmDialog) });
    let soltarBorrado;
    let borrar;
    await act(async () => {
      borrar = g.valor.confirm({
        title: "Eliminar pieza",
        description: "",
        onConfirm: () => new Promise((s) => (soltarBorrado = s)),
      });
    });
    let confirmando;
    await act(async () => {
      confirmando = dialogo.onConfirm();
    });
    assert.equal(dialogo.isBusy, true);
    let salir;
    await act(async () => {
      salir = g.valor.confirm({ title: "Salir sin guardar", description: "" });
    });
    assert.equal(await estadoDe(borrar), false);
    await act(async () => {
      soltarBorrado();
      await confirmando;
    });
    assert.equal(await estadoDe(salir), "pendiente", "el borrado respondió a la guardia");
    assert.equal(dialogo.open, true);
    assert.equal(dialogo.title, "Salir sin guardar");
    // Y la guardia se sigue respondiendo con lo suyo.
    await act(async () => dialogo.onClose());
    assert.equal(await estadoDe(salir), false);
    assert.equal(dialogo.open, false);
    await g.desmontar();
  });

  test("lo de siempre: confirmar dice sí, cancelar dice no, y el diálogo se cierra", async () => {
    const g = await montarGancho(() => useAdminConfirm(), {}, { pintar: (v) => createElement(v.ConfirmDialog) });
    let si;
    await act(async () => {
      si = g.valor.confirm({ title: "¿Seguro?", description: "" });
    });
    await act(async () => dialogo.onConfirm());
    assert.equal(await si, true);
    assert.equal(dialogo.open, false);
    let no;
    await act(async () => {
      no = g.valor.confirm({ title: "¿Seguro?", description: "" });
    });
    await act(async () => dialogo.onClose());
    assert.equal(await no, false);
    // Con una acción que falla, el diálogo se queda abierto con el error.
    let conError;
    await act(async () => {
      conError = g.valor.confirm({ title: "Borrar", description: "", onConfirm: async () => {
        throw new Error("No se pudo.");
      } });
    });
    await act(async () => dialogo.onConfirm());
    assert.equal(dialogo.open, true);
    assert.equal(dialogo.errorMessage, "No se pudo.");
    assert.equal(await estadoDe(conError), "pendiente");
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
      preguntando: false,
      setPreguntando: (v) => (d.preguntando = v),
      toastError: (m) => avisos.push(m),
    };
    let eliminando;
    await act(async () => {
      eliminando = eliminarPieza(d);
    });
    assert.equal(d.enMarcha.current, true);
    assert.equal(d.preguntando, true);
    await act(async () => {
      g.valor.confirm({ title: "Salir sin guardar", description: "" });
    });
    await eliminando;
    assert.equal(d.enMarcha.current, false);
    // Y la pregunta pisada también deja de contar como «preguntando».
    assert.equal(d.preguntando, false);
    await g.desmontar();
  });
});
