import PropTypes from "prop-types";
import { useState } from "react";
import { useNavegar } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useUserAuth } from "../../context/UserAuthContext";
import { useTemasSeguidos } from "../../context/TemasSeguidosContext";

/**
 * «Seguir» un tema, al lado de su etiqueta en la pieza (y en «Mis temas» de la cuenta).
 *
 * Como el botón de guardar: a quien no ha entrado se le enseña igual y, al pulsar, se le
 * lleva a entrar con el sitio de vuelta. Seguir un tema es de las razones por las que
 * alguien crea una cuenta en un medio, así que esconderlo sería peor.
 *
 * Es un botón con estado (`aria-pressed`): el lector de pantalla oye «Seguir: Macroeconomía,
 * activado» cuando ya se sigue.
 */
export const BotonDeSeguirTema = ({ slug, nombre, className = "" }) => {
  const { t } = useIdioma();
  const navigate = useNavegar();
  const { isAuthenticated, isEmailVerified } = useUserAuth();
  const { sigue, alternar } = useTemasSeguidos();
  const [ocupado, setOcupado] = useState(false);
  const seguido = sigue(slug);

  const pulsar = async () => {
    if (!isAuthenticated) {
      navigate("/cuenta/entrar", { state: { from: window.location.pathname } });
      return;
    }
    if (!isEmailVerified) {
      navigate("/cuenta/verificar-email");
      return;
    }
    setOcupado(true);
    try {
      await alternar(slug, nombre);
    } catch {
      /* el contexto ya deshizo el cambio en pantalla */
    } finally {
      setOcupado(false);
    }
  };

  return (
    <button
      type="button"
      className={`se-seguir${seguido ? " se-seguir--on" : ""} ${className}`.trim()}
      aria-pressed={seguido}
      aria-label={t("piezas.seguir.etiqueta", { tema: nombre })}
      disabled={ocupado}
      onClick={pulsar}
    >
      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
        {seguido ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        )}
      </svg>
      {seguido ? t("piezas.seguir.siguiendo") : t("piezas.seguir.seguir")}
    </button>
  );
};

BotonDeSeguirTema.propTypes = {
  slug: PropTypes.string.isRequired,
  nombre: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default BotonDeSeguirTema;
