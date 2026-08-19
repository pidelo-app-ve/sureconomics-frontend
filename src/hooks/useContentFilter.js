import { useCallback, useMemo, useState } from "react";
import { applyFilter } from "../lib/contentFilter";

/**
 * Selection state for the two-axis explorer, plus the filtered result.
 *
 * Lives in a hook so every listing page derives its results from the same
 * selection the explorer is showing counts for — one source of truth per page.
 *
 * @param {Array<object>} pieces pool to filter (a single format, or everything)
 * @param {{ geoTop?: string, regiones?: Record<string, string[]> }} [tree]
 *   the geography tree, needed so a region matches the pieces tagged with its
 *   countries. Passed in rather than imported because it comes from the API.
 */
export const useContentFilter = (pieces, tree) => {
  const [temas, setTemas] = useState(() => new Set());
  const [geos, setGeos] = useState(() => new Set());
  const [query, setQuery] = useState("");

  const setSelection = useCallback(({ temas: nextTemas, geos: nextGeos }) => {
    setTemas(nextTemas);
    setGeos(nextGeos);
  }, []);

  const reset = useCallback(() => {
    setTemas(new Set());
    setGeos(new Set());
    setQuery("");
  }, []);

  const results = useMemo(
    () => applyFilter(pieces, { temas, geos, query, tree }),
    [pieces, temas, geos, query, tree]
  );

  return {
    temas,
    geos,
    query,
    results,
    setSelection,
    setQuery,
    reset,
    isFiltered: temas.size > 0 || geos.size > 0 || query.trim().length > 0,
    /** What the explorer needs to compute a per-option count the page can honour. */
    selection: useMemo(() => ({ temas, geos, query, tree }), [temas, geos, query, tree]),
  };
};
