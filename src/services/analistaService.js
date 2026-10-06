import { adminRequest } from "../lib/api";
import { userPublicRequest, userRequest } from "../lib/userApi";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

/** El ranking de El Analista: la mejor carrera de cada cuenta, en la forma que lee el juego. */
export const obtenerRegistro = async (tope = 20) => {
  const datos = await userPublicRequest("/analista/registro", { query: { tope } });
  return Array.isArray(datos) ? datos : [];
};

/**
 * Anota una carrera con la cuenta del lector. `clave` es la de idempotencia: la misma en
 * cada reintento, para que un doble toque o una respuesta perdida no sumen dos veces.
 * Devuelve `{ carrera, registro }`, con el ranking ya actualizado.
 */
export const anotarCarrera = (entrada, clave, version) =>
  userRequest("/analista/carreras", {
    method: "POST",
    json: { ...entrada, version },
    idempotencyKey: clave,
  });

/* —— Panel ——————————————————————————————————————————————————————————————— */

export const listAdminCarreras = async (params = {}) =>
  unwrapListResponse(
    await adminRequest("/admin/analista/carreras", {
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        oculta: params.oculta === undefined || params.oculta === "" ? undefined : params.oculta,
        q: params.q || undefined,
      },
    })
  );

export const moderarCarrera = async (id, oculta) =>
  unwrapEntity(
    await adminRequest(`/admin/analista/carreras/${encodeURIComponent(id)}`, {
      method: "PATCH",
      json: { oculta },
    })
  );
