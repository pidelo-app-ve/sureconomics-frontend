import { useEffect, useState } from "react";
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
 */

const PER_PAGE = 100;
const MAX_PAGES = 5;

export const usePieces = ({ format } = {}) => {
  const [state, setState] = useState({
    status: "loading",
    items: [],
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
        const chunk = await getPieces({ format, page, limit: PER_PAGE });
        collected.push(...chunk.items);
        pages = chunk.pages || 1;
        total = chunk.total ?? collected.length;
        page += 1;
      }

      if (alive) {
        setState({
          status: "success",
          items: collected,
          total,
          truncated: pages > MAX_PAGES,
          error: null,
        });
      }
    })().catch((error) => {
      if (alive) {
        setState({ status: "error", items: [], total: 0, truncated: false, error });
      }
    });

    return () => {
      alive = false;
    };
  }, [format]);

  return state;
};
