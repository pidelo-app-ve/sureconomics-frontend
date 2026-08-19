/**
 * Which page numbers a pager should offer, and how to keep a page number legal.
 *
 * Extracted so the public listings and the backoffice tables share one
 * implementation — the windowing rules (how many neighbours, when an ellipsis
 * replaces a run) are the kind of thing that drifts silently once it exists
 * twice.
 */

/** Marker the pager renders as a gap rather than a button. */
export const PAGE_GAP = "…";

/** Force a page number into `1..totalPages`, treating junk as page 1. */
export const clampPage = (page, totalPages) => {
  const top = Math.max(1, totalPages || 1);
  const n = Number.isFinite(page) ? Math.trunc(page) : 1;
  return Math.min(Math.max(n, 1), top);
};

/**
 * Build the page list around `current`: always the first and last page, a window
 * of neighbours, and `PAGE_GAP` wherever a run was skipped.
 *
 * @param {number} current page currently shown
 * @param {number} total number of pages
 * @param {number} [windowSize] how many consecutive pages to show around current
 * @returns {Array<number|string>}
 */
export const buildPageRange = (current, total, windowSize = 5) => {
  if (total <= 1) return [1];

  const half = Math.floor(windowSize / 2);
  let start = clampPage(current - half, Math.max(1, total - windowSize + 1));
  const end = Math.min(total, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = [];
  if (start > 1) pages.push(1);
  if (start > 2) pages.push(PAGE_GAP);
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push(PAGE_GAP);
  if (end < total) pages.push(total);
  return pages;
};
