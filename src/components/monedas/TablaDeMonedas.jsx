import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { porDolar } from "../../lib/monedas";
// `useMonedas` vivía aquí; ahora está en `hooks/useMonedas` (cotizaciones compartidas)
// y se reexporta para que quien lo importaba de aquí siga igual.
export { useMonedas } from "../../hooks/useMonedas";
import { Flecha, variacionTexto } from "./FichaDeMoneda";
import "./tablaDeMonedas.css";

/**
 * Las monedas de la región en una tabla de cifras: código, valor por dólar y variación
 * del día, en la monoespaciada para que los decimales caigan en columna. La usan la
 * primera plana y el lateral de Última hora. Van las que más se movieron hoy, primero
 * (`useMonedas`), y la subida o bajada lleva flecha y signo, no solo color.
 */

export const TablaDeMonedas = ({ monedas }) => {
  const { t, lang } = useIdioma();
  if (!monedas.length) return null;
  return (
    <table className="se-tabla-monedas">
      <tbody>
        {monedas.map((m) => (
          <tr key={m.codigo}>
            <th scope="row">
              <abbr title={t(`monedas.nombres.${m.codigo}`)}>{m.codigo}</abbr>
            </th>
            <td className="se-tabla-monedas__valor">{porDolar(m.valor, lang)}</td>
            <td className={`se-tabla-monedas__var se-tabla-monedas__var--${m.fija ? "fija" : m.direccion}`}>
              {typeof m.variacion === "number" && !m.fija ? (
                <>
                  <Flecha direccion={m.direccion} /> {variacionTexto(m, lang)}
                </>
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

TablaDeMonedas.propTypes = {
  monedas: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TablaDeMonedas;
