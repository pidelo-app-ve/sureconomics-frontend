/**
 * The shape the reading views speak, and how an API row becomes one.
 *
 * The layout components were written against a `pieza` — Spanish field names, the
 * format as its display plural, tags as plain strings. The API speaks English and
 * nests its relations. Rather than rewrite eleven components to the wire format,
 * the translation lives here: one place to look when the two disagree, and the
 * views stay readable in the language the newsroom uses.
 */

/** Display metadata per format slug. Copy that the API owns is read from it instead. */
export const FORMATO_META = {
  noticia: {
    slug: "noticias",
    plural: "Noticias",
    /**
     * How many fit on a listing page. A layout decision, so it lives here.
     *
     * Nine, not ten, since noticias became a grid: the grid is three columns wide,
     * and ten left a last row with a single card in it and two empty slots beside.
     */
    porPagina: 9,
  },
  articulo: { slug: "articulos", plural: "Artículos", porPagina: 9 },
  editorial: { slug: "editorial", plural: "Editorial", porPagina: 6 },
  entrevista: { slug: "entrevistas", plural: "Entrevistas", porPagina: 6 },
  informe: { slug: "informes", plural: "Informes", porPagina: 6 },
};

/** Route prefix → format slug, for reading a URL back. */
export const FORMATO_POR_RUTA = Object.fromEntries(
  Object.entries(FORMATO_META).map(([apiSlug, meta]) => [meta.slug, apiSlug])
);

/** The display plurals, in the order the site presents them. */
export const FORMATOS = Object.values(FORMATO_META).map((m) => m.plural);

