import PropTypes from "prop-types";
import { useCallback, useMemo, useRef, useState } from "react";

import { RichTextEditor } from "../../editor/RichTextEditor";
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { atributosDeAsset } from "./atributos";
import { DialogoDeImagen } from "./DialogoDeImagen";
import { Figura } from "./figura";
import { InsertarEnLinea } from "./InsertarEnLinea";

/**
 * Pone una foto donde estaba el párrafo vacío y deja el cursor debajo, listo para
 * seguir escribiendo. Si la foto queda la última del texto, se le añade un párrafo
 * detrás: sin él no habría dónde poner el cursor después de una foto final.
 */
const insertarEn = (editor, pos, attrs) => {
  const nodo = editor.state.doc.nodeAt(pos);
  const vacio = nodo && nodo.type.name === "paragraph" && nodo.content.size === 0;
  editor
    .chain()
    .focus()
    .insertContentAt(vacio ? { from: pos, to: pos + nodo.nodeSize } : pos, { type: "figura", attrs })
    .run();
  const figura = editor.state.doc.nodeAt(pos);
  if (!figura) return;
  const despues = pos + figura.nodeSize;
  if (despues >= editor.state.doc.content.size) {
    editor.chain().insertContentAt(despues, { type: "paragraph" }).run();
  }
  try {
    editor.commands.setTextSelection(despues + 1);
  } catch {
    /* si lo que sigue no admite cursor, se queda donde esté */
  }
};

/**
 * El editor del cuerpo con fotos entre párrafos: el de siempre, más el «+» de la línea
 * vacía, soltar o pegar fotos y la ventana para subir o elegir. Solo lo usa el panel,
 * en artículos, noticias y editoriales.
 *
 * `subir` es la subida de la biblioteca (`uploadAdminMediaImage`): devuelve el archivo
 * registrado, del que salen la dirección, las tallas y las medidas.
 */
export const EditorConImagenes = ({ value, onChange, placeholder, disabled, subir }) => {
  // { modo: "insertar", pos } | { modo: "editar", pos, attrs } | null
  const [dialogo, setDialogo] = useState(null);
  const [aviso, setAviso] = useState("");

  const subirAtributos = useCallback(async (archivo) => atributosDeAsset(await subir(archivo)), [subir]);

  // Las extensiones se montan una sola vez; lo que cambia lo leen de referencias.
  const subirRef = useRef(subirAtributos);
  subirRef.current = subirAtributos;
  const editarRef = useRef(null);
  editarRef.current = (pos, attrs) => setDialogo({ modo: "editar", pos, attrs });

  const extensiones = useMemo(
    () => [
      Figura.configure({
        subir: (archivo) => subirRef.current(archivo),
        alFallar: (err) => setAviso(adminErrorMessage(err, "No se pudo subir la foto. Pruebe otra vez.")),
        alEditar: (pos, attrs) => editarRef.current(pos, attrs),
      }),
    ],
    []
  );

  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      extensiones={extensiones}
      className="se-richtext--imagenes"
    >
      {(editor) => (
        <>
          <InsertarEnLinea
            editor={editor}
            onImagen={(pos) => {
              setAviso("");
              setDialogo({ modo: "insertar", pos });
            }}
          />
          {aviso ? (
            <p className="se-richtext__aviso" role="alert">
              {aviso}
              <button type="button" onClick={() => setAviso("")} aria-label="Cerrar el aviso">
                ×
              </button>
            </p>
          ) : null}
          <DialogoDeImagen
            abierto={Boolean(dialogo)}
            inicial={dialogo?.attrs ?? null}
            subir={subirAtributos}
            onCerrar={() => {
              setDialogo(null);
              editor.commands.focus();
            }}
            onAceptar={(attrs) => {
              if (dialogo?.modo === "editar") {
                const actual = editor.state.doc.nodeAt(dialogo.pos);
                if (actual?.type.name === "figura") {
                  editor.view.dispatch(
                    editor.state.tr.setNodeMarkup(dialogo.pos, undefined, { ...actual.attrs, ...attrs })
                  );
                }
              } else if (dialogo) {
                insertarEn(editor, dialogo.pos, attrs);
              }
              setDialogo(null);
            }}
          />
        </>
      )}
    </RichTextEditor>
  );
};

EditorConImagenes.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  subir: PropTypes.func.isRequired,
};

EditorConImagenes.defaultProps = { value: "", placeholder: undefined, disabled: false };

export default EditorConImagenes;
