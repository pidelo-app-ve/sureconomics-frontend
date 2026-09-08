import { Link } from "react-router-dom";
import { BRAND, PRIMARY_NAV, CONTACT, SOCIAL } from "../data/surEconomicsMock";
import { IconInstagram, IconX } from "./icons/social";
import { BRAND_PUBLIC_LOGO } from "../brand/publicBrandLogos";
import useI18n from "../i18n/useI18n";
import { useState } from "react";
import { subscribeToNewsletter } from "../services/newsletterService";

/** Un icono por cuenta. Una red sin icono aquí no se pinta: mejor que falte a que
 *  salga un hueco con el nombre suelto rompiendo la fila. */
const ICONO_RED = {
  instagram: IconInstagram,
  x: IconX,
};

export const Footer = () => {
  const { t } = useI18n();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  // El campo trampa: invisible para una persona, irresistible para un rastreador.
  const [newsletterTrampa, setNewsletterTrampa] = useState("");
  const [newsletterState, setNewsletterState] = useState({ status: "idle", message: "" });

  /**
   * Suscribir de verdad.
   *
   * Lo que había aquí antes: un `setTimeout` de 700 milisegundos y el mensaje "Listo. Te
   * enviaremos el próximo boletín (demo)". No existía ni la tabla ni la ruta, así que
   * cada correo escrito en este formulario se perdió — y la persona se fue creyendo lo
   * contrario. La palabra "(demo)" estaba ahí, pero se lee de pasada.
   *
   * El acierto no distingue si el correo ya estaba: el servidor contesta lo mismo en los
   * dos casos para que nadie pueda averiguar quién está suscrito escribiendo
   * direcciones, y decirlo aquí anularía esa protección.
   */
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (newsletterState.status === "loading") return;
    const email = newsletterEmail.trim();
    if (!email) return;
    setNewsletterState({ status: "loading", message: "" });
    try {
      await subscribeToNewsletter(email, {
        source: "footer",
        honeypot: newsletterTrampa,
      });
      setNewsletterEmail("");
      setNewsletterState({
        status: "success",
        message: "Listo. Le llegará el próximo boletín a ese correo.",
      });
    } catch (err) {
      setNewsletterState({
        status: "error",
        message:
          err?.status === 422
            ? "Revise el correo: parece que tiene algo raro."
            : err?.status === 429
              ? "Demasiados intentos. Espere un momento y vuelva a probar."
              : "No se pudo completar la suscripción. Inténtelo de nuevo.",
      });
    }
  };

  return (
    <footer className="se-footer" role="contentinfo">
      <div className="se-container">
        <div className="se-footer__grid">
          <div className="se-footer__about">
            <h2 className="se-footer__brand">
              <img
                className="se-footer__brand-mark"
                src={BRAND_PUBLIC_LOGO.light.wordmarkNoTagline}
                alt=""
                width={220}
                height={48}
                decoding="async"
              />
              <span className="se-sr-only">{BRAND.name}</span>
            </h2>
            <p className="se-footer__tagline">{BRAND.tagline}</p>
            <p className="se-footer__description">{BRAND.description}</p>
          </div>

          <nav className="se-footer__nav" aria-label="Enlaces del sitio">
            <div className="se-footer__contact-title">Navegación</div>
            <ul className="se-footer__nav-list">
              {PRIMARY_NAV.map((item) => (
                <li key={item.id}>
                  <Link to={item.to} className="se-footer__link">
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="se-footer__contact" aria-label="Contacto">
            <div className="se-footer__contact-title">{t("nav.contacto")}</div>
            <a className="se-footer__link" href={`mailto:${CONTACT.primaryEmail}`}>
              {CONTACT.primaryEmail}
            </a>
          </div>

          <div className="se-footer__newsletter" aria-label="Boletín">
            <div className="se-footer__contact-title">Boletín</div>
            <p className="se-footer__newsletter-text">
              Reciba un resumen ejecutivo con señales y contexto. Una vez al mes.
            </p>
            <form className="se-footer__newsletter-form" onSubmit={handleNewsletterSubmit}>
              <label className="se-sr-only" htmlFor="footer-newsletter-email">
                Correo electrónico
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                className="se-footer__newsletter-input"
                placeholder="Correo electrónico"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterState.status === "loading"}
                required
                aria-label="Correo electrónico para newsletter"
              />
              {/* Fuera del tabulador y de los lectores de pantalla: si una persona la
                  rellenara sin querer, su suscripción se descartaría. */}
              <input
                type="text"
                name="website"
                className="se-sr-only"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
                value={newsletterTrampa}
                onChange={(e) => setNewsletterTrampa(e.target.value)}
              />
              <button
                type="submit"
                className="se-footer__newsletter-btn"
                disabled={newsletterState.status === "loading"}
                aria-label="Suscribirme al boletín"
              >
                {newsletterState.status === "loading" ? "Enviando…" : "Suscribirme"}
              </button>
            </form>
            <div className="se-footer__newsletter-status" aria-live="polite">
              {newsletterState.status === "success" ? (
                <p className="se-footer__newsletter-ok">{newsletterState.message}</p>
              ) : null}
              {newsletterState.status === "error" ? (
                <p className="se-footer__newsletter-error" role="alert">
                  {newsletterState.message}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <hr className="se-divider se-footer__divider" />
        <div className="se-footer__bottom">
          <p className="se-footer__copy">
            © {new Date().getFullYear()} {BRAND.name}. Todos los derechos reservados.
          </p>

          <div className="se-footer__social">
            <span className="se-footer__social-title" id="se-footer-redes">
              Síguenos en
            </span>
            <ul className="se-footer__social-list" aria-labelledby="se-footer-redes">
              {SOCIAL.map(({ id, label, handle, url }) => {
                const Icono = ICONO_RED[id];
                if (!Icono) return null;
                return (
                  <li key={id}>
                    <a
                      className={`se-footer__social-link se-footer__social-link--${id}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label}: ${handle}`}
                      title={`${label} ${handle}`}
                    >
                      <Icono className="se-footer__social-svg" />
                      <span className="se-sr-only">{`${label} ${handle}`}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
