import { Link } from "react-router-dom";
import { REPORTS, SUBSCRIPTION } from "../data/surEconomicsMock";
import { formatDate } from "../data/blogMock";

const ReportTierBadge = ({ tier }) => {
  return <span className="se-meta se-meta--category">{tier}</span>;
};

export const Informes = () => {
  return (
    <main className="se-blog" role="main">
      <section className="se-hero se-hero--institutional">
        <div className="se-container">
          <div className="se-institutional-hero">
            <h1 className="se-heading-hero">Informes y reportes</h1>
            <p className="se-text-lead se-hero__claim">
              Investigación extensa con lectura ejecutiva: escenarios, riesgos y oportunidades para Latinoamérica.
            </p>
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
              <ul className="se-compact-list">
                <li>Investigaciones extensas en economía, finanzas y política.</li>
                <li>Boletín mensual con síntesis accionable.</li>
                <li>Oportunidades de inversión directa en Latinoamérica.</li>
                <li>Acceso preferente para potenciales inversionistas.</li>
                <li>Cursos con orientación práctica en economía y finanzas.</li>
              </ul>
              <div style={{ marginTop: "1.5rem" }}>
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
                        <time dateTime={r.date}>{formatDate(r.date)}</time>
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
          <div className="se-research-cta">
            <h2 className="se-heading-section">Una biblioteca para decisiones</h2>
            <p className="se-text-body">
              {SUBSCRIPTION.benefits[0]} {SUBSCRIPTION.benefits[1]}
            </p>
            <Link to="/suscribirse" className="se-btn" aria-label="Suscribirse">
              Suscribirse
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

