/**
 * «Usuarios» (los lectores) en el panel, en pantalla (`scripts/pruebas/dom.mjs`): la lista
 * por páginas, el buscador y los filtros. `npm test`.
 *
 * Las respuestas son del backend de verdad, grabadas con su cliente de pruebas: 25
 * lectores, tres «Ana» y uno desactivado (`src/pruebas/respuestas/lectores/lista-*.json`).
 */
import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { pintar, pantalla, fireEvent, waitFor, within, act, asentar, servidor, grabada } = await import(
  "../../../scripts/pruebas/dom.mjs"
);
const { AdminUsersList } = await import("./AdminUsersList.jsx");
const { ESPERA_DEL_BUSCADOR_MS: ESPERA } = await import("../../lib/listasDelPanel.js");

const LISTA = "/admin/users";
const ROL = grabada("panel/entrar-editor.json").data.role;

const listaPara = ({ page, q, activo }) => {
  if (q === "ana") return grabada("lectores/lista-buscar.json");
  if (q) return grabada("lectores/lista-vacia.json");
  if (activo === "no") return grabada("lectores/lista-desactivados.json");
  return grabada(page === "2" ? "lectores/lista-2.json" : "lectores/lista-1.json");
};

const abrir = async (lista = listaPara) => {
  servidor.contestar("GET", LISTA, (p) => lista(p.consulta));
  pintar(createElement(AdminUsersList), { ruta: "/admin/users", rol: ROL });
  await pantalla.findByText("Página 1 de 2 — 25 en total");
  await asentar();
};

const pedidas = () => servidor.a(LISTA, "GET").map((p) => p.consulta);
const siguiente = () =>
  fireEvent.click(
    within(pantalla.getByRole("navigation", { name: "Paginación (arriba)" })).getByRole("button", { name: "Página siguiente" }),
  );

test("cambiar un filtro desde la página 2 vuelve a pedir la página 1", async () => {
  await abrir();
  siguiente();
  await pantalla.findByText("Página 2 de 2 — 25 en total");
  fireEvent.change(pantalla.getByLabelText("Cuenta"), { target: { value: "no" } });
  await pantalla.findByText("Página 1 de 1 — 1 en total");
  assert.deepEqual(
    pedidas().filter((c) => c.activo === "no").map((c) => c.page),
    ["1"],
  );
  assert.ok(pantalla.getByText("Desactivada · sin verificar"));
});

test("el buscador espera a que se deje de escribir, y pide una sola vez", async () => {
  await abrir();
  const antes = pedidas().length;
  const buscar = pantalla.getByRole("searchbox", { name: "Buscar" });
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const entreTeclas = Math.floor(ESPERA / 2);
    for (const texto of ["a", "an", "  ana  "]) {
      fireEvent.change(buscar, { target: { value: texto } });
      act(() => mock.timers.tick(entreTeclas));
    }
    act(() => mock.timers.tick(ESPERA - entreTeclas - 1));
    assert.equal(pedidas().length, antes, "mientras se escribe no se pide nada");
    act(() => mock.timers.tick(1));
  } finally {
    mock.timers.reset();
  }
  await pantalla.findByText("Página 1 de 1 — 3 en total");
  const nuevas = pedidas().slice(antes);
  assert.equal(nuevas.length, 1, `una sola petición: ${JSON.stringify(nuevas)}`);
  assert.deepEqual({ q: nuevas[0].q, page: nuevas[0].page }, { q: "ana", page: "1" });
});

test("sin nadie con esos filtros lo dice, y «Limpiar filtros» vuelve a todos", async () => {
  await abrir();
  fireEvent.change(pantalla.getByRole("searchbox", { name: "Buscar" }), { target: { value: "nadie" } });
  await pantalla.findByText("Ningún lector con estos filtros");
  fireEvent.click(pantalla.getByRole("button", { name: "Limpiar filtros" }));
  await pantalla.findByText("Página 1 de 2 — 25 en total");
  assert.equal(pantalla.getByRole("searchbox", { name: "Buscar" }).value, "");
  assert.deepEqual(pedidas().at(-1), { page: "1", limit: "20" });
});

test("una página que ya no existe lleva a la última que hay", async () => {
  await abrir(({ page, ...resto }) =>
    page === "2" ? { ...grabada("lectores/lista-vacia.json"), meta: { page: 2, limit: 20, total: 18, pages: 1 } } : listaPara({ page, ...resto }),
  );
  siguiente();
  await waitFor(() => assert.equal(pedidas().at(-1).page, "1"));
  await pantalla.findByText("Página 1 de 2 — 25 en total");
});
