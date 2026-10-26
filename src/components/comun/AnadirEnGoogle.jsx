import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";

/**
 * «Añádanos en Google»: el lector marca SurEconomics como fuente preferida y Google nos
 * muestra más en sus resultados de noticias (Noticias destacadas, Discover). Es el botón
 * que Google ofrece a los medios desde agosto de 2026; dejan diseñarlo a cada uno
 * mientras lleve al mismo sitio, así que va con la letra del periódico y sin su logo.
 *
 * En una pestaña nueva: quien lo pulsa está leyendo y no debe perder la pieza.
 *
 * Dos sitios: el pie (`pie`, sobre el verde) y el final de cada pieza (`pieza`, con una
 * línea que explica qué gana el lector, porque ahí no hay más contexto).
 */
const FUENTE_PREFERIDA = "https://www.google.com/preferences/source?q=sureconomics.com";

const IconoEstrella = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.85 6.75 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z" strokeLinejoin="round" />
  </svg>
);

export const AnadirEnGoogle = ({ variante }) => {
  const { t } = useIdioma();
  const boton = (
    <a className={`se-fuente-google__boton se-fuente-google__boton--${variante}`} href={FUENTE_PREFERIDA} target="_blank" rel="noopener noreferrer">
      <IconoEstrella />
      {t("comun.fuenteGoogle.boton")}
      <span className="se-sr-only"> {t("comun.fuenteGoogle.nuevaPestana")}</span>
    </a>
  );
  if (variante === "pie") return boton;
  return (
    <div className="se-fuente-google">
      <p className="se-fuente-google__nota">{t("comun.fuenteGoogle.nota")}</p>
      {boton}
    </div>
  );
};

AnadirEnGoogle.propTypes = {
  variante: PropTypes.oneOf(["pie", "pieza"]),
};

AnadirEnGoogle.defaultProps = {
  variante: "pieza",
};