/** Display plural → API slug. */
export const FORMATO_API = Object.fromEntries(
  Object.entries(FORMATO_META).map(([apiSlug, meta]) => [meta.plural, apiSlug])
);

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** `2026-08-01T12:00:00Z` → `1 ago 2026`, the form the cards print. */
export const fechaCorta = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MESES[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * HTML -> texto llano.
 *
 * The summary is written in the rich editor, so it arrives as markup. A card
 * prints it inside a `<p>` as text, and React escapes markup — so without this a
 * teaser would read `<p>El banco…</p>` on the home page. A regex rather than
 * `DOMParser`, because this module is also loaded outside a browser by the
 * verification scripts.
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

/** `1440` -> `24 min`. */
export const duracionCorta = (seconds) => {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

/**
 * A gradient key for the placeholder image.
 *
 * Derived from the slug rather than random so a piece keeps the same treatment
 * between renders and between visits — a card that changes colour on reload reads
 * as a bug.
 */
// Only the three `PlaceholderImage` actually draws. Inventing names here produced
// a piece asking for a "trade" treatment that does not exist, which React reported
// as a prop-type warning on every card of every listing.
const VARIANTES = ["chart", "building", "growth"];

const varianteDe = (slug) => {
  let total = 0;
  for (let i = 0; i < (slug ?? "").length; i += 1) total += slug.charCodeAt(i);
  return VARIANTES[total % VARIANTES.length];
};

/**
 * Una derivada del tamaño en que la imagen se va a ver.
 *
 * Las imágenes que la redacción sube son PNG de 1536 px y cerca de 2 MB cada una.
 * En una tarjeta de 400 px eso son veinte veces más píxeles de los que se pintan,
 * y el listado de artículos llegaba a pesar unos 17 MB — inaceptable en móvil, que
 * es donde se lee un medio económico de la región.
 *
 * Cloudinary sirve derivadas por URL, así que basta insertar la transformación:
 * `f_auto` entrega WebP o AVIF a quien los acepte, `q_auto` ajusta la compresión, y
 * `c_fill` recorta al encuadre en vez de deformar.
 *
 * Solo toca direcciones de Cloudinary y solo cuando no traen ya una transformación
 * — `featured_image_url` es un campo libre y puede apuntar a cualquier sitio, que
 * se devuelve intacto.
 */
export const imagenAncho = (url, ancho) => {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  const marca = "/image/upload/";
  const corte = url.indexOf(marca);
  if (corte === -1) return url;
  const resto = url.slice(corte + marca.length);
  // `v<digitos>/` justo después de `upload/` significa que no hay transformación.
  if (!/^v\d+\//.test(resto)) return url;
  return `${url.slice(0, corte + marca.length)}f_auto,q_auto,c_fill,w_${ancho}/${resto}`;
};

/** Where a piece lives. */
export const rutaDePieza = (pieza) => {
  if (!pieza) return "/";
  const meta = Object.values(FORMATO_META).find((m) => m.plural === pieza.formato);
  return meta ? `/${meta.slug}/${pieza.slug}` : "/";
};

/** The tag a card shows: the first, which the backend stores as the principal one. */
export const temaPrincipal = (pieza) => pieza?.temas?.[0] ?? null;

export const geoPrincipal = (pieza, geoTop = "Las Américas") =>
  pieza?.geos?.[0] ?? geoTop;

/**
 * One API row → one `pieza`.
 *
 * Everything optional stays optional: a noticia has no author, an editorial has no
 * byline by design, and a draft-turned-published piece may have no image. The views
 * already handle a missing value; inventing one here would hide a real gap.
 */
export const piezaFromApi = (row) => {
  if (!row || typeof row !== "object") return null;
  const meta = FORMATO_META[row.format];
  return {
    id: String(row.id),
    slug: String(row.slug ?? ""),
    formato: meta?.plural ?? row.content_format?.name_plural ?? row.format ?? "",
    formatoApi: row.format ?? "",
    titulo: String(row.title ?? ""),
    // Two forms on purpose: the cards want text, the reading view wants the markup
    // the writer actually applied.
    resumen: textoLlano(row.excerpt),
    resumenHtml: row.excerpt || "",
    // Editorial calls its opening line an "entrada"; it is the same column.
    entrada: row.format === "editorial" ? textoLlano(row.excerpt) : "",
    entradaHtml: row.format === "editorial" ? row.excerpt || "" : "",
    cuerpo: row.content || "",
    temas: (row.topics ?? []).map((t) => t.name),
    geos: (row.places ?? []).map((p) => p.name),
    // The slugs of the principal tags. The names are what a reader sees; the slugs
    // are what the API filters by, and carrying both saves a lookup table in every
    // view that links out to `/explorar`.
    temaSlug: row.topics?.[0]?.slug ?? null,
    geoSlug: row.places?.[0]?.slug ?? null,
    temaSlugs: (row.topics ?? []).map((t) => t.slug),
    geoSlugs: (row.places ?? []).map((p) => p.slug),
    fecha: fechaCorta(row.published_at),
    fechaIso: row.published_at ?? null,
    // The byline the piece is published under, and nothing else.
    //
    // It deliberately does NOT fall back to `author.name`, which is the account
    // that wrote the piece. That account name was being printed on the site, which
    // exposed a personal login as a public byline -- and a fallback would keep
    // doing it every time somebody left the field empty, which is exactly what the
    // newsroom asked to stop. No byline means no byline shown.
    autor: row.content_format?.shows_author === false ? null : row.byline || null,
    entrevistado: row.interviewee || null,
    entrevistadoCargo: row.interviewee_role || null,
    unidad: row.unit || null,
    // As many as the piece cites, in the order the newsroom entered them. The
    // fallback covers a response from a build that predates the list, so the
    // deploys do not have to be ordered.
    fuentes: (row.sources ?? (row.source_name ? [{ name: row.source_name, url: row.source_url }] : []))
      .map((f) => ({ nombre: (f.name ?? "").trim(), url: f.url || null }))
      .filter((f) => f.nombre),
    opinionCasa: textoLlano(row.house_opinion) || null,
    opinionCasaHtml: row.house_opinion || null,
    imagen: varianteDe(row.slug ?? ""),
    imagenUrl: row.image_asset?.url || row.featured_image_url || null,
    videoUrl: row.video_asset?.url || null,
    duracion: duracionCorta(row.video_asset?.duration_seconds),
    // Present means "there is a report to offer"; the URL is handed out only to a
    // signed-in reader by `documentService`.
    tieneDocumento: Boolean(row.document_asset),
    paginas: row.document_asset?.pages ?? null,
  };
};

export const piezasFromApi = (rows) => (rows ?? []).map(piezaFromApi).filter(Boolean);
