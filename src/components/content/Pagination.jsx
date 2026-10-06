import PropTypes from "prop-types";
import { PAGE_GAP, buildPageRange, clampPage } from "../../lib/pageRange";
import { useIdioma } from "../../i18n/ProveedorIdioma";

/**
 * `compacta`: solo «Anterior» y «Siguiente», pequeños y sin aire, para ponerla encima de
 * una lista además de debajo (en el panel, con 20 filas largas, la de abajo no se ve sin
 * bajar hasta el final). El número de página lo dice el texto que la acompaña.
 */
export const Pagination = ({ page, totalPages, onPageChange, compacta = false, etiqueta }) => {
  const { t } = useIdioma();
  if (!totalPages || totalPages <= 1) return null;

  const safePage = clampPage(page || 1, totalPages);
  const pages = buildPageRange(safePage, totalPages);

  const handleGo = (next) => {
    const target = clampPage(next, totalPages);
    if (target === safePage) return;
    onPageChange(target);
  };

  return (
    <nav className={compacta ? undefined : "se-container"} aria-label={etiqueta === undefined ? t("comun.paginacion") : etiqueta}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: compacta ? "flex-start" : "center",
          flexWrap: compacta ? "nowrap" : "wrap",
          gap: "0.5rem",
          padding: compacta ? 0 : "2rem 0",
        }}
      >
        <button
          type="button"
          className={`se-btn se-btn--secondary${compacta ? " se-btn--small" : ""}`}
          onClick={() => handleGo(safePage - 1)}
          disabled={safePage <= 1}
          aria-label={t("comun.paginaAnterior")}
        >
          {t("comun.anterior")}
        </button>

        {compacta ? null : (
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
                  aria-label={t("comun.irAPagina", { n: p })}
                >
                  {p}
                </button>
              )
            )}
          </div>
        )}

        <button
          type="button"
          className={`se-btn se-btn--secondary${compacta ? " se-btn--small" : ""}`}
          onClick={() => handleGo(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label={t("comun.paginaSiguiente")}
        >
          {t("comun.siguiente")}
        </button>
      </div>
    </nav>
  );
};

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  compacta: PropTypes.bool,
  etiqueta: PropTypes.string,
};
