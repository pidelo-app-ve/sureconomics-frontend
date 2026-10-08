import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { IconoImagen, IconoMas } from "./iconos";

/**
 * El «+» de la línea vacía.
 *
 * Cuando el cursor está en un párrafo vacío del primer nivel -- el sitio natural para
 * meter algo entre dos párrafos --, aparece un «+» discreto en el margen izquierdo, a la
 * altura de esa línea. Al pulsarlo gira a «×» y despliega lo que se puede añadir ahí;
 * hoy, una foto. En cuanto se escribe una letra, desaparece: no estorba al que solo
 * quiere escribir.
 *
 * Vive dentro del área de texto (un portal al contenedor que hace scroll), así que se
 * desplaza con el texto sin recalcular nada al hacer scroll.
 */
export const InsertarEnLinea = ({ editor, onImagen }) => {
  const [abierto, setAbierto] = useState(false);
  const { state } = editor;
  const { $from, empty } = state.selection;
  const enLineaVacia =
    editor.isEditable &&
    empty &&
    $from.depth === 1 &&
    $from.parent.type.name === "paragraph" &&
    $from.parent.content.size === 0;
  const visible = enLineaVacia && (editor.isFocused || abierto);

  // Al dejar la línea, el menú se cierra solo.
  const posLinea = enLineaVacia ? $from.before() : null;
  useEffect(() => {
    setAbierto(false);
  }, [posLinea]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsar = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setAbierto(false);
        editor.commands.focus();
      }
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierto, editor]);

  const contenedor = editor.view.dom.parentElement;
  if (!visible || !contenedor) return null;

  const caja = contenedor.getBoundingClientRect();
  const linea = editor.view.coordsAtPos($from.pos);
  const alto = linea.bottom - linea.top;
  const top = linea.top - caja.top + contenedor.scrollTop + alto / 2;

  // `onMouseDown` sin foco: pulsar el «+» no puede sacar el cursor de la línea, o el
  // propio «+» se escondería antes de que llegue el clic.
  const sinFoco = (e) => e.preventDefault();

  return createPortal(
    <div className={`se-insertar${abierto ? " se-insertar--abierto" : ""}`} style={{ top }} data-figura-control>
      <button
        type="button"
        className="se-insertar__mas"
        aria-label={abierto ? "Cerrar" : "Añadir algo en esta línea"}
        aria-expanded={abierto}
        aria-haspopup="menu"
        onMouseDown={sinFoco}
        onClick={() => setAbierto((v) => !v)}
      >
        <IconoMas />
      </button>
      {abierto ? (
        <div className="se-insertar__menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="se-insertar__opcion"
            onMouseDown={sinFoco}
            onClick={() => {
              setAbierto(false);
              onImagen(posLinea);
            }}
          >
            <IconoImagen />
            <span className="se-insertar__nombre">Foto</span>
            <span className="se-insertar__pista">o suéltela en el texto</span>
          </button>
        </div>
      ) : null}
    </div>,
    contenedor
  );
};

InsertarEnLinea.propTypes = {
  editor: PropTypes.object.isRequired,
  /** Se llama con la posición del párrafo vacío donde irá la foto. */
  onImagen: PropTypes.func.isRequired,
};

export default InsertarEnLinea;
