import PropTypes from "prop-types";
import { formatDateEs } from "../../lib/date";
import { ErrorState, LoadingState } from "../content";

export const HeadlinesSection = ({ state, onRetry }) => {
  if (state.status === "loading" || state.status === "idle") {
    return (
      <section className="se-section se-headlines" aria-labelledby="se-headlines-title">
        <div className="se-container">
          <h2 id="se-headlines-title" className="se-heading-section se-heading-section--small">
            Titulares
          </h2>
          <LoadingState title="Cargando titulares…" description="Obteniendo resumen de noticias desde el servidor." />
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="se-section se-headlines" aria-labelledby="se-headlines-title">
        <div className="se-container">
          <h2 id="se-headlines-title" className="se-heading-section se-heading-section--small">
            Titulares
          </h2>
          <ErrorState title="No pudimos cargar los titulares" error={state.error} onRetry={onRetry} />
        </div>
      </section>
    );
  }

  const headlines = state.headlines ?? [];
  if (!headlines.length) {
    return (
      <section className="se-section se-headlines" aria-labelledby="se-headlines-title">
        <div className="se-container">
          <h2 id="se-headlines-title" className="se-heading-section se-heading-section--small">
            Titulares
          </h2>
          <p className="se-text-body se-headlines__empty" role="status">
            No hay titulares publicados por el momento.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="se-section se-headlines" aria-labelledby="se-headlines-title">
      <div className="se-container">
        <h2 id="se-headlines-title" className="se-heading-section se-heading-section--small">
          Titulares
        </h2>
        <ul className="se-headlines__list">
          {headlines.map((h) => (
            <li key={String(h.id ?? h.title)} className="se-headlines__item">
              <article className="se-headlines__card">
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
                      {formatDateEs(h.publishedAt)}
                    </time>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
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
