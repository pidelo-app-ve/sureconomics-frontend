import PropTypes from "prop-types";
import { PAGE_GAP, buildPageRange, clampPage } from "../../lib/pageRange";

export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const safePage = clampPage(page || 1, totalPages);
  const pages = buildPageRange(safePage, totalPages);

  const handleGo = (next) => {
    const target = clampPage(next, totalPages);
    if (target === safePage) return;
    onPageChange(target);
  };

  return (
    <nav className="se-container" aria-label="Paginación">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "2rem 0" }}>
        <button
          type="button"
          className="se-btn se-btn--secondary"
          onClick={() => handleGo(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Página anterior"
        >
          Anterior
        </button>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {pages.map((p, idx) =>
            p === PAGE_GAP ? (
              <span key={`ellipsis-${idx}`} className="se-meta" aria-hidden="true" style={{ padding: "0 0.25rem" }}>
                {PAGE_GAP}
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={p === safePage ? "se-btn" : "se-btn se-btn--secondary"}
                onClick={() => handleGo(p)}
                aria-current={p === safePage ? "page" : undefined}
                aria-label={`Ir a página ${p}`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className="se-btn se-btn--secondary"
          onClick={() => handleGo(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Página siguiente"
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
};

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

