/**
 * «En inglés» en el editor, en pantalla (`scripts/pruebas/dom.mjs`): lo que se ve mientras
 * Claude traduce y cuando acaba. Los campos en inglés no se pueden tocar durante la espera
 * (lo que llegue los reemplaza: lo escrito se perdería sin aviso), y el aviso para lectores
 * de pantalla solo habla mientras traduce. `npm test`.
 *
 * Los editores de texto (TipTap) van con un doble: un `<textarea>` con su `disabled`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import PropTypes from "prop-types";
import { sustituir } from "../../../../scripts/pruebas/dobles.mjs";

const Editor = ({ value, onChange, disabled }) =>
  createElement("textarea", { "aria-label": "Editor en inglés", value, disabled, onChange: (e) => onChange(e.target.value) });
Editor.propTypes = { value: PropTypes.string, onChange: PropTypes.func.isRequired, disabled: PropTypes.bool };

sustituir({
  "src/components/editor/RichTextEditor.jsx": { RichTextEditor: Editor },
  "src/components/admin/cuerpo/EditorConImagenes.jsx": { EditorConImagenes: Editor },
});

const { pintar, pantalla } = await import("../../../../scripts/pruebas/dom.mjs");
const { CampoEnIngles } = await import("./CampoEnIngles.jsx");

const ESPERA = /Claude está traduciendo/;

const campo = (traduciendo, extra = {}) =>
  createElement(CampoEnIngles, {
    form: { format: "noticia", title_en: "Oil", excerpt_en: "", content_en: "", traduccion_automatica: true },
    setForm: () => {},
    handleChange: () => () => {},
    // Con algo pendiente se abre solo, como en el editor.
    estadoIngles: { resumen: "Falta el cuerpo", estado: "falta", aviso: "" },
    traductorDisponible: true,
    traducir: () => {},
    traduciendo,
    versionEn: 0,
    revisadaAhora: false,
    setRevisadaAhora: () => {},
    ...extra,
  });

test("traduciendo: el botón lo dice, el aviso habla y los campos en inglés no se tocan", { timeout: 20000 }, async () => {
  pintar(campo(true), { ruta: "/admin/posts/7", rol: "publicador" });
  const boton = await pantalla.findByRole("button", { name: "Traduciendo…" });
  assert.equal(boton.disabled, true);
  assert.match(pantalla.getByRole("status").textContent, ESPERA);
  assert.match(pantalla.getByRole("status").textContent, /Si cierra la pieza/, "de usted, como el resto del panel");
  assert.equal(pantalla.getByLabelText("Título en inglés").readOnly, true);
  for (const editor of pantalla.getAllByLabelText("Editor en inglés")) assert.equal(editor.disabled, true);
  assert.equal(pantalla.getByLabelText(/Ya revisé la traducción automática/).disabled, true);
  const contenedor = pantalla.getByLabelText("Título en inglés").closest("[aria-busy]");
  assert.equal(contenedor?.getAttribute("aria-busy"), "true", "el contenedor de los campos, ocupado");
});

test("sin traducir: todo se puede editar y el aviso calla", { timeout: 20000 }, async () => {
  pintar(campo(false), { ruta: "/admin/posts/7", rol: "publicador" });
  await pantalla.findByRole("button", { name: "Traducir con Claude" });
  assert.equal(pantalla.getByRole("status").textContent, "", "al acabar no se lee nada de más");
  assert.ok(pantalla.getByText(/Traduce el título, el resumen y el cuerpo/));
  assert.equal(pantalla.getByLabelText("Título en inglés").readOnly, false);
  for (const editor of pantalla.getAllByLabelText("Editor en inglés")) assert.equal(editor.disabled, false);
  assert.equal(pantalla.getByLabelText("Título en inglés").closest("[aria-busy]")?.getAttribute("aria-busy"), "false");
});
