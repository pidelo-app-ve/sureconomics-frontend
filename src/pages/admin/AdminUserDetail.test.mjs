/**
 * La ficha de un lector en el panel, en pantalla (`scripts/pruebas/dom.mjs`). `npm test`.
 *
 * Vigila el fallo del 10-nov-2026 (665f0a8): la ficha leía el permiso de proponer con un
 * nombre que el servidor no manda (`can_submit_collaborations`), decía «No» a quien sí
 * podía y, al guardar cualquier otro cambio, se lo quitaba. Solo lo caza una respuesta
 * **grabada del backend** (`src/pruebas/respuestas/lectores/`): con una inventada en la
 * prueba, quien la escribe repite el mismo error.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { pintar, pantalla, fireEvent, waitFor, asentar, servidor, grabada } = await import("../../../scripts/pruebas/dom.mjs");
const { AdminUserDetail } = await import("./AdminUserDetail.jsx");

const lectora = grabada("lectores/lectora.json");
const RUTA = `/admin/users/${lectora.data.id}`;

const abrir = async () => {
  servidor.contestar("GET", RUTA, lectora).contestar("PATCH", RUTA, grabada("lectores/lectora-nombre.json"));
  pintar(createElement(AdminUserDetail), { ruta: RUTA, patron: "/admin/users/:id", rol: grabada("panel/entrar-editor.json").data.role });
  await pantalla.findByDisplayValue("Ana");
  await asentar();
};

test("lee el permiso de proponer tal como lo manda el servidor", async () => {
  assert.equal(lectora.data.can_submit_collaborative_articles, true, "la respuesta grabada es de una lectora que puede");
  await abrir();
  assert.equal(pantalla.getByLabelText("Puede enviar propuestas").checked, true);
});

test("guardar el nombre no toca el permiso", async () => {
  await abrir();
  fireEvent.change(pantalla.getByLabelText("Nombre"), { target: { value: "Ana María" } });
  fireEvent.click(pantalla.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => assert.equal(servidor.a(RUTA, "PATCH").length, 1));
  await waitFor(() => assert.equal(pantalla.getByRole("button", { name: "Guardar cambios" }).disabled, false));
  assert.deepEqual(servidor.a(RUTA, "PATCH")[0].cuerpo, { first_name: "Ana María", last_name: "Pérez" });
  assert.deepEqual(
    servidor.peticiones.filter((p) => p.ruta !== RUTA).map((p) => `${p.metodo} ${p.ruta}`),
    [],
    "ni el permiso ni la cuenta activa: solo cambió el nombre",
  );
  assert.equal(pantalla.getByLabelText("Puede enviar propuestas").checked, true);
});
