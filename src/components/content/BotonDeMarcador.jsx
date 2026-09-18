import PropTypes from "prop-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { useMarcadores } from "../../context/MarcadoresContext";

/**
 * Guardar una pieza para después.
 *
 * ## Por qué no existía
 *
 * La sección «Marcadores» de la cuenta llevaba desde el principio en el sitio, con su
 * pantalla, su estado vacío y su endpoint. Y `addBookmark`/`removeBookmark` estaban
 * escritos en el servicio del frontend. Lo único que faltaba era esto: **nada llamaba a
 * esas funciones**, así que no había forma de crear un marcador y la lista no podía
 * estar más que vacía.
 *
 * ## Sin cuenta no se esconde, se explica
 *
 * A quien no ha entrado se le enseña el botón igual y, al pulsarlo, se le lleva a entrar
 * conservando a dónde volver. Esconderlo sería más limpio y peor: quien no sabe que
 * puede guardar artículos no se registra para poder hacerlo, y guardar algo es de las
 * pocas razones por las que alguien crea una cuenta en un medio.
 */

const IconoMarcador = ({ lleno }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <path
      d="M6.5 3.75h11a.75.75 0 0 1 .75.75v15.4a.4.4 0 0 1-.62.33L12 16.6l-5.63 3.63a.4.4 0 0 1-.62-.33V4.5a.75.75 0 0 1 .75-.75Z"
      fill={lleno ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

IconoMarcador.propTypes = { lleno: PropTypes.bool };

export const BotonDeMarcador = ({ postId, className }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isEmailVerified } = useUserAuth();
  const { tiene, alternar } = useMarcadores();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const guardado = tiene(postId);
  const puede = isAuthenticated && isEmailVerified;

  const pulsar = async () => {
    setError("");

    if (!isAuthenticated) {
      // Con el sitio de vuelta: quien entra a guardar un artículo quiere volver a ese
      // artículo, no a la portada.
      navigate("/cuenta/entrar", { state: { from: window.location.pathname } });
      return;
    }
    if (!isEmailVerified) {
      navigate("/cuenta/verificar-email");
      return;
    }

    setOcupado(true);
    try {
      await alternar(postId);
    } catch {
      setError("No se pudo guardar. Inténtelo de nuevo.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <span className={`se-marcar${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className={`se-marcar__btn${guardado ? " se-marcar__btn--on" : ""}`}
        onClick={pulsar}
        disabled={ocupado}
        // `aria-pressed` y no un `aria-label` que cambie: es un interruptor, y así lo
        // anuncia un lector de pantalla sin que haya que reescribir su nombre.
        aria-pressed={puede ? guardado : undefined}
        title={
          !isAuthenticated
            ? "Entre para guardar esta pieza"
            : guardado
              ? "Quitar de mis marcadores"
              : "Guardar para después"
        }
      >
        <IconoMarcador lleno={puede && guardado} />
        <span className="se-marcar__texto">{guardado ? "Guardado" : "Guardar"}</span>
      </button>
      {error ? (
        <span className="se-marcar__error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
};

BotonDeMarcador.propTypes = {
  /** Numero o cadena: el mapeo de una pieza lo da como cadena y la lista de
      marcadores como numero. El contexto los normaliza. */
  postId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  className: PropTypes.string,
};

export default BotonDeMarcador;
