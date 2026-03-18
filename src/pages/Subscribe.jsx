import { Link } from "react-router-dom";
import { SUBSCRIPTION } from "../data/surEconomicsMock";

export const Subscribe = () => {
  return (
    <main className="se-blog" role="main">
      <section className="se-hero se-hero--institutional">
        <div className="se-container">
          <div className="se-institutional-hero">
            <h1 className="se-heading-hero">Suscripción</h1>
            <p className="se-text-lead se-hero__claim">
              Acceso a investigaciones, reportes y boletines con lectura ejecutiva para América Latina.
            </p>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <div className="se-two-col se-two-col--align-start">
            <div>
              <h2 className="se-heading-section">Beneficios de la suscripción</h2>
              <ul className="se-compact-list">
                {SUBSCRIPTION.benefits.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>

              <div style={{ marginTop: "1.75rem" }}>
                <Link to="/informes" className="se-link" aria-label="Ver informes y reportes">
                  Ver informes y reportes
                </Link>
              </div>
            </div>

            <div>
              <div className="se-research-cta">
                <h2 className="se-heading-section">Plan premium</h2>
                <div className="se-subscription-price">
                  <div className="se-meta se-meta--category">Precio</div>
                  <div className="se-subscription-price__value">
                    {SUBSCRIPTION.priceLabel}
                  </div>
                </div>

                <div className="se-subscription-method">
                  <div className="se-meta se-meta--category">Pago</div>
                  <div className="se-subscription-method__value">
                    {SUBSCRIPTION.paymentMethodsLabel}
                  </div>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <Link to="#" className="se-btn" aria-label="CTA de suscripción (demo)">
                    {SUBSCRIPTION.ctaLabel}
                  </Link>
                </div>

                <p className="se-text-body" style={{ marginTop: "1rem", color: "var(--se-gray-500)" }}>
                  Esta pantalla es una demo institucional. En la siguiente fase se conectará el flujo de pago.
                </p>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <Link to="/" className="se-link">
                  Explorar la plataforma
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
