import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearNumero } from "../../i18n/motor";
import { porDolar } from "../../lib/monedas";
import { getMonedas } from "../../services/monedasService";
import "./tablaDeMonedas.css";

/**
 * Las monedas de la región en una tabla de cifras: código, valor por dólar y variación
 * del día, en la monoespaciada para que los decimales caigan en columna. La usan la
 * primera plana y el lateral de Última hora.
 */

/** Las `cuantas` primeras con dato vigente. Si la petición falla, ninguna. */
export const useMonedas = (cuantas = 6) => {
  const [monedas, setMonedas] = useState([]);
  useEffect(() => {
    let vivo = true;
    getMonedas()
      .then((datos) => {
        if (!vivo) return;
        setMonedas((datos?.monedas ?? []).filter((m) => m.valor !== null && !m.vieja).slice(0, cuantas));
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [cuantas]);
  return monedas;
};

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
              {typeof m.variacion === "number" && !m.fija
                ? `${m.variacion > 0 ? "+" : ""}${formatearNumero(m.variacion, lang, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%`
                : "—"}
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
