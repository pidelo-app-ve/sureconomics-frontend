/**
 * Two-axis filtering shared by the explorer and every listing page.
 *
 * Kept in one place on purpose: the explorer's option counts and the page's result
 * list have to agree, or an option will promise a number the page can't deliver.
 * Both call `matches` here.
 *
 * The geography tree used to be imported from a fixed data file. It now comes from
 * the API, so every function that needs it takes it as an argument — a module that
 * silently reads mutable global state is exactly how the counts and the results
 * would drift apart while both looked right.
 */

/** The tree, in the shape `useTaxonomy` hands back. */
const EMPTY_TREE = { geoTop: "Mundo", regiones: {}, ancestros: {} };

/**
 * A place's ancestors, nearest first.
 *
 * Read from the map the service builds while walking the tree, rather than
 * derived here from `regiones`. The derived version could only ever see one level
 * up, which was indistinguishable from correct while there was exactly one level
 * above a country.
 */
const arriba = (tree, nombre) => tree?.ancestros?.[nombre] ?? [];

/**
 * Every geography node a piece belongs to. Tagging Perú also places the piece in
 * Andina and in Las Américas, which is what lets a reader browsing a region find
 * country-level pieces without them being tagged twice.
 *
 * Takes the piece's whole list because a piece may carry three geographies — an
 * analysis of trade between Venezuela and Colombia belongs to both, and to Andina
 * and Las Américas above them.
 *
 * @param {Array<string>} geos
 * @param {{ geoTop?: string, ancestros?: Record<string, string[]> }} tree
 * @returns {Set<string>}
 */
export const expandGeo = (geos, tree = EMPTY_TREE) => {
  const { geoTop = EMPTY_TREE.geoTop } = tree;
  // The root belongs to every piece: filtering by it means "no restriction".
  const out = new Set([geoTop]);
  (geos ?? []).forEach((geo) => {
    if (!geo) return;
    out.add(geo);
    arriba(tree, geo).forEach((a) => out.add(a));
  });
  return out;
};

/**
 * A place plus everything above it, outermost last: Venezuela, Andina, Las Américas.
 *
 * Derived from the tree at render time and stored nowhere. The newsroom asked to
 * see the region beside the country, and the temptation was to write it onto the
 * piece as a second tag — which would be the same fact recorded twice, and would
 * spend one of the three slots a piece has on something the tree already knows.
 *
 * The ancestors are links like any other tag: a reader who sees "Andina" can click
 * it and get the whole region, which is the point of showing it.
 *
 * @param {Array<string>} geos the piece's own place tags
 * @param {{ geoTop?: string, ancestros?: Record<string, string[]> }} tree
 * @returns {Array<{ nombre: string, propio: boolean }>}
 */
export const conAncestros = (geos, tree = EMPTY_TREE) => {
  const { geoTop = EMPTY_TREE.geoTop } = tree;
  const propios = (geos ?? []).filter(Boolean);
  if (!propios.length) return [];

  const vistos = new Set();
  const salida = [];

  const push = (nombre, propio) => {
    // The root is left out deliberately. It is "Mundo", and a chip meaning
    // "everything ever published" is not something a reader would follow.
    if (!nombre || nombre === geoTop || vistos.has(nombre)) return;
    vistos.add(nombre);
    salida.push({ nombre, propio });
  };

  // What the newsroom tagged comes first and reads as the piece's own.
  propios.forEach((geo) => push(geo, true));
  // Then everything above each of them, deduplicated - two countries of the same
  // region must not print it twice.
  propios.forEach((geo) => arriba(tree, geo).forEach((a) => push(a, false)));

  return salida;
};

/**
 * The single tag a listing card shows. Inside the piece every tag is shown, but a
 * card has room for one, and the first is the principal one.
 */
export const temaPrincipal = (piece) => piece?.temas?.[0] ?? null;

/**
 * A piece with no country is regional or continental, and reads as the root —
 * plenty of news is exactly that: a Fed decision belongs to no single country.
 */
export const geoPrincipal = (piece, geoTop = EMPTY_TREE.geoTop) =>
  piece?.geos?.[0] ?? geoTop;

/**
 * @param {object} piece
 * @param {{ temas?: Set<string>, geos?: Set<string>, query?: string, tree?: object }} selection
 * @returns {boolean}
 */
export const matches = (piece, { temas, geos, query, tree } = {}) => {
  // Within an axis the values add up (or); across axes they narrow (and). A piece
  // matches when *any* of its own tags is among the selected ones.
  if (temas?.size && !(piece.temas ?? []).some((t) => temas.has(t))) return false;

  if (geos?.size) {
    const belongs = expandGeo(piece.geos, tree);
    if (![...geos].some((g) => belongs.has(g))) return false;
  }

  const q = (query ?? "").trim().toLowerCase();
  if (q) {
    const haystack = [piece.titulo, piece.resumen, piece.entrada, piece.entrevistado]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
};

/**
 * How many pieces one option would return.
 *
 * The option's own axis is replaced rather than added to, so the number answers
 * "what if I picked this" instead of "what if I added this to what I already
 * picked" — which is what makes zero-result options detectable and hideable.
 *
 * @param {Array<object>} pieces
 * @param {"tema" | "geo"} axis
 * @param {string} value
 * @param {{ temas?: Set<string>, geos?: Set<string>, query?: string, tree?: object }} selection
 * @returns {number}
 */
export const countForOption = (pieces, axis, value, selection = {}) => {
  const probe =
    axis === "tema"
      ? { ...selection, temas: new Set([value]) }
      : { ...selection, geos: new Set([value]) };
  return pieces.filter((p) => matches(p, probe)).length;
};

/**
 * @param {Array<object>} pieces
 * @param {{ temas?: Set<string>, geos?: Set<string>, query?: string, tree?: object }} selection
 * @returns {Array<object>}
 */
export const applyFilter = (pieces, selection) =>
  pieces.filter((p) => matches(p, selection));
