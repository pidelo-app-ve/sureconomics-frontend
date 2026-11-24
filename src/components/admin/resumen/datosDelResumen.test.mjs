/**
 * Lo puro del historial del resumen en el panel (`datosDelResumen.js`). `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { FILTROS_DEL_HISTORIAL, consultaDelHistorial, hayFiltrosEnElHistorial } from "./datosDelResumen.js";

test("sin filtros solo viaja la página", () => {
  assert.deepEqual(consultaDelHistorial(FILTROS_DEL_HISTORIAL, 3), { pagina: 3 });
  assert.equal(hayFiltrosEnElHistorial(FILTROS_DEL_HISTORIAL), false);
});

test("viajan los filtros puestos, y las fechas al revés se dan la vuelta", () => {
  const f = { ...FILTROS_DEL_HISTORIAL, estado: "publicado", desde: "2026-11-20", hasta: "2026-11-10", fallo: "whatsapp" };
  assert.deepEqual(consultaDelHistorial(f, 1), {
    estado: "publicado",
    desde: "2026-11-10",
    hasta: "2026-11-20",
    fallo: "whatsapp",
    pagina: 1,
  });
  assert.equal(hayFiltrosEnElHistorial({ ...FILTROS_DEL_HISTORIAL, hasta: "2026-11-10" }), true);
});

test("una sola fecha viaja sola", () => {
  assert.deepEqual(consultaDelHistorial({ ...FILTROS_DEL_HISTORIAL, desde: "2026-10-01" }), { desde: "2026-10-01", pagina: 1 });
});
