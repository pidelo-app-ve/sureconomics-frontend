import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { countForOption } from "../../lib/contentFilter";

/**
 * Two-axis content explorer: topic and place, laid out as a horizontal bar.
 *
 * Controlled on purpose — the page owns the selection, because the same values
 * drive both these option counts and the result list below. Keeping two copies of
 * that state is how an option ends up promising a number the page can't deliver.
 *
 * Format is deliberately absent: it comes from the header menu, and inside a
 * format page these two axes narrow without leaving the format.
 */
export const ContentExplorer = ({
  pieces,
  // The available options and the tree they live in. Props rather than an import:
  // they come from the API now, and a component that reaches for module-level data
  // cannot be rendered before that data exists.
  temasDisponibles,
  geoTop,
  regiones,
  temas,
  geos,
  query,
  onChange,
  onQueryChange,
  total,
  scopeLabel,
}) => {
  const [open, setOpen] = useState(null);
  const rootRef = useRef(null);

  // Close on outside click or Escape, the way a real dropdown does.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The tree travels inside the selection so `countForOption` expands a region to
  // its countries the same way the result list does. Without it an option would
  // count zero for a region while the page showed matches under it.
  const selection = { temas, geos, query, tree: { geoTop, regiones } };
  const count = (axis, value) => countForOption(pieces, axis, value, selection);

  const toggle = (axis, value) => {
    const current = axis === "tema" ? temas : geos;
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(axis === "tema" ? { temas: next, geos } : { temas, geos: next });
  };

  const clearAll = () => {
    onChange({ temas: new Set(), geos: new Set() });
    onQueryChange?.("");
    setOpen(null);
  };

  const label = (set, empty) => {
    const arr = [...set];
    if (!arr.length) return empty;
    return arr.length === 1 ? arr[0] : `${arr.length} elegidos`;
  };

  const active = [
    ...[...temas].map((v) => ["tema", v]),
    ...[...geos].map((v) => ["geo", v]),
  ];

  const topicOptions = temasDisponibles.map((t) => ({ value: t, n: count("tema", t) })).filter(
    (o) => o.n > 0
  );

  const hasSelection = active.length > 0 || Boolean((query ?? "").trim());

  return (
    <div className="se-explorer" ref={rootRef}>
      <div className="se-explorer__bar">
        <div className="se-explorer__lead">
          <span className="se-explorer__eyebrow">Filtros</span>
          {scopeLabel ? <span className="se-explorer__scope">{scopeLabel}</span> : null}
        </div>

        {onQueryChange ? (
          <div className="se-explorer__field">
            <label className="se-sr-only" htmlFor="explorer-search">
              Buscar por título o resumen
            </label>
            <input
              id="explorer-search"
              type="search"
              className="se-explorer__search"
              value={query ?? ""}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar por título o resumen…"
            />
          </div>
        ) : null}

        <div className="se-explorer__sel">
          <button
            type="button"
            className={`se-explorer__btn${open === "tema" ? " se-explorer__btn--on" : ""}${
              temas.size ? " se-explorer__btn--filled" : ""
            }`}
            onClick={() => setOpen(open === "tema" ? null : "tema")}
            aria-expanded={open === "tema"}
          >
            <span>{label(temas, "Tema")}</span>
            <span className="se-explorer__caret" aria-hidden="true">
              ▾
            </span>
          </button>
          {open === "tema" ? (
            <div className="se-explorer__panel" role="listbox" aria-label="Temas">
              {topicOptions.length ? (
                topicOptions.map((o) => (
                  <button
                    type="button"
                    key={o.value}
                    role="option"
                    aria-selected={temas.has(o.value)}
                    className={`se-explorer__opt${temas.has(o.value) ? " se-explorer__opt--on" : ""}`}
                    onClick={() => toggle("tema", o.value)}
                  >
                    <span>{o.value}</span>
                    <span className="se-explorer__n">{o.n}</span>
                  </button>
                ))
              ) : (
                <p className="se-explorer__none">Ningún tema con contenido para esta selección.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="se-explorer__sel">
          <button
            type="button"
            className={`se-explorer__btn${open === "geo" ? " se-explorer__btn--on" : ""}${
              geos.size ? " se-explorer__btn--filled" : ""
            }`}
            onClick={() => setOpen(open === "geo" ? null : "geo")}
            aria-expanded={open === "geo"}
          >
            <span>{label(geos, "Dónde")}</span>
            <span className="se-explorer__caret" aria-hidden="true">
              ▾
            </span>
          </button>
          {open === "geo" ? (
            <div className="se-explorer__panel" role="listbox" aria-label="Lugares">
              <button
                type="button"
                role="option"
                aria-selected={geos.has(geoTop)}
                className={`se-explorer__opt${geos.has(geoTop) ? " se-explorer__opt--on" : ""}`}
                onClick={() => toggle("geo", geoTop)}
              >
                <span>Toda la región</span>
                <span className="se-explorer__n">{count("geo", geoTop)}</span>
              </button>

              {Object.entries(regiones).map(([region, paises]) => {
                const nRegion = count("geo", region);
                if (!nRegion) return null;
                return (
                  <div key={region} className="se-explorer__group">
                    <button
                      type="button"
                      role="option"
                      aria-selected={geos.has(region)}
                      className={`se-explorer__opt se-explorer__opt--region${
                        geos.has(region) ? " se-explorer__opt--on" : ""
                      }`}
                      onClick={() => toggle("geo", region)}
                    >
                      <span>{region}</span>
                      <span className="se-explorer__n">{nRegion}</span>
                    </button>
                    {paises.map((pais) => {
                      const nPais = count("geo", pais);
                      if (!nPais) return null;
                      return (
                        <button
                          type="button"
                          key={pais}
                          role="option"
                          aria-selected={geos.has(pais)}
                          className={`se-explorer__opt se-explorer__opt--child${
                            geos.has(pais) ? " se-explorer__opt--on" : ""
                          }`}
                          onClick={() => toggle("geo", pais)}
                        >
                          <span>{pais}</span>
                          <span className="se-explorer__n">{nPais}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <span className="se-explorer__total" aria-live="polite">
          <strong>{total}</strong> resultado{total === 1 ? "" : "s"}
        </span>

        {hasSelection ? (
          <button type="button" className="se-explorer__clear" onClick={clearAll}>
            Limpiar
          </button>
        ) : null}
      </div>

      {active.length ? (
        <div className="se-explorer__active">
          {active.map(([axis, value]) => (
            <button
              type="button"
              key={`${axis}-${value}`}
              className="se-explorer__chip"
              onClick={() => toggle(axis, value)}
              aria-label={`Quitar ${value}`}
            >
              {value}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

ContentExplorer.propTypes = {
  temasDisponibles: PropTypes.arrayOf(PropTypes.string).isRequired,
  geoTop: PropTypes.string.isRequired,
  regiones: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  /** Pool the option counts are computed over — the current format, or everything. */
  pieces: PropTypes.arrayOf(PropTypes.object).isRequired,
  temas: PropTypes.instanceOf(Set).isRequired,
  geos: PropTypes.instanceOf(Set).isRequired,
  query: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  /** Omit to hide the search field. */
  onQueryChange: PropTypes.func,
  total: PropTypes.number.isRequired,
  scopeLabel: PropTypes.string,
};
