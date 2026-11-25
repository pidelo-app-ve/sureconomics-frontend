import { adminRequest } from "../../../lib/api";
import { unwrapEntity, unwrapListResponse } from "../../../services/adminResponseUtils";
import { entregarDescarga, pedirArchivo } from "../../../api/nucleo.js";
import { readStoredAuth } from "../../../lib/authStorage";

/**
 * Lo que el panel le pide al servidor del boletín: los números (montarlos, probarlos y
 * mandarlos) y, al final, la lista de suscriptores y su CSV.
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

/**
 * Vuelve a poner en cola un número ya enviado, con un asunto nuevo si se da. No manda
 * nada: después se llama a `enviarLote` por lotes, como en un envío normal.
 */
export const reenviarNumero = async (id, asunto) =>
  unwrapEntity(
    await adminRequest(`${base}/${id}/reenviar`, {
      method: "POST",
      json: { asunto: asunto || undefined },
    }),
  );

/** Un lote. Hay que volver a llamarlo mientras `terminado` sea falso. */
export const enviarLote = async (id) =>
  unwrapEntity(await adminRequest(`${base}/${id}/enviar`, { method: "POST" }));

/** La lista, para el panel. Filtros opcionales, solo si están puestos: `status`, `q` (un trozo del correo) y `origen`. */
export const listNewsletterSubscribers = async (params = {}) => {
  const raw = await adminRequest("/admin/newsletter", {
    query: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...(params.status ? { status: params.status } : {}),
      ...(params.q ? { q: params.q } : {}),
      ...(params.origen ? { origen: params.origen } : {}),
    },
  });
  return unwrapListResponse(raw);
};

/**
 * Descarga el CSV de la lista.
 *
 * Va por `fetch` y no por un enlace normal, y esa es la única forma que funciona: el
 * endpoint pide la cabecera `Authorization`, y un `<a href>` no manda cabeceras — daría
 * un 401 y una pestaña en blanco. Se baja a memoria y se entrega al navegador como una
 * descarga, que es el mismo patrón que ya usa la descarga de informes.
 *
 * `adminRequest` no sirve aquí porque devuelve el cuerpo ya interpretado como JSON y
 * esto son bytes. Se usa antes, con una petición mínima, sólo para que refresque el
 * token si estaba a punto de caducar; y el token se lee con `readStoredAuth`, que es la
 * única función que sabe dónde vive — está en `sessionStorage` y en cuatro claves
 * separadas, no donde uno supondría.
 */
export const downloadNewsletterCsv = async ({ status } = {}) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  await adminRequest("/admin/newsletter", { query: { page: 1, limit: 1 } });

  const res = await pedirArchivo(`/admin/newsletter/csv${query}`, {
    headers: { Authorization: `Bearer ${readStoredAuth().accessToken || ""}` },
  });
  if (!res.ok) {
    const detalle = await res.json().catch(() => ({}));
    throw new Error(detalle?.error?.message || "No se pudo descargar la lista.");
  }

  entregarDescarga(await res.blob(), "boletin.csv");
};
