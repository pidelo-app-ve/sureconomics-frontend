/**
 * Lo que el panel de publicidad le pide al servidor: anunciantes, campañas, piezas,
 * ajustes y la ocupación de los huecos.
 */
import { adminRequest } from "../../../lib/api";
import { uploadAdminMediaImage } from "../../../services/adminMediaService";
import { unwrapEntity } from "../../../services/adminResponseUtils";
import { comprobarSenal } from "../../../components/admin/aligerarImagen";
import { arteDemasiadoPesado } from "./utils";
import { prepararArte } from "./aligerarArte";

/**
 * Sube el arte de un anuncio (o el logotipo de un anunciante) a la biblioteca.
 *
 * Si pesa de más (`arteDemasiadoPesado`), antes lo aligera en el navegador al tamaño de
 * su hueco (`medidas`, de `MEDIDAS_DE_ARTE`) y sube el WebP por el mismo camino de
 * siempre. Lo va contando al selector: `onAviso` mientras trabaja («Optimizando la
 * imagen…») y `onNota` al acabar («Se aligeró de 243 KB a 88 KB»). Un GIF animado o un
 * SVG que no se puede dibujar no se suben, y el selector enseña por qué. `signal`
 * cancela (el selector se cerró): si llega antes de subir, no se sube nada.
 *
 * Sin `medidas` no sabe a qué tamaño dejarlo, y hace lo de antes: avisar y no subir.
 */
export const subirArte = async (archivo, { medidas, onAviso, onNota, signal } = {}) => {
  if (!medidas) {
    const motivo = arteDemasiadoPesado({ mime: archivo?.type, bytes: archivo?.size, nombre: archivo?.name });
    if (motivo) throw new Error(motivo);
    return uploadAdminMediaImage(archivo);
  }
  const { archivo: listo, nota } = await prepararArte(archivo, { medidas, onAviso, senal: signal });
  comprobarSenal(signal);
  if (nota) onAviso?.("Subiendo la imagen aligerada…");
  const fila = await uploadAdminMediaImage(listo);
  if (nota) onNota?.(nota);
  return fila;
};

/** `subirArte` para un hueco: lo que el selector (`AssetField`) recibe en `onUpload`. */
export const subidaDeArte = (medidas) => (archivo, opciones = {}) => subirArte(archivo, { ...opciones, medidas });

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

/**
 * La escalera en las proximas `recargas` recargas, para el mapa. Corre la misma funcion
 * que sirve al lector. `incluir`: una campana aun en borrador que se quiere ver como si
 * estuviera activa (el asistente, antes de publicar).
 */
export const getEscalera = async ({ recargas = 6, seccion = "portada", incluir } = {}) => {
  const query = { recargas, seccion };
  if (incluir) query.incluir = incluir;
  const datos = unwrapEntity(await adminRequest("/admin/publicidad/escalera", { query }));
  return {
    recargas: Array.isArray(datos?.recargas) ? datos.recargas : [],
    // El día simulado: hoy, o el primer día de la campaña incluida si empieza después.
    fecha: datos?.fecha ?? null,
  };
};

/** Las plazas fijas de cada hueco en un periodo (`desde`, `hasta` en ISO; sin ellas, hoy). */
export const getOcupacion = async ({ desde, hasta } = {}) => {
  const query = {};
  if (desde) query.desde = desde;
  if (hasta) query.hasta = hasta;
  const datos = unwrapEntity(await adminRequest("/admin/publicidad/ocupacion", { query }));
  return datos?.huecos && typeof datos.huecos === "object" ? datos.huecos : {};
};
