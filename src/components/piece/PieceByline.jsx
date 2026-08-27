import PropTypes from "prop-types";
import { BRAND } from "../../brand/publicBrandLogos";

/**
 * La firma de una pieza, como la define el brandbook.
 *
 * "POR" en cobre, el nombre en grueso, una regla vertical y la fecha con su icono.
 *
 * *Sin fotografía de la persona*, y eso es una decisión editorial, no una pieza
 * pendiente: el brandbook la dibuja, pero conseguir y mantener un retrato por cada
 * firmante cuesta más de lo que aporta. Cuando firma la casa sí va el isotipo, que
 * es un archivo y no cien.
 *
 * El editorial firma siempre como la casa: es la posición del medio, no la de una
 * persona, y ese es justamente el rasgo que lo distingue de un análisis firmado.
 */
const ES_LA_CASA = /redacci[oó]n|sureconomics/i;

const IconoFecha = () => (
  <svg
    className="se-firma__cal"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <circle cx="8" cy="14" r=".9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14" r=".9" fill="currentColor" stroke="none" />
    <circle cx="16" cy="14" r=".9" fill="currentColor" stroke="none" />
    <circle cx="8" cy="17.5" r=".9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="17.5" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

export const PieceByline = ({ autor, fecha, unidad, esEditorial }) => {
  // Sin firma y sin fecha no hay bloque que dibujar. Una pieza puede publicarse sin
  // firma a propósito -- así se decidió cuando la firma dejó de salir de la cuenta.
  if (!autor && !fecha && !unidad) return null;

  const nombre = esEditorial ? "Redacción SurEconomics" : autor;
  const laCasa = esEditorial || (nombre ? ES_LA_CASA.test(nombre) : false);

  return (
    <div className="se-firma">
      {laCasa ? (
        <img className="se-firma__marca" src={BRAND.isotipo} alt="" width="56" height="56" />
      ) : null}

      {nombre ? (
        <div className="se-firma__quien">
          <span className="se-firma__por">Por</span>
          <span className="se-firma__nombre">{nombre}</span>
          {unidad ? (
            <span className="se-firma__rol">Investigación de {unidad}</span>
          ) : null}
        </div>
      ) : null}

      {fecha ? (
        <div className="se-firma__cuando">
          <IconoFecha />
          <time>{fecha}</time>
        </div>
      ) : null}
    </div>
  );
};

PieceByline.propTypes = {
  autor: PropTypes.string,
  fecha: PropTypes.string,
  unidad: PropTypes.string,
  esEditorial: PropTypes.bool,
};

PieceByline.defaultProps = {
  autor: null,
  fecha: null,
  unidad: null,
  esEditorial: false,
};
