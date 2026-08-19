import PropTypes from "prop-types";
import { PAGE_GAP, buildPageRange, clampPage } from "../../lib/pageRange";

/**
 * Pager for the public listings.
 *
 * Separate from the backoffice `Pagination` because that one wraps itself in a
 * container and carries the light-theme buttons — inside a listing that already
 * sits in a container it would double the gutter. The windowing logic is shared
 * through `lib/pageRange`, so only the skin differs.
 *
 * Hidden when there is a single page: a pager that cannot go anywhere is noise.
 */
export const ListingPagination = ({
  page,
  totalPages,
  from,
  to,
  total,
  unit,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const current = clampPage(page, totalPages);
  const pages = buildPageRange(current, totalPages);

  const go = (target) => {
    const next = clampPage(target, totalPages);
    if (next !== current) onPageChange(next);
  };

  return (
    <nav className="se-pager" aria-label="Paginación">
      <p className="se-pager__count">
        <strong>
          {from}–{to}
        </strong>{" "}
        de <strong>{total}</strong> {unit}
      </p>

      <div className="se-pager__controls">
        <button
          type="button"
          className="se-pager__btn se-pager__btn--edge"
          onClick={() => go(current - 1)}
          disabled={current <= 1}
        >
          Anterior
        </button>

        {pages.map((p, index) =>
          p === PAGE_GAP ? (
            <span
              // Two gaps can appear at once, so the index is what separates them.
              key={`gap-${index}`}
              className="se-pager__gap"
              aria-hidden="true"
            >
              {PAGE_GAP}
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`se-pager__btn${p === current ? " se-pager__btn--on" : ""}`}
              onClick={() => go(p)}
              aria-current={p === current ? "page" : undefined}
              aria-label={`Ir a la página ${p}`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="se-pager__btn se-pager__btn--edge"
          onClick={() => go(current + 1)}
          disabled={current >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
};

ListingPagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  from: PropTypes.number.isRequired,
  to: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  /** Plural noun for the counter, e.g. "noticias". */
  unit: PropTypes.string.isRequired,
  onPageChange: PropTypes.func.isRequired,
};
