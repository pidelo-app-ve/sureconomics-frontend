import PropTypes from "prop-types";

/**
 * El «Guardar» de las páginas largas del panel que se guardan de una vez.
 *
 * Estaba al fondo: en «En redes» había que bajar cuatro pantallas para encontrarlo, y
 * mientras tanto nada decía que lo cambiado seguía sin guardar. Con cambios, la barra
 * se pega al borde de abajo y lo dice; sin cambios, se queda quieta en su sitio.
 */
export const BarraDeGuardar = ({ hayCambios, guardando, bloqueado, onGuardar, etiqueta, children }) => (
  <div className={`se-barra-guardar${hayCambios ? " se-barra-guardar--pendiente" : ""}`}>
    <p className="se-barra-guardar__estado" role="status">
      {hayCambios ? "Hay cambios sin guardar." : "Todo guardado."}
    </p>
    {children}
    <button type="button" className="se-btn" onClick={onGuardar} disabled={!hayCambios || guardando || bloqueado}>
      {guardando ? "Guardando…" : etiqueta}
    </button>
  </div>
);

BarraDeGuardar.propTypes = {
  hayCambios: PropTypes.bool.isRequired,
  guardando: PropTypes.bool,
  // Algo en curso (una foto subiendo) que impide guardar todavía.
  bloqueado: PropTypes.bool,
  onGuardar: PropTypes.func.isRequired,
  etiqueta: PropTypes.string,
  children: PropTypes.node,
};

BarraDeGuardar.defaultProps = {
  guardando: false,
  bloqueado: false,
  etiqueta: "Guardar",
  children: null,
};
