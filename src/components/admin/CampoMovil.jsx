import PropTypes from "prop-types";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Un campo del editor, a la medida del teléfono.
 *
 * **En el computador no hace nada**: devuelve el campo tal cual, sin envoltorio, así que
 * el editor de escritorio sigue exactamente como estaba.
 *
 * **En el teléfono** el campo se convierte en una fila -- qué es, cómo va y un resumen de
 * lo que tiene -- y al tocarla se abre **el mismo campo** en una hoja a pantalla
 * completa, con un «Listo» abajo, al alcance del pulgar. Es el patrón de los Ajustes del
 * iPhone: la página es corta y se lee de un vistazo qué falta, en vez de un formulario
 * de cinco pantallas donde el botón de guardar queda al final.
 *
 * Por qué el mismo campo y no uno aparte: lo que hay dentro -- el editor de texto, las
 * subidas, el selector de temas -- sigue siendo el componente de siempre, conectado al
 * mismo estado del editor. No hay una segunda versión que mantener ni que pueda
 * desincronizarse.
 *
 * La hoja **se queda montada** aunque esté cerrada (sólo se oculta): una subida de video
 * a medias no puede cortarse porque alguien cerró la hoja para mirar otra cosa.
 *
 * Cerrar la hoja no pierde nada: lo escrito ya está en el editor. Lo que guarda es el
 * botón «Guardar» de la barra fija de abajo, igual que en el computador.
 */
export const CampoMovil = ({ movil, titulo, resumen, estado, miniatura, children }) => {
  const [abierta, setAbierta] = useState(false);
  const fila = useRef(null);
  const hoja = useRef(null);
  const tituloId = useId();

  // Foco dentro al abrir y de vuelta a la fila al cerrar: quien navega con teclado o
  // con VoiceOver no puede perder el sitio en el que estaba.
  useEffect(() => {
    if (!abierta) return undefined;
    const origen = fila.current;
    const t = window.setTimeout(() => hoja.current?.focus?.(), 30);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const alPulsar = (e) => {
      if (e.key === "Escape") setAbierta(false);
    };
    document.addEventListener("keydown", alPulsar);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = previo;
      document.removeEventListener("keydown", alPulsar);
      origen?.focus?.();
    };
  }, [abierta]);

  if (!movil) return children;

  const cerrar = () => setAbierta(false);

  return (
    <>
      <button
        type="button"
        ref={fila}
        className={`se-campo-movil${estado ? ` se-campo-movil--${estado}` : ""}`}
        onClick={() => setAbierta(true)}
        aria-haspopup="dialog"
      >
        {miniatura ? (
          <img className="se-campo-movil__mini" src={miniatura} alt="" aria-hidden="true" />
        ) : null}
        <span className="se-campo-movil__texto">
          <span className="se-campo-movil__titulo">{titulo}</span>
          <span className="se-campo-movil__resumen">{resumen}</span>
        </span>
        {estado === "ok" ? (
          <span className="se-campo-movil__estado" aria-label="Completo">
            ✓
          </span>
        ) : estado === "falta" ? (
          <span className="se-campo-movil__estado" aria-label="Falta">
            Falta
          </span>
        ) : null}
        <span className="se-campo-movil__flecha" aria-hidden="true">
          ›
        </span>
      </button>

      {/* Colgada del body, como `ModalDelPanel`: el contenedor del panel queda con un
          `transform` de su animación de entrada, y eso rompería el `position: fixed`.
          El envoltorio `se-admin-app` lleva las variables de color del panel. */}
      {createPortal(
        <div className="se-admin-app se-adm-portal">
          <div
            className={`se-campo-movil__hoja${abierta ? " is-abierta" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            aria-hidden={!abierta}
            hidden={!abierta}
            ref={hoja}
            tabIndex={-1}
          >
            <header className="se-campo-movil__cabeza">
              <button
                type="button"
                className="se-campo-movil__volver"
                onClick={cerrar}
                aria-label="Volver al editor"
              >
                ‹
              </button>
              <h2 id={tituloId} className="se-campo-movil__cabeza-titulo">
                {titulo}
              </h2>
              <button type="button" className="se-campo-movil__listo-arriba" onClick={cerrar}>
                Listo
              </button>
            </header>
            <div className="se-campo-movil__cuerpo">{children}</div>
            <footer className="se-campo-movil__pie">
              <button type="button" className="se-btn se-campo-movil__listo" onClick={cerrar}>
                Listo
              </button>
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

CampoMovil.propTypes = {
  /** En el computador, `false`: el campo sale tal cual. */
  movil: PropTypes.bool,
  titulo: PropTypes.node.isRequired,
  /** Lo que tiene el campo, en una línea: «Borrador», «842 palabras», «Falta». */
  resumen: PropTypes.node,
  /** `ok` pinta una marca; `falta`, un aviso. Sin estado, nada. */
  estado: PropTypes.oneOf(["ok", "falta"]),
  /** Una miniatura a la izquierda: la imagen de la pieza. */
  miniatura: PropTypes.string,
  children: PropTypes.node,
};

export default CampoMovil;
