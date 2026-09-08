import { createApiClient } from "./apiClient";
import { adminRequest } from "../lib/api";
import { readStoredAuth } from "../lib/authStorage";
import { unwrapListResponse } from "./adminResponseUtils";

const defaultClient = (() => {
  try {
    return createApiClient();
  } catch {
    return null;
  }
})();

const ensureClient = (client) => {
  if (client) return client;
  if (defaultClient) return defaultClient;
  return createApiClient();
};

/**
 * Apuntar un correo al boletín.
 *
 * El servidor contesta lo mismo si el correo era nuevo, si ya estaba, o si la trampa de
 * bots lo descartó — a propósito, para que nadie pueda averiguar quién está suscrito
 * escribiendo direcciones. Así que este lado tampoco distingue: un acierto es un acierto.
 *
 * `honeypot` es el campo trampa. Va vacío desde una persona; se manda de todas formas
 * porque el contrato del formulario lo incluye y así el servidor no tiene que adivinar
 * si el cliente lo soporta.
 */
export const subscribeToNewsletter = async (email, { source, honeypot = "", client } = {}) => {
  const c = ensureClient(client);
  return c.request("/newsletter", {
    method: "POST",
    json: { email, source, website: honeypot },
  });
};

/** Salir de la lista con el token que viaja en el enlace del correo. */
export const unsubscribeFromNewsletter = async (token, { client } = {}) => {
  const c = ensureClient(client);
  return c.request("/newsletter/baja", { method: "POST", json: { token } });
};

/** La lista, para el panel. */
export const listNewsletterSubscribers = async (params = {}) => {
  const raw = await adminRequest("/admin/newsletter", {
    query: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...(params.status ? { status: params.status } : {}),
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

  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const res = await fetch(`${base}/admin/newsletter/csv${query}`, {
    headers: { Authorization: `Bearer ${readStoredAuth().accessToken || ""}` },
  });
  if (!res.ok) {
    const detalle = await res.json().catch(() => ({}));
    throw new Error(detalle?.error?.message || "No se pudo descargar la lista.");
  }

  const blob = await res.blob();
  const objeto = URL.createObjectURL(blob);
  try {
    const enlace = document.createElement("a");
    enlace.href = objeto;
    enlace.download = "boletin.csv";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  } finally {
    // Sin esto el blob se queda en memoria hasta que se recargue la página.
    URL.revokeObjectURL(objeto);
  }
};
