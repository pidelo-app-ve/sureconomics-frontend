import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/** The page lives in the query string, so a page of results is a shareable link. */
const PARAM = "pagina";

/**
 * Slice a list into pages, with the current page held in the URL.
 *
 * Keeping the page in the address bar rather than in component state is what
 * makes the browser's back button and a pasted link both land where the reader
 * expects. It also means a page number can arrive that the list cannot honour —
 * a stale link, or a filter that shrank the results under the reader — so an
 * out-of-range page is clamped for display and then rewritten in place.
 *
 * @param {Array<object>} items full result set, already filtered
 * @param {number} perPage how many to show per page
 * @param {{ scrollTo?: React.RefObject<HTMLElement> }} [options]
 *   `scrollTo` is brought back into view whenever the page changes, so paging
 *   does not leave the reader stranded halfway down the previous page.
 */
export const usePagedList = (items, perPage, { scrollTo } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const parsed = Number.parseInt(searchParams.get(PARAM) ?? "1", 10);
  const requested = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  const page = Math.min(requested, totalPages);

  const write = useCallback(
    (target, replace) => {
      const next = new URLSearchParams(searchParams);
      // Page one is the default, so it stays out of the URL entirely.
      if (target <= 1) next.delete(PARAM);
      else next.set(PARAM, String(target));
      setSearchParams(next, { replace });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (requested !== page) write(page, true);
  }, [requested, page, write]);

  /**
   * Only a deliberate move through the pager scrolls anything.
   *
   * The obvious version of this — an effect on `page` that skips its first run —
   * is wrong twice over. It fights the app's scroll-to-top when a view is first
   * entered, and under StrictMode's double invocation the "first run" flag is
   * consumed by the first pass, so the second pass scrolls anyway. Reading an
   * intent set by the click itself cannot be triggered by a re-run.
   */
  const pagerIntentRef = useRef(false);

  const goTo = useCallback(
    (target) => {
      pagerIntentRef.current = true;
      write(target, false);
    },
    [write]
  );

  /** Back to the first page — for when the result set itself changed. */
  const resetPage = useCallback(() => write(1, true), [write]);

  useEffect(() => {
    if (!pagerIntentRef.current) return;
    pagerIntentRef.current = false;
    const node = scrollTo?.current;
    if (!node) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [page, scrollTo]);

  const visible = useMemo(
    () => items.slice((page - 1) * perPage, page * perPage),
    [items, page, perPage]
  );

  return {
    page,
    totalPages,
    visible,
    goTo,
    resetPage,
    total,
    from: total === 0 ? 0 : (page - 1) * perPage + 1,
    to: Math.min(page * perPage, total),
  };
};
