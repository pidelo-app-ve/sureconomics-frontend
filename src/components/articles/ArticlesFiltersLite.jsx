import PropTypes from "prop-types";

export const ArticlesFiltersLite = ({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  tag,
  onTagChange,
  categories,
  tags,
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
          <label className="se-filters__label" htmlFor="filter-category">
            Categoría
          </label>
          <select
            id="filter-category"
            className="se-filters__control"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug || c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-tag">
            Tag
          </label>
          <select
            id="filter-tag"
            className="se-filters__control"
            value={tag}
            onChange={(e) => onTagChange(e.target.value)}
          >
            <option value="">Todos</option>
            {tags.map((t) => (
              <option key={t.slug || t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
};

ArticlesFiltersLite.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  tag: PropTypes.string.isRequired,
  onTagChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
    })
  ).isRequired,
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
    })
  ).isRequired,
  onReset: PropTypes.func.isRequired,
};

