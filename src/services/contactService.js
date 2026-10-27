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
   * `website` es la trampa para bots (un campo que la persona no ve) y `turnstile`, el
   * token de Cloudflare; los dos como en el boletín. Ver `hooks/useVerificacionHumana`.
   *
   * @param {{ name: string, email: string, subject: string, message: string, website?: string }} form
   * @param {{ client?: { request: Function }, idempotencyKey?: string, turnstile?: string }} [opts]
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
        website: form.website ?? "",
        turnstile: opts.turnstile ?? "",
      },
      idempotencyKey: opts.idempotencyKey,
    });
  },
};
