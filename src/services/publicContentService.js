import { createApiClient } from "./apiClient";
import { piezaFromApi, piezasFromApi } from "../lib/pieza";

/**
 * What the public site reads.
 *
 * The API speaks English (`?format=&topic=&place=&q=`); the reader-facing URLs are
 * Spanish (`/explorar?tema=&donde=`). That translation happens here rather than in
 * the backend, because the Spanish is a choice about what readers see and the
 * English is a choice about the codebase — neither should be forced to follow the
 * other.
 */

const defaultClient = (() => {
  try {
    return createApiClient();
  } catch {
    return null;
  }
})();

const client = () => defaultClient ?? createApiClient();

const listOf = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

/** The five formats, with the section copy the API owns. */
export const getFormats = async () => listOf(await client().request("/formats"));

/** The fourteen topics with their published counts. */
export const getTopics = async () => listOf(await client().request("/topics"));

/**
 * The geography tree, flattened into what the filter bar needs:
 * the root's name, and region → countries.
 */
/**
 * The geography tree, flattened into the shapes the UI asks of it.
 *
 * Walked to whatever depth the API sends. The previous version read
 * `children.children` directly, which was correct while the tree was exactly
 * "raíz -> regiones -> países" and would silently drop a whole level the day a
 * continent appeared between them: the countries under it would stop existing
 * for the filters, with nothing failing loudly enough to notice.
 */
export const getPlaces = async () => {
  const roots = listOf(await client().request("/places"));
  const root = roots[0] ?? null;

  const slugPorNombre = {};
  const conteoPorNombre = {};
  /** Name -> its ancestors, nearest first: Venezuela -> Andina, Las Américas, Mundo. */
  const ancestros = {};
  const continentes = [];
  /** A grouping node -> the leaves under it, which is what a picker draws. */
  const regiones = {};

  const walk = (node, arriba) => {
    if (!node?.name) return;
    slugPorNombre[node.name] = node.slug;
    conteoPorNombre[node.name] = node.post_count ?? 0;
    ancestros[node.name] = arriba;
    if (node.level === "continent") continentes.push(node.name);

    const hijos = node.children ?? [];
    // A group is a node whose children are leaves: the five regions, and any
    // continent holding a country with no region in between.
    const hojas = hijos.filter((h) => !(h.children ?? []).length);
    if (hojas.length) regiones[node.name] = hojas.map((h) => h.name);

    hijos.forEach((h) => walk(h, [node.name, ...arriba]));
  };
  if (root) walk(root, []);

  return {
    geoTop: root?.name ?? "Mundo",
    continentes,
    regiones,
    ancestros,
    slugPorNombre,
    conteoPorNombre,
  };
};

/**
 * Published pieces, optionally narrowed.
 *
 * `place` is expanded down the tree by the backend, so asking for a region returns
 * the pieces tagged with its countries.
 */
export const getPieces = async ({
  format,
  topic,
  place,
  q,
  page = 1,
  limit = 20,
} = {}) => {
  const payload = await client().request("/posts", {
    query: { format, topic, place, q, page, limit },
  });
  const rows = payload && "data" in payload ? payload.data : payload;
  const meta = payload?.meta ?? null;
  return {
    items: piezasFromApi(rows),
    meta,
    total: meta?.total ?? (Array.isArray(rows) ? rows.length : 0),
    pages: meta?.pages ?? 1,
  };
};

export const getPiece = async (slug) =>
  piezaFromApi(await client().request(`/posts/${encodeURIComponent(slug)}`));

/**
 * Pieces related to this one: same topic or same place, never itself.
 *
 * Two requests rather than one because "shares a topic OR a place" is not something
 * the listing endpoint expresses — and adding an OR filter to serve one sidebar
 * would be a worse trade than two cheap reads.
 */
export const getRelated = async (pieza, limite = 4) => {
  if (!pieza) return [];
  const [porTema, porLugar] = await Promise.all([
    pieza.temaSlug || pieza.temas?.length
      ? getPieces({ topic: pieza.temaSlug, limit: limite + 1 }).catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] }),
    pieza.geoSlug
      ? getPieces({ place: pieza.geoSlug, limit: limite + 1 }).catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] }),
  ]);
  const seen = new Set([pieza.slug]);
  const out = [];
  for (const candidate of [...porTema.items, ...porLugar.items]) {
    if (seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    out.push(candidate);
    if (out.length >= limite) break;
  }
  return out;
};
