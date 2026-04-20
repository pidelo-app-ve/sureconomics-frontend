import { createApiClient } from "./apiClient";
import {
  normalizeCategory,
  normalizeTag,
  normalizePost,
  normalizePaginatedPosts,
  normalizeHeadline,
  normalizePaginatedComments,
} from "./contentMappers";

const defaultClient = (() => {
  try {
    return createApiClient();
  } catch {
    return null;
  }
})();

const ensureClient = (client) => {
  if (client) return client;
  if (defaultClient) return defaultClient;
  return createApiClient();
};

const toCategorySlug = (category) => (typeof category === "string" ? category : category?.slug);
const toTagSlug = (tag) => (typeof tag === "string" ? tag : tag?.slug);

export const contentService = {
  /**
   * @param {{ page?: number, limit?: number, category?: string, tag?: string }} [params]
   * @param {{ client?: { request: Function } }} [opts]
   */
  async getPosts(params = {}, opts = {}) {
    const client = ensureClient(opts.client);
    const payload = await client.request("/posts", {
      query: {
        page: params.page,
        limit: params.limit,
        category: toCategorySlug(params.category),
        tag: toTagSlug(params.tag),
      },
    });
    return normalizePaginatedPosts(payload);
  },

  /**
   * @param {string} slug
   * @param {{ client?: { request: Function } }} [opts]
   */
  async getPostBySlug(slug, opts = {}) {
    const client = ensureClient(opts.client);
    const payload = await client.request(`/posts/${encodeURIComponent(slug)}`);
    return normalizePost(payload);
  },

  /**
   * @param {{ client?: { request: Function } }} [opts]
   */
  async getCategories(opts = {}) {
    const client = ensureClient(opts.client);
    const payload = await client.request("/categories");
    const arr = Array.isArray(payload) ? payload : payload?.items ?? payload?.results ?? [];
    return arr.map(normalizeCategory).filter((c) => c.slug || c.name);
  },

  /**
   * @param {{ client?: { request: Function } }} [opts]
   */
  async getTags(opts = {}) {
    const client = ensureClient(opts.client);
    const payload = await client.request("/tags");
    const arr = Array.isArray(payload) ? payload : payload?.items ?? payload?.results ?? [];
    return arr.map(normalizeTag).filter((t) => t.slug || t.name);
  },

  /**
   * @param {{ limit?: number }} [params]
   * @param {{ client?: { request: Function } }} [opts]
   */
  async getHeadlines(params = {}, opts = {}) {
    const client = ensureClient(opts.client);
    const limit = params.limit ?? 12;
    const payload = await client.request("/headlines", {
      query: { limit },
    });
    if (payload && typeof payload === "object" && !Array.isArray(payload) && Array.isArray(payload.data)) {
      return payload.data.map(normalizeHeadline).filter(Boolean);
    }
    const arr = Array.isArray(payload) ? payload : payload?.items ?? payload?.results ?? payload?.data ?? [];
    return (Array.isArray(arr) ? arr : []).map(normalizeHeadline).filter(Boolean);
  },

  /**
   * @param {string} slug
   * @param {{ page?: number, limit?: number }} [params]
   * @param {{ client?: { request: Function } }} [opts]
   */
  async getPostComments(slug, params = {}, opts = {}) {
    const client = ensureClient(opts.client);
    const payload = await client.request(`/posts/${encodeURIComponent(slug)}/comments`, {
      query: {
        page: params.page,
        limit: params.limit,
      },
    });
    return normalizePaginatedComments(payload);
  },
};

