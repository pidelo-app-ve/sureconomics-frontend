import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { alEmpezar, urlVistaPrevia } from "../../lib/youtube";

/**
 * El video mudo que se asoma sobre una portada: la fila «En la calle» y la apertura con
 * un short. Quien la usa decide cuándo se monta (consentimiento, a la vista, sin pausa:
 * `usePuedePrevisualizar`); aquí solo se cuida cómo entra y cuánto dura.
 *
 * - YouTube enseña un instante su carátula, su rueda y sus mandos al arrancar: el video
 *   se funde sobre la portada cuando ya corre limpio (`ESPERA_LIMPIO`).
 * - Con `enCuantoCorra`, se enseña en cuanto el reproductor dice que corre (y, si no lo
 *   dice, a los `ESPERA_LIMPIO` igual): para quien recorta la franja de YouTube con CSS.
 * - Es un asomo, no el video: a los 20 s avisa (`onAgotada`) para que vuelva la portada.
 * - No recibe ni el foco ni el ratón: la tarjeta de debajo es el botón.
 */
export const ESPERA_LIMPIO = 2600;
export const DURA_PREVIA = 20000;
/** Ya corriendo, lo que tarda en irse la rueda de YouTube. */
const ESPERA_CORRIENDO = 200;

export const VistaPrevia = ({ id, titulo, className, onAgotada, enCuantoCorra }) => {
  const { t } = useIdioma();
  const [lista, setLista] = useState(false);
  const relojes = useRef([]);
  const marco = useRef(null);
  const dejarDeEscuchar = useRef(null);
  useEffect(
    () => () => {
      relojes.current.forEach((r) => window.clearTimeout(r));
      dejarDeEscuchar.current?.();
    },
    []
  );
  const alCargar = () => {
    relojes.current = [
      window.setTimeout(() => setLista(true), ESPERA_LIMPIO),
      window.setTimeout(() => onAgotada?.(), ESPERA_LIMPIO + DURA_PREVIA),
    ];
    if (enCuantoCorra) {
      dejarDeEscuchar.current = alEmpezar(marco.current, () => {
        relojes.current.push(window.setTimeout(() => setLista(true), ESPERA_CORRIENDO));
      });
    }
  };
  return (
    <iframe
      ref={marco}
      className={`${className}${lista ? " is-lista" : ""}`}
      src={urlVistaPrevia(id, enCuantoCorra ? { origen: window.location.origin } : undefined)}
      title={t("portada.calle.vistaPrevia", { titulo })}
      tabIndex={-1}
      aria-hidden="true"
      allow="autoplay; encrypted-media"
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={alCargar}
    />
  );
};

VistaPrevia.propTypes = {
  id: PropTypes.string.isRequired,
  titulo: PropTypes.string,
  className: PropTypes.string.isRequired,
  onAgotada: PropTypes.func,
  /** Enseñarlo en cuanto corre: quien lo usa recorta la franja de arriba de YouTube. */
  enCuantoCorra: PropTypes.bool,
};

/** El ▶ en un círculo de las portadas de video. */
export const IconoPlay = ({ tamano = 18 }) => (
  <svg viewBox="0 0 24 24" width={tamano} height={tamano} aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 8.2l6 3.8-6 3.8Z" fill="currentColor" />
  </svg>
);

IconoPlay.propTypes = { tamano: PropTypes.number };
