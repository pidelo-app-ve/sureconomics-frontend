import { Link } from "react-router-dom";
import { CONTACT, SERVICES } from "../data/surEconomicsMock";

export const Consultoria = () => {
  return (
    <main className="se-blog" role="main">
      <section className="se-hero se-hero--institutional">
        <div className="se-container">
          <div className="se-institutional-hero">
            <h1 className="se-heading-hero">Consultoría</h1>
            <p className="se-text-lead se-hero__claim">
              Investigación y acompañamiento institucional orientado a decisiones en economía, finanzas y escenarios políticos.
            </p>
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
            <div className="se-contact-block">
              <div className="se-contact-block__title">Contacto</div>
              <a href={`mailto:${CONTACT.primaryEmail}`} className="se-link">
                {CONTACT.primaryEmail}
              </a>
              <div className="se-contact-block__sub">
                Emails de dirección editorial:
              </div>
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
              <div style={{ marginTop: "1.25rem" }}>
                <Link to="/contacto" className="se-btn se-btn--secondary" aria-label="Ir a Contacto">
                  Contactar
                </Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <div className="se-services-grid" aria-label="Servicios de consultoría">
              {SERVICES.map((s) => (
                <article key={s.id} className="se-card se-card--service">
                  <div className="se-card__body">
                    <h3 className="se-heading-card se-heading-card--small">{s.title}</h3>
                    <p className="se-card__excerpt se-text-body">{s.description}</p>
                    <Link to="/contacto" className="se-link se-card__cta">
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

