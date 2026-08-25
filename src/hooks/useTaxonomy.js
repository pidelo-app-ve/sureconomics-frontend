import { useEffect, useState } from "react";
import { getFormats, getPlaces, getTopics } from "../services/publicContentService";

/**
 * The reference data every public view needs: the five formats, the fourteen
 * topics, and the geography tree.
 *
 * Fetched once per page load and shared, because four different views ask for the
 * same three lists and none of them changes while a reader is browsing. The cache
 * is a promise rather than a result, so two components mounting at the same moment
 * make one request between them instead of three each.
 */

const EMPTY = {
  formats: [],
  topics: [],
  geoTop: "Mundo",
  continentes: [],
  regiones: {},
  ancestros: {},
  slugPorNombre: {},
  conteoPorNombre: {},
};

let cache = null;

const load = async () => {
  const [formats, topics, places] = await Promise.all([
    getFormats(),
    getTopics(),
    getPlaces(),
  ]);
  return { formats, topics, ...places };
};

/** Drop the cache. Only used by tests and by a hard reload of reference data. */
export const resetTaxonomyCache = () => {
  cache = null;
};

export const useTaxonomy = () => {
  const [state, setState] = useState({ status: "loading", data: EMPTY, error: null });

  useEffect(() => {
    let alive = true;
    cache = cache ?? load();
    cache
      .then((data) => {
        if (alive) setState({ status: "success", data, error: null });
      })
      .catch((error) => {
        // A failed reference load must not be cached: the next mount should try
        // again rather than inherit a permanent empty taxonomy.
        cache = null;
        if (alive) setState({ status: "error", data: EMPTY, error });
      });
    return () => {
      alive = false;
    };
  }, []);

  return {
    ...state.data,
    status: state.status,
    error: state.error,
    /** True once the tree is usable; the filters need it before they mean anything. */
    ready: state.status === "success",
  };
};
