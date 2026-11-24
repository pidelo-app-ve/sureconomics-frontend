/**
 * «Entorno en Viñetas» en el panel, en pantalla (`scripts/pruebas/dom.mjs`): abrir un
 * número, cambiar el asunto y la introducción, guardar y enviar. `npm test`.
 *
 * Vigila el fallo del 23-nov-2026 (b4717a8): tras guardar, «Enviar ahora» no se encendía
 * hasta recargar. El editor comparaba lo escrito con lo guardado, y el servidor devuelve
 * la introducción con los atributos del enlace en otro orden (`href` antes que `rel`), así
 * que la pantalla veía «cambios sin guardar» para siempre. Las respuestas son las del
 * backend, grabadas con su cliente de pruebas (`src/pruebas/respuestas/boletin/`).
 *
 * El editor de texto (TipTap) va con un doble: un `<textarea>` que entrega el HTML tal
 * cual, como lo entregaría TipTap al escribir (`target` y `rel` antes que `href`). Lo
 * demás de la página, de verdad.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import PropTypes from "prop-types";
import { sustituir } from "../../../scripts/pruebas/dobles.mjs";

const EditorDeTexto = ({ value, onChange, disabled }) =>
  createElement("textarea", { "aria-label": "Introducción", value, disabled, onChange: (e) => onChange(e.target.value) });
EditorDeTexto.propTypes = { value: PropTypes.string, onChange: PropTypes.func.isRequired, disabled: PropTypes.bool };

sustituir({ "src/components/editor/RichTextEditor.jsx": { RichTextEditor: EditorDeTexto } });

const { pintar, pantalla, fireEvent, waitFor, within, asentar, servidor, grabada } = await import(
  "../../../scripts/pruebas/dom.mjs"
);
const { AdminBoletin } = await import("./AdminBoletin.jsx");

const BASE = "/admin/boletin/numeros";
/** Lo que escribe quien edita: el asunto y la introducción, con el enlace como lo deja TipTap. */
const ASUNTO = "Entorno en Viñetas · 30 de noviembre (con enlace)";
const INTRO_DE_TIPTAP =
  '<p>Esta semana, <a target="_blank" rel="noopener noreferrer nofollow" href="https://sureconomics.com/noticias/inflacion">la inflación en cifras</a> y la cumbre.</p>';

/** La página con el número 1 abierto. */
const abrirNumero = async () => {
  servidor
    .contestar("GET", BASE, grabada("boletin/lista.json"))
    .contestar("GET", `${BASE}/1`, grabada("boletin/numero.json"))
    .contestar("PATCH", `${BASE}/1`, grabada("boletin/numero-guardado.json"));
  pintar(createElement(AdminBoletin), { ruta: "/admin/boletin/numeros", rol: "publicador" });
  fireEvent.click(await pantalla.findByRole("button", { name: /30 de noviembre/ }));
  const asunto = await pantalla.findByLabelText("Asunto");
  // Que corra el efecto que copia el número en el borrador antes de escribir: si no,
  // con la máquina cargada pisaba lo escrito (revisión de la tanda 2).
  await asentar();
  return asunto;
};

const escribir = (campo, valor) => fireEvent.change(campo, { target: { value: valor } });

test("tras guardar, «Enviar ahora» se enciende aunque el servidor reordene el enlace", async () => {
  const asunto = await abrirNumero();
  assert.equal(pantalla.getByRole("button", { name: "Enviar ahora" }).disabled, false, "antes de tocar nada");

  escribir(asunto, ASUNTO);
  escribir(pantalla.getByLabelText("Introducción"), INTRO_DE_TIPTAP);
  assert.ok(pantalla.getByText("Hay cambios sin guardar."));

  fireEvent.click(pantalla.getByRole("button", { name: "Guardar asunto e introducción" }));
  await waitFor(() => assert.equal(servidor.a(`${BASE}/1`, "PATCH").length, 1));
  assert.deepEqual(servidor.a(`${BASE}/1`, "PATCH")[0].cuerpo, { subject: ASUNTO, preheader: "", body_html: INTRO_DE_TIPTAP });

  // Lo de antes del arreglo: «Guardar y enviar ahora» (o apagado) y «Hay cambios sin
  // guardar» para siempre, porque lo escrito ya no era igual a lo guardado.
  const enviar = await pantalla.findByRole("button", { name: "Enviar ahora" });
  assert.equal(enviar.disabled, false);
  assert.equal(pantalla.queryByText("Hay cambios sin guardar."), null);
  assert.equal(pantalla.getByRole("button", { name: "Guardar asunto e introducción" }).disabled, true);
  // Y el editor se queda con lo que guardó el servidor.
  assert.equal(pantalla.getByLabelText("Introducción").value, grabada("boletin/numero-guardado.json").data.body_html);
  assert.deepEqual(servidor.sinRespuesta, []);
});

test("con cambios sin guardar, el botón dice «Guardar y enviar ahora», y guarda antes de mandar", async () => {
  const asunto = await abrirNumero();
  escribir(asunto, ASUNTO);

  const boton = pantalla.getByRole("button", { name: "Guardar y enviar ahora" });
  assert.equal(boton.disabled, false);
  assert.equal(pantalla.queryByRole("button", { name: "Enviar ahora" }), null);

  // Sin asunto no se puede guardar, así que tampoco «guardar y enviar».
  escribir(asunto, "   ");
  assert.equal(pantalla.getByRole("button", { name: "Guardar y enviar ahora" }).disabled, true);
  escribir(asunto, ASUNTO);

  servidor
    .contestar("POST", `${BASE}/1/enviar`, grabada("boletin/lote-terminado.json"))
    .contestar("GET", `${BASE}/1`, () => {
      const r = grabada("boletin/numero-guardado.json");
      r.data.status = "sent";
      return r;
    });
  fireEvent.click(pantalla.getByRole("button", { name: "Guardar y enviar ahora" }));

  // Pregunta con el asunto nuevo, no con el guardado.
  const dialogo = await pantalla.findByRole("dialog");
  assert.match(dialogo.textContent, /¿Enviar «Entorno en Viñetas · 30 de noviembre \(con enlace\)» a 3 suscriptores\?/);
  assert.match(dialogo.textContent, /Antes se guardan el asunto y la introducción/);
  fireEvent.click(within(dialogo).getByRole("button", { name: "Guardar y enviar" }));

  await waitFor(() => assert.equal(servidor.a(`${BASE}/1/enviar`, "POST").length, 1));
  const orden = servidor.peticiones.map((p) => `${p.metodo} ${p.ruta}`).filter((p) => !p.startsWith("GET"));
  assert.deepEqual(orden, [`PATCH ${BASE}/1`, `POST ${BASE}/1/enviar`], "primero se guarda, después sale");
  assert.equal(servidor.a(`${BASE}/1`, "PATCH")[0].cuerpo.subject, ASUNTO);
  assert.deepEqual(servidor.sinRespuesta, []);
});
