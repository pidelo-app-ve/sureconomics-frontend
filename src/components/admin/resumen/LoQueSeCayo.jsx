import PropTypes from "prop-types";

/**
 * Lo que se borró después de armar la edición (un titular que se borró, una pieza que se
 * despublicó): `caidos`, lo que la edición todavía lleva pero ya no sale (ni se ve, si ya
 * salió), y `quitados`, lo que el servidor sacó al publicarla. No se puede volver a poner.
 */
export const LoQueSeCayo = ({ resumen }) => {
  const caidos = resumen.caidos ?? [];
  const quitados = resumen.quitados ?? [];
  if (!caidos.length && !quitados.length) return null;
  const salio = ["publicado", "retirado"].includes(resumen.estado);
  const linea = (p) => `«${p.linea || p.id}»${p.motivo ? `: ${p.motivo}` : ""}`;
  return (
    <div className="se-tit-aviso" role="status">
      {caidos.length ? (
        <>
          <strong>
            {salio
              ? "Se borró después de salir y ya no se ve en la web:"
              : "Se borró después de armarla y ya no saldrá:"}
          </strong>
          <ul className="se-tit-historial__lista">
            {caidos.map((p) => <li key={`c-${p.id}`}>{linea(p)}</li>)}
          </ul>
        </>
      ) : null}
      {quitados.length ? (
        <>
          <strong>Se quitó al publicarla, porque se había borrado:</strong>
          <ul className="se-tit-historial__lista">
            {quitados.map((p, i) => <li key={`q-${p.id}-${i}`}>{linea(p)}</li>)}
          </ul>
        </>
      ) : null}
    </div>
  );
};

const PUNTO_CAIDO = PropTypes.shape({ id: PropTypes.string, linea: PropTypes.string, motivo: PropTypes.string });
LoQueSeCayo.propTypes = {
  resumen: PropTypes.shape({
    estado: PropTypes.string,
    caidos: PropTypes.arrayOf(PUNTO_CAIDO),
    quitados: PropTypes.arrayOf(PUNTO_CAIDO),
  }).isRequired,
};
