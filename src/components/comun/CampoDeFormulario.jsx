import PropTypes from "prop-types";

/**
 * Un campo con su aviso debajo, el de los formularios de contacto (`/contacto` y el
 * contacto comercial de la portada).
 *
 * El aviso vive pegado al control y no en una lista arriba: un resumen general dice
 * que algo falla y deja a la persona buscando cuál. Y va atado con `aria-describedby`,
 * que es lo que hace que un lector de pantalla lo lea al entrar en el campo en vez de
 * tener que salir a buscarlo.
 */
export const CampoDeFormulario = ({
  id,
  etiqueta,
  valor,
  error,
  onChange,
  onBlur,
  bloqueado,
  tipo = "text",
  multilinea = false,
  filas = 6,
  obligatorio = true,
  autoComplete,
}) => {
  const idDelError = `${id}-error`;
  const Control = multilinea ? "textarea" : "input";
  return (
    <div className={`se-form-field${error ? " se-form-field--mal" : ""}`}>
      <label className="se-form-label" htmlFor={id}>
        {etiqueta}
      </label>
      <Control
        id={id}
        className={`se-form-control${multilinea ? " se-form-control--textarea" : ""}`}
        type={multilinea ? undefined : tipo}
        rows={multilinea ? filas : undefined}
        value={valor}
        onChange={onChange}
        onBlur={onBlur}
        disabled={bloqueado}
        autoComplete={autoComplete}
        // Lo obligatorio se dice antes de fallar, no después. Los formularios van con
        // `noValidate`, así que esto anuncia "obligatorio" sin que salte el globo del
        // navegador por encima de nuestros avisos.
        required={obligatorio}
        // `aria-invalid` y no solo el borde rojo: el color no llega a quien no lo ve.
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? idDelError : undefined}
      />
      {error ? (
        <p className="se-form-error" id={idDelError}>
          {error}
        </p>
      ) : null}
    </div>
  );
};

CampoDeFormulario.propTypes = {
  id: PropTypes.string.isRequired,
  etiqueta: PropTypes.string.isRequired,
  valor: PropTypes.string,
  error: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  bloqueado: PropTypes.bool,
  tipo: PropTypes.string,
  multilinea: PropTypes.bool,
  filas: PropTypes.number,
  obligatorio: PropTypes.bool,
  autoComplete: PropTypes.string,
};

export default CampoDeFormulario;
