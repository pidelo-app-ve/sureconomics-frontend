import PropTypes from "prop-types";
import { useHistoriaMoneda } from "../../hooks/useMonedas";
import { FichaDeMoneda } from "./FichaDeMoneda";
import { GraficaDeMoneda } from "./GraficaDeMoneda";

/**
 * Bajo el titular de la apertura, cuando la pieza habla de una moneda: su ficha de hoy y
 * su gráfica de 30 días, compacta. Como abre Bloomberg una noticia de mercado, con la
 * cotización al lado del titular.
 */
export const AperturaMoneda = ({ codigo }) => {
  const puntos = useHistoriaMoneda(codigo);
  return (
    <div className="se-plana__moneda">
      <FichaDeMoneda codigo={codigo} />
      {puntos && puntos.length >= 2 ? <GraficaDeMoneda codigo={codigo} puntos={puntos} compacta /> : null}
    </div>
  );
};

AperturaMoneda.propTypes = { codigo: PropTypes.string.isRequired };

export default AperturaMoneda;
