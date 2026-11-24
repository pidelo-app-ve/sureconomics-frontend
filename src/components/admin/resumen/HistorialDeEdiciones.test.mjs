/**
 * «Ediciones anteriores» del resumen en el panel, en pantalla (`scripts/pruebas/dom.mjs`):
 * por páginas de 21, con filtros pedidos al servidor. `npm test`.
 *
 * Las respuestas son del backend de verdad, grabadas con su cliente de pruebas: 30
 * ediciones publicadas en diez días, una con fallo en WhatsApp (`src/pruebas/respuestas/resumen/`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement, useState } from "react";

const { pintar, pantalla, fireEvent, waitFor, within, act, asentar, pasar, servidor, grabada } = await import(
  "../../../../scripts/pruebas/dom.mjs"
);
const { HistorialDeEdiciones } = await import("./HistorialDeEdiciones.jsx");

const LISTA = "/admin/resumen/ediciones";
const ROL = grabada("panel/entrar-editor.json").data.role;

const listaPara = ({ pagina, fallo, estado }) => {
  if (estado === "retenido") return grabada("resumen/ediciones-vacio.json");
  if (fallo === "whatsapp") return grabada("resumen/ediciones-fallo.json");
  return grabada(pagina === "2" ? "resumen/ediciones-2.json" : "resumen/ediciones-1.json");
};

/** Con un botón que hace de «acción de la página»: cada clic, una vuelta más. */
const ConAcciones = () => {
  const [vueltas, setVueltas] = useState(0);
  return createElement(
    "div",
    null,
    createElement("button", { type: "button", onClick: () => setVueltas((v) => v + 1) }, "Otra acción"),
    createElement(HistorialDeEdiciones, { vueltas, onAbrir: () => {} }),
  );
};

const abrir = async (lista = listaPara) => {
  servidor.contestar("GET", LISTA, (p) => lista(p.consulta));
  pintar(createElement(ConAcciones), { ruta: "/admin/resumen", rol: ROL });
  await pantalla.findByText("Página 1 de 2 — 30 en total");
  await asentar();
};

const pedidas = () => servidor.a(LISTA, "GET").map((p) => p.consulta);
const siguiente = () =>
  fireEvent.click(
    within(pantalla.getByRole("navigation", { name: "Paginación (arriba)" })).getByRole("button", { name: "Página siguiente" }),
  );

test("de 21 en 21, y cambiar un filtro desde la página 2 pide la página 1", async () => {
  await abrir();
  assert.equal(pantalla.getAllByRole("button", { name: "Ver" }).length, 21);
  siguiente();
  await pantalla.findByText("Página 2 de 2 — 30 en total");
  assert.equal(pedidas().at(-1).pagina, "2");

  fireEvent.change(pantalla.getByLabelText("Solo con fallos de envío"), { target: { value: "whatsapp" } });
  await pantalla.findByText("Página 1 de 1 — 1 en total");
  assert.deepEqual(
    pedidas().filter((c) => c.fallo === "whatsapp").map((c) => c.pagina),
    ["1"],
  );
  assert.ok(pantalla.getByText("falló"), "la fila dice que WhatsApp falló");
});

test("sin nada con esos filtros: lo dice, y «Limpiar filtros» vuelve a todas", async () => {
  await abrir();
  fireEvent.change(pantalla.getByLabelText("Estado"), { target: { value: "retenido" } });
  await pantalla.findByText("Ninguna edición con estos filtros");
  fireEvent.click(pantalla.getByRole("button", { name: "Limpiar filtros" }));
  await pantalla.findByText("Página 1 de 2 — 30 en total");
  assert.equal(pantalla.getByLabelText("Estado").value, "");
  assert.deepEqual(pedidas().at(-1), { pagina: "1" });
});

test("unas fechas al revés se piden del derecho", async () => {
  await abrir();
  fireEvent.change(pantalla.getByLabelText("Desde"), { target: { value: "2026-11-20" } });
  await asentar();
  fireEvent.change(pantalla.getByLabelText("Hasta"), { target: { value: "2026-11-10" } });
  await waitFor(() => assert.equal(pedidas().at(-1).hasta, "2026-11-20"));
  assert.equal(pedidas().at(-1).desde, "2026-11-10");
});

test("tras una acción se pide la lista vigente, sin «Cargando»", async () => {
  await abrir();
  siguiente();
  await pantalla.findByText("Página 2 de 2 — 30 en total");
  const antes = pedidas().length;
  fireEvent.click(pantalla.getByRole("button", { name: "Otra acción" }));
  await waitFor(() => assert.equal(pedidas().length, antes + 1));
  assert.equal(pedidas().at(-1).pagina, "2");
  assert.equal(pantalla.queryByText("Cargando las ediciones…"), null);
  await asentar();
  assert.ok(pantalla.getByText("Página 2 de 2 — 30 en total"));
});

test("una respuesta que llega tarde no pisa a la de un filtro más nuevo", async () => {
  let soltarPagina2;
  await abrir((consulta) =>
    consulta.pagina === "2" && !consulta.fallo
      ? new Promise((listo) => (soltarPagina2 = () => listo(listaPara(consulta))))
      : listaPara(consulta),
  );
  siguiente();
  await waitFor(() => assert.ok(soltarPagina2, "se pidió la página 2"));
  fireEvent.change(pantalla.getByLabelText("Solo con fallos de envío"), { target: { value: "whatsapp" } });
  await pantalla.findByText("Página 1 de 1 — 1 en total");
  await act(async () => soltarPagina2());
  await pasar(20);
  assert.ok(pantalla.getByText("Página 1 de 1 — 1 en total"));
  assert.equal(pantalla.queryByText("Página 2 de 2 — 30 en total"), null);
});
