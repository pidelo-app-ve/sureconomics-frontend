/**
 * La foto dentro del cuerpo de una pieza: un bloque del editor que se guarda como
 *
 * ```html
 * <figure>
 *   <img src="…" srcset="…" sizes="…" alt="…" width="…" height="…" loading="lazy" decoding="async">
 *   <figcaption>Pie de foto, si lo hay</figcaption>
 * </figure>
 * ```
 *
 * Es exactamente lo que deja pasar el saneador del backend (`app/utils/html_seguro.py`):
 * si algún día se le añade un atributo aquí, hay que añadirlo allí o se perderá al
 * guardar.
 *
 * Además de insertarse desde el «+» de la línea vacía, se puede **soltar o pegar** una
 * foto en el texto. Mientras sube se ve ya, desde el propio archivo, con un velo de
 * «Subiendo»; al terminar se cambia la dirección local por la de la biblioteca. Si la
 * subida falla, el bloque desaparece y se avisa: nunca queda guardada una dirección
 * `blob:` que solo existe en este navegador.
 */

import { Node } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";

import { VistaDeFigura } from "./VistaDeFigura";

export const TIPOS_DE_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** La columna de lectura mide unos 612 px; en el teléfono, todo el ancho. */
export const SIZES_DEL_CUERPO = "(max-width: 700px) 100vw, 640px";

const delImg = (el) => (el.tagName === "IMG" ? el : el.querySelector("img"));
const leer = (nombre) => ({
  default: null,
  parseHTML: (el) => delImg(el)?.getAttribute(nombre) || null,
});

let contador = 0;
/** Un identificador para encontrar el bloque cuando termine su subida. */
export const nuevoUid = () => `fig-${Date.now().toString(36)}-${(contador += 1)}`;

/** Busca el bloque con ese `uid` y devuelve su posición, o -1. */
export const posDeFigura = (doc, uid) => {
  let encontrada = -1;
  doc.descendants((nodo, pos) => {
    if (encontrada !== -1) return false;
    if (nodo.type.name === "figura" && nodo.attrs.uid === uid) encontrada = pos;
    return encontrada === -1;
  });
  return encontrada;
};

/**
 * Dónde cae de verdad una foto soltada o pegada: **entre párrafos**, nunca dentro de
 * uno. Soltarla sobre una frase partía el párrafo a mitad de palabra. Se lleva al borde
 * del bloque de primer nivel más cercano: antes si cayó en su primera mitad, después si
 * en la segunda. Un párrafo vacío se sustituye, que es donde se quería poner.
 */
export const destinoEntreBloques = (doc, pos) => {
  const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)));
  if ($pos.depth === 0) return { from: $pos.pos, to: $pos.pos };
  const inicio = $pos.before(1);
  const fin = $pos.after(1);
  const bloque = doc.nodeAt(inicio);
  if (bloque?.type.name === "paragraph" && bloque.content.size === 0) return { from: inicio, to: fin };
  const enLaPrimeraMitad = $pos.pos - inicio < (fin - inicio) / 2;
  const donde = enLaPrimeraMitad ? inicio : fin;
  return { from: donde, to: donde };
};

/** Los archivos de imagen de un evento de soltar o pegar. */
const imagenesDe = (lista) => Array.from(lista ?? []).filter((f) => TIPOS_DE_IMAGEN.includes(f.type));

export const Figura = Node.create({
  name: "figura",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      /** `(file) => Promise<atributos>`: sube y devuelve `src`, `srcset`, medidas. */
      subir: null,
      /** Se llama con un texto cuando una subida falla. */
      alFallar: () => {},
      /** `(pos, attrs)`: abrir el diálogo para cambiar la foto o su descripción. */
      alEditar: () => {},
    };
  },

  addAttributes() {
    return {
      src: leer("src"),
      srcset: leer("srcset"),
      sizes: leer("sizes"),
      alt: { default: "", parseHTML: (el) => delImg(el)?.getAttribute("alt") || "" },
      width: leer("width"),
      height: leer("height"),
      pie: {
        default: "",
        parseHTML: (el) => (el.tagName === "FIGURE" ? el.querySelector("figcaption")?.textContent?.trim() || "" : ""),
      },
      // Solo del editor: no se guardan.
      subiendo: { default: false, rendered: false, parseHTML: () => false },
      uid: { default: null, rendered: false, parseHTML: () => null },
    };
  },

  parseHTML() {
    return [
      { tag: "figure", getAttrs: (el) => (delImg(el) ? null : false) },
      // Un `<img>` suelto -- pegado desde otra página -- también se acepta.
      { tag: "img[src]" },
    ];
  },

  renderHTML({ node }) {
    const a = node.attrs;
    const img = {
      src: a.src,
      alt: a.alt || "",
      loading: "lazy",
      decoding: "async",
    };
    if (a.srcset) img.srcset = a.srcset;
    if (a.srcset) img.sizes = a.sizes || SIZES_DEL_CUERPO;
    if (a.width) img.width = a.width;
    if (a.height) img.height = a.height;
    return a.pie ? ["figure", {}, ["img", img], ["figcaption", {}, a.pie]] : ["figure", {}, ["img", img]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VistaDeFigura, {
      // El pie se escribe en un campo propio: sus teclas no son del editor.
      stopEvent: ({ event }) => {
        const el = event.target;
        return Boolean(el?.closest?.("input, textarea, button, [data-figura-control]"));
      },
    });
  },

  addProseMirrorPlugins() {
    const extension = this;
    const editor = this.editor;

    /** Mete un bloque por cada archivo en `pos` y los sube de uno en uno. */
    const recibir = (archivos, pos) => {
      const { subir, alFallar } = extension.options;
      if (!subir || !archivos.length) return false;
      const bloques = archivos.map((archivo) => ({
        archivo,
        uid: nuevoUid(),
        local: URL.createObjectURL(archivo),
      }));
      editor
        .chain()
        .insertContentAt(
          destinoEntreBloques(editor.state.doc, pos),
          bloques.map((b) => ({ type: "figura", attrs: { src: b.local, uid: b.uid, subiendo: true } }))
        )
        .run();

      bloques.forEach(async (b) => {
        try {
          const attrs = await subir(b.archivo);
          const donde = posDeFigura(editor.state.doc, b.uid);
          if (donde === -1) return; // la borraron mientras subía
          const actual = editor.state.doc.nodeAt(donde);
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(donde, undefined, { ...actual.attrs, ...attrs, subiendo: false })
          );
        } catch (err) {
          const donde = posDeFigura(editor.state.doc, b.uid);
          if (donde !== -1) {
            const actual = editor.state.doc.nodeAt(donde);
            editor.view.dispatch(editor.state.tr.delete(donde, donde + actual.nodeSize));
          }
          alFallar(err);
        } finally {
          URL.revokeObjectURL(b.local);
        }
      });
      return true;
    };

    return [
      new Plugin({
        key: new PluginKey("figuraSoltarPegar"),
        props: {
          handleDrop(view, event, _slice, movido) {
            if (movido) return false;
            const archivos = imagenesDe(event.dataTransfer?.files);
            if (!archivos.length || !extension.options.subir) return false;
            event.preventDefault();
            const donde = view.posAtCoords({ left: event.clientX, top: event.clientY });
            return recibir(archivos, donde ? donde.pos : view.state.selection.from);
          },
          handlePaste(view, event) {
            const archivos = imagenesDe(event.clipboardData?.files);
            if (!archivos.length || !extension.options.subir) return false;
            event.preventDefault();
            return recibir(archivos, view.state.selection.from);
          },
        },
      }),
    ];
  },
});

export default Figura;
