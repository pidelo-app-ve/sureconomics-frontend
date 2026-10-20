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

/**
 * Lo ya descargado, por formato, durante un minuto.
 *
 * La portada, Artículos y Al punto piden el mismo listado; ir y volver lo pedía otra vez
 * entero cada vez. Un minuto basta para navegar sin esperas y es lo mismo que guarda el
 * servidor (`cache_publico`), así que no enseña nada más viejo de lo que ya enseñaría.
 */
const GUARDADO_MS = 60_000;
const guardado = new Map();

const pedirPagina = (format, educational, page) =>
  // `undefined` y no `false` cuando no se pide: el cliente omite los nulos, y un
  // `?educational=false` en la direccion se leeria como un filtro puesto.
  getPieces({ format, educational: educational ? true : undefined, page, limit: PER_PAGE });

export const usePieces = ({ format, educational } = {}) => {
  const { lang } = useIdioma();
  const clave = `${format ?? ""}|${educational ? 1 : 0}`;
  const [state, setState] = useState(() => {
    const previo = guardado.get(clave);
    if (previo && Date.now() - previo.en < GUARDADO_MS) {
      return { status: "success", filas: previo.filas, total: previo.total, truncated: previo.truncated, error: null };
    }
    return { status: "loading", filas: [], total: 0, truncated: false, error: null };
  });

  useEffect(() => {
    let alive = true;
    const previo = guardado.get(clave);
    if (previo && Date.now() - previo.en < GUARDADO_MS) {
      setState({ status: "success", filas: previo.filas, total: previo.total, truncated: previo.truncated, error: null });
      return () => {
        alive = false;
      };
    }
    setState((s) => ({ ...s, status: "loading", error: null }));

    (async () => {
      // La primera, sola: es la que dice cuántas páginas hay. Y en cuanto llega, se
      // pinta. Antes la portada esperaba las cinco, una detrás de otra, para enseñar
      // las veintitantas piezas de arriba que ya venían en la primera.
      const primera = await pedirPagina(format, educational, 1);
      const pages = primera.pages || 1;
      const total = primera.total ?? primera.filas.length;
      const truncated = pages > MAX_PAGES;
      if (!alive) return;
      setState({ status: "success", filas: primera.filas, total, truncated, error: null });

      // El resto a la vez y por detrás: completan el buscador y los contadores de los
      // filtros sin que nadie mire una pantalla vacía mientras tanto.
      const resto = [];
      for (let page = 2; page <= Math.min(pages, MAX_PAGES); page += 1) resto.push(page);
      let filas = primera.filas;
      if (resto.length) {
        const trozos = await Promise.all(resto.map((page) => pedirPagina(format, educational, page)));
        filas = [...primera.filas, ...trozos.flatMap((t) => t.filas)];
        if (!alive) return;
        setState({ status: "success", filas, total, truncated, error: null });
      }
      guardado.set(clave, { filas, total, truncated, en: Date.now() });
    })().catch((error) => {
      if (alive) {
        // Si la primera llegó y falla una de las siguientes, se queda lo que hay: mejor
        // la portada con cien piezas que una pantalla de error.
        setState((s) =>
          s.filas.length ? { ...s, status: "success" } : { status: "error", filas: [], total: 0, truncated: false, error },
        );
      }
    });

    return () => {
      alive = false;
    };
  }, [clave, format, educational]);

  // `lang` en las dependencias aunque no se use dentro: es lo que hace que las piezas
  // se vuelvan a convertir cuando cambia el idioma (`piezaFromApi` lo lee del motor).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => piezasFromApi(state.filas), [state.filas, lang]);
  return { status: state.status, items, total: state.total, truncated: state.truncated, error: state.error };
};
