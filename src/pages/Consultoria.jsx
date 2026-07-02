import { Link } from "react-router-dom";
import { CONTACT, SERVICES } from "../data/surEconomicsMock";

export const Consultoria = () => {
  return (
    <main className="se-blog se-consulting" role="main">
      <section className="se-hero se-hero--institutional se-consulting__hero" aria-label="Consultoría">
        <div className="se-container">
          <div className="se-consulting__hero-grid">
            <div className="se-consulting__hero-copy">
              <p className="se-consulting__kicker">Consultoría</p>
              <h1 className="se-consulting__title">Decisiones con criterio, estructura y señal</h1>
              <p className="se-text-lead se-consulting__lead">
                Investigación y acompañamiento institucional orientado a decisiones en economía, finanzas y escenarios políticos.
              </p>

              <div className="se-consulting__deliverables" aria-label="Entregables">
                {["Lectura ejecutiva", "Modelos + escenarios", "Reporte institucional"].map((t) => (
                  <span key={t} className="se-consulting__chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <aside className="se-contact-block se-consulting__contact" aria-label="Contacto consultoría">
              <div className="se-contact-block__title">Contacto</div>
              <a href={`mailto:${CONTACT.primaryEmail}`} className="se-link">
                {CONTACT.primaryEmail}
              </a>
              <div className="se-contact-block__sub">Emails de dirección editorial:</div>
              <div className="se-contact-block__emails">
                {CONTACT.leadershipEmails.map((e) => (
                  <div key={e.email} className="se-contact-block__email">
                    <span className="se-contact-block__email-name">{e.name}:</span>{" "}
                    <a href={`mailto:${e.email}`} className="se-link">
                      {e.email}
                    </a>
                  </div>
                ))}
              </div>
              <div className="se-consulting__contact-cta">
                <Link to="/contacto" className="se-btn se-btn--secondary" aria-label="Ir a Contacto">
                  Contactar
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <div className="se-two-col se-two-col--align-start">
            <div>
              <h2 className="se-heading-section">Servicios</h2>
              <p className="se-text-body">
                Diseñamos entregables con estructura ejecutiva para apoyar inversión, valuación y evaluación financiera. Nuestro enfoque conecta lectura macro con implicaciones operativas.
              </p>
            </div>
            <div className="se-consulting__services-aside" aria-hidden="true">
              <div className="se-consulting__aside-card">
                <p className="se-consulting__aside-kicker">Metodología</p>
                <p className="se-consulting__aside-text">
                  Convertimos datos y señales cualitativas en entregables accionables: marco, escenarios, riesgos, próximos pasos.
                </p>
              </div>
            </div>
          </div>

          <div className="se-consulting__services">
            <div className="se-services-grid" aria-label="Servicios de consultoría">
              {SERVICES.map((s) => (
                <article key={s.id} className="se-card se-card--service se-consulting__service-card">
                  <div className="se-card__body">
                    <p className="se-consulting__service-meta">Entregable · Confidencial · Executive-ready</p>
                    <h3 className="se-heading-card se-heading-card--small">{s.title}</h3>
                    <p className="se-card__excerpt se-text-body">{s.description}</p>
                    <Link
                      to={`/contacto?asunto=${encodeURIComponent(s.title)}`}
                      className="se-btn se-consulting__service-cta"
                      aria-label={`Solicitar conversación: ${s.title}`}
                    >
                      Solicitar conversación
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

