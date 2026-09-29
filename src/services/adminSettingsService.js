import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

export const getCollaborativeSubmissionsSettings = async () =>
  unwrapEntity(await adminRequest("/admin/settings/collaborative-submissions"));

export const patchCollaborativeSubmissionsSettings = async (body) =>
  unwrapEntity(
    await adminRequest("/admin/settings/collaborative-submissions", { method: "PATCH", json: body })
  );

/**
 * Las fotos del equipo tal como están hoy.
 *
 * Devuelve las dos caras del mismo mapa: `fotos` son direcciones, para pintar; e
 * `imagenes` son ids, que es lo que hay que devolver al guardar para que una foto que
 * nadie ha tocado siga ahí. De una dirección no se vuelve al id.
 */
export const getTeamPhotos = async () => {
  const data = unwrapEntity(await adminRequest("/admin/settings/team-photos"));
  return { fotos: data?.fotos ?? {}, imagenes: data?.imagenes ?? {} };
};

/**
 * Guarda el mapa entero: `{ id de persona: id de imagen }`.
 *
 * Entero y no por partes -- es un PUT -- porque así se puede expresar "a éste le
 * quitamos la foto": se manda el mapa sin él. Devuelve el mapa ya resuelto a
 * direcciones, que es lo que la pantalla necesita para repintarse sin pedirlo otra vez.
 */
export const putTeamPhotos = async (fotos) => {
  const data = unwrapEntity(
    await adminRequest("/admin/settings/team-photos", { method: "PUT", json: { fotos } })
  );
  return data?.fotos ?? {};
};

/** Las publicaciones curadas, con el id de imagen y su direccion. */
export const getSocial = async () =>
  unwrapEntity(await adminRequest("/admin/settings/social")) ?? { instagram: [], x: [], tiktok: [] };

/**
 * Reemplaza las dos listas de una vez. Devuelve como quedan, con las imagenes
 * resueltas, para repintar sin volver a pedir.
 */
export const putSocial = async (cuerpo) =>
  unwrapEntity(await adminRequest("/admin/settings/social", { method: "PUT", json: cuerpo }));

/** Instagram en automático: traer ya las últimas, sin esperar a la hora. */
export const sincronizarInstagram = async () =>
  unwrapEntity(
    await adminRequest("/admin/settings/social/instagram/sincronizar", { method: "POST" })
  );

/** Las publicaciones de Instagram que no salen en el sitio (lista completa de ids). */
export const ocultarInstagram = async (ids) =>
  unwrapEntity(
    await adminRequest("/admin/settings/social/instagram/ocultas", {
      method: "PUT",
      json: { ids },
    })
  );

/* —— TikTok en automático ——
   La conexión es un ida y vuelta con TikTok: `autorizarTiktok` da la dirección a la que
   se manda a quien tiene la sesión de la cuenta, y TikTok vuelve a /admin/redes/tiktok
   con `code` y `state`, que `conectarTiktok` entrega al servidor. Los tokens se quedan
   en el servidor: aquí nunca llegan. */

/** La dirección de TikTok a la que manda «Conectar TikTok». */
export const autorizarTiktok = async () =>
  unwrapEntity(await adminRequest("/admin/settings/social/tiktok/autorizar"))?.url ?? null;

/** La vuelta de TikTok. Devuelve el panel de redes con la cuenta ya conectada. */
export const conectarTiktok = async (code, state) =>
  unwrapEntity(
    await adminRequest("/admin/settings/social/tiktok/conectar", {
      method: "POST",
      json: { code, state },
    })
  );

/** Traer ya los últimos videos, sin esperar a la hora. */
export const sincronizarTiktok = async () =>
  unwrapEntity(await adminRequest("/admin/settings/social/tiktok/sincronizar", { method: "POST" }));

/** Los videos de TikTok que no salen en el sitio (lista completa de ids). */
export const ocultarTiktok = async (ids) =>
  unwrapEntity(
    await adminRequest("/admin/settings/social/tiktok/ocultos", { method: "PUT", json: { ids } })
  );

/** Olvida la conexión: «En redes» vuelve a la lista manual de TikTok. */
export const desconectarTiktok = async () =>
  unwrapEntity(await adminRequest("/admin/settings/social/tiktok", { method: "DELETE" }));
