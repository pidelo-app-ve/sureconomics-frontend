/**
 * Hablar con la API desde la parte del lector: lo público (`userPublicRequest`), lo que
 * pide su sesión (`userRequest`), lo que la usa si la hay (`userOptionalAuthRequest`) y
 * las descargas protegidas. El trabajo lo hace el núcleo, `src/api/` (`nucleo.js` y
 * `sesion.js`); aquí queda lo propio del lector: su sesión (`userAuthStorage.js`), su
 * forma de leer el error y de desenvolver la respuesta, el quiosco para las lecturas
 * públicas, y su política si renovar la sesión falla (`CERRAR_SIEMPRE`: ver allí por qué
 * es distinta de la del panel).
 */
import { tActual } from "../i18n/motor";
import {
  API_BASE,
  ApiError,
  desenvolverDelLector,
  entregarDescarga,
  errorDelLector,
  pedir,
  pedirArchivo,
} from "../api/nucleo.js";
import { CERRAR_SIEMPRE, SEGUIR, crearSesion } from "../api/sesion.js";
import { clearUserAuth, persistUserAuth, readUserAuth } from "./userAuthStorage";

export const USER_AUTH_SYNC_EVENT = "sureconomics-user-auth-sync";

/** Las peticiones del lector: las lecturas públicas y sin sesión pueden ir por el quiosco. */
const pedirDelLector = (path, options) => pedir(path, options, { conQuiosco: true });

/** La respuesta ya leída: el error del lector si no fue bien; si no, desenvuelta. */
const responder = ({ res, payload }) => {
  if (!res.ok || payload?.success === false) {
    throw errorDelLector(res, payload ?? {});
  }
  return desenvolverDelLector(payload);
};

const sesion = crearSesion({
  almacen: { leer: readUserAuth, guardar: persistUserAuth, borrar: clearUserAuth },
  evento: USER_AUTH_SYNC_EVENT,
  rutaDeRenovar: "/user-auth/refresh",
  pedir: pedirDelLector,
  abrir: responder,
  sinRenovacion: () => new ApiError("No hay token de renovación", { status: 401 }),
  renovacionInvalida: () => new ApiError("Respuesta de renovación inválida", { status: 401 }),
});

export const dispatchUserAuthSync = sesion.avisar;

/** Sin `VITE_API_URL` no se pide nada (iría al dominio de la página). */
const exigirBase = () => {
  if (!API_BASE) {
    throw new ApiError("Falta VITE_API_URL en el entorno.", { status: 0 });
  }
};

/** Estos dos mensajes sí llegan a la pantalla (los pintan los estados de error de la cuenta): en el idioma del documento. */
const debeIniciarSesion = () => new ApiError(tActual("cuenta.api.debeIniciarSesion"), { status: 401 });
const sesionExpirada = () => new ApiError(tActual("cuenta.api.sesionExpirada"), { status: 401 });

/**
 * Public JSON request (no consumer bearer).
 * @param {string} path
 * @param {Omit<RequestInit, 'body'> & { json?: unknown, query?: Record<string, unknown> }} [options]
 */
export const userPublicRequest = async (path, options = {}) => {
  exigirBase();
  return responder(await pedirDelLector(path, options));
};

/**
 * Igual que `userRequest`, pero **sin exigir sesión**: manda el token si hay uno y se
 * conforma si no.
 *
 * Existe por los informes de descarga abierta. `userRequest` corta con un 401 propio
 * antes de tocar la red cuando no hay token guardado -- lo cual es correcto para todo lo
 * demás, porque ahorra un viaje que iba a fallar. Pero en un informe abierto el servidor
 * habría contestado 200, y ese 401 del navegador dejaba al lector anónimo sin poder
 * descargar algo que la redacción abrió a todos. El fallo no era del backend, así que las
 * pruebas del backend no podían verlo.
 *
 * Se manda el token cuando lo hay porque el servidor identifica al lector si puede, y
 * distinguir aquí quién es sería duplicar una decisión que ya se toma allá.
 *
 * @returns {Promise<Record<string, unknown>>}
 */
