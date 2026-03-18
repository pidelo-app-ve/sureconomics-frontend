import PropTypes from "prop-types";

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
  return (
    <aside className="se-filters" aria-label="Filtros de artículos">
      <div className="se-filters__panel" role="region">
        <div className="se-filters__header">
          <h2 className="se-heading-section se-heading-section--small">Filtros</h2>
          <button type="button" className="se-link se-filters__reset" onClick={onReset}>
            Limpiar
          </button>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="article-search">
            Buscar
          </label>
          <input
            id="article-search"
            className="se-filters__control"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por título o resumen…"
          />
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-content-type">
            Tipo de contenido
          </label>
          <select
            id="filter-content-type"
            className="se-filters__control"
            value={contentType}
            onChange={(e) => onContentTypeChange(e.target.value)}
          >
            <option value="">Todos</option>
            {contentTypes.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-main-theme">
            Tema principal
          </label>
          <select
            id="filter-main-theme"
            className="se-filters__control"
            value={mainTheme}
            onChange={(e) => onMainThemeChange(e.target.value)}
          >
            <option value="">Todos</option>
            {mainThemes.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-region-geo">
            Región / geografía
          </label>
          <select
            id="filter-region-geo"
            className="se-filters__control"
            value={regionGeo}
            onChange={(e) => onRegionGeoChange(e.target.value)}
          >
            <option value="">Todas</option>
            {regionGeos.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-sector">
            Sector
          </label>
          <select
            id="filter-sector"
            className="se-filters__control"
            value={sector}
            onChange={(e) => onSectorChange(e.target.value)}
          >
            <option value="">Todos</option>
            {sectors.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-date-from">
            Fecha (desde)
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
            Por Autor
          </label>
          <select
            id="filter-author"
            className="se-filters__control"
            value={author}
            onChange={(e) => onAuthorChange(e.target.value)}
          >
            <option value="">Todos</option>
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

