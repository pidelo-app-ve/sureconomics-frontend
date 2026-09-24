import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/**
 * Los números del boletín: montarlos, probarlos y mandarlos.
 *
 * Como en publicidad, **todo lo que toca un número devuelve el número entero**: añadir
 * una página renumera las demás y quitar una también, así que una respuesta parcial
 * obligaría a la pantalla a adivinar el orden resultante.
 */

const base = "/admin/boletin/numeros";

export const listarNumeros = async () => {
  const datos = unwrapEntity(await adminRequest(base));
  return Array.isArray(datos?.numeros) ? datos.numeros : [];
};

export const verNumero = async (id) => unwrapEntity(await adminRequest(`${base}/${id}`));

/** Cada número nace atado a un lunes. Sin asunto, el servidor lo saca de la fecha. */
export const crearNumero = async (sendOn, subject) =>
  unwrapEntity(
    await adminRequest(base, {
      method: "POST",
      json: { send_on: sendOn, subject: subject || undefined },
    }),
  );

/** Los próximos lunes y cuáles ya tienen número. */
export const listarLunes = async () => {
  const datos = unwrapEntity(await adminRequest("/admin/boletin/lunes"));
  return Array.isArray(datos?.lunes) ? datos.lunes : [];
};

export const actualizarNumero = async (id, datos) =>
  unwrapEntity(await adminRequest(`${base}/${id}`, { method: "PATCH", json: datos }));

export const borrarNumero = async (id) =>
  unwrapEntity(await adminRequest(`${base}/${id}`, { method: "DELETE" }));

export const anadirPagina = async (id, mediaId) =>
  unwrapEntity(
    await adminRequest(`${base}/${id}/paginas`, { method: "POST", json: { media_id: mediaId } }),
  );

export const quitarPagina = async (id, paginaId) =>
  unwrapEntity(await adminRequest(`${base}/${id}/paginas/${paginaId}`, { method: "DELETE" }));

/** `orden` es la lista completa de ids de página, en el orden nuevo. */
export const ordenarPaginas = async (id, orden) =>
  unwrapEntity(
    await adminRequest(`${base}/${id}/paginas/orden`, { method: "PUT", json: { orden } }),
  );

export const enviarPrueba = async (id, destino) =>
  unwrapEntity(
    await adminRequest(`${base}/${id}/prueba`, { method: "POST", json: { destino } }),
  );

/** Un lote. Hay que volver a llamarlo mientras `terminado` sea falso. */
export const enviarLote = async (id) =>
  unwrapEntity(await adminRequest(`${base}/${id}/enviar`, { method: "POST" }));
