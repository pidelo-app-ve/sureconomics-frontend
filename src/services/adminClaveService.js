import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/**
 * El catálogo de «La Clave», para el panel: tantas palabras como se quiera, por
 * categoría, de una en una o pegando una lista.
 */

export const listAdminPalabras = async (params = {}) =>
  adminRequest("/admin/juegos/palabras", {
    query: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      categoria: params.categoria || undefined,
      q: params.q?.trim() || undefined,
      activa: params.activa ?? undefined,
    },
  });

export const createAdminPalabra = async (body) =>
  unwrapEntity(await adminRequest("/admin/juegos/palabras", { method: "POST", json: body }));

/** Varias de una vez: `texto` con una por línea, `palabra | definición | pista`. */
export const createAdminPalabrasEnLote = async (categoria, texto) =>
  unwrapEntity(await adminRequest("/admin/juegos/palabras/lote", { method: "POST", json: { categoria, texto } }));

export const patchAdminPalabra = async (id, body) =>
  unwrapEntity(await adminRequest(`/admin/juegos/palabras/${encodeURIComponent(id)}`, { method: "PATCH", json: body }));

export const deleteAdminPalabra = async (id) =>
  adminRequest(`/admin/juegos/palabras/${encodeURIComponent(id)}`, { method: "DELETE" });
