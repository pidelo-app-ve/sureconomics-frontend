/**
 * El editor de texto (TipTap de verdad, en `scripts/pruebas/dom.mjs`) de solo lectura: la
 * barra entera apagada. Con `editable: false` el teclado no escribe, pero un botón de la
 * barra sí cambiaría el texto (`toggleBold().run()`); el panel lo pone así mientras Claude
 * traduce la pieza (`CampoEnIngles`). `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { pintar, pantalla, fireEvent, asentar } = await import("../../../scripts/pruebas/dom.mjs");
const { RichTextEditor } = await import("./RichTextEditor.jsx");
const { EditorConImagenes } = await import("../admin/cuerpo/EditorConImagenes.jsx");

const LIMITE = { timeout: 20000 };
const botonesDeLaBarra = async () => {
  const barra = await pantalla.findByRole("toolbar");
  await asentar();
  return [...barra.querySelectorAll("button")];
};

for (const [nombre, Editor, extra] of [
  ["RichTextEditor", RichTextEditor, {}],
  ["EditorConImagenes", EditorConImagenes, { subir: async () => ({}) }],
]) {
  test(`${nombre} de solo lectura: ningún botón de la barra cambia el texto`, LIMITE, async () => {
    const cambios = [];
    pintar(createElement(Editor, { value: "<p>Hola</p>", onChange: (html) => cambios.push(html), disabled: true, ...extra }));
    const botones = await botonesDeLaBarra();
    assert.ok(botones.length >= 11, `la barra tiene sus botones (${botones.length})`);
    for (const boton of botones) assert.equal(boton.disabled, true, `«${boton.title}» apagado`);
    // Al montarse, TipTap avisa una vez con el mismo texto (`setEditable`): no cuenta.
    cambios.length = 0;
    for (const boton of botones) fireEvent.click(boton);
    await asentar();
    assert.deepEqual(cambios.filter((html) => html !== "<p>Hola</p>"), [], "el texto no cambió");
  });

  test(`${nombre} editable: la barra encendida, como siempre`, LIMITE, async () => {
    pintar(createElement(Editor, { value: "<p>Hola</p>", onChange: () => {}, ...extra }));
    const botones = await botonesDeLaBarra();
    const negrita = botones[0];
    assert.equal(negrita.disabled, false);
    // Deshacer y rehacer, apagados porque aún no hay nada que deshacer.
    assert.deepEqual(botones.slice(-2).map((b) => b.disabled), [true, true]);
  });
}
