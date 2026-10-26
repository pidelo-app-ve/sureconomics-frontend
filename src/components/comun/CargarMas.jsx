import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";

/**
 * «Cargar más»: añade la tanda siguiente debajo, sin salir de donde se está. Lo usan las
 * secciones de la portada y los listados. Dice cuántas hay a la vista de cuántas, con
 * una regla que se llena, y el botón cuántas trae. Sin nada más que cargar, no se pinta.
 *
 * La cuenta es una región viva: quien usa lector de pantalla oye que llegaron más.
 */
export const CargarMas = ({ mostradas, total, paso, onCargar, unidad = "" }) => {
  const { t } = useIdioma();
  if (mostradas >= total) return null;
  const siguientes = Math.min(paso, total - mostradas);
  return (
    <div className="se-cargar-mas">
      <p className="se-cargar-mas__cuenta" aria-live="polite">
        {t("comun.cargarMas.cuenta", {
          mostradas: <strong key="m">{mostradas}</strong>,
          total: <strong key="t">{total}</strong>,
          unidad,
        })}
      </p>
      <span className="se-cargar-mas__regla" aria-hidden="true">
        <span style={{ transform: `scaleX(${mostradas / total})` }} />
      </span>
      <button type="button" className="se-cargar-mas__boton" onClick={onCargar}>
        {t("comun.cargarMas.boton", { n: siguientes })}
      </button>
    </div>
  );
};

CargarMas.propTypes = {
  mostradas: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  /** Cuántas trae cada pulsación. */
  paso: PropTypes.number.isRequired,
  onCargar: PropTypes.func.isRequired,
  /** Qué se cuenta, en minúscula y plural: «artículos», «noticias». */
  unidad: PropTypes.string,
};

export default CargarMas;
