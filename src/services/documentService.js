import { userOptionalAuthRequest } from "../lib/userApi";

/**
 * Ask for a report's file.
 *
 * The article payload deliberately reports that a document exists — its page
 * count, so the page can offer it — and withholds the address. This is the only
 * way to get it.
 *
 * Quién puede lo decide el servidor en cada petición, y no este archivo: un informe
 * marcado como abierto contesta 200 a cualquiera, y el resto sigue contestando 401 a
 * quien no tenga sesión con el correo confirmado. De ahí `userOptionalAuthRequest`, que
 * manda el token si lo hay en vez de exigirlo — con `userRequest` el navegador cortaba
 * al lector anónimo antes de preguntar, y los informes abiertos no se podían descargar.
 */
export const fetchPieceDocument = async (slug) => {
  const data = await userOptionalAuthRequest(`/posts/${encodeURIComponent(slug)}/document`, {
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