export const userOptionalAuthRequest = async (path, options = {}) => {
  exigirBase();
  // Sólo se refresca si de verdad hay sesión que refrescar.
  await sesion.renovarSiVaACaducar({ soloConAcceso: true });
  return responder(await pedirDelLector(path, { ...options, token: readUserAuth().accessToken || undefined }));
};

/**
 * @returns {Promise<Record<string, unknown>>}
 */
export const refreshUserTokens = sesion.renovar;

/**
 * Authenticated consumer request (Bearer user access). On 401 refreshes once.
 * @param {string} path
 * @param {Omit<RequestInit, 'body'> & { json?: unknown, query?: Record<string, unknown> }} [options]
 */
export const userRequest = async (path, options = {}) => {
  exigirBase();
  await sesion.renovarSiVaACaducar();

  if (!readUserAuth().accessToken) {
    throw debeIniciarSesion();
  }

  const respuesta = await sesion.conRenovacion(
    () => pedirDelLector(path, { ...options, token: readUserAuth().accessToken }),
    { siFalla: CERRAR_SIEMPRE, errorCaducada: sesionExpirada },
  );

  if (respuesta.res.status === 401) {
    sesion.cerrar();
  }

  return responder(respuesta);
};

/**
 * Descarga un archivo protegido con la sesión del lector.
 *
 * Hace falta porque `window.open` no manda cabeceras: el token se queda fuera y el
 * servidor contesta 401. Así que se pide con `fetch`, que sí lo lleva, y los bytes se
 * entregan al navegador como una descarga normal.
 *
 * Es el mismo patrón de blob que usan los otros sistemas del equipo con R2, y por la
 * misma razón: los permisos los decide la aplicación en cada petición, no una firma en
 * la dirección que cualquiera podría reenviar.
 *
 * Refresca el token una vez si venció, igual que `userRequest`; pero si no puede, no
 * cierra la sesión: sube el 401 como error.
 */
export const descargarArchivoDeUsuario = async (
  path,
  { nombreSugerido, exigirSesion = true, comoBlob = false } = {},
) => {
  exigirBase();
  await sesion.renovarSiVaACaducar();

  // La cabecera se arma sólo si hay token. Mandar `Bearer undefined` no es lo mismo
  // que no mandar nada: el servidor intentaria leerlo.
  const hacer = async () => {
    const token = readUserAuth().accessToken;
    return { res: await pedirArchivo(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} }) };
  };

  // `exigirSesion: false` es para los informes de descarga abierta, donde el servidor
  // contesta 200 sin sesión. Por omisión se exige, que es lo que quiere todo lo demás:
  // cortar aquí ahorra un viaje que iba a volver 401.
  if (exigirSesion && !readUserAuth().accessToken) {
    throw debeIniciarSesion();
  }

  const { res } = await sesion.conRenovacion(hacer, { siFalla: SEGUIR });

  if (!res.ok) {
    // El cuerpo de un error sí es JSON; el de un acierto son bytes.
    const payload = await res.json().catch(() => ({}));
    throw errorDelLector(res, payload ?? {});
  }

  const blob = await res.blob();

  // `comoBlob` devuelve los bytes en vez de provocar la descarga. Lo pide el audio de
  // una leccion de pago: un `<audio src>` no manda la cabecera de sesion, asi que la
  // unica forma de reproducir un archivo cerrado es traerlo con `fetch` y darle al
  // elemento un blob ya descargado.
  if (comoBlob) return blob;

  // El nombre lo pone el servidor en `Content-Disposition`; si no llega, el sugerido.
  const cabecera = res.headers.get("Content-Disposition") || "";
  const enCabecera = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cabecera);
  const nombre = (enCabecera && decodeURIComponent(enCabecera[1])) || nombreSugerido || "descarga";

  // Se suelta al segundo: un informe de veinte megas en memoria se nota.
  entregarDescarga(blob, nombre, { soltarTrasMs: 1000 });
  return { nombre, bytes: blob.size };
};
