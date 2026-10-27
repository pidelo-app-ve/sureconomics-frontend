import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useCotizaciones } from "../../hooks/useMonedas";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearNumero } from "../../i18n/motor";
import { porDolar } from "../../lib/monedas";
import "./fichaDeMoneda.css";

/**
 * La ficha de cotización de una moneda, junto al titular de la pieza que habla de ella:
 * «VES 886,23 ▲ +0,17 %». Lleva a /monedas. La subida o la bajada va con flecha y
 * signo, no solo con color. Sin dato vigente no se pinta: una ficha vieja mentiría.
 */
export const Flecha = ({ direccion }) =>
  direccion === "up" || direccion === "down" ? (
    <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false">
      <path d={direccion === "up" ? "M5 1.5l4 6H1z" : "M5 8.5l4-6H1z"} fill="currentColor" />
    </svg>
  ) : null;

Flecha.propTypes = { direccion: PropTypes.string };

export const variacionTexto = (m, lang) =>
  typeof m.variacion === "number"
    ? `${m.variacion > 0 ? "+" : ""}${formatearNumero(m.variacion, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
    : null;

export const FichaDeMoneda = ({ codigo, className = "" }) => {
  const { t, lang } = useIdioma();
  const todas = useCotizaciones();
  const m = todas?.[codigo];
  if (!m || m.valor === null || m.vieja) return null;
  const variacion = m.fija ? null : variacionTexto(m, lang);
  return (
    <Enlace
      to="/monedas"
      className={`se-ficha-moneda ${className}`.trim()}
      aria-label={t("monedas.ficha.etiqueta", {
        codigo,
        valor: porDolar(m.valor, lang),
        variacion: variacion ?? t("monedas.ficha.sinVariacion"),
      })}
    >
      <span className="se-ficha-moneda__codigo" aria-hidden="true">{codigo}</span>
      <span className="se-ficha-moneda__valor" aria-hidden="true">{porDolar(m.valor, lang)}</span>
      {variacion ? (
        <span className={`se-ficha-moneda__var se-ficha-moneda__var--${m.direccion}`} aria-hidden="true">
          <Flecha direccion={m.direccion} />
          {variacion}
        </span>
      ) : null}
    </Enlace>
  );
};

FichaDeMoneda.propTypes = {
  codigo: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default FichaDeMoneda;
