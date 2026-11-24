/**
 * El núcleo de las llamadas a la API: lo que antes repetían, cada uno a su manera, los
 * tres clientes del sitio (`lib/api.js` para el panel, `lib/userApi.js` para el lector y
 * `services/apiClient.js` para lo público). Arma la dirección (la API o el quiosco), pone
 * las cabeceras, hace la petición, lee el JSON, y sabe leer el error y desenvolver la
 * respuesta. La sesión (renovarla, cerrarla) está en `sesion.js`.
 *
 * Los tres clientes siguen existiendo con sus nombres de siempre, como envoltorios de
 * esto, para no tocar a sus ~50 importadores. Lo que cada uno hacía distinto -- el texto
 * del error, qué devuelve cuando la respuesta no trae `data`, si un cuerpo que no es JSON
 * es `{}` o `null` -- se ha dejado como estaba, con una función o una opción por cliente:
 * igualarlo cambiaría textos que se ven y respuestas que leen las pantallas. Si un día se
 * iguala, es aquí, en un commit aparte y con sus pruebas (`lib/api.test.mjs`,
 * `lib/userApi.test.mjs`, `services/apiClient.test.mjs`).
 *
 * Nadie fuera de `src/api/` llama a `fetch` por su cuenta: lo vigila
 * `src/arquitectura.test.mjs`, con la lista de los que tienen un motivo para hacerlo.
 */
import { tActual } from "../i18n/motor";
import { baseDelQuiosco, vaPorElQuiosco } from "./quiosco.js";

/** La dirección de la API (`VITE_API_URL`), sin la barra final. */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** El error de una llamada a la API: el texto que se puede enseñar y lo que dijo el servidor. */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, code?: string, details?: unknown, url?: string }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details ?? null;
    this.url = opts.url;
  }
}

/** `base` + la ruta (con su barra) + la consulta, sin los valores vacíos. */
export const armarUrl = (base, ruta, consulta) => {
  const normalizada = ruta?.startsWith("/") ? ruta : `/${ruta ?? ""}`;
  const url = new URL(`${base}${normalizada}`);
  if (consulta && typeof consulta === "object") {
    Object.entries(consulta).forEach(([clave, valor]) => {
      if (valor === undefined || valor === null || valor === "") return;
      url.searchParams.set(clave, String(valor));
    });
  }
  return url.toString();
};

/**
 * Una petición a la API. No lanza por el estado HTTP (eso lo decide quien llama), solo
 * si no hay red: devuelve `{ res, payload, url }`.
 *
 * `opciones`, las de `fetch` y además: `token` (va como `Authorization: Bearer`), `json`
 * (el cuerpo, con su `Content-Type`), `query` y `idempotencyKey` (reintentar con la misma
 * clave devuelve la respuesta de la primera vez en vez de crear otra cosa; ver
 * `lib/idempotencia.js`). Un `body` que no es JSON -- un `FormData` al subir un archivo
 * -- va tal cual y sin `Content-Type`: el navegador pone el suyo, con el separador.
 *
 * `como`: `base` (por omisión la API), `conQuiosco` (si una lectura pública y sin sesión
 * puede salir por el quiosco, `quiosco.js`) y `siNoEsJson` (qué vale `payload` cuando la
 * respuesta no es JSON).
 *
 * @param {string} ruta
 * @param {RequestInit & { token?: string, json?: unknown, query?: Record<string, unknown>, idempotencyKey?: string }} [opciones]
 * @param {{ base?: string, conQuiosco?: boolean, siNoEsJson?: unknown }} [como]
 */
