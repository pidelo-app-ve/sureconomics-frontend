import { createApiClient } from "./apiClient";
import { normalizePaginatedComments } from "./contentMappers";

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

export const contentService = {
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

