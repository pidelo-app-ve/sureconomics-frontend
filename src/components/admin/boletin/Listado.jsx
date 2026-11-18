import PropTypes from "prop-types";
import { recorridoBoletin } from "../../../lib/guias/guiaBoletin";
import { lunesLargo, fecha } from "./datosDelBoletin";
import { Estado } from "./Estado";

const { ancla } = recorridoBoletin;

// ------------------------------------------------------------------ el listado
export const Listado = ({ numeros, onAbrir, onNuevo }) => {
  if (!numeros.length) {
    return (
      <div className="se-bol__vacio">
        <p>Todavía no hay ningún número.</p>
        <button type="button" className="se-btn se-btn--primary" onClick={onNuevo}>
          Crear el primero
        </button>
      </div>
    );
  }
  return (
    <ul className="se-bol__lista" {...ancla("lista")}>
      {numeros.map((n) => (
        <li key={n.id}>
          <button type="button" className="se-bol__fila" onClick={() => onAbrir(n.id)}>
            <span className="se-bol__portadita" aria-hidden="true">
              {n.cover_url ? <img src={n.cover_url} alt="" /> : null}
            </span>
            <span className="se-bol__fila-texto">
              <span className="se-bol__fila-lunes">
                {n.send_on ? `Sale el ${lunesLargo(n.send_on)}` : "Sin lunes asignado"}
              </span>
              <span className="se-bol__fila-asunto">{n.subject}</span>
              <span className="se-admin-pub__meta">
                {n.paginas} {n.paginas === 1 ? "página" : "páginas"} ·{" "}
                {n.sent_at ? `enviado el ${fecha(n.sent_at)}` : `creado el ${fecha(n.created_at)}`}
                {n.total_recipients ? ` · ${n.total_recipients} destinatarios` : ""}
              </span>
            </span>
            <Estado status={n.status} />
          </button>
        </li>
      ))}
    </ul>
  );
};

Listado.propTypes = {
  numeros: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAbrir: PropTypes.func.isRequired,
  onNuevo: PropTypes.func.isRequired,
};
