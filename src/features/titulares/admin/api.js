import { adminRequest } from "../../../lib/api";

/**
 * Los titulares en caliente en el panel (`/admin/headlines…` en el backend, ver
 * `services/titulares/` allí). Aparte del sitio público: el sitio no carga nada de esto.
 *
 * Cada función devuelve la respuesta tal cual llega (`adminRequest`): quien la llama la
 * desenvuelve con `unwrapEntity` si necesita los datos, como hacía cuando las llamadas
 * iban escritas dentro de cada componente.
 */

/** Cómo va la redacción: el último ciclo (con lo que el juez frenó), lo gastado y si está en pausa. */
export const getResumenDeTitulares = () => adminRequest("/admin/headlines/resumen");

/** Los dos interruptores (publicación automática, sección en la web), el modo del juez y los motivos de borrado. */
export const getAjustesDeTitulares = () => adminRequest("/admin/headlines/settings");

/** Cambia uno de los ajustes (`{ [clave]: valor }`). */
export const cambiarAjusteDeTitulares = (clave, valor) =>
  adminRequest("/admin/headlines/settings", { method: "PUT", json: { [clave]: valor } });

/** Los titulares de las últimas `horas`: `vista` es «publicados» o «borrados». */
export const getTitularesDelPanel = ({ vista, horas, limite }) =>
  adminRequest("/admin/headlines", { query: { vista, horas, limite } });

/** Los medios que lee el sistema, con su nivel y si están silenciados. */
export const getFuentesDeTitulares = () => adminRequest("/admin/headlines/fuentes");

/** «Borrar»: con un motivo; el evento no vuelve aunque lleguen más fuentes. */
export const borrarTitular = (id, { motivo, nota }) =>
  adminRequest(`/admin/headlines/${id}`, { method: "DELETE", json: { motivo, nota } });

/** «Restaurar» uno borrado: vuelve a la web. */
export const restaurarTitular = (id) => adminRequest(`/admin/headlines/${id}/restore`, { method: "POST" });

/** «Fijar arriba» durante `minutos`. */
export const fijarTitular = (id, minutos) =>
  adminRequest(`/admin/headlines/${id}/pin`, { method: "POST", json: { minutos } });

/** «Quitar de arriba». */
export const desfijarTitular = (id) => adminRequest(`/admin/headlines/${id}/pin`, { method: "DELETE" });

/** «Editar»: los textos cambiados (`json`), en los dos idiomas; el titular queda bloqueado para el sistema. */
export const corregirTitular = (id, json) => adminRequest(`/admin/headlines/${id}`, { method: "PATCH", json });

/** Quién hizo qué con un titular, y de qué notas salió. */
export const getHistorialDeTitular = (id) => adminRequest(`/admin/headlines/${id}/historial`);

const rutaDeFuente = (id) => `/admin/headlines/fuentes/${encodeURIComponent(id)}`;

/** «Silenciar» un medio; con `retirar`, se borran los titulares donde era la única fuente. */
export const silenciarFuente = (id, retirar) =>
  adminRequest(`${rutaDeFuente(id)}/mute`, { method: "POST", json: { retirar } });

/** «Cambiar nivel» de un medio (1 oficial … 4 Google News o medio pequeño). */
export const cambiarNivelDeFuente = (id, nivel) =>
  adminRequest(`${rutaDeFuente(id)}/nivel`, { method: "POST", json: { nivel } });

/** «Activar» o «Reactivar» un medio silenciado. */
export const activarFuente = (id) => adminRequest(`${rutaDeFuente(id)}/unmute`, { method: "POST" });
