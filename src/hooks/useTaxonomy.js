import { useEffect, useState } from "react";
import { idiomaActual, tActual } from "../i18n/motor";
import { getFormats, getPlaces, getTopics } from "../services/publicContentService";

/**
 * The reference data every public view needs: the five formats, the fourteen
 * topics, and the geography tree.
 *
 * Fetched once per page load and shared, because four different views ask for the
 * same three lists and none of them changes while a reader is browsing. The cache
 * is a promise rather than a result, so two components mounting at the same moment
 * make one request between them instead of three each.
 *
 * Una promesa **por idioma**: `getPlaces` arma el árbol con los nombres del idioma del
 * documento (`nombreTraducido`), y cambiar de idioma es una navegación dentro de la
 * misma pestaña, así que lo cargado en español no sirve en `/en` ni al revés.
 */

/** Lo que hay mientras no llega nada. La raíz del árbol, en el idioma del documento. */
const vacio = () => ({
  formats: [],
  topics: [],
  geoTop: tActual("piezas.geo.mundo"),
  continentes: [],
  regiones: {},
  ancestros: {},
  slugPorNombre: {},
  conteoPorNombre: {},
});

let cache = {};

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
  cache = {};
};

export const useTaxonomy = () => {
  const [state, setState] = useState(() => ({ status: "loading", data: vacio(), error: null }));

  useEffect(() => {
    let alive = true;
    const lang = idiomaActual();
    cache[lang] = cache[lang] ?? load();
    cache[lang]
      .then((data) => {
        if (alive) setState({ status: "success", data, error: null });
      })
      .catch((error) => {
        // A failed reference load must not be cached: the next mount should try
        // again rather than inherit a permanent empty taxonomy.
        delete cache[lang];
        if (alive) setState({ status: "error", data: vacio(), error });
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
