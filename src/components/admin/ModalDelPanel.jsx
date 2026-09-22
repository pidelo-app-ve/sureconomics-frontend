import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

/**
 * Un modal del panel con contenido libre.
 *
 * ## Por qué hacía falta
 *
 * El panel tenía `AdminConfirmDialog`, que está bien resuelto pero sólo sirve para
 * confirmar un borrado: no acepta contenido, y su texto y sus botones están cableados.
 * Quien necesitaba un modal de verdad lo reinventaba — `LinkDialog` copia el marcado a
 * mano y se dejó por el camino la trampa de foco y la devolución del foco al cerrar,
 * que son justo las dos partes que cuesta acertar.
 *
 * Así que esto es lo mismo que hace `AdminConfirmDialog`, sin la parte del borrado:
 * fondo, superficie, `role="dialog"`, foco que entra al abrir y vuelve al cerrar,
 * Escape, y Tab que da la vuelta dentro en vez de escaparse a la página de detrás.
 *
 * ## El bloqueo del desplazamiento
 *
 * Que `AdminConfirmDialog` no tiene, y aquí sí: un diálogo de dos botones aguanta que
 * la página de detrás se mueva, pero un asistente de tres pasos no — se pierde el sitio
 * al primer giro de rueda. Se guarda el valor anterior y se restaura, en vez de poner
 * `""`: sobreescribirlo rompe cualquier otro bloqueo que estuviera puesto.
 */

const enfocables =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const ModalDelPanel = ({
  abierto,
  titulo,
  subtitulo,
  ocupado,
  onCerrar,
  children,
  pie,
  ancho,
}) => {
  const superficie = useRef(null);
  const anterior = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    if (!abierto) return undefined;
    anterior.current = document.activeElement;
    const t = window.setTimeout(() => superficie.current?.focus?.(), 0);
    return () => window.clearTimeout(t);
  }, [abierto]);

  useEffect(() => {
    if (abierto) return;
    const el = anterior.current;
    if (el && typeof el.focus === "function") el.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsar = (e) => {
      if (e.key === "Escape") {
        if (!ocupado) onCerrar();
        return;
      }
      if (e.key !== "Tab") return;
      const raiz = superficie.current;
      if (!raiz) return;
      const nodos = Array.from(raiz.querySelectorAll(enfocables)).filter(
        (n) => !n.hasAttribute("disabled") && n.getAttribute("aria-hidden") !== "true",
      );
      if (!nodos.length) return;
      const primero = nodos[0];
      const ultimo = nodos[nodos.length - 1];
      const activo = document.activeElement;
      if (e.shiftKey) {
        if (activo === primero || activo === raiz) {
          e.preventDefault();
          ultimo.focus();
        }
        return;
      }
      if (activo === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierto, ocupado, onCerrar]);

  if (!abierto) return null;

  /*
   * Colgado del `body` y no de donde se declara.
   *
   * `.se-admin-main__outlet` anima su entrada con `transform` y `animation-fill-mode:
   * both`, así que al terminar se queda con un `transform` puesto. Un elemento
   * transformado pasa a ser el bloque contenedor de sus descendientes `position:
   * fixed`: el `inset: 0` del modal dejaba de significar «la pantalla» y pasaba a
   * significar «la columna de contenido». El resultado era el que se veía -- la barra
   * lateral sin oscurecer y el diálogo descentrado, porque su 50 % era el de la columna.
   *
   * El envoltorio `se-admin-app` va porque todo el CSS del panel cuelga de esa clase,
   * incluidas sus variables de color: fuera de ella el modal se quedaba sin estilos.
   */
  return createPortal(
    <div className="se-admin-app se-adm-portal">
      <div className="se-adm-dialog se-modalp" role="presentation">
      <div
        className="se-adm-dialog__backdrop"
        role="button"
        tabIndex={-1}
        aria-label="Cerrar"
        onClick={() => !ocupado && onCerrar()}
        onKeyDown={(e) => e.key === "Enter" && !ocupado && onCerrar()}
      />
      <div
        className={`se-adm-dialog__surface se-modalp__caja${
          ancho === "ancho" ? " se-modalp__caja--ancho" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        ref={superficie}
        tabIndex={-1}
      >
        <header className="se-adm-dialog__header">
          <div>
            <h2 id={tituloId} className="se-adm-dialog__title">
              {titulo}
            </h2>
            {subtitulo ? <p className="se-modalp__subtitulo">{subtitulo}</p> : null}
          </div>
          <button
            type="button"
            className="se-adm-dialog__x"
            onClick={onCerrar}
            disabled={ocupado}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="se-modalp__cuerpo">{children}</div>

        {pie ? <footer className="se-adm-dialog__actions">{pie}</footer> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
};

ModalDelPanel.propTypes = {
  abierto: PropTypes.bool.isRequired,
  titulo: PropTypes.node.isRequired,
  subtitulo: PropTypes.node,
  /** Mientras trabaja no se puede cerrar: ni Escape, ni fondo, ni aspa. */
  ocupado: PropTypes.bool,
  onCerrar: PropTypes.func.isRequired,
  children: PropTypes.node,
  /** Los botones. Va aparte del cuerpo para que no se vaya con el desplazamiento. */
  pie: PropTypes.node,
  ancho: PropTypes.oneOf(["normal", "ancho"]),
};

ModalDelPanel.defaultProps = {
  ocupado: false,
  ancho: "normal",
};

export default ModalDelPanel;
