import PropTypes from "prop-types";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const buildRange = (current, total) => {
  if (total <= 1) return [1];

  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = clamp(current - half, 1, Math.max(1, total - windowSize + 1));
  let end = Math.min(total, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = [];
  if (start > 1) pages.push(1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("…");
  if (end < total) pages.push(total);
  return pages;
};

export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const safePage = clamp(page || 1, 1, totalPages);
  const pages = buildRange(safePage, totalPages);

  const handleGo = (next) => {
    const target = clamp(next, 1, totalPages);
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
            p === "…" ? (
              <span key={`ellipsis-${idx}`} className="se-meta" aria-hidden="true" style={{ padding: "0 0.25rem" }}>
                …
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

