/**
 * HTML -> texto llano: lo que pintan las tarjetas como resumen de una pieza.
 *
 * The summary is written in the rich editor, so it arrives as markup. A card
 * prints it inside a `<p>` as text, and React escapes markup — so without this a
 * teaser would read `<p>El banco…</p>` on the home page. A regex rather than
 * `DOMParser`, because this module is also loaded outside a browser by the
 * verification scripts.
 *
 * Vivía en `lib/pieza.js` (que la sigue usando en `piezaFromApi`). Salió aquí, sin
 * importaciones, porque `api/portada.js` pinta la entradilla de la apertura en el HTML
 * antes de que llegue la aplicación y tiene que decir exactamente lo mismo que dirá
 * React; y aquella arrastra el motor de idiomas, que Node no carga sin Vite.
 */
export const textoLlano = (html) => {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, String.fromCharCode(34))
    .replace(/&#39;/gi, String.fromCharCode(39))
    .replace(/\s+/g, " ")
    .trim();
};
