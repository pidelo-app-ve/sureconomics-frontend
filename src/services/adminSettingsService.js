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
