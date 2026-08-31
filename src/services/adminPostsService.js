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

