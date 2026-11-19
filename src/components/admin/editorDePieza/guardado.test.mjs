/**
 * Guardar una pieza en el panel: lo que decide el editor (`guardado.js`) y la barra de
 * botones pintada (`BotonesDeLaPieza.jsx`) en los momentos delicados -- guardando,
 * publicando, con cosas que faltan. `npm test`.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { textoDe } from "../../../../scripts/pruebas/pintar.mjs";
import { emptyForm } from "./formulario.js";
import { avisoDelFormulario, avisoTrasGuardar, claveDelBorrador, destinoTrasCrear, hayCambios } from "./guardado.js";
import { BotonesDeLaPieza } from "./BotonesDeLaPieza.jsx";

const form = (extra = {}) => ({ ...emptyForm(), format: "noticia", title: "Titular", ...extra });

describe("si hay cambios sin guardar", () => {
  test("antes de cargar no hay nada que perder", () => {
    assert.equal(hayCambios(form(), null), false);
  });

  test("lo mismo que se cargó no es un cambio, ni con el párrafo vacío del editor", () => {
    assert.equal(hayCambios(form({ content: "<p></p>" }), form({ content: "" })), false);
  });

  test("una letra sí", () => {
    assert.equal(hayCambios(form({ title: "Titular!" }), form()), true);
  });
});

describe("tras crear", () => {
  test("se va al editor de la pieza nueva, sin dejar «crear» en el historial", () => {
    const { ruta, opciones } = destinoTrasCrear({ created: { id: 42 }, publicar: false, label: "Noticia" });
    assert.equal(ruta, "/admin/posts/42");
    assert.equal(opciones.replace, true);
    assert.deepEqual(opciones.state, { flash: "Noticia: creada correctamente." });
  });

  test("creada y publicada de una vez: el aviso lo dice y marca `recienPublicada` (el enlace)", () => {
    const { opciones } = destinoTrasCrear({ created: { id: 42 }, publicar: true, label: "Noticia" });
    assert.deepEqual(opciones.state, { flash: "Noticia: publicada.", recienPublicada: true });
  });

  test("si la API no devuelve el id (id 0 sí vale), al listado", () => {
    assert.equal(destinoTrasCrear({ created: {}, publicar: false, label: "La pieza" }).ruta, "/admin/posts");
    assert.equal(destinoTrasCrear({ created: null, publicar: true, label: "La pieza" }).ruta, "/admin/posts");
    assert.equal(destinoTrasCrear({ created: { id: 0 }, publicar: false, label: "La pieza" }).ruta, "/admin/posts/0");
  });
});

describe("el aviso tras guardar", () => {
  test("lo normal", () => {
    assert.deepEqual(avisoTrasGuardar({ status: "draft" }), { mensaje: "Cambios guardados correctamente.", titulo: "Contenido guardado" });
  });

  test("programada: con la fecha en hora de Caracas", () => {
    const aviso = avisoTrasGuardar({ status: "scheduled", published_at: "2026-12-01T13:00:00Z" });
    assert.equal(aviso.titulo, "Programada");
    assert.match(aviso.mensaje, /^Programada: sale sola el martes, 1 de diciembre, 9:00 \(hora de Caracas\)\.$/);
  });

  test("fijada en portada: hasta cuándo", () => {
    const aviso = avisoTrasGuardar({ status: "published", en_portada: true, destacada_hasta: "2026-12-01T13:00:00Z" });
    assert.match(aviso.mensaje, /^Cambios guardados\. Abre la portada hasta el martes, 1 de diciembre a las 9:00/);
  });

  test("una respuesta vacía no rompe el aviso", () => {
    assert.equal(avisoTrasGuardar(null).mensaje, "Cambios guardados correctamente.");
  });
});

describe("el mensaje bajo el formulario", () => {
  const nada = { status: "idle", message: "" };
  test("sin nada que decir, nada", () => {
    assert.equal(avisoDelFormulario(nada, nada), null);
    assert.equal(avisoDelFormulario({ status: "loading" }, { status: "loading" }), null);
  });

  test("la última acción manda sobre el guardado", () => {
    assert.deepEqual(
      avisoDelFormulario({ status: "error", message: "No se pudo publicar." }, { status: "success", message: "Guardado" }),
      { tone: "error", message: "No se pudo publicar." }
    );
    assert.deepEqual(avisoDelFormulario(nada, { status: "error", message: "Su sesión expiró." }), {
      tone: "error",
      message: "Su sesión expiró.",
    });
  });
});

describe("la copia en este equipo", () => {
  const cargada = { status: "success" };
  test("una por pieza, y una por formato para las nuevas", () => {
    assert.equal(claveDelBorrador({ loadState: cargada, base: form(), isCreate: false, postId: "7" }), "pieza-7");
    assert.equal(claveDelBorrador({ loadState: cargada, base: form(), isCreate: true }), "pieza-nueva-noticia");
    assert.equal(claveDelBorrador({ loadState: cargada, base: form({ format: "" }), isCreate: true }), "pieza-nueva-sin-formato");
  });

  test("nada mientras carga o si falló la carga", () => {
    assert.equal(claveDelBorrador({ loadState: { status: "loading" }, base: form(), isCreate: false, postId: "7" }), null);
    assert.equal(claveDelBorrador({ loadState: { status: "error" }, base: null, isCreate: false, postId: "7" }), null);
  });
});

/** La barra de botones pintada; devuelve `{ texto, boton(etiqueta) }`. */
const barra = (props = {}) => {
  const html = renderToString(
    createElement(BotonesDeLaPieza, {
      esMovil: false,
      form: form(),
      faltas: [],
      setVistaPrevia: () => {},
      publicarEsPrincipal: false,
      handleSave: () => {},
      saveState: { status: "idle" },
      programada: false,
      isCreate: false,
      canPublish: true,
      guardar: () => {},
      handlePublish: () => {},
      actionState: { status: "idle", kind: "" },
      sinGuardar: false,
      handleUnpublish: () => {},
      handleDelete: () => {},
      ...props,
    })
  );
  const botones = [...html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)].map(([, attrs, dentro]) => ({
    etiqueta: textoDe(dentro),
    desactivado: /\sdisabled=""/.test(attrs),
    titulo: /title="([^"]*)"/.exec(attrs)?.[1] ?? null,
  }));
  return { html, botones, boton: (etiqueta) => botones.find((b) => b.etiqueta === etiqueta) };
};

