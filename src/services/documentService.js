import { userRequest } from "../lib/userApi";

/**
 * Ask for a report's file. Requires a registered reader with a verified e-mail.
 *
 * The article payload deliberately reports that a document exists — its page
 * count, so the page can offer it — and withholds the address. This is the only
 * way to get it, and the endpoint behind it answers 401 to anyone not signed in.
 */
export const fetchPieceDocument = async (slug) => {
  const data = await userRequest(`/posts/${encodeURIComponent(slug)}/document`, {
    method: "GET",
  });
  if (!data || typeof data !== "object" || !data.url) return null;
  return {
    url: String(data.url),
    pages: typeof data.pages === "number" ? data.pages : null,
    bytes: typeof data.bytes === "number" ? data.bytes : null,
    filename: data.original_filename ? String(data.original_filename) : null,
  };
};
