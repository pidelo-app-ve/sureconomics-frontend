import PropTypes from "prop-types";
import { Suspense, lazy, useEffect } from "react";
import { useHistoriaMoneda } from "../useMonedas";
import { FichaDeMoneda } from "./FichaDeMoneda";
// La hoja de la gráfica sigue viajando con el sitio, en el mismo sitio de la cascada:
// lo que baja aparte es solo el código.
import "./graficaDeMoneda.css";

// La gráfica baja aparte, y se pide a la vez que la historia (abajo), no después: sale
// cuando llegan los puntos, como antes. Si no llega, la ficha se queda sola.
const cargarGrafica = () => import("./GraficaDeMoneda");
const GraficaDeMoneda = lazy(() =>
  cargarGrafica()
    .then((m) => ({ default: m.GraficaDeMoneda }))
    .catch(() => ({ default: () => null }))
);

/**
 * Bajo el titular de la apertura, cuando la pieza habla de una moneda: su ficha de hoy y
 * su gráfica de 30 días, compacta. Como abre Bloomberg una noticia de mercado, con la
 * cotización al lado del titular.
 */
export const AperturaMoneda = ({ codigo }) => {
  const puntos = useHistoriaMoneda(codigo);
  useEffect(() => {
    cargarGrafica().catch(() => {});
  }, []);
  return (
    <div className="se-plana__moneda">
      <FichaDeMoneda codigo={codigo} />
      {puntos && puntos.length >= 2 ? (
        <Suspense fallback={null}>
          <GraficaDeMoneda codigo={codigo} puntos={puntos} compacta />
        </Suspense>
      ) : null}
    </div>
  );
};

AperturaMoneda.propTypes = { codigo: PropTypes.string.isRequired };

export default AperturaMoneda;
