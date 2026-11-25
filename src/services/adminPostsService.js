import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

export { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

/**
 * @param {{
 *   page?: number,
 *   limit?: number,
 *   format?: string,
 *   status?: string,
 *   q?: string,
 *   unclassified?: boolean,
 *   firmaDesactualizada?: boolean,
 * }} [params]
 */
export const listAdminPosts = async (params = {}) => {
    const raw = await adminRequest("/admin/posts", {
        query: {
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            format: params.format || undefined,
            status: params.status || undefined,
            q: params.q || undefined,
            // The re-tagging backlog: pieces carried over from the old
            // categorisation that nobody has given a topic yet.
            unclassified: params.unclassified ? 1 : undefined,
            // Piezas de lectores cuya cuenta cambió de nombre o foto desde que se
            // aceptaron (su firma está congelada). El servidor lo atiende solo, sin
            // los demás filtros.
            firma_desactualizada: params.firmaDesactualizada ? 1 : undefined,
        },
    });
    return unwrapListResponse(raw);
};

/**
 * @param {string|number} postId
 */
export const getAdminPost = async (postId) => unwrapEntity(await adminRequest(`/admin/posts/${postId}`));

/**
 * @param {Record<string, unknown>} body
 */
export const createAdminPost = async (body, idempotencyKey) =>
    unwrapEntity(
        await adminRequest("/admin/posts", { method: "POST", json: body, idempotencyKey }),
    );

/**
 * @param {string|number} postId
 * @param {Record<string, unknown>} body
 */
export const patchAdminPost = async (postId, body) =>
    unwrapEntity(await adminRequest(`/admin/posts/${postId}`, { method: "PATCH", json: body }));

/**
 * La pieza de un lector (propuesta aceptada): copia otra vez a la firma el nombre y la
 * foto que tiene hoy su cuenta. Guarda al momento y devuelve la pieza.
 * @param {string|number} postId
 */
export const usarFirmaDeSuCuenta = async (postId) =>
    unwrapEntity(await adminRequest(`/admin/posts/${postId}/colaborador/usar-su-cuenta`, { method: "POST" }));

/**
 * La pieza deja de contar como del lector que la propuso. La firma no se toca.
 * @param {string|number} postId
 */
export const quitarVinculoConElLector = async (postId) =>
    unwrapEntity(await adminRequest(`/admin/posts/${postId}/colaborador`, { method: "DELETE" }));

/** Si el servidor puede traducir con Claude (tiene la clave): `{ disponible, modelo }`. */
export const getTraductor = async () => unwrapEntity(await adminRequest("/admin/posts/traducir"));

/** Cada cuánto se pregunta por una traducción que sigue en marcha, y cuánto se espera en total. */
export const ESPERA_DE_LA_TRADUCCION = { cadaMs: 2000, topeMs: 4 * 60 * 1000 };

const TRADUCCION = "/admin/traducciones";

/** Un error como los del panel (`adminErrorMessage` enseña el texto de los `translation_*`). */
const errorDeTraduccion = (message, status, code) => Object.assign(new Error(message), { status, code });

const YA_HAY_UNA = () =>
    errorDeTraduccion("Ya hay una traducción en marcha. Espere a que termine.", 409, "translation_in_progress");
const SE_INTERRUMPIO = () =>
    errorDeTraduccion("La traducción se interrumpió. Vuelva a pedirla.", 404, "translation_interrupted");
const TARDA_DEMASIADO = () =>
    errorDeTraduccion(
        "La traducción tarda más de 4 minutos. Espere un momento y vuelva a pedirla.",
        504,
        "translation_timeout",
    );

/** `ms` de espera, o hasta que `signal` diga que se deja (entonces lanza un `AbortError`). */
const esperar = (ms, signal) =>
    new Promise((resolve, reject) => {
        const dejar = () => {
            clearTimeout(reloj);
            reject(new DOMException("Se dejó de esperar la traducción.", "AbortError"));
        };
        const reloj = setTimeout(() => {
            signal?.removeEventListener("abort", dejar);
            resolve();
        }, ms);
        if (signal?.aborted) dejar();
        else signal?.addEventListener("abort", dejar, { once: true });
    });

/**
 * Traduce al inglés lo que hay en el formulario (guardado o no) y lo devuelve sin
 * guardar nada: `{ title, excerpt, content }`.
 *
 * La IA puede tardar hasta un minuto y medio, y una petición que espera tanto la corta
 * Cloudflare (y ocupa uno de los cuatro hilos del servidor). Por eso va en segundo plano:
 * `POST /admin/traducciones` contesta con la traducción si la tiene en 8 s; si no, con
 * `{ en_marcha, id }`, y aquí se pregunta por ese id cada `cadaMs` hasta que llega la
 * traducción o su error, o hasta `topeMs`. `signal` corta la espera (al cerrar la pieza).
 *
 * La ruta vieja, `POST /admin/posts/traducir`, sigue en el backend para el bot de Saúl.
 *
 * @param {{ title: string, excerpt: string, content: string }} campos
 * @param {{ signal?: AbortSignal, cadaMs?: number, topeMs?: number }} [opciones]
 */
export const traducirTextos = async (campos, opciones = {}) => {
    const { signal, cadaMs, topeMs } = { ...ESPERA_DE_LA_TRADUCCION, ...opciones };
    const empezo = Date.now();
    let r;
    try {
        r = unwrapEntity(await adminRequest(TRADUCCION, { method: "POST", json: campos, signal }));
    } catch (err) {
        throw err?.status === 409 ? YA_HAY_UNA() : err;
    }
    while (r?.en_marcha) {
        if (Date.now() - empezo >= topeMs) throw TARDA_DEMASIADO();
        await esperar(cadaMs, signal);
        try {
            r = unwrapEntity(await adminRequest(`${TRADUCCION}/${encodeURIComponent(r.id)}`, { signal }));
        } catch (err) {
            // 404: el servidor ya no la tiene (se reinició entretanto). 409: otra cuenta
            // estaba traduciendo y esta no llegó a empezar.
            if (err?.status === 404) throw SE_INTERRUMPIO();
            throw err?.status === 409 ? YA_HAY_UNA() : err;
        }
    }
    return r;
};

/**
 * El tema y el lugar que parece tratar un texto, sin guardar nada. Lo calcula el servidor
 * con reglas, sin IA.
 * @param {{ title: string, excerpt: string, content: string }} campos
 * @returns {Promise<{ temas: {id: number, name: string}[], lugares: {id: number, name: string}[] }>}
 */
export const sugerirClasificacion = async (campos) =>
    unwrapEntity(await adminRequest("/admin/posts/sugerir-clasificacion", { method: "POST", json: campos }));

/**
 * @param {string|number} postId
 */
export const publishAdminPost = async (postId) =>
    unwrapEntity(
        await adminRequest(`/admin/posts/${postId}/publish`, { method: "PATCH", json: {} })
    );

/**
 * @param {string|number} postId
 */
export const unpublishAdminPost = async (postId) =>
    unwrapEntity(
        await adminRequest(`/admin/posts/${postId}/unpublish`, { method: "PATCH", json: {} })
    );

/**
 * @param {string|number} postId
 */
export const deleteAdminPost = async (postId) =>
    adminRequest(`/admin/posts/${postId}`, { method: "DELETE" });

