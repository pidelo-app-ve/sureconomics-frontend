/**
 * Lo que el sitio le pide al servidor del boletín, sin sesión: apuntarse, darse de baja y
 * volver con el token del enlace. Lo del panel (la lista y su CSV) va en `admin/api.js`.
 */
import { createApiClient } from "../../services/apiClient";
import { registrarAlta } from "../../lib/analitica";

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
 *
 * Tras el acierto se avisa a la medición (`registrarAlta`), que suma un alta al canal
 * por el que llegó la visita: es lo que deja saber de dónde vienen los suscriptores.
 * Va aquí y no en cada formulario para que ninguno se quede sin contar. No lleva el
 * correo, y si el lector no aceptó las cookies no manda nada.
 */
export const subscribeToNewsletter = async (email, { source, honeypot = "", turnstile = "", client } = {}) => {
  const c = ensureClient(client);
  const respuesta = await c.request("/newsletter", {
    method: "POST",
    json: { email, source, website: honeypot, turnstile },
  });
  registrarAlta();
  return respuesta;
};

/** Salir de la lista con el token que viaja en el enlace del correo. */
export const unsubscribeFromNewsletter = async (token, { client } = {}) => {
  const c = ensureClient(client);
  return c.request("/newsletter/baja", { method: "POST", json: { token } });
};

/**
 * Volver a la lista con el mismo enlace de baja. Es la única forma de volver de quien se
 * dio de baja: el formulario de alta ya no reactiva (cualquiera puede escribir cualquier
 * correo en él), y este token solo lo tiene quien recibe el boletín.
 */
export const volverAlBoletin = async (token, { client } = {}) => {
  const c = ensureClient(client);
  return c.request("/newsletter/volver", { method: "POST", json: { token } });
};
