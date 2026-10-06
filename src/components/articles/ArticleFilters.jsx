import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";

export const ArticleFilters = ({
  query,
  onQueryChange,
  contentType,
  onContentTypeChange,
  mainTheme,
  onMainThemeChange,
  regionGeo,
  onRegionGeoChange,
  sector,
  onSectorChange,
  dateFrom,
  onDateFromChange,
  author,
  onAuthorChange,
  authors,
  contentTypes,
  mainThemes,
  regionGeos,
  sectors,
  onReset,
}) => {
  const { t } = useIdioma();
  return (
    <aside className="se-filters" aria-label={t("listados.filtros.rotulo")}>
      <div className="se-filters__panel" role="region">
        <div className="se-filters__header">
          <h2 className="se-heading-section se-heading-section--small">{t("listados.filtros.titulo")}</h2>
          <button type="button" className="se-link se-filters__reset" onClick={onReset}>
            {t("comun.limpiar")}
          </button>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="article-search">
            {t("comun.buscar")}
          </label>
          <input
            id="article-search"
            className="se-filters__control"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("listados.filtros.buscarPlaceholder")}
          />
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-content-type">
            {t("listados.filtros.tipoContenido")}
          </label>
          <select
            id="filter-content-type"
            className="se-filters__control"
            value={contentType}
            onChange={(e) => onContentTypeChange(e.target.value)}
          >
            <option value="">{t("comun.todos")}</option>
            {contentTypes.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-main-theme">
            {t("listados.filtros.temaPrincipal")}
          </label>
          <select
            id="filter-main-theme"
            className="se-filters__control"
            value={mainTheme}
            onChange={(e) => onMainThemeChange(e.target.value)}
          >
            <option value="">{t("comun.todos")}</option>
            {mainThemes.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-region-geo">
            {t("listados.filtros.regionGeo")}
          </label>
          <select
            id="filter-region-geo"
            className="se-filters__control"
            value={regionGeo}
            onChange={(e) => onRegionGeoChange(e.target.value)}
          >
            <option value="">{t("comun.todas")}</option>
            {regionGeos.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-sector">
            {t("listados.filtros.sector")}
          </label>
          <select
            id="filter-sector"
            className="se-filters__control"
            value={sector}
            onChange={(e) => onSectorChange(e.target.value)}
          >
            <option value="">{t("comun.todos")}</option>
            {sectors.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-date-from">
            {t("listados.filtros.fechaDesde")}
          </label>
          <input
            id="filter-date-from"
            type="date"
            className="se-filters__control"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-author">
            {t("listados.filtros.porAutor")}
          </label>
          <select
            id="filter-author"
            className="se-filters__control"
            value={author}
            onChange={(e) => onAuthorChange(e.target.value)}
          >
            <option value="">{t("comun.todos")}</option>
            {authors.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
};

ArticleFilters.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  contentType: PropTypes.string.isRequired,
  onContentTypeChange: PropTypes.func.isRequired,
  mainTheme: PropTypes.string.isRequired,
  onMainThemeChange: PropTypes.func.isRequired,
  regionGeo: PropTypes.string.isRequired,
  onRegionGeoChange: PropTypes.func.isRequired,
  sector: PropTypes.string.isRequired,
  onSectorChange: PropTypes.func.isRequired,
  dateFrom: PropTypes.string.isRequired,
  onDateFromChange: PropTypes.func.isRequired,
  author: PropTypes.string.isRequired,
  onAuthorChange: PropTypes.func.isRequired,
  authors: PropTypes.arrayOf(PropTypes.string).isRequired,
  contentTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  mainThemes: PropTypes.arrayOf(PropTypes.string).isRequired,
  regionGeos: PropTypes.arrayOf(PropTypes.string).isRequired,
  sectors: PropTypes.arrayOf(PropTypes.string).isRequired,
  onReset: PropTypes.func.isRequired,
};
