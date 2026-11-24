import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

/**
 * Una página de lectores. Filtros opcionales, solo si están puestos: `q` (nombre, apellido
 * o correo), `activo` y `verificado` (`si`/`no`) y `colaborador` (`si`/`no`/`sin_cambiar`).
 */
export const listAdminUsers = async (params = {}) => {
  const filtros = Object.fromEntries(
    ["q", "activo", "verificado", "colaborador"].filter((k) => params[k]).map((k) => [k, params[k]]),
  );
  const raw = await adminRequest("/admin/users", {
    query: { page: params.page ?? 1, limit: params.limit ?? 20, ...filtros },
  });
  return unwrapListResponse(raw);
};

export const getAdminUser = async (id) =>
  unwrapEntity(await adminRequest(`/admin/users/${encodeURIComponent(id)}`));

export const patchAdminUser = async (id, body) =>
  unwrapEntity(await adminRequest(`/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", json: body }));

export const setAdminUserCollabEnabled = async (id, enabled) =>
  unwrapEntity(
    await adminRequest(`/admin/users/${encodeURIComponent(id)}/collaborative-submissions`, {
      method: "PATCH",
      json: { enabled },
    })
  );

export const setAdminUserActive = async (id, enabled) =>
  unwrapEntity(
    await adminRequest(`/admin/users/${encodeURIComponent(id)}/active`, {
      method: "PATCH",
      json: { enabled },
    })
  );
