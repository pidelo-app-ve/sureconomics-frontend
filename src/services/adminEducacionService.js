import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/**
 * El panel de Educacion.
 *
 * Todas las operaciones sobre lecciones devuelven **el modulo entero**, no la leccion
 * tocada. Es a proposito: crear, mover o borrar una leccion renumera a las demas, asi
 * que la respuesta parcial obligaria a la pantalla a recalcular posiciones por su cuenta
 * -- y a equivocarse el dia que la regla de numeracion cambie en el servidor.
 */

export const listarModulos = async () =>
  unwrapEntity(await adminRequest("/admin/education/modules"))?.modulos ?? [];

export const crearModulo = async (datos) =>
  unwrapEntity(await adminRequest("/admin/education/modules", { method: "POST", json: datos }));

export const actualizarModulo = async (id, datos) =>
  unwrapEntity(
    await adminRequest(`/admin/education/modules/${id}`, { method: "PATCH", json: datos }),
  );

export const borrarModulo = async (id) =>
  unwrapEntity(await adminRequest(`/admin/education/modules/${id}`, { method: "DELETE" }));

export const crearLeccion = async (moduleId, datos) =>
  unwrapEntity(
    await adminRequest(`/admin/education/modules/${moduleId}/lessons`, {
      method: "POST",
      json: datos,
    }),
  );

export const actualizarLeccion = async (lessonId, datos) =>
  unwrapEntity(
    await adminRequest(`/admin/education/lessons/${lessonId}`, { method: "PATCH", json: datos }),
  );

export const moverLeccion = async (lessonId, salto) =>
  unwrapEntity(
    await adminRequest(`/admin/education/lessons/${lessonId}/mover`, {
      method: "POST",
      json: { salto },
    }),
  );

export const borrarLeccion = async (lessonId) =>
  unwrapEntity(
    await adminRequest(`/admin/education/lessons/${lessonId}`, { method: "DELETE" }),
  );

/**
 * Ingresos, ventas y embudo de los últimos 30 días.
 *
 * Aparte del listado y no dentro: el panel pinta primero los módulos, que es lo que se
 * vino a editar, y las cifras llegan cuando lleguen.
 */
export const getResumenEducacion = async () =>
  unwrapEntity(await adminRequest("/admin/education/resumen"));
