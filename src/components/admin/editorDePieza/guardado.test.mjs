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
import {
  avisoDelFormulario,
  avisoTrasGuardar,
  claveDelBorrador,
  destinoTrasCrear,
  ejecutarAccion,
  eliminarPieza,
  estaOcupado,
  fusionarRespuesta,
  guardarPieza,
  hayCambios,
} from "./guardado.js";
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
  const saveState = props.saveState ?? { status: "idle" };
  const actionState = props.actionState ?? { status: "idle", kind: "" };
  const html = renderToString(
    createElement(BotonesDeLaPieza, {
      // Como en el editor: `ocupado` sale de los estados (ver `estaOcupado`).
      ocupado: estaOcupado({ saveState, actionState, eliminando: props.eliminando }),
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

  // Era un fallo (19-nov-2026): los atajos de teclado se apagaban con «ocupado»
  // (guardando **o** publicando), pero los botones no: mientras guardaba, «Publicar» de
  // una pieza existente seguía activo y lanzaba otro PATCH a la vez, y mientras
  // publicaba, «Guardar» seguía activo.
  test("guardando, tampoco se puede publicar (ni al revés)", () => {
    assert.equal(barra({ saveState: { status: "loading" } }).boton("Publicar").desactivado, true);
    assert.equal(barra({ actionState: { status: "loading", kind: "publish" } }).boton("Guardar cambios").desactivado, true);
  });

  test("publicada y guardando: ni despublicar ni eliminar", () => {
    const { boton } = barra({ form: form({ status: "published" }), saveState: { status: "loading" } });
    assert.equal(boton("Despublicar").desactivado, true);
    assert.equal(boton("Eliminar la pieza").desactivado, true);
  });

  test("despublicando: ni guardar ni eliminar", () => {
    const { boton } = barra({ form: form({ status: "published" }), actionState: { status: "loading", kind: "unpublish" } });
    assert.equal(boton("Despublicando…").desactivado, true);
    assert.equal(boton("Guardar cambios").desactivado, true);
    assert.equal(boton("Eliminar la pieza").desactivado, true);
  });

  test("programada y guardando: tampoco «Publicar ya» ni «Volver a borrador»", () => {
    const { boton } = barra({ programada: true, form: form({ status: "scheduled" }), saveState: { status: "loading" } });
    assert.equal(boton("Publicar ya").desactivado, true);
    assert.equal(boton("Volver a borrador").desactivado, true);
  });

  test("borrando la pieza: todo apagado menos la vista previa", () => {
    const { botones } = barra({ form: form({ status: "published" }), eliminando: true });
    assert.deepEqual(
      botones.filter((b) => b.desactivado).map((b) => b.etiqueta),
      ["Guardar cambios", "Despublicar", "Eliminar la pieza"]
    );
  });

  test("sin nada en marcha, todo encendido (también eliminar)", () => {
    assert.deepEqual(barra({ form: form({ status: "published" }) }).botones.filter((b) => b.desactivado), []);
  });
});

describe("si el editor está ocupado", () => {
  const nada = { status: "idle" };
  test("guardando, publicando/despublicando o eliminando; si no, no", () => {
    assert.equal(estaOcupado({ saveState: nada, actionState: nada }), false);
    assert.equal(estaOcupado({ saveState: { status: "loading" }, actionState: nada }), true);
    assert.equal(estaOcupado({ saveState: nada, actionState: { status: "loading", kind: "unpublish" } }), true);
    assert.equal(estaOcupado({ saveState: nada, actionState: nada, eliminando: true }), true);
    // Un error o un éxito ya no es «en marcha».
    assert.equal(estaOcupado({ saveState: { status: "error" }, actionState: { status: "success" } }), false);
  });
});

/** Una promesa que la prueba resuelve o rechaza cuando quiere. */
const diferida = () => {
  let resolver;
  let rechazar;
  const promesa = new Promise((si, no) => {
    resolver = si;
    rechazar = no;
  });
  return { promesa, resolver, rechazar };
};

/**
 * El editor de piezas sin React: el estado que tocan los manejadores de `guardado.js`,
 * con `set…` que aceptan valor o función como los de `useState`, y una API cuyas
 * respuestas suelta la prueba (`e.api("patch").resolver(pieza)`). Los botones son
 * `e.guardar()`, `e.publicar()`, `e.despublicar()` y `e.eliminar()`; el diálogo de
 * eliminar, `e.dialogo` (`confirmar()` / `cancelar()`). Lo que se escribe mientras
 * tanto, `e.escribir({ campo: valor })`.
 */
const editor = ({ isCreate = false, inicial = form({ status: "published", slug: "titular" }) } = {}) => {
  const e = {
    estado: {
      form: inicial,
      base: inicial,
      saveState: { status: "idle", message: "" },
      actionState: { status: "idle", message: "", kind: "" },
      eliminando: false,
      colaborador: null,
      assets: { image: null, video: null, document: null, audio: null, bylinePhoto: null },
      recienPublicada: false,
    },
    llamadas: [],
    borrador: [],
    avisos: [],
    navegado: null,
    dialogo: null,
    enMarcha: { current: false },
    saltarGuarda: { current: false },
  };
  const set = (clave) => (v) => {
    e.estado[clave] = typeof v === "function" ? v(e.estado[clave]) : v;
  };
  const api = (nombre) => (...args) => {
    const d = diferida();
    e.llamadas.push({ nombre, args, ...d });
    return d.promesa;
  };
  /** La última llamada a `nombre`, para soltar su respuesta. */
  e.api = (nombre) => e.llamadas.filter((l) => l.nombre === nombre).at(-1);
  e.nombres = () => e.llamadas.map((l) => l.nombre);
  e.ocupado = () => estaOcupado(e.estado);
  e.escribir = (cambios) => set("form")((prev) => ({ ...prev, ...cambios }));
  e.sinGuardar = () => hayCambios(e.estado.form, e.estado.base);
  /** Lo que el editor pasa a los manejadores, leído al pulsar (como en cada pintado). */
  e.d = () => ({
    form: e.estado.form,
    // El ref del editor: el formulario del último pintado.
    formActual: { get current() { return e.estado.form; } },
    isCreate,
    numericPostId: 7,
    label: "Noticia",
    enMarcha: e.enMarcha,
    claveDeCreacion: () => "clave-1",
    createAdminPost: api("crear"),
    patchAdminPost: api("patch"),
    deleteAdminPost: api("borrar"),
    navigate: (...a) => (e.navegado = a),
    saltarGuarda: e.saltarGuarda,
    borrador: {
      limpiar: () => e.borrador.push("limpiar"),
      borrar: () => e.borrador.push("borrar"),
      conservar: () => e.borrador.push("conservar"),
    },
    confirm: (opciones) =>
      new Promise((cerrar) => {
        e.dialogo = {
          opciones,
          confirmar: async () => {
            try {
              await opciones.onConfirm();
              e.dialogo = null;
              cerrar(true);
            } catch (err) {
              // Como `useAdminConfirm`: el diálogo sigue abierto con el error.
              e.dialogo.error = err;
            }
          },
          cancelar: () => {
            e.dialogo = null;
            cerrar(false);
          },
        };
      }),
    setSaveState: set("saveState"),
    setActionState: set("actionState"),
    setForm: set("form"),
    setBase: set("base"),
    setColaborador: set("colaborador"),
    setAssets: set("assets"),
    setRecienPublicada: set("recienPublicada"),
    setEliminando: set("eliminando"),
    toastSuccess: (m, t) => e.avisos.push({ tono: "ok", m, t }),
    toastError: (m, t) => e.avisos.push({ tono: "error", m, t }),
  });
  e.guardar = (opciones) => guardarPieza(opciones, e.d());
  const accion = (kind, nombre, enviado = () => undefined) => () =>
    ejecutarAccion(
      { kind, fn: api(nombre), successMessage: `ok ${kind}`, failureMessage: `No se pudo ${kind}.`, toastTitle: kind, enviado: enviado() },
      e.d()
    );
  e.publicar = accion("publish", "publicar");
  // Como en el editor: despublicar no manda el formulario, responde sobre lo guardado.
  e.despublicar = accion("unpublish", "despublicar", () => e.estado.base);
  e.eliminar = () => eliminarPieza({ ...e.d(), dialogo: { title: "Eliminar pieza", confirmLabel: "Eliminar" } });
  return e;
};

/** Lo que devuelve la API: la pieza guardada, con lo que pone el servidor. */
const pieza = (extra = {}) => ({ id: 7, format: "noticia", title: "Titular", slug: "titular", status: "published", ...extra });
const sinRed = () => new TypeError("Failed to fetch");

describe("una acción a la vez (el candado)", () => {
  test("doble clic en «Guardar»: un solo PATCH", async () => {
    const e = editor();
    const uno = e.guardar();
    const dos = e.guardar();
    assert.deepEqual(e.nombres(), ["patch"]);
    assert.equal(e.ocupado(), true);
    e.api("patch").resolver(pieza());
    await Promise.all([uno, dos]);
    assert.equal(e.ocupado(), false);
    assert.equal(e.estado.saveState.status, "success");
  });

  test("lo que no se hace por estar ocupado se dice, no se calla", async () => {
    const e = editor();
    const guardando = e.guardar();
    await e.guardar();
    await e.despublicar();
    await e.eliminar();
    const ocupado = e.avisos.filter((a) => a.m === "Hay otra acción en marcha. Espere a que termine.");
    assert.equal(ocupado.length, 3);
    assert.equal(ocupado[0].tono, "error");
    e.api("patch").resolver(pieza());
    await guardando;
  });

  test("si el manejador mismo lanza (p. ej. el aviso de error), el candado se suelta", async () => {
    const e = editor();
    const d = { ...e.d(), toastError: () => {
      throw new Error("el aviso falló");
    } };
    const guardando = guardarPieza({}, d);
    e.api("patch").rechazar(sinRed());
    await assert.rejects(guardando, /el aviso falló/);
    assert.equal(e.enMarcha.current, false);
  });

  test("«Guardar cambios» y, mientras, «Despublicar»: no se despublica a la vez", async () => {
    const e = editor();
    const guardando = e.guardar();
    await e.despublicar();
    assert.deepEqual(e.nombres(), ["patch"]);
    e.api("patch").resolver(pieza());
    await guardando;
    // Ya en paz, despublicar sí va.
    const despublicando = e.despublicar();
    assert.deepEqual(e.nombres(), ["patch", "despublicar"]);
    e.api("despublicar").resolver(pieza({ status: "draft" }));
    await despublicando;
    assert.equal(e.estado.form.status, "draft");
    assert.equal(e.estado.actionState.status, "success");
  });

  test("al revés: despublicando, «Guardar» (o Ctrl+S) no manda el PATCH con `published`", async () => {
    const e = editor();
    const despublicando = e.despublicar();
    await e.guardar();
    assert.deepEqual(e.nombres(), ["despublicar"]);
    e.api("despublicar").resolver(pieza({ status: "draft" }));
    await despublicando;
    assert.equal(e.estado.form.status, "draft");
  });

  test("un borrador: «Guardar» y enseguida «Guardar y publicar», uno solo", async () => {
    const e = editor({ inicial: form({ status: "draft" }) });
    const guardando = e.guardar();
    await e.publicar();
    assert.deepEqual(e.nombres(), ["patch"]);
    e.api("patch").resolver(pieza({ status: "draft" }));
    await guardando;
  });

  test("doble clic en «Publicar»: una sola publicación", async () => {
    const e = editor({ inicial: form({ status: "draft" }) });
    const uno = e.publicar();
    await e.publicar();
    assert.deepEqual(e.nombres(), ["publicar"]);
    e.api("publicar").resolver(pieza());
    await uno;
    assert.equal(e.estado.recienPublicada, true);
  });

  test("al crear, doble clic en «Publicar» (o «Guardar borrador» detrás): una sola pieza", async () => {
    const e = editor({ isCreate: true, inicial: form() });
    const uno = e.guardar({ publicar: true });
    await e.guardar({ publicar: true });
    await e.guardar();
    assert.deepEqual(e.nombres(), ["crear"]);
    assert.equal(e.api("crear").args[0].status, "published");
    e.api("crear").resolver({ id: 42 });
    await uno;
    assert.equal(e.navegado[0], "/admin/posts/42");
  });

  test("tras crear no se queda «Guardando…» (el editor sigue montado en la pieza nueva)", async () => {
    const e = editor({ isCreate: true, inicial: form() });
    const creando = e.guardar();
    assert.equal(e.ocupado(), true);
    e.api("crear").resolver({ id: 42 });
    await creando;
    assert.equal(e.ocupado(), false);
  });

  test("guardando, «Eliminar» ni pregunta", async () => {
    const e = editor();
    const guardando = e.guardar();
    await e.eliminar();
    assert.equal(e.dialogo, null);
    e.api("patch").resolver(pieza());
    await guardando;
  });

  test("con la pregunta de eliminar abierta, Ctrl+S no guarda; al cancelar, sí", async () => {
    const e = editor();
    const eliminando = e.eliminar();
    assert.ok(e.dialogo);
    await e.guardar();
    await e.despublicar();
    assert.deepEqual(e.nombres(), []);
    e.dialogo.cancelar();
    await eliminando;
    const guardando = e.guardar();
    assert.deepEqual(e.nombres(), ["patch"]);
    e.api("patch").resolver(pieza());
    await guardando;
  });

  test("borrando: ocupado hasta que acaba, y luego al listado", async () => {
    const e = editor();
    const eliminando = e.eliminar();
    const confirmando = e.dialogo.confirmar();
    assert.equal(e.estado.eliminando, true);
    assert.equal(e.ocupado(), true);
    e.api("borrar").resolver(null);
    await confirmando;
    await eliminando;
    assert.equal(e.navegado[0], "/admin/posts");
    assert.equal(e.saltarGuarda.current, true);
  });

  test("sin red al borrar: el diálogo sigue con el error, los botones vuelven y nada se cuela hasta cerrarlo", async () => {
    const e = editor();
    const eliminando = e.eliminar();
    const confirmando = e.dialogo.confirmar();
    e.api("borrar").rechazar(sinRed());
    await confirmando;
    assert.ok(e.dialogo.error instanceof TypeError);
    assert.equal(e.estado.eliminando, false);
    assert.equal(e.navegado, null);
    await e.guardar();
    assert.deepEqual(e.nombres(), ["borrar"]);
    e.dialogo.cancelar();
    await eliminando;
    assert.equal(e.enMarcha.current, false);
  });

  test("sin red al guardar: se dice, no se borra la copia local y se puede volver a intentar", async () => {
    const e = editor();
    const uno = e.guardar();
    e.api("patch").rechazar(sinRed());
    await uno;
    assert.equal(e.estado.saveState.status, "error");
    assert.equal(e.estado.saveState.message, "No se pudo contactar el servidor. Revise su conexión e inténtelo de nuevo.");
    assert.deepEqual(e.borrador, []);
    assert.equal(e.ocupado(), false);
    const dos = e.guardar();
    assert.deepEqual(e.nombres(), ["patch", "patch"]);
    e.api("patch").resolver(pieza());
    await dos;
    assert.equal(e.estado.saveState.status, "success");
  });

  test("sin red al despublicar: se dice, la pieza sigue publicada y se suelta el candado", async () => {
    const e = editor();
    const uno = e.despublicar();
    e.api("despublicar").rechazar(sinRed());
    await uno;
    assert.equal(e.estado.actionState.status, "error");
    assert.equal(e.estado.form.status, "published");
    assert.equal(e.ocupado(), false);
    assert.equal(e.enMarcha.current, false);
  });

  test("sin red al crear: no se navega y se reintenta con la misma clave", async () => {
    const e = editor({ isCreate: true, inicial: form() });
    const uno = e.guardar();
    e.api("crear").rechazar(sinRed());
    await uno;
    assert.equal(e.estado.saveState.status, "error");
    assert.equal(e.navegado, null);
    const dos = e.guardar();
    assert.deepEqual(e.llamadas.map((l) => l.args[1]), ["clave-1", "clave-1"]);
    e.api("crear").resolver({ id: 42 });
    await dos;
  });
});

describe("la respuesta, campo a campo (fusionarRespuesta)", () => {
  const enviado = form({ title: "Antes", slug: "Mi Pieza", topic_ids: [1] });
  const recibido = form({ title: "Antes", slug: "mi-pieza", topic_ids: [1], status: "scheduled" });

  test("lo que no se tocó desde que se mandó, como dice el servidor", () => {
    const f = fusionarRespuesta({ actual: enviado, enviado, recibido });
    assert.deepEqual(f, recibido);
  });

  test("lo que se tocó mientras tanto, como lo dejó quien escribe", () => {
    const actual = { ...enviado, slug: "Mi Pieza 2", topic_ids: [1, 2] };
    const f = fusionarRespuesta({ actual, enviado, recibido });
    assert.equal(f.slug, "Mi Pieza 2");
    assert.deepEqual(f.topic_ids, [1, 2]);
    assert.equal(f.status, "scheduled");
  });

  test("escribir y deshacer hasta lo que se mandó cuenta como no tocado", () => {
    const actual = { ...enviado, title: "Antes" };
    assert.equal(fusionarRespuesta({ actual, enviado, recibido }).title, "Antes");
    assert.equal(fusionarRespuesta({ actual: { ...enviado }, enviado, recibido }).slug, "mi-pieza");
  });
});

describe("lo que se escribe mientras guarda no se pierde", () => {
  test("se escribe el título mientras va el PATCH: se queda, sigue «sin guardar» y la copia local no se borra", async () => {
    const e = editor();
    const guardando = e.guardar();
    e.escribir({ title: "Titular con más" });
    e.api("patch").resolver(pieza());
    await guardando;
    assert.equal(e.estado.form.title, "Titular con más");
    assert.equal(e.estado.base.title, "Titular");
    assert.equal(e.sinGuardar(), true);
    assert.deepEqual(e.borrador, ["conservar"]);
    assert.equal(e.estado.saveState.status, "success");
  });

  test("sin escribir nada: lo del servidor, nada sin guardar, y la copia local se limpia", async () => {
    const e = editor();
    const guardando = e.guardar();
    e.api("patch").resolver(pieza());
    await guardando;
    assert.equal(e.sinGuardar(), false);
    assert.deepEqual(e.borrador, ["limpiar"]);
  });

  test("el servidor normaliza el slug y nadie lo tocó: se ve el suyo", async () => {
    const e = editor({ inicial: form({ status: "draft", slug: "Mi Pieza" }) });
    const guardando = e.guardar();
    e.api("patch").resolver(pieza({ status: "draft", slug: "mi-pieza" }));
    await guardando;
    assert.equal(e.estado.form.slug, "mi-pieza");
    assert.equal(e.sinGuardar(), false);
    assert.deepEqual(e.borrador, ["limpiar"]);
  });

  test("el servidor normaliza el slug pero quien escribe lo cambió mientras: se queda el suyo", async () => {
    const e = editor({ inicial: form({ status: "draft", slug: "Mi Pieza" }) });
    const guardando = e.guardar();
    e.escribir({ slug: "otra-pieza" });
    e.api("patch").resolver(pieza({ status: "draft", slug: "mi-pieza" }));
    await guardando;
    assert.equal(e.estado.form.slug, "otra-pieza");
    assert.equal(e.sinGuardar(), true);
    assert.deepEqual(e.borrador, ["conservar"]);
  });

  test("el cuerpo saneado por el servidor: se ve si no se tocó; si se siguió escribiendo, se queda lo escrito", async () => {
    const sucio = "<p>Hola</p><script>x()</script>";
    const limpio = "<p>Hola</p>";
    const a = editor({ inicial: form({ content: sucio }) });
    const uno = a.guardar();
    a.api("patch").resolver(pieza({ content: limpio }));
    await uno;
    assert.equal(a.estado.form.content, limpio);
    assert.equal(a.sinGuardar(), false);

    const b = editor({ inicial: form({ content: sucio }) });
    const dos = b.guardar();
    b.escribir({ content: "<p>Hola, y sigo</p>" });
    b.api("patch").resolver(pieza({ content: limpio }));
    await dos;
    assert.equal(b.estado.form.content, "<p>Hola, y sigo</p>");
    assert.equal(b.estado.base.content, limpio);
    assert.equal(b.sinGuardar(), true);
  });

  test("la fecha de publicación la pone el servidor, aunque se escriba otra cosa a la vez", async () => {
    const e = editor({ inicial: form({ status: "published", published_at: "" }) });
    const guardando = e.guardar();
    e.escribir({ excerpt: "Un resumen" });
    e.api("patch").resolver(pieza({ status: "published", published_at: "2026-11-19T15:45:00Z" }));
    await guardando;
    assert.equal(e.estado.form.status, "published");
    assert.equal(e.estado.form.published_at, "2026-11-19T11:45");
    assert.equal(e.estado.form.excerpt, "Un resumen");
    assert.equal(e.estado.base.excerpt, "");
  });

  test("un adjunto cambiado mientras guarda se queda, con su ficha; el que no, el del servidor", async () => {
    const e = editor({ inicial: form({ image_asset_id: 1, document_asset_id: 5 }) });
    e.estado.assets = { ...e.estado.assets, image: { id: 1 }, document: { id: 5 } };
    const guardando = e.guardar();
    // Como `setAsset` del editor: el id en el formulario y la ficha en `assets`.
    e.escribir({ image_asset_id: 2 });
    e.estado.assets = { ...e.estado.assets, image: { id: 2 } };
    e.api("patch").resolver(pieza({ image_asset_id: 1, image_asset: { id: 1 }, document_asset_id: 5, document_asset: { id: 5, label: "Informe" } }));
    await guardando;
    assert.equal(e.estado.form.image_asset_id, 2);
    assert.deepEqual(e.estado.assets.image, { id: 2 });
    assert.deepEqual(e.estado.assets.document, { id: 5, label: "Informe" });
    assert.equal(e.sinGuardar(), true);
  });

  test("despublicar mientras se escribe: el estado del servidor y lo escrito, los dos", async () => {
    const e = editor();
    const despublicando = e.despublicar();
    e.escribir({ title: "Titular corregido" });
    e.api("despublicar").resolver(pieza({ status: "draft" }));
    await despublicando;
    assert.equal(e.estado.form.status, "draft");
    assert.equal(e.estado.form.title, "Titular corregido");
    assert.equal(e.sinGuardar(), true);
    assert.deepEqual(e.borrador, ["conservar"]);
  });

  test("despublicar con cambios sin guardar de antes: no se los lleva (despublicar no los manda)", async () => {
    const e = editor();
    e.escribir({ excerpt: "Sin guardar todavía" });
    const despublicando = e.despublicar();
    e.api("despublicar").resolver(pieza({ status: "draft" }));
    await despublicando;
    assert.equal(e.estado.form.excerpt, "Sin guardar todavía");
    assert.equal(e.estado.form.status, "draft");
    assert.equal(e.sinGuardar(), true);
  });

  test("guardar y publicar un borrador mientras se escribe: publicada, y lo nuevo sin guardar", async () => {
    const e = editor({ inicial: form({ status: "draft" }) });
    const publicando = e.publicar();
    e.escribir({ title: "Titular, segunda vuelta" });
    e.api("publicar").resolver(pieza({ status: "published" }));
    await publicando;
    assert.equal(e.estado.form.status, "published");
    assert.equal(e.estado.form.title, "Titular, segunda vuelta");
    assert.equal(e.sinGuardar(), true);
  });

  test("sin red tras escribir mientras guardaba: no se toca nada de lo escrito ni la copia", async () => {
    const e = editor();
    const guardando = e.guardar();
    e.escribir({ title: "Titular con más" });
    e.api("patch").rechazar(sinRed());
    await guardando;
    assert.equal(e.estado.form.title, "Titular con más");
    assert.deepEqual(e.borrador, []);
    assert.equal(e.sinGuardar(), true);
  });
});
