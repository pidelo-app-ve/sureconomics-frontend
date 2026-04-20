import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";
import { listAdminCategoriesForEditor, listAdminTagsForEditor } from "./adminTaxonomyService";

export { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

/**
 * @param {{ page?: number, limit?: number }} [params]
 */
export const listAdminPosts = async (params = {}) => {
    const raw = await adminRequest("/admin/posts", {
        query: {
            page: params.page ?? 1,
            limit: params.limit ?? 20,
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
export const createAdminPost = async (body) =>
    unwrapEntity(await adminRequest("/admin/posts", { method: "POST", json: body }));

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

/** @returns {Promise<Array<{ id: unknown, name?: string, slug?: string }>>} */
export const listAdminCategories = () => listAdminCategoriesForEditor();

/** @returns {Promise<Array<{ id: unknown, name?: string, slug?: string }>>} */
export const listAdminTags = () => listAdminTagsForEditor();