describe("la barra de botones", () => {
  test("una pieza nueva: guardar borrador y publicar", () => {
    const { boton } = barra({ isCreate: true });
    assert.equal(boton("Guardar borrador").desactivado, false);
    assert.equal(boton("Publicar").desactivado, false);
    assert.equal(boton("Eliminar la pieza"), undefined);
  });

  test("mientras guarda, «Guardar» está desactivado y dice «Guardando…» (contra el doble clic)", () => {
    const { boton } = barra({ isCreate: true, saveState: { status: "loading" } });
    assert.equal(boton("Guardando…").desactivado, true);
    assert.equal(boton("Publicar").desactivado, true);
  });

  test("mientras publica, «Publicar» está desactivado (contra el doble clic)", () => {
    const { boton } = barra({ actionState: { status: "loading", kind: "publish" } });
    assert.equal(boton("Publicando…").desactivado, true);
  });

  test("con cosas que faltan, publicar una nueva no se puede, y dice qué falta", () => {
    const { boton } = barra({ isCreate: true, faltas: ["título", "tema"] });
    assert.equal(boton("Publicar").desactivado, true);
    assert.equal(boton("Publicar").titulo, "Falta: título, tema");
  });

  test("en el teléfono, lo que falta se lee encima de los botones", () => {
    assert.match(textoDe(barra({ esMovil: true, faltas: ["texto"] }).html), /Falta: texto/);
  });

  test("sin formato no hay vista previa", () => {
    assert.equal(barra({ form: form({ format: "" }) }).boton("Vista previa").desactivado, true);
  });

  test("con cambios sin guardar, publicar dice que también guarda", () => {
    assert.ok(barra({ sinGuardar: true }).boton("Guardar y publicar"));
  });

  test("quien no puede publicar solo guarda", () => {
    const { botones } = barra({ canPublish: false });
    assert.deepEqual(botones.map((b) => b.etiqueta), ["Vista previa", "Guardar cambios"]);
  });

  test("programada: programar, publicar ya y volver a borrador", () => {
    const { boton } = barra({ programada: true, form: form({ status: "scheduled" }) });
    assert.ok(boton("Programar"));
    assert.ok(boton("Publicar ya"));
    assert.ok(boton("Volver a borrador"));
  });

  // FALLO CONOCIDO (19-nov-2026, sin arreglar: cambia lo que se ve). Los atajos de teclado
  // se apagan con «ocupado» (guardando **o** publicando), pero los botones no: mientras
  // guarda, «Publicar» de una pieza existente sigue activo y lanza otro PATCH con el
  // mismo formulario a la vez (`guardarYPublicar`), y mientras publica, «Guardar» sigue
  // activo.
  // Al arreglarlo, quitar el `todo` y dejarla como prueba normal: entonces vigila que el fallo no vuelva.
  test("guardando, tampoco se puede publicar (ni al revés)", { todo: "los botones no miran el otro estado" }, () => {
    assert.equal(barra({ saveState: { status: "loading" } }).boton("Publicar").desactivado, true);
    assert.equal(barra({ actionState: { status: "loading", kind: "publish" } }).boton("Guardar cambios").desactivado, true);
  });
});
