import PropTypes from "prop-types";
import { geoPrincipal } from "../../lib/contentFilter";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { haceCuanto } from "../../hooks/useHeadlines";

const UN_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * «Venezuela · Hace 3 h» o «Venezuela · 4 ago 2026»: el lugar en negrita y cuándo. Lo
 * de las últimas 24 horas se cuenta en horas, como en un canal de noticias; lo más
 * viejo lleva la fecha. Lo usan la apertura y Noticias.
 */
export const LugarYFecha = ({ pieza, clase }) => {
  const { t } = useIdioma();
  const ms = Date.parse(pieza.fechaIso ?? "");
  const reciente = ms && Date.now() - ms < UN_DIA_MS;
  const cuando = reciente ? haceCuanto(pieza.fechaIso, t) : pieza.fecha;
  return (
    <span className={clase}>
      <span className="se-meta__lugar">{geoPrincipal(pieza)}</span>
      {cuando ? <span aria-hidden="true"> · </span> : null}
      {cuando ? <time dateTime={pieza.fechaIso ?? undefined}>{cuando}</time> : null}
    </span>
  );
};

LugarYFecha.propTypes = {
  pieza: PropTypes.shape({ fecha: PropTypes.string, fechaIso: PropTypes.string }).isRequired,
  clase: PropTypes.string.isRequired,
};
