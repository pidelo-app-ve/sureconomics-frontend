import { BRAND } from "../data/surEconomicsMock";
import { Enlace } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";

const BENEFICIOS = ["beneficio1", "beneficio2", "beneficio3", "beneficio4", "beneficio5"];

export const Subscribe = () => {
  const { t } = useIdioma();
  useMetaPagina({
    title: t("boletin.suscripcion.meta.titulo", { marca: BRAND.name }),
    description: t("boletin.suscripcion.meta.descripcion"),
  });

  return (
    <main className="se-blog" role="main">
      <section className="se-hero se-hero--institutional">
        <div className="se-container">
          <div className="se-institutional-hero">
            <h1 className="se-heading-hero">{t("boletin.suscripcion.titulo")}</h1>
            <p className="se-text-lead se-hero__claim">{t("boletin.suscripcion.claim")}</p>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <div className="se-two-col se-two-col--align-start">
            <div>
              <h2 className="se-heading-section">{t("boletin.suscripcion.beneficios")}</h2>
              <ul className="se-compact-list">
                {BENEFICIOS.map((clave) => (
                  <li key={clave}>{t(`boletin.suscripcion.${clave}`)}</li>
                ))}
              </ul>

              <div style={{ marginTop: "1.75rem" }}>
                <Enlace to="/informes" className="se-link" aria-label={t("boletin.suscripcion.verInformes")}>
                  {t("boletin.suscripcion.verInformes")}
                </Enlace>
              </div>
            </div>

            <div>
              <div className="se-research-cta">
                <h2 className="se-heading-section">{t("boletin.suscripcion.planPremium")}</h2>
                <div className="se-subscription-price">
                  <div className="se-meta se-meta--category">{t("boletin.suscripcion.precio")}</div>
                  <div className="se-subscription-price__value">{t("boletin.suscripcion.precioValor")}</div>
                </div>

                <div className="se-subscription-method">
                  <div className="se-meta se-meta--category">{t("boletin.suscripcion.pago")}</div>
                  <div className="se-subscription-method__value">{t("boletin.suscripcion.pagoValor")}</div>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <Enlace to="#" className="se-btn" aria-label={t("boletin.suscripcion.ctaDemo")}>
                    {t("boletin.suscripcion.cta")}
                  </Enlace>
                </div>

                <p className="se-text-body" style={{ marginTop: "1rem", color: "var(--se-gray-500)" }}>
                  {t("boletin.suscripcion.demo")}
                </p>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <Enlace to="/" className="se-link">
                  {t("boletin.suscripcion.explorar")}
                </Enlace>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
