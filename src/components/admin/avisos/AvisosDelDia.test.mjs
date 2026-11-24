/**
 * «De hoy» en «Avisos de noticias», en pantalla (`scripts/pruebas/dom.mjs`): el filtro por
 * estado, las páginas cuando un día pasa de 30 avisos y el selector del día. `npm test`.
 *
 * Sin servidor: el componente recibe los avisos ya leídos (`leerAvisos`), en la forma en
 * que los manda `GET /admin/avisos` (ver `test_avisos.py` en el backend).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { pintar, pantalla, fireEvent, within } = await import("../../../../scripts/pruebas/dom.mjs");
const { AvisosDelDia } = await import("./AvisosDelDia.jsx");
const { leerAvisos } = await import("../../../lib/avisos.js");

const ESTADOS = ["pendiente", "tomado", "redactado", "publicado", "descartado"];
const dia = (n) =>
  leerAvisos({
    activos: true,
    hoy: n,
    motivos: ["ya_la_dimos", "poca_cosa"],
    avisos: Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      titulo: `Aviso ${i + 1}`,
      pais: "VE",
      calor: 50,
      medios: 2,
      estado: ESTADOS[i % 5],
      tomado_por_id: i % 5 === 1 ? (i % 10 === 1 ? 7 : 8) : null,
      tomado_por: "Alguien",
      post_id: i % 5 === 2 || i % 5 === 3 ? 100 + i : null,
      creado_en: "2026-11-24T14:00:00Z",
    })),
  });

const NADA = () => {};
const ACCIONES = { onTomar: NADA, onSoltar: NADA, onDescartar: NADA, onRedactar: NADA };

const abrir = ({ n = 45, fecha = null, onFecha = NADA } = {}) =>
  pintar(
    createElement(AvisosDelDia, { dia: dia(n), fecha, hoy: "2026-11-24", onFecha, miId: 7, acciones: ACCIONES }),
    { ruta: "/admin/avisos" },
  );

const titulos = () => pantalla.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

test("con más de 30 avisos van de 20 en 20, y filtrar vuelve a la primera página", async () => {
  abrir();
  assert.ok(pantalla.getByText("Página 1 de 3 — 45 en total"));
  assert.equal(titulos().length, 20);
  fireEvent.click(
    within(pantalla.getByRole("navigation", { name: "Paginación (arriba)" })).getByRole("button", { name: "Página siguiente" }),
  );
  assert.ok(pantalla.getByText("Página 2 de 3 — 45 en total"));
  assert.equal(titulos()[0], "Aviso 21");

  fireEvent.change(pantalla.getByLabelText("Estado"), { target: { value: "pendientes" } });
  // Nueve pendientes: caben todos, sin páginas.
  assert.equal(titulos().length, 9);
  assert.equal(titulos()[0], "Aviso 1");
  assert.equal(pantalla.queryByText(/^Página/), null);
});

test("«Tomados por mí» enseña solo los de quien mira, y «Descartados» los descartados", async () => {
  abrir({ n: 12 });
  fireEvent.change(pantalla.getByLabelText("Estado"), { target: { value: "mios" } });
  assert.deepEqual(titulos(), ["Aviso 2", "Aviso 12"]);
  fireEvent.change(pantalla.getByLabelText("Estado"), { target: { value: "descartados" } });
  assert.deepEqual(titulos(), ["Aviso 5", "Aviso 10"]);
});

test("sin ninguno con ese estado lo dice, y «Ver todos» los vuelve a enseñar", async () => {
  abrir({ n: 3 });
  fireEvent.change(pantalla.getByLabelText("Estado"), { target: { value: "publicados" } });
  assert.ok(pantalla.getByText("Ningún aviso «publicados» hoy."));
  fireEvent.click(pantalla.getByRole("button", { name: "Ver todos" }));
  assert.deepEqual(titulos(), ["Aviso 1", "Aviso 2", "Aviso 3"]);
  assert.equal(pantalla.getByLabelText("Estado").value, "todos");
});

test("el día: hoy es «null», otro día va tal cual, y «Volver a hoy»", async () => {
  const elegidos = [];
  abrir({ n: 0, fecha: "2026-11-20", onFecha: (f) => elegidos.push(f) });
  assert.ok(pantalla.getByText("Ese día no salió ningún aviso."));
  const campo = pantalla.getByLabelText("Día");
  assert.equal(campo.max, "2026-11-24");
  fireEvent.change(campo, { target: { value: "2026-11-18" } });
  fireEvent.change(campo, { target: { value: "2026-11-24" } });
  fireEvent.click(pantalla.getByRole("button", { name: "Volver a hoy" }));
  assert.deepEqual(elegidos, ["2026-11-18", null, null]);
});
