import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/**
 * El panel de publicidad.
 *
 * Como en Educación, **todo lo que toca una campaña devuelve la campaña entera** y no
 * sólo el campo tocado. Aquí el motivo es más fuerte todavía: activar una campaña puede
 * fallar por algo que no está en el formulario que se envió -- no tiene ninguna pieza
 * activa --, y cambiar los segmentos reemplaza la lista completa. Una respuesta parcial
 * obligaría a la pantalla a adivinar el estado resultante, y a equivocarse el día que
 * una regla cambie en el servidor.
 */

export const listar = async () => {
  const datos = unwrapEntity(await adminRequest("/admin/publicidad/anunciantes"));
  return {
    anunciantes: Array.isArray(datos?.anunciantes) ? datos.anunciantes : [],
    ajustes: datos?.ajustes ?? {},
  };
};

export const crearAnunciante = async (datos) =>
  unwrapEntity(
    await adminRequest("/admin/publicidad/anunciantes", { method: "POST", json: datos }),
  );

export const actualizarAnunciante = async (id, datos) =>
  unwrapEntity(
    await adminRequest(`/admin/publicidad/anunciantes/${id}`, { method: "PATCH", json: datos }),
  );

export const borrarAnunciante = async (id) =>
  unwrapEntity(await adminRequest(`/admin/publicidad/anunciantes/${id}`, { method: "DELETE" }));

export const crearCampana = async (anuncianteId, datos) =>
  unwrapEntity(
    await adminRequest(`/admin/publicidad/anunciantes/${anuncianteId}/campanas`, {
      method: "POST",
      json: datos,
    }),
  );

export const actualizarCampana = async (id, datos) =>
  unwrapEntity(
    await adminRequest(`/admin/publicidad/campanas/${id}`, { method: "PATCH", json: datos }),
  );

export const borrarCampana = async (id) =>
  unwrapEntity(await adminRequest(`/admin/publicidad/campanas/${id}`, { method: "DELETE" }));

export const crearPieza = async (campanaId, datos) =>
  unwrapEntity(
    await adminRequest(`/admin/publicidad/campanas/${campanaId}/piezas`, {
      method: "POST",
      json: datos,
    }),
  );

export const actualizarPieza = async (id, datos) =>
  unwrapEntity(
    await adminRequest(`/admin/publicidad/piezas/${id}`, { method: "PATCH", json: datos }),
  );

export const borrarPieza = async (id) =>
  unwrapEntity(await adminRequest(`/admin/publicidad/piezas/${id}`, { method: "DELETE" }));

export const getResumen = async (dias = 30) =>
  unwrapEntity(await adminRequest("/admin/publicidad/resumen", { query: { dias } }));

export const fijarAjustes = async (datos) =>
  unwrapEntity(await adminRequest("/admin/publicidad/ajustes", { method: "PATCH", json: datos }));
