import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";
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
  continentes,
  regiones,
  ancestros,
  temas,
  geos,
  query,
  onChange,
  onQueryChange,
  total,
  scopeLabel,
}) => {
  const { t } = useIdioma();
  const [open, setOpen] = useState(null);
  const rootRef = useRef(null);
  // Los dos botones que abren, para devolverles el foco al cerrar con Escape.
  const temaRef = useRef(null);
  const geoRef = useRef(null);

  // Close on outside click or Escape, the way a real dropdown does. Escape also hands
  // focus back to the button that opened it: closing the panel under the focused
  // option would otherwise drop the keyboard user at the top of the page.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const boton = (open === "tema" ? temaRef : geoRef).current;
      setOpen(null);
      boton?.focus();
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
  const selection = { temas, geos, query, tree: { geoTop, regiones, ancestros } };
  const count = (axis, value) => countForOption(pieces, axis, value, selection);

  const toggle = (axis, value) => {
    const current = axis === "tema" ? temas : geos;
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(axis === "tema" ? { temas: next, geos } : { temas, geos: next });
  };

  // Tabular fuera del desplegable lo cierra: un panel abierto que ya no tiene el foco
  // tapa lo que viene detras. Solo si el foco se fue a otro sitio de la pagina --
  // `relatedTarget` nulo es cambiar de ventana o pulsar en vacio, y del clic fuera ya se
  // ocupa `mousedown`.
  const alSalirDelDesplegable = (e) => {
    const destino = e.relatedTarget;
    if (destino && !e.currentTarget.contains(destino)) setOpen(null);
  };

  // Flechas arriba y abajo entre las opciones, como en cualquier lista de casillas.
  // Tab sigue funcionando igual; esto solo ahorra recorrer una lista larga de lugares.
  const alTeclearEnPanel = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") {
      return;
    }
    const opciones = Array.from(e.currentTarget.querySelectorAll(".se-explorer__opt"));
    if (!opciones.length) return;
    e.preventDefault();
    const i = opciones.indexOf(document.activeElement);
    let siguiente;
    if (e.key === "Home") siguiente = 0;
    else if (e.key === "End") siguiente = opciones.length - 1;
    else if (e.key === "ArrowDown") siguiente = i < 0 ? 0 : Math.min(i + 1, opciones.length - 1);
    else siguiente = i < 0 ? opciones.length - 1 : Math.max(i - 1, 0);
    opciones[siguiente].focus();
  };

  const clearAll = () => {
    onChange({ temas: new Set(), geos: new Set() });
    onQueryChange?.("");
    setOpen(null);
  };

  const label = (set, empty) => {
    const arr = [...set];
    if (!arr.length) return empty;
    return arr.length === 1 ? arr[0] : t("portada.explorador.elegidos", { n: arr.length });
  };

  const active = [
    ...[...temas].map((v) => ["tema", v]),
    ...[...geos].map((v) => ["geo", v]),
  ];

  const topicOptions = temasDisponibles.map((t) => ({ value: t, n: count("tema", t) })).filter(
    (o) => o.n > 0
  );

  const hasSelection = active.length > 0 || Boolean((query ?? "").trim());

  // El alcance va dentro del campo y no en un rotulo aparte: "Filtros / en todo el
  // sitio" nombraba lo que los propios controles ya dicen, y dejaba la busqueda --
  // lo que la gente viene a usar -- de segunda. Si no hay alcance, "Buscar" a secas.
  const rotulo = (scopeLabel ?? "").trim()
    ? t("portada.explorador.buscarEn", { alcance: scopeLabel.trim() })
    : t("comun.buscar");

  return (
    <div className="se-explorer" ref={rootRef}>
      <div className="se-explorer__bar">
        {onQueryChange ? (
          <div className="se-explorer__field">
            <label className="se-sr-only" htmlFor="explorer-search">
              {rotulo}
            </label>
            {/* Decorativa: la etiqueta y el marcador de posicion ya dicen que es. */}
            <svg
              className="se-explorer__lupa"
              viewBox="0 0 16 16"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10.8 10.8 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              id="explorer-search"
              type="search"
              className="se-explorer__search"
              value={query ?? ""}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={rotulo}
            />
          </div>
        ) : null}

        <div className="se-explorer__sel" onBlur={alSalirDelDesplegable}>
          <button
            ref={temaRef}
            type="button"
            aria-controls={open === "tema" ? "explorer-panel-tema" : undefined}
            className={`se-explorer__btn${open === "tema" ? " se-explorer__btn--on" : ""}${
              temas.size ? " se-explorer__btn--filled" : ""
            }`}
            onClick={() => setOpen(open === "tema" ? null : "tema")}
            aria-expanded={open === "tema"}
          >
            <span>{label(temas, t("portada.explorador.tema"))}</span>
            <span className="se-explorer__caret" aria-hidden="true">
              ▾
            </span>
          </button>
          {open === "tema" ? (
            // Un grupo de botones que se encienden y apagan, y no un `listbox`: la
            // seleccion es multiple y cada opcion es un boton de verdad, asi que
            // `aria-pressed` dice exactamente lo que pasa al pulsarla.
            <div
              id="explorer-panel-tema"
              className="se-explorer__panel"
              role="group"
              aria-label={t("portada.explorador.temas")}
              onKeyDown={alTeclearEnPanel}
            >
              {topicOptions.length ? (
                topicOptions.map((o) => (
                  <button
                    type="button"
                    key={o.value}
                    aria-pressed={temas.has(o.value)}
                    className={`se-explorer__opt${temas.has(o.value) ? " se-explorer__opt--on" : ""}`}
                    onClick={() => toggle("tema", o.value)}
                  >
                    <span>{o.value}</span>
                    <span className="se-explorer__n">{o.n}</span>
                  </button>
                ))
              ) : (
                <p className="se-explorer__none">{t("portada.explorador.sinTemas")}</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="se-explorer__sel" onBlur={alSalirDelDesplegable}>
          <button
            ref={geoRef}
            type="button"
            aria-controls={open === "geo" ? "explorer-panel-geo" : undefined}
            className={`se-explorer__btn${open === "geo" ? " se-explorer__btn--on" : ""}${
              geos.size ? " se-explorer__btn--filled" : ""
            }`}
            onClick={() => setOpen(open === "geo" ? null : "geo")}
            aria-expanded={open === "geo"}
          >
            <span>{label(geos, t("portada.explorador.donde"))}</span>
            <span className="se-explorer__caret" aria-hidden="true">
              ▾
            </span>
          </button>
          {open === "geo" ? (
            <div
              id="explorer-panel-geo"
              className="se-explorer__panel"
              role="group"
              aria-label={t("portada.explorador.lugares")}
              onKeyDown={alTeclearEnPanel}
            >
              <button
                type="button"
                aria-pressed={geos.has(geoTop)}
                className={`se-explorer__opt${geos.has(geoTop) ? " se-explorer__opt--on" : ""}`}
                onClick={() => toggle("geo", geoTop)}
              >
                <span>{t("portada.explorador.todo")}</span>
                <span className="se-explorer__n">{count("geo", geoTop)}</span>
              </button>

              {(continentes ?? [])
                // A continent that holds countries directly is already drawn below
                // as a group heading; listing it twice would read as two controls.
                .filter((continente) => !regiones[continente])
                .map((continente) => {
                  const nCont = count("geo", continente);
                  if (!nCont) return null;
                  return (
                    <button
                      type="button"
                      key={continente}
                      aria-pressed={geos.has(continente)}
                      className={`se-explorer__opt se-explorer__opt--region${
                        geos.has(continente) ? " se-explorer__opt--on" : ""
                      }`}
                      onClick={() => toggle("geo", continente)}
                    >
                      <span>{continente}</span>
                      <span className="se-explorer__n">{nCont}</span>
                    </button>
                  );
                })}

              {Object.entries(regiones).map(([region, paises]) => {
                const nRegion = count("geo", region);
                if (!nRegion) return null;
                return (
                  <div key={region} className="se-explorer__group">
                    <button
                      type="button"
                      aria-pressed={geos.has(region)}
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
                          aria-pressed={geos.has(pais)}
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
          {t("portada.explorador.resultados", { n: total, numero: <strong>{total}</strong> })}
        </span>

        {hasSelection ? (
          <button type="button" className="se-explorer__clear" onClick={clearAll}>
            {t("comun.limpiar")}
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
              aria-label={t("portada.explorador.quitar", { valor: value })}
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
  continentes: PropTypes.arrayOf(PropTypes.string),
  regiones: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  ancestros: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  /** Pool the option counts are computed over — the current format, or everything. */
  pieces: PropTypes.arrayOf(PropTypes.object).isRequired,
  temas: PropTypes.instanceOf(Set).isRequired,
  geos: PropTypes.instanceOf(Set).isRequired,
  query: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  /** Omit to hide the search field. */
  onQueryChange: PropTypes.func,
  total: PropTypes.number.isRequired,
  /** Donde busca: "en todo el sitio", "en Artículos". Va dentro del campo. */
  scopeLabel: PropTypes.string,
};
