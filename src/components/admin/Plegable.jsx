import PropTypes from "prop-types";
import { useEffect, useId, useState } from "react";
import "./plegable.css";

/**
 * Un campo plegado del panel: la cabecera dice qué es y qué tiene, y al pulsarla se abre.
 *
 * Era un `<details>` con un «›» de texto: se abría de golpe, la cabecera no parecía un
 * botón y no decía si el campo estaba completo. Ahora:
 *
 * - **Se abre y se cierra con suavidad.** La altura va de cero a la suya con una rejilla
 *   (`0fr` → `1fr`), que es la única forma de animar «la altura que tenga» sin medirla;
 *   el contenido entra con un punto de retraso. Con «reducir movimiento», sin animación.
 * - **La cabecera es un botón entero**, con la marca del estado delante (completo, falta
 *   o vacío), el resumen de lo que hay y una flecha que gira.
 * - **Cerrado no se puede tabular dentro** (`inert`), y abierto del todo deja de recortar:
 *   si no, un menú o el borde de enfoque de dentro saldrían cortados.
 *
 * Se abre solo si le falta algo (`estado="falta"`) o si la página lo pide (`abierto`).
 */
export const Plegable = ({ titulo, resumen, estado, abierto, children }) => {
  const [desplegado, setDesplegado] = useState(Boolean(abierto || estado === "falta"));
  // Abierto del todo, con la animación terminada: ahí se deja de recortar el contenido.
  const [asentado, setAsentado] = useState(desplegado);
  const cuerpoId = useId();

  useEffect(() => {
    if (abierto || estado === "falta") setDesplegado(true);
  }, [abierto, estado]);

  const alternar = () => {
    setAsentado(false);
    setDesplegado((antes) => !antes);
  };

  return (
    <div className={`se-plegable${desplegado ? " is-abierto" : ""}${asentado && desplegado ? " is-asentado" : ""}`}>
      <button
        type="button"
        className="se-plegable__cabeza"
        aria-expanded={desplegado}
        aria-controls={cuerpoId}
        onClick={alternar}
      >
        <span className={`se-plegable__marca${estado ? ` se-plegable__marca--${estado}` : ""}`} aria-hidden="true">
          {estado === "ok" ? (
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
        <span className="se-plegable__titulo">{titulo}</span>
        <span className="se-plegable__resumen">{resumen}</span>
        {estado === "falta" ? <span className="se-plegable__falta">Falta</span> : null}
        <span className="se-plegable__flecha" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div
        className="se-plegable__caja"
        id={cuerpoId}
        // `inert` como texto: React 18 no lo conoce como atributo de sí o no.
        {...(desplegado ? {} : { inert: "" })}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === "grid-template-rows") setAsentado(desplegado);
        }}
      >
        <div className="se-plegable__recorte">
          <div className="se-plegable__cuerpo">{children}</div>
        </div>
      </div>
    </div>
  );
};

Plegable.propTypes = {
  titulo: PropTypes.string.isRequired,
  /** Lo que tiene el campo, en pocas palabras: «2 fuentes», «Sin firma». */
  resumen: PropTypes.string,
  /** `ok` completo, `falta` impide publicar; sin valor, un campo opcional vacío o a medias. */
  estado: PropTypes.oneOf(["ok", "falta"]),
  abierto: PropTypes.bool,
  children: PropTypes.node,
};

Plegable.defaultProps = { resumen: "", estado: undefined, abierto: false, children: null };
