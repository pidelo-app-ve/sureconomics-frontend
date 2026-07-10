import { Link } from "react-router-dom";
import { useEffect } from "react";
import { REPORTS, SUBSCRIPTION } from "../data/surEconomicsMock";
import { formatDateEs } from "../lib/date";
import { applyPageMeta } from "../lib/seo";
import PropTypes from "prop-types";

const ReportTierBadge = ({ tier }) => {
  return <span className="se-meta se-meta--category">{tier}</span>;
};

ReportTierBadge.propTypes = {
  tier: PropTypes.string.isRequired,
};

export const Informes = () => {
  useEffect(() => {
    applyPageMeta({
      title: "Informes — SurEconomics",
      description: "Biblioteca de informes e investigación de SurEconomics.",
    });
  }, []);

  return (
    <main className="se-blog se-reports" role="main">
      <section className="se-hero se-hero--institutional se-reports__hero" aria-label="Informes y reportes">
        <div className="se-container">
          <div className="se-reports__hero-grid">
            <div className="se-reports__hero-copy">
              <p className="se-reports__kicker">Informes</p>
              <h1 className="se-reports__title">Investigación extensa con lectura ejecutiva</h1>
              <p className="se-text-lead se-reports__lead">
                Escenarios, riesgos y oportunidades para Latinoamérica. Una biblioteca pensada para tomadores de decisión.
              </p>
              <div className="se-reports__hero-cta">
                <Link to="/suscribirse" className="se-btn" aria-label="Suscribirse">
                  Suscribirse
                </Link>
                <Link to="/consultoria" className="se-btn se-btn--secondary" aria-label="Ver consultoría">
                  Consultoría
                </Link>
              </div>
            </div>

            <aside className="se-reports__hero-panel" aria-label="Beneficios">
              <p className="se-reports__panel-kicker">Incluye</p>
              <ul className="se-reports__bullets" aria-label="Beneficios de la suscripción">
                <li>Boletín mensual con síntesis accionable.</li>
                <li>Informes por país/sector con estructura ejecutiva.</li>
                <li>Lectura geopolítica y riesgos de mercado.</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <div className="se-two-col se-two-col--align-start">
            <div>
              <h2 className="se-heading-section">Valor premium</h2>
              <p className="se-text-body">
                Nuestros informes integran análisis económico, financiero y de lectura política con una estructura pensada para tomadores de decisión. Cada reporte acompaña el “por qué”
                y el “qué sigue”, orientando a inversionistas e institucionalidad.
              </p>
              <div className="se-reports__signals" aria-label="Señales de valor">
                {[
                  { t: "Cobertura", d: "Economía, finanzas y política con contexto regional." },
                  { t: "Estructura", d: "Marco, escenarios, riesgos y próximos pasos." },
                  { t: "Acción", d: "Síntesis ejecutiva para decidir con criterio." },
                ].map((s) => (
                  <div key={s.t} className="se-reports__signal">
                    <p className="se-reports__signal-title">{s.t}</p>
                    <p className="se-reports__signal-desc">{s.d}</p>
                  </div>
                ))}
              </div>
              <div className="se-reports__value-cta">
                <Link to="/suscribirse" className="se-btn se-btn--secondary" aria-label="Ir a Suscripción">
                  Suscribirse
                </Link>
              </div>
            </div>

            <div>
              <h2 className="se-heading-section">Reportes destacados</h2>
              <div className="se-report-grid">
                {REPORTS.map((r) => (
                  <article key={r.id} className="se-card se-card--compact">
                    <div className="se-card__body">
                      <ReportTierBadge tier={r.tier} />
                      <h3 className="se-heading-card se-heading-card--small">{r.title}</h3>
                      <p className="se-card__excerpt se-text-body">{r.excerpt}</p>
                      <div className="se-report-meta">
                        <time dateTime={r.date}>{formatDateEs(r.date)}</time>
                      </div>
                      <Link to="/suscribirse" className="se-link se-card__cta">
                        Solicitar acceso
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="se-section se-section--narrow">
        <div className="se-container se-container--narrow">
          <div className="se-research-cta se-reports__cta">
            <h2 className="se-heading-section se-reports__cta-title">Una biblioteca para decisiones</h2>
            <p className="se-text-body se-reports__cta-text">
              {SUBSCRIPTION.benefits[0]} {SUBSCRIPTION.benefits[1]}
            </p>
            <div className="se-reports__cta-actions">
              <Link to="/suscribirse" className="se-btn" aria-label="Suscribirse">
                Suscribirse
              </Link>
              <Link to="/contacto" className="se-btn se-btn--secondary" aria-label="Contactar">
                Contacto institucional
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

