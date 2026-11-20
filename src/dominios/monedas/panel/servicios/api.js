import { adminRequest } from "../../../../lib/api";
import { unwrapEntity } from "../../../../services/adminResponseUtils";

/**
 * Las monedas de la región en el panel (`app/dominios/monedas/rutas.py` en el backend).
 *
 * Una lectura que no cuadra (fuera de su banda, o un salto grande frente al último dato
 * bueno) queda «sospechosa»: no se publica hasta que alguien la acepta como buena o la
 * oculta. Aparte del sitio público: el sitio no carga nada de esto.
 *
 * Todas devuelven lo mismo: `{ sync, monedas, sospechosas, ocultas }`.
 */

export const getMonedasDelPanel = async () => unwrapEntity(await adminRequest("/admin/monedas"));

/** «Ocultar esta cotización»: deja de publicarse (si es sospechosa, con su racha). */
export const ocultarCotizacion = async (id) =>
  unwrapEntity(await adminRequest(`/admin/monedas/cotizaciones/${encodeURIComponent(id)}/ocultar`, { method: "POST", json: {} }));

/** «Aceptar como buena»: se publica y pasa a ser la referencia de la lectura siguiente. */
export const aceptarCotizacion = async (id) =>
  unwrapEntity(await adminRequest(`/admin/monedas/cotizaciones/${encodeURIComponent(id)}/aceptar`, { method: "POST", json: {} }));

/** «Deshacer» un ocultar: la racha entera vuelve a como estaba. `id` es el de `ocultas`. */
export const deshacerOcultar = async (id) =>
  unwrapEntity(await adminRequest(`/admin/monedas/ocultas/${encodeURIComponent(id)}/deshacer`, { method: "POST", json: {} }));
