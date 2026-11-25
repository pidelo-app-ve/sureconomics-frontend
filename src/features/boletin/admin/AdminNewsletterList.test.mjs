/**
 * «Suscriptores del boletín» en el panel, en pantalla (`scripts/pruebas/dom.mjs`): la línea
 * de las páginas, el buscador por correo y «Limpiar filtros». `npm test`.
 *
 * Las respuestas son del backend de verdad, grabadas con su cliente de pruebas: 25
 * suscritos, tres «ana…» (`src/pruebas/respuestas/boletin/suscriptores-*.json`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { pintar, pantalla, fireEvent, waitFor, within, asentar, pasar, servidor, grabada } = await import(
  "../../../../scripts/pruebas/dom.mjs"
);
const { AdminNewsletterList } = await import("./AdminNewsletterList.jsx");
const { ESPERA_DEL_BUSCADOR_MS: ESPERA } = await import("../../../lib/listasDelPanel.js");

const LISTA = "/admin/newsletter";
const ROL = grabada("panel/entrar-editor.json").data.role;
const VACIA = { ...grabada("boletin/suscriptores-buscar.json"), data: [], meta: { page: 1, limit: 20, total: 0, pages: 0 } };

const abrir = async () => {
  servidor.contestar("GET", LISTA, ({ consulta }) => {
    if (consulta.q === "ana") return grabada("boletin/suscriptores-buscar.json");
    if (consulta.q || consulta.origen) return VACIA;
    return grabada("boletin/suscriptores-1.json");
  });
  pintar(createElement(AdminNewsletterList), { ruta: "/admin/newsletter", rol: ROL });
  await pantalla.findByText("Página 1 de 2 — 25 en total");
  await asentar();
};

const pedidas = () => servidor.a(LISTA, "GET").map((p) => p.consulta);

test("el buscador pide una vez, cuando se deja de escribir, y vuelve a la página 1", async () => {
  await abrir();
  const antes = pedidas().length;
  fireEvent.change(pantalla.getByRole("searchbox", { name: "Buscar" }), { target: { value: " an" } });
  fireEvent.change(pantalla.getByRole("searchbox", { name: "Buscar" }), { target: { value: " ana " } });
  await pasar(ESPERA + 50);
  await pantalla.findByText("Página 1 de 1 — 3 en total");
  const nuevas = pedidas().slice(antes);
  assert.deepEqual(nuevas, [{ page: "1", limit: "20", status: "subscribed", q: "ana" }]);
  assert.ok(pantalla.getByText("3 con estos filtros"));
});

test("sin nadie con esos filtros lo dice, y «Limpiar filtros» vuelve a los suscritos", async () => {
  await abrir();
  fireEvent.change(pantalla.getByLabelText("Origen"), { target: { value: "instagram" } });
  await pantalla.findByText("Nadie con estos filtros");
  assert.equal(pedidas().at(-1).origen, "instagram");
  fireEvent.click(pantalla.getByRole("button", { name: "Limpiar filtros" }));
  await pantalla.findByText("Página 1 de 2 — 25 en total");
  assert.equal(pantalla.getByLabelText("Origen").value, "");
  assert.deepEqual(pedidas().at(-1), { page: "1", limit: "20", status: "subscribed" });
  await waitFor(() =>
    assert.ok(within(pantalla.getByRole("navigation", { name: "Paginación (arriba)" })).getByRole("button", { name: "Página siguiente" })),
  );
});
