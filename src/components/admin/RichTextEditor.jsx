import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { LinkDialog } from "./LinkDialog";

const ToolbarButton = ({ label, title, isActive, onClick, disabled }) => (
  <button
    type="button"
    className={`se-richtext__btn${isActive ? " se-richtext__btn--active" : ""}`}
    title={title}
    aria-pressed={isActive}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
  >
    {label}
  </button>
);

ToolbarButton.propTypes = {
  label: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

/**
 * Rich text editor for post content. Stores/returns real HTML, so it slots
 * into the existing `content` field with no backend changes -- the public
 * article page already renders HTML content as-is.
 *
 * @param {{ value: string, onChange: (html: string) => void, placeholder?: string }} props
 */
export const RichTextEditor = ({ value, onChange, placeholder }) => {
  // Tiptap only re-renders this component on content changes (`onUpdate`);
  // clicking a toolbar button toggles a mark/selection without necessarily
  // changing content, so without this the button highlight goes stale until
  // the next keystroke. Forcing a tick on every transaction keeps it live.
  const [, forceRerender] = useState(0);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder || "Escriba el contenido…" }),
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    onTransaction: () => {
      forceRerender((t) => t + 1);
    },
  });

  // Keep the editor in sync when `value` changes from outside (e.g. loading
  // an existing post) without fighting the user's own typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const currentLinkHref = editor.getAttributes("link").href || "";

  const applyLink = (url) => {
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkDialogOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkDialogOpen(false);
  };

  return (
    <div className="se-richtext">
      <div className="se-richtext__toolbar" role="toolbar" aria-label="Formato de texto">
        <ToolbarButton
          label={<strong>B</strong>}
          title="Negrita"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label={<em>I</em>}
          title="Cursiva"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label={<s>S</s>}
          title="Tachado"
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <span className="se-richtext__divider" aria-hidden="true" />
        <ToolbarButton
          label="H2"
          title="Título"
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="H3"
          title="Subtítulo"
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <span className="se-richtext__divider" aria-hidden="true" />
        <ToolbarButton
          label="• Lista"
          title="Lista con viñetas"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. Lista"
          title="Lista numerada"
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="❝❞"
          title="Cita"
          isActive={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <span className="se-richtext__divider" aria-hidden="true" />
        <ToolbarButton
          label="Link"
          title="Insertar/editar enlace"
          isActive={editor.isActive("link")}
          onClick={() => setLinkDialogOpen(true)}
        />
        <span className="se-richtext__divider" aria-hidden="true" />
        <ToolbarButton
          label="↺"
          title="Deshacer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          label="↻"
          title="Rehacer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />
      </div>
      <EditorContent editor={editor} className="se-richtext__content" />
      <LinkDialog
        open={linkDialogOpen}
        initialUrl={currentLinkHref}
        onSave={applyLink}
        onRemove={removeLink}
        onClose={() => setLinkDialogOpen(false)}
      />
    </div>
  );
};

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
