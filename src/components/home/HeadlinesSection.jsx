import PropTypes from "prop-types";
import { formatearFecha } from "../../i18n/motor";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { ErrorState, LoadingState } from "../content";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";

export const HeadlinesSection = ({ state, onRetry }) => {
  const { t } = useIdioma();
  const sectionRef = useRef(null);
  const railRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const items = useMemo(() => (state.headlines ?? []).filter(Boolean), [state.headlines]);

  useRevealOnScroll(sectionRef);

  const scrollToIndex = (idx) => {
    const rail = railRef.current;
    if (!rail) return;
    const children = rail.querySelectorAll("[data-headline-card]");
    const el = children?.[idx];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  const handlePrev = () => {
    const next = Math.max(0, activeIdx - 1);
    setActiveIdx(next);
    scrollToIndex(next);
  };

  const handleNext = () => {
    const next = Math.min(items.length - 1, activeIdx + 1);
    setActiveIdx(next);
    scrollToIndex(next);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
  };

  useEffect(() => {
    setActiveIdx(0);
  }, [items.length]);

  const headlines = state.headlines ?? [];

  return (
    <section
      ref={sectionRef}
      className="se-section se-headlines se-reveal se-reveal--stagger"
      aria-labelledby="se-headlines-title"
    >
      <div className="se-container">
        {state.status === "success" && headlines.length ? (
          <div className="se-headlines__top">
            <h2 id="se-headlines-title" className="se-heading-section se-heading-section--small">
              {t("portada.titulares.titulo")}
            </h2>
            <div className="se-headlines__controls" aria-label={t("portada.titulares.controles")}>
              <button
                type="button"
                className="se-headlines__ctrl"
                onClick={handlePrev}
                disabled={activeIdx <= 0}
                aria-label={t("portada.titulares.anterior")}
              >
                ←
              </button>
              <button
                type="button"
                className="se-headlines__ctrl"
                onClick={handleNext}
                disabled={activeIdx >= items.length - 1}
                aria-label={t("portada.titulares.siguiente")}
              >
                →
              </button>
            </div>
          </div>
        ) : (
          <h2 id="se-headlines-title" className="se-heading-section se-heading-section--small">
            {t("portada.titulares.titulo")}
          </h2>
        )}

        {state.status === "loading" || state.status === "idle" ? (
          <LoadingState title={t("portada.titulares.cargando")} description={t("portada.titulares.cargandoTexto")} />
        ) : null}

        {state.status === "error" ? (
          <ErrorState title={t("portada.titulares.error")} error={state.error} onRetry={onRetry} />
        ) : null}

        {state.status === "success" && !headlines.length ? (
          <p className="se-text-body se-headlines__empty" role="status">
            {t("portada.titulares.vacio")}
          </p>
        ) : null}

        {state.status === "success" && headlines.length ? (
          <>
            <div className="se-headlines__rail-wrap">
              <ul
                className="se-headlines__rail"
                ref={railRef}
                tabIndex={0}
                role="list"
                aria-label={t("portada.titulares.carril")}
                onKeyDown={handleKeyDown}
              >
                {items.map((h, idx) => (
                  <li key={String(h.id ?? h.title)} className="se-headlines__rail-item">
                    <article
                      className="se-headlines__card"
                      data-headline-card
                      aria-label={t("portada.titulares.titularNDeM", { n: idx + 1, total: items.length })}
                    >
                      <h3 className="se-headlines__title">{h.title}</h3>
                      {h.summary ? <p className="se-text-body se-headlines__summary">{h.summary}</p> : null}
                      <div className="se-headlines__meta">
                        {h.sourceName ? (
                          h.sourceUrl ? (
                            <a href={h.sourceUrl} className="se-link" rel="noopener noreferrer" target="_blank">
                              {h.sourceName}
                            </a>
                          ) : (
                            <span className="se-meta">{h.sourceName}</span>
                          )
                        ) : null}
                        {h.publishedAt ? (
                          <time className="se-meta" dateTime={h.publishedAt}>
                            {formatearFecha(h.publishedAt, "larga") || h.publishedAt}
                          </time>
                        ) : null}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
              <div className="se-headlines__fade se-headlines__fade--left" aria-hidden="true" />
              <div className="se-headlines__fade se-headlines__fade--right" aria-hidden="true" />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
};

HeadlinesSection.propTypes = {
  state: PropTypes.shape({
    status: PropTypes.oneOf(["idle", "loading", "success", "error"]).isRequired,
    headlines: PropTypes.array,
    error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
  onRetry: PropTypes.func,
};
