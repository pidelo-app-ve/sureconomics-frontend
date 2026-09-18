import { userRequest } from "../lib/userApi";
import { normalizePaginatedPosts, normalizePaginatedSubmissions } from "./contentMappers";

export const getMyBookmarks = async (params = {}) => {
  const data = await userRequest("/me/bookmarks", {
    method: "GET",
    query: { page: params.page, limit: params.limit },
  });
  return normalizePaginatedPosts(data);
};

export const addBookmark = (postId) =>
  userRequest(`/posts/${encodeURIComponent(postId)}/bookmark`, { method: "POST" });

export const removeBookmark = (postId) =>
  userRequest(`/posts/${encodeURIComponent(postId)}/bookmark`, { method: "DELETE" });

export const postComment = (slug, content, idempotencyKey) =>
  userRequest(`/posts/${encodeURIComponent(slug)}/comments`, {
    method: "POST",
    json: { content },
    idempotencyKey,
  });

export const listMySubmissions = async (params = {}) => {
  const data = await userRequest("/me/submissions", {
    method: "GET",
    query: { page: params.page, limit: params.limit },
  });
  return normalizePaginatedSubmissions(data);
};

export const createSubmission = (payload, idempotencyKey) =>
  userRequest("/me/submissions", {
    method: "POST",
    json: {
      // Only `articulo` or `noticia` — the backend refuses anything else with a
      // CHECK constraint, so sending a house format would be a 400, not a silent
      // downgrade.
      format: payload.format ?? "articulo",
      title: payload.title,
      excerpt: payload.excerpt,
      content: payload.content,
      featured_image_url: payload.featured_image_url ?? payload.featuredImageUrl ?? "",
    },
    idempotencyKey,
  });

export const getSubmissionById = async (id) => {
  const data = await userRequest(`/me/submissions/${encodeURIComponent(id)}`, { method: "GET" });
  if (!data || typeof data !== "object") {
    return null;
  }
  return {
    id: String(data.id ?? id),
    format: String(data.format ?? "articulo"),
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    content: String(data.content ?? ""),
    featuredImageUrl: String(data.featured_image_url ?? data.featuredImageUrl ?? ""),
    status: String(data.status ?? ""),
    createdAt: String(data.created_at ?? data.createdAt ?? ""),
  };
};

export const patchMySubmission = (id, patch) =>
  userRequest(`/me/submissions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    json: {
      format: patch?.format,
      title: patch?.title,
      excerpt: patch?.excerpt,
      content: patch?.content,
      featured_image_url: patch?.featured_image_url ?? patch?.featuredImageUrl,
    },
  });

export const listMySubmissionNotes = async (submissionId, params = {}) =>
  userRequest(`/me/submissions/${encodeURIComponent(submissionId)}/notes`, {
    method: "GET",
    query: { page: params.page ?? 1, limit: params.limit ?? 20 },
  });

/** Los módulos de Educación que esta persona compró, con el recibo de cada pago. */
export const getMisCompras = async () => {
  const datos = await userRequest("/me/compras");
  return {
    modulos: Array.isArray(datos?.modulos) ? datos.modulos : [],
    pendientes: Array.isArray(datos?.pendientes) ? datos.pendientes : [],
    gastadoCentavos: Number(datos?.gastado_centavos) || 0,
    moneda: datos?.moneda || "USD",
  };
};

/**
 * Sube el retrato del lector y lo deja adjunto.
 *
 * El servidor lo asocia en la misma petición: devolver solo el id y esperar a un
 * segundo paso deja una ventana en la que la imagen existe y no es de nadie.
 */
export const subirMiFoto = async (file) => {
  const cuerpo = new FormData();
  cuerpo.append("file", file);
  const datos = await userRequest("/me/foto", { method: "POST", body: cuerpo });
  return { fotoId: datos?.photo_id ?? null, fotoUrl: datos?.photo_url ?? null };
};
