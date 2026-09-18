import PropTypes from "prop-types";
import { useId, useState } from "react";

/**
 * Un campo de formulario de la cuenta: etiqueta, ayuda, error y, si es clave, el ojo.
 *
 * Existe porque el área de cuenta tenía cada campo escrito a mano en su pantalla, y eso
 * significa que el error se pinta distinto en cada una — o directamente no se pinta, que
 * es lo que pasaba: los fallos salían todos juntos en una frase arriba del formulario,
 * sin decir de qué campo hablaban.
 *
 * ## Tres cosas que no negocia
 *
 * **La etiqueta es un `<label>` de verdad**, no un texto encima del recuadro. Es lo que
 * hace que pulsar sobre ella lleve el foco al campo y que un lector de pantalla lo
 * anuncie con su nombre.
 *
 * **El error va atado con `aria-describedby` y `aria-invalid`.** Un mensaje rojo suelto
 * debajo del recuadro no existe para quien no lo ve.
 *
 * **La contraseña se puede mostrar.** Escribir a ciegas una clave de ocho caracteres en
 * un móvil es la causa más común de «mi contraseña no funciona», y el botón que la
 * revela cuesta una línea.
 */
export const CampoDeTexto = ({
  id,
  etiqueta,
  tipo = "text",
  valor,
  onCambio,
  onSalir,
  error,
  ayuda,
  autoComplete,
  placeholder,
  deshabilitado,
  opcional,
  inputMode,
  maxLength,
}) => {
  const generado = useId();
  const idCampo = id || generado;
  const idAyuda = `${idCampo}-ayuda`;
  const idError = `${idCampo}-error`;
  const [visible, setVisible] = useState(false);

  const esClave = tipo === "password";
  const tipoReal = esClave && visible ? "text" : tipo;

  const describe = [error ? idError : null, ayuda ? idAyuda : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`se-campo${error ? " se-campo--mal" : ""}`}>
      <label className="se-campo__etiqueta" htmlFor={idCampo}>
        {etiqueta}
        {opcional ? <span className="se-campo__opcional">opcional</span> : null}
      </label>

      <div className="se-campo__caja">
        <input
          id={idCampo}
          className="se-campo__input"
          type={tipoReal}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          onBlur={onSalir}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={deshabilitado}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describe || undefined}
        />
        {esClave ? (
          <button
            type="button"
            className="se-campo__ojo"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            // El texto cambia con el estado: "Mostrar" con la clave ya visible es
            // justo lo contrario de lo que el botón hace.
            aria-label={visible ? "Ocultar la contraseña" : "Mostrar la contraseña"}
          >
            {visible ? "Ocultar" : "Ver"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="se-campo__error" id={idError} role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p className="se-campo__ayuda" id={idAyuda}>
          {ayuda}
        </p>
      ) : null}
    </div>
  );
};

CampoDeTexto.propTypes = {
  id: PropTypes.string,
  etiqueta: PropTypes.string.isRequired,
  tipo: PropTypes.string,
  valor: PropTypes.string.isRequired,
  onCambio: PropTypes.func.isRequired,
  /** Se llama al salir del campo: es cuando conviene avisar, no en cada tecla. */
  onSalir: PropTypes.func,
  error: PropTypes.string,
  ayuda: PropTypes.string,
  autoComplete: PropTypes.string,
  placeholder: PropTypes.string,
  deshabilitado: PropTypes.bool,
  /** Marca el campo como opcional en la etiqueta, para no tener que adivinarlo. */
  opcional: PropTypes.bool,
  inputMode: PropTypes.string,
  maxLength: PropTypes.number,
};

export default CampoDeTexto;
