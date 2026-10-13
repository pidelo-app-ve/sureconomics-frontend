import { useEffect, useMemo, useState } from "react";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { piezasFromApi } from "../lib/pieza";
import { getPieces } from "../services/publicContentService";

/**
 * Every published piece of one format, or of all of them.
 *
 * Fetched whole rather than page by page, because the filter panel shows a count
 * next to every option and those counts have to agree with the list below them —
 * which they only do when both are computed from the same set. Server-side counts
 * would mean two code paths that have to stay in step, and the day they drift an
 * option promises a number the page cannot deliver.
 *
 * The trade is a ceiling. The API pages at 100, so this follows pages up to
 * `MAX_PAGES` and reports whether it stopped short. At five pages that is 500
 * pieces of one format; the site launches empty and the day a format passes that,
 * the filtering has to move to the server and the counts with it.
 *
 * Se guardan las filas tal como llegan y se convierten al pintar, con el idioma de la
 * página: `/` y `/en` montan la misma vista, React la conserva al cambiar de idioma, y
 * unas piezas convertidas al descargarlas se quedaban en el idioma anterior (titulares
 * y fechas en inglés en la portada española). Convertir es barato; volver a pedir
 * quinientas piezas por cada cambio de idioma, no.
 */

const PER_PAGE = 100;
const MAX_PAGES = 5;

export const usePieces = ({ format, educational } = {}) => {
  const { lang } = useIdioma();
  const [state, setState] = useState({
    status: "loading",
    filas: [],
    total: 0,
    truncated: false,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, status: "loading", error: null }));

    (async () => {
      const collected = [];
      let page = 1;
      let pages = 1;
      let total = 0;

      while (page <= Math.min(pages, MAX_PAGES)) {
        // Sequential on purpose: the first response is what says how many pages
        // there are, so firing them in parallel would mean guessing.
        // `undefined` y no `false` cuando no se pide: el cliente omite los nulos, y
        // un `?educational=false` en la direccion se leeria como un filtro puesto.
        const chunk = await getPieces({
          format,
          educational: educational ? true : undefined,
          page,
          limit: PER_PAGE,
        });
        collected.push(...chunk.filas);
        pages = chunk.pages || 1;
        total = chunk.total ?? collected.length;
        page += 1;
      }

      if (alive) {
        setState({
          status: "success",
          filas: collected,
          total,
          truncated: pages > MAX_PAGES,
          error: null,
        });
      }
    })().catch((error) => {
      if (alive) {
        setState({ status: "error", filas: [], total: 0, truncated: false, error });
      }
    });

    return () => {
      alive = false;
    };
  }, [format, educational]);

  // `lang` en las dependencias aunque no se use dentro: es lo que hace que las piezas
  // se vuelvan a convertir cuando cambia el idioma (`piezaFromApi` lo lee del motor).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => piezasFromApi(state.filas), [state.filas, lang]);
  return { status: state.status, items, total: state.total, truncated: state.truncated, error: state.error };
};
