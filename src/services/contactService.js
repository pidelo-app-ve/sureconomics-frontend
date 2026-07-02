import { createApiClient } from "./apiClient";

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

export const contactService = {
  /**
   * @param {{ name: string, email: string, subject: string, message: string }} form
   * @param {{ client?: { request: Function } }} [opts]
   */
  async submitContactMessage(form, opts = {}) {
    const client = ensureClient(opts.client);
    return client.request("/contact", {
      method: "POST",
      json: {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      },
    });
  },
};