export const pedir = async (ruta, opciones = {}, { base = API_BASE, conQuiosco = false, siNoEsJson = {} } = {}) => {
  const { token, json, headers: iniciales, body, query, idempotencyKey, ...resto } = opciones;
  const headers = { ...iniciales };
  if (json !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const quiosco = conQuiosco ? baseDelQuiosco() : null;
  const porElQuiosco = Boolean(quiosco) && vaPorElQuiosco(ruta, { method: resto.method ?? "GET", headers });
  const url = armarUrl(porElQuiosco ? quiosco : base, ruta, query);
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const res = await fetch(url, { ...resto, headers, body: json !== undefined ? JSON.stringify(json) : body });
  const payload = await res.json().catch(() => siNoEsJson);
  return { res, payload, url };
};

/* ─── Archivos (bytes, no JSON) ───────────────────────────────────────────── */

/**
 * Pide un archivo a la API (`ruta` puede llevar ya su consulta). Devuelve la `Response`
 * tal cual: quien llama mira `ok` y saca los bytes. Las descargas del panel y del lector
 * van así porque un enlace normal no manda la cabecera de sesión.
 *
 * @param {string} ruta
 * @param {{ headers?: Record<string, string> }} [opciones]
 */
export const pedirArchivo = (ruta, { headers = {} } = {}) => fetch(armarUrl(API_BASE, ruta), { headers });

/**
 * Entrega unos bytes al navegador como una descarga normal. Sin soltar el blob después,
 * se queda en memoria hasta que se recargue la página.
 *
 * @param {Blob} blob
 * @param {string} nombre
 * @param {{ soltarTrasMs?: number }} [opciones] 0: se suelta en el acto; si no, a los ms dichos.
 */
export const entregarDescarga = (blob, nombre, { soltarTrasMs = 0 } = {}) => {
  const objeto = URL.createObjectURL(blob);
  try {
    const enlace = document.createElement("a");
    enlace.href = objeto;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  } finally {
    if (soltarTrasMs) setTimeout(() => URL.revokeObjectURL(objeto), soltarTrasMs);
    else URL.revokeObjectURL(objeto);
  }
};

/* ─── Leer el error (uno por cliente, como estaban) ──────────────────────── */

/**
 * El del panel: un `Error` con `status`, `code` y `details`, y el texto que manda el
 * servidor (o el estado, o «Request failed»). El panel va solo en español y lo traduce a
 * algo legible `lib/adminErrorMessage.js`.
 */
export const errorDelPanel = (res, payload) => {
  const err = payload?.error ?? { message: res.statusText || "Request failed" };
  const error = new Error(typeof err.message === "string" ? err.message : "Request failed");
  error.status = res.status;
  error.code = err.code;
  error.details = err.details ?? payload ?? null;
  return error;
};

/** El `detail` de una validación: un texto, o una lista de textos o de `{ msg }`. */
const textoDelDetalle = (payload) => {
  const detail = payload?.detail;
  if (Array.isArray(detail)) {
    const partes = detail
      .map((d) => {
        if (typeof d === "string") return d;
        if (d && typeof d.msg === "string") return d.msg;
        return null;
      })
      .filter(Boolean);
    if (partes.length) return partes.join(" ");
  }
  if (typeof detail === "string") return detail;
  return null;
};

/**
 * El del lector: un `ApiError`. Prefiere el texto de `error` (salvo el genérico «Request
 * failed»), después el `detail` de una validación, el `message` de arriba y el estado.
 */
export const errorDelLector = (res, payload) => {
  const err = payload?.error ?? {};
  const delError = typeof err.message === "string" ? err.message : "";
  const deArriba = typeof payload?.message === "string" ? payload.message : "";
  const message =
    (delError && delError !== "Request failed" ? delError : null) ||
    textoDelDetalle(payload) ||
    deArriba ||
    (typeof err.message === "string" ? err.message : null) ||
    res.statusText ||
    "Request failed";
  return new ApiError(message, {
    status: res.status,
    code: err.code,
    details: err.details ?? payload ?? null,
  });
};

/**
 * El de lo público (`createApiClient`): un `ApiError` con la dirección pedida. El texto de
 * respaldo puede acabar en pantalla (los estados de error lo pintan), así que sale en el
 * idioma del documento.
 */
export const errorPublico = (res, payload, url) => {
  if (!res.ok) {
    const message =
      (payload && (payload.message || payload.error?.message)) || res.statusText || tActual("cuenta.api.errorSolicitud");
    return new ApiError(String(message), {
      status: res.status,
      code: payload?.error?.code,
      details: payload?.error?.details ?? payload,
      url,
    });
  }
  const err = payload.error ?? { message: tActual("cuenta.api.errorSolicitud") };
  return new ApiError(typeof err.message === "string" ? err.message : tActual("cuenta.api.errorSolicitud"), {
    status: res.status,
    code: err.code,
    details: err.details ?? payload,
    url,
  });
};

/* ─── Desenvolver la respuesta (una por cliente, como estaban) ───────────── */

/** `{ data, meta }` si la respuesta trae `meta` (una lista por páginas). */
const conMeta = (payload) => Object.prototype.hasOwnProperty.call(payload, "meta") && payload.meta != null;

/** Panel: `data`, o `{ data, meta }`. */
export const desenvolverDelPanel = (payload) => {
  if (payload == null) return null;
  if (conMeta(payload)) return { data: payload.data, meta: payload.meta };
  return payload.data;
};

/** Lector: `data`, `{ data, meta }`, o el cuerpo entero si no trae `data`. */
export const desenvolverDelLector = (payload) => {
  if (payload == null) return null;
  if (conMeta(payload)) return { data: payload.data, meta: payload.meta };
  return payload.data !== undefined ? payload.data : payload;
};

/** Público: como el del lector, pero `{ data, meta }` solo si de verdad trae `data`. */
export const desenvolverPublico = (payload) => {
  if (!payload) return null;
  if (payload.success === false) return payload;
  if (conMeta(payload) && "data" in payload) return { data: payload.data, meta: payload.meta };
  if ("data" in payload) return payload.data;
  return payload;
};
