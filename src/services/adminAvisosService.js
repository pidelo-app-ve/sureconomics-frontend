import { adminRequest } from "../lib/api";
import { leerAvisos, leerBot, leerCandidatos } from "../lib/avisos";
import { unwrapEntity } from "./adminResponseUtils";

/* —— Avisos de noticias ——
   Los hechos que la redacción debería mirar hoy (`services/avisos_service.py` en el
   backend). Se crean solos al final de cada ciclo de titulares; aquí se ven, se toman y
   se descartan. Lo que devuelve cada función ya viene leído (`lib/avisos.js`): la página
   no adivina nombres. */

/** Los avisos de hoy, con si están encendidos y cuántos quedan. */
export const traerAvisos = async () => leerAvisos(unwrapEntity(await adminRequest("/admin/avisos")));

/** Lo que se avisaría ahora mismo. No crea nada: sirve para mirar antes de encender. */
export const traerCandidatos = async () =>
  leerCandidatos(unwrapEntity(await adminRequest("/admin/avisos/candidatos")));

/** Enciende o apaga los avisos. Apagar no toca los que ya existen. */
export const encenderAvisos = async (activos) =>
  unwrapEntity(await adminRequest("/admin/avisos/ajustes", { method: "PUT", json: { activos } }));

/** «Esto lo hago yo». Si ya lo tomó otra persona, el servidor responde 409 con su nombre. */
export const tomarAviso = async (id) => adminRequest(`/admin/avisos/${id}/tomar`, { method: "POST" });

/** Lo devuelve a pendiente, para otra persona. Solo quien lo tomó. */
export const soltarAviso = async (id) => adminRequest(`/admin/avisos/${id}/soltar`, { method: "POST" });

/** «Esto no», con su motivo: `ya_la_dimos`, `no_es_nuestro_tema` o `poca_cosa`. */
export const descartarAviso = async (id, motivo) =>
  adminRequest(`/admin/avisos/${id}/descartar`, { method: "POST", json: { motivo } });

/**
 * Convierte el aviso en una pieza en borrador y lo aparta para quien lo pide. Con `ia`,
 * el servidor lee el artículo de cada medio, la IA escribe la noticia y se comprueban
 * sus cifras y sus citas (puede tardar medio minuto); sin ella, nace vacía con el título
 * y las fuentes puestas.
 * Devuelve la clave de la pieza.
 */
export const redactarAviso = async (id, { ia = true } = {}) => {
  const data = unwrapEntity(await adminRequest(`/admin/avisos/${id}/redactar`, { method: "POST", json: { ia } }));
  return { piezaId: data?.post_id ?? null, yaExistia: data?.ya_existia === true };
};

/** El bot de Telegram de la redacción: si está listo, su @nombre y quién está vinculado. */
export const traerBot = async () => leerBot(unwrapEntity(await adminRequest("/admin/avisos/bot")));

/** Le dice a Telegram adónde llamar. Solo el admin. Devuelve el estado nuevo. */
export const conectarBot = async () =>
  leerBot(unwrapEntity(await adminRequest("/admin/avisos/bot/conectar", { method: "POST" })));
