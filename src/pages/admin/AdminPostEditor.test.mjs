/**
 * El editor de piezas del panel, pintado al abrirlo (`renderToString`). `npm test`.
 *
 * Solo el primer pintado: la pieza se pide en un efecto, que aquí no corre. Lo que
 * decide al guardar se prueba aparte (`components/admin/editorDePieza/*.test.mjs`).
 */
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { pintarEn, textoDe } from "../../../scripts/pruebas/pintar.mjs";
import { AdminToastProvider } from "../../context/AdminToastContext.jsx";
import { AdminPostEditor } from "./AdminPostEditor.jsx";

const abrir = (direccion) =>
  pintarEn(direccion, "admin/posts/*", createElement(AdminToastProvider, null, createElement(AdminPostEditor)));

const almacen = (datos) => ({
  getItem: (k) => datos[k] ?? null,
  setItem: (k, v) => (datos[k] = String(v)),
  removeItem: (k) => delete datos[k],
});

afterEach(() => {
  delete globalThis.sessionStorage;
});

describe("crear una pieza", () => {
  test("sin cuenta del panel no se puede (se dice, sin formulario)", async () => {
    const texto = textoDe(await abrir("/admin/posts/new"));
    assert.match(texto, /Sin acceso/);
    assert.doesNotMatch(texto, /Guardar/);
  });

  test("con cuenta: abre como «Crear pieza», en borrador", async () => {
    globalThis.sessionStorage = almacen({
      sureconomics_admin_access_token: "a",
      sureconomics_admin_refresh_token: "r",
      sureconomics_admin_role: "publicador",
    });
    const texto = textoDe(await abrir("/admin/posts/new"));
    assert.doesNotMatch(texto, /Sin acceso/);
    assert.match(texto, /Crear pieza/);
    assert.match(texto, /Estado: borrador/);
  });
});
