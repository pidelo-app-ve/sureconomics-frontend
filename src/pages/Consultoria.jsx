import { BRAND, CONTACT, SERVICES } from "../data/surEconomicsMock";
import { Enlace } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";

const CHIPS = ["chip1", "chip2", "chip3"];

export const Consultoria = () => {
  const { t } = useIdioma();
  useMetaPagina({
    title: t("paginas.consultoria.meta.titulo", { marca: BRAND.name }),
    description: t("paginas.consultoria.meta.descripcion"),
  });
  return (
    <main className="se-blog se-consulting" role="main">
      <section className="se-hero se-hero--institutional se-consulting__hero" aria-label={t("paginas.consultoria.kicker")}>
        <div className="se-container">
          <div className="se-consulting__hero-grid">
            <div className="se-consulting__hero-copy">
              <p className="se-consulting__kicker">{t("paginas.consultoria.kicker")}</p>
              <h1 className="se-consulting__title">{t("paginas.consultoria.titulo")}</h1>
              <p className="se-text-lead se-consulting__lead">{t("paginas.consultoria.lead")}</p>

              <div className="se-consulting__deliverables" aria-label={t("paginas.consultoria.entregables")}>
                {CHIPS.map((clave) => (
                  <span key={clave} className="se-consulting__chip">
                    {t(`paginas.consultoria.${clave}`)}
                  </span>
                ))}
              </div>
            </div>

            <aside className="se-contact-block se-consulting__contact" aria-label={t("paginas.consultoria.contactoRegion")}>
              <div className="se-contact-block__title">{t("paginas.consultoria.contacto")}</div>
              <a href={`mailto:${CONTACT.primaryEmail}`} className="se-link">
                {CONTACT.primaryEmail}
              </a>
              <div className="se-contact-block__sub">{t("paginas.consultoria.emailsDireccion")}</div>
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
                <Enlace to="/contacto" className="se-btn se-btn--secondary" aria-label={t("paginas.consultoria.irAContacto")}>
                  {t("paginas.consultoria.contactar")}
                </Enlace>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <div className="se-two-col se-two-col--align-start">
            <div>
              <h2 className="se-heading-section">{t("paginas.consultoria.servicios")}</h2>
              <p className="se-text-body">{t("paginas.consultoria.serviciosTexto")}</p>
            </div>
            <div className="se-consulting__services-aside" aria-hidden="true">
              <div className="se-consulting__aside-card">
                <p className="se-consulting__aside-kicker">{t("paginas.consultoria.metodologia")}</p>
                <p className="se-consulting__aside-text">{t("paginas.consultoria.metodologiaTexto")}</p>
              </div>
            </div>
          </div>

          <div className="se-consulting__services">
            <div className="se-services-grid" aria-label={t("paginas.consultoria.serviciosRegion")}>
              {SERVICES.map((s) => (
                <article key={s.id} className="se-card se-card--service se-consulting__service-card">
                  <div className="se-card__body">
                    <p className="se-consulting__service-meta">{t("paginas.consultoria.servicioMeta")}</p>
                    <h3 className="se-heading-card se-heading-card--small">{t(`paginas.consultoria.servicio.${s.id}.titulo`)}</h3>
                    <p className="se-card__excerpt se-text-body">{t(`paginas.consultoria.servicio.${s.id}.descripcion`)}</p>
                    <Enlace
                      to={`/contacto?asunto=${encodeURIComponent(t(`paginas.consultoria.servicio.${s.id}.titulo`))}`}
                      className="se-btn se-consulting__service-cta"
                      aria-label={t("paginas.consultoria.solicitarCon", { servicio: t(`paginas.consultoria.servicio.${s.id}.titulo`) })}
                    >
                      {t("paginas.consultoria.solicitar")}
                    </Enlace>
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

