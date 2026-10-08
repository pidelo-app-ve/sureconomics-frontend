import PropTypes from "prop-types";
import { NodeViewWrapper } from "@tiptap/react";

import { IconoBasura, IconoCambiar, IconoTexto } from "./iconos";

/**
 * Cómo se ve una foto del cuerpo **dentro del editor**: casi como en la pieza publicada
 * -- la foto al ancho de la columna y su pie debajo --, más lo que hace falta para
 * trabajarla.
 *
 * - **El pie se escribe ahí mismo**, debajo de la foto, donde va a salir. Es opcional:
 *   vacío no se guarda nada.
 * - **Las acciones aparecen al pasar o al seleccionarla**, en una barra sobre la esquina:
 *   cambiar la foto, su descripción para lectores de pantalla y quitarla. Fuera de eso
 *   no estorban la lectura del borrador.
 * - **Se arrastra** desde la propia foto para cambiarla de sitio entre párrafos.
 * - **Sin descripción** el botón lo dice con un punto: no bloquea, pero se ve.
 */
export const VistaDeFigura = ({ node, updateAttributes, deleteNode, selected, extension, getPos, editor }) => {
  const { src, alt, pie, subiendo } = node.attrs;
  const editable = editor.isEditable;

  const editar = () => {
    const pos = typeof getPos === "function" ? getPos() : null;
    if (pos == null) return;
    extension.options.alEditar(pos, node.attrs);
  };

  return (
    <NodeViewWrapper
      as="figure"
      className={`se-figura-ed${selected ? " se-figura-ed--elegida" : ""}${subiendo ? " se-figura-ed--subiendo" : ""}`}
    >
      <div className="se-figura-ed__marco" data-drag-handle draggable={editable && !subiendo}>
        {src ? <img src={src} alt={alt || ""} className="se-figura-ed__img" draggable={false} /> : null}

        {subiendo ? (
          <span className="se-figura-ed__velo" role="status">
            <span className="se-figura-ed__giro" aria-hidden="true" />
            Subiendo la foto…
          </span>
        ) : null}

        {editable && !subiendo ? (
          <div className="se-figura-ed__acciones" data-figura-control contentEditable={false}>
            <button type="button" className="se-figura-ed__accion" onClick={editar}>
              <IconoCambiar />
              Cambiar
            </button>
            <button
              type="button"
              className="se-figura-ed__accion"
              onClick={editar}
              title={alt ? `Descripción: ${alt}` : "Esta foto no tiene descripción para lectores de pantalla"}
            >
              <IconoTexto />
              Descripción
              {alt ? null : <span className="se-figura-ed__falta" aria-label="(falta)" />}
            </button>
            <button
              type="button"
              className="se-figura-ed__accion se-figura-ed__accion--quitar"
              onClick={() => deleteNode()}
              aria-label="Quitar la foto"
              title="Quitar la foto"
            >
              <IconoBasura />
            </button>
          </div>
        ) : null}
      </div>

      {editable ? (
        <input
          type="text"
          className="se-figura-ed__pie"
          value={pie}
          maxLength={280}
          placeholder="Pie de foto (opcional)"
          aria-label="Pie de foto"
          onChange={(e) => updateAttributes({ pie: e.target.value })}
          onKeyDown={(e) => {
            // Intro sale del pie y sigue escribiendo debajo, como en un párrafo.
            if (e.key === "Enter") {
              e.preventDefault();
              const despues = getPos() + node.nodeSize;
              const siguiente = editor.state.doc.nodeAt(despues);
              const cadena = editor.chain().focus();
              // Si debajo ya hay un párrafo vacío, se va a él; si no, se abre uno.
              if (!(siguiente?.type.name === "paragraph" && siguiente.content.size === 0)) {
                cadena.insertContentAt(despues, { type: "paragraph" });
              }
              cadena.setTextSelection(despues + 1).run();
            }
          }}
        />
      ) : pie ? (
        <figcaption className="se-figura-ed__pie se-figura-ed__pie--leido">{pie}</figcaption>
      ) : null}
    </NodeViewWrapper>
  );
};

VistaDeFigura.propTypes = {
  node: PropTypes.object.isRequired,
  updateAttributes: PropTypes.func.isRequired,
  deleteNode: PropTypes.func.isRequired,
  selected: PropTypes.bool,
  extension: PropTypes.object.isRequired,
  getPos: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  editor: PropTypes.object.isRequired,
};

VistaDeFigura.defaultProps = { selected: false, getPos: null };

export default VistaDeFigura;
