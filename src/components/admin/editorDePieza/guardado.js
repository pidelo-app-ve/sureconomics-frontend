/**
 * Lo que decide el editor de piezas (`pages/admin/AdminPostEditor.jsx`) al guardar, sin
 * React: si hay cambios, adónde se va tras crear, qué se le dice a quien escribe y bajo
 * qué clave se guarda la copia en este equipo. También los manejadores de guardar,
 * publicar/despublicar y eliminar, con lo que usan inyectado (`guardarPieza`,
 * `ejecutarAccion`, `eliminarPieza`). Las pruebas, en `guardado.test.mjs`.
 */
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { comparable, fechaDeCaracas, formToPayload, hastaDeCaracas, isoToDateTimeLocal, postToForm } from "./formulario";

/**
 * Si lo que hay en el formulario es distinto de lo último que se cargó o guardó. Sin
 * `base` (todavía no cargó nada) no hay cambios que perder. Compara con `comparable`:
 * un `<p></p>` del editor de texto no cuenta como cambio.
 */
export const hayCambios = (form, base) => base !== null && base !== undefined && comparable(form) !== comparable(base);

const mismoValor = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Lo que vuelve del servidor tras guardar (o publicar…), aplicado sobre el formulario
 * de **ahora**, no sobre el que se mandó: quien escribe sigue escribiendo mientras la
 * petición va y viene, y antes `setForm(postToForm(updated))` se llevaba lo tecleado.
 *
 * Campo a campo: si sigue como se mandó (`enviado`), manda el servidor (`recibido`) --
 * el estado, la fecha, los adjuntos, y lo que normaliza: el slug, el HTML saneado del
 * cuerpo --; si se tocó mientras tanto, se queda lo de quien escribe.
 *
 * Los campos que solo tienen sentido juntos van en grupo (`GRUPOS_DEL_FORMULARIO`): si
 * se tocó cualquiera, se queda el grupo entero de quien escribe. Si no, mezclar
 * dejaría, p. ej., «programada» con la fecha que puso el servidor al publicar.
 */
const GRUPOS_DEL_FORMULARIO = [
  ["status", "published_at"],
  ["portada", "portada_durante", "portada_hasta"],
];
export const fusionarRespuesta = ({ actual, enviado, recibido }) => {
  const grupoDe = (campo) => GRUPOS_DEL_FORMULARIO.find((g) => g.includes(campo)) ?? [campo];
  const fusion = { ...actual };
  for (const campo of Object.keys(recibido)) {
    const sinTocar = grupoDe(campo).every((c) => mismoValor(actual?.[c], enviado?.[c]));
    if (sinTocar) fusion[campo] = recibido[campo];
  }
  return fusion;
};

/**
 * Pone en el editor la pieza que devolvió el servidor. La base (lo guardado) pasa a ser
 * lo que dice el servidor; el formulario, la fusión de arriba. Si quedó algo escrito
 * mientras tanto, sigue «sin guardar» y la copia en este equipo se conserva (antes se
 * borraba); si no, se limpia como siempre. `d.formActual` es un ref al formulario del
 * último pintado: el de `d.form` es el de cuando se pulsó. `enviado` es aquello sobre
 * lo que responde el servidor: lo que se mandó o, si no se mandó el formulario
 * (despublicar), lo que ya estaba guardado.
 */
const aplicarRespuesta = (updated, d, enviado = d.form) => {
  const recibido = postToForm(updated);
  d.setForm((prev) => fusionarRespuesta({ actual: prev, enviado, recibido }));
  d.setBase(recibido);
  d.setColaborador(updated.colaborador ?? null);
  const ahora = fusionarRespuesta({ actual: d.formActual.current, enviado, recibido });
  if (hayCambios(ahora, recibido)) d.borrador.conservar(ahora);
  else d.borrador.limpiar();
};

/** Si un campo del formulario cambió desde que se pulsó (lo que se mandó). */
const tocadoDesdeQueSeMando = (campo, d) => !mismoValor(d.formActual.current?.[campo], d.form[campo]);

/**
 * Adónde se va tras crear una pieza, y con qué aviso. `label` es el nombre del formato
 * (o «La pieza»): sin adjetivo con género, porque viene de datos.
 */
export const destinoTrasCrear = ({ created, publicar, label }) => {
  const newId = created?.id ?? null;
  if (newId != null) {
    return {
      ruta: `/admin/posts/${newId}`,
      opciones: {
        replace: true,
        state: publicar
          ? { flash: `${label}: publicada.`, recienPublicada: true }
          : { flash: `${label}: creada correctamente.` },
      },
    };
  }
  return {
    ruta: "/admin/posts",
    opciones: { replace: true, state: { flash: `${label}: creada correctamente.` } },
  };
};

/**
 * Lo que se dice tras guardar una pieza que ya existía, y el título del aviso.
 * Programada: que lo diga con la fecha, que es lo que hay que comprobar. Y fijada en
 * portada, igual: el «hasta» es lo que la redacción quiere ver.
 */
export const avisoTrasGuardar = (updated) => ({
  mensaje:
    updated?.status === "scheduled"
      ? `Programada: sale sola el ${fechaDeCaracas(isoToDateTimeLocal(updated.published_at))} (hora de Caracas).`
      : updated?.en_portada && updated?.destacada_hasta
        ? `Cambios guardados. Abre la portada hasta el ${hastaDeCaracas(updated.destacada_hasta)} (hora de Caracas).`
        : "Cambios guardados correctamente.",
  titulo: updated?.status === "scheduled" ? "Programada" : "Contenido guardado",
});

/**
 * El mensaje bajo el formulario: el de la última acción (publicar, despublicar…) y, si
 * no hay, el de guardar. Un error gana a un éxito de la misma fila.
 */
export const avisoDelFormulario = (actionState, saveState) => {
  for (const state of [actionState, saveState]) {
    if (state.status === "error") return { tone: "error", message: state.message };
    if (state.status === "success") return { tone: "success", message: state.message };
  }
  return null;
};

/**
 * La clave de la copia en este equipo (`useBorradorLocal`): una por pieza, y una por
 * formato para las nuevas. Nula mientras no haya cargado: no se guarda nada a medias.
 */
export const claveDelBorrador = ({ loadState, base, isCreate, postId }) =>
  loadState.status === "success" && base
    ? isCreate
      ? `pieza-nueva-${base.format || "sin-formato"}`
      : `pieza-${postId}`
    : null;

/**
 * Si el editor está a mitad de algo: guardando, publicando, despublicando, eliminando,
 * cambiando la firma del colaborador o con una pregunta abierta (eliminar, quitar el
 * vínculo: `preguntando`). Con esto se apagan a la vez **todos** los botones de acción
 * y los atajos de teclado. Antes cada botón miraba solo lo suyo, y con una pieza
 * publicada se podía
 * pulsar «Guardar cambios» y, mientras tanto, «Despublicar»: el PATCH manda siempre
 * `status`, así que si llegaba el último la pieza volvía a quedar publicada aunque el
 * aviso dijera «Se despublicó».
 */
export const estaOcupado = ({
  saveState,
  actionState,
  eliminando = false,
  colaboradorOcupado = false,
  preguntando = false,
}) =>
  saveState?.status === "loading" ||
  actionState?.status === "loading" ||
  Boolean(eliminando) ||
  Boolean(colaboradorOcupado) ||
  Boolean(preguntando);

/**
 * Una acción a la vez. `enMarcha` es un ref (`{ current }`) que comparten las
 * acciones: los botones se apagan con `estaOcupado`, pero eso llega en el siguiente
 * pintado, y un doble clic o un atajo podían colarse antes. Con el candado, lo que
 * llega mientras hay algo en marcha no se hace, pero se dice (`d.toastError`): si el
 * candado se quedara tomado por un fallo, los botones no callarían sin más.
 */
export const conCandado = async (d, fn) => {
  if (d.enMarcha.current) {
    d.toastError("Hay otra acción en marcha. Espere a que termine.", "Un momento");
    return;
  }
  d.enMarcha.current = true;
  try {
    await fn();
  } finally {
    d.enMarcha.current = false;
  }
};

/**
 * Si la pieza abierta ya es otra que la de la petición. El editor sigue montado al pasar
 * de una pieza a otra (las dos rutas pintan el mismo componente), y la respuesta que
 * llega tarde de la anterior no se pone en el formulario de la nueva. `d.piezaAbierta`
 * es un ref al id del último pintado; `d.numericPostId`, el de cuando se pulsó.
 */
const esOtraPieza = (d) => d.piezaAbierta.current !== d.numericPostId;
const NADA = { status: "idle", message: "" };

/**
 * «Guardar» (y, al crear, «Publicar»: `publicar` hace que la pieza nazca publicada).
 * Lo que usa llega en `d`: el formulario, los `set…` del editor, la API, `borrador`
 * (`useBorradorLocal`), `navigate`, los avisos y `enMarcha`.
 */
export const guardarPieza = ({ publicar = false } = {}, d) =>
  conCandado(d, async () => {
    d.setSaveState({ status: "loading", message: "" });
    d.setActionState({ status: "idle", message: "", kind: "" });
    try {
      const payload = formToPayload(d.form, d.base);
      if (publicar) payload.status = "published";
      if (d.isCreate) {
        const created = await d.createAdminPost(payload, d.claveDeCreacion());
        d.saltarGuarda.current = true;
        d.borrador.borrar();
        // El editor sigue montado al pasar de «crear» a la pieza nueva (las dos rutas
        // pintan el mismo componente): sin esto se quedaba «Guardando…», y con
        // `estaOcupado`, todos los botones apagados.
        d.setSaveState({ status: "idle", message: "" });
        const { ruta, opciones } = destinoTrasCrear({ created, publicar, label: d.label });
        // La traducción en marcha sigue en la pieza nueva (ver `useTraduccionDePieza`).
        d.alCrear?.(created?.id ?? null);
        d.navigate(ruta, opciones);
        return;
      }
      const updated = await d.patchAdminPost(d.numericPostId, payload);
      if (esOtraPieza(d)) {
        d.setSaveState(NADA);
        return;
      }
      // El adjunto que se cambió mientras tanto se queda, con su ficha, igual que su id
      // en el formulario: si no, la vista previa enseñaría el de antes.
      const cambiados = {
        image: tocadoDesdeQueSeMando("image_asset_id", d),
        video: tocadoDesdeQueSeMando("video_asset_id", d),
        document: tocadoDesdeQueSeMando("document_asset_id", d),
        audio: tocadoDesdeQueSeMando("audio_asset_id", d),
      };
      aplicarRespuesta(updated, d);
      d.setAssets((prev) => ({
        ...prev,
        image: cambiados.image ? prev.image : updated.image_asset ?? null,
        video: cambiados.video ? prev.video : updated.video_asset ?? null,
        document: cambiados.document ? prev.document : updated.document_asset ?? null,
        audio: cambiados.audio ? prev.audio : updated.audio_asset ?? null,
      }));
      // Programada, con la fecha; fijada en portada, con el «hasta»: ver `avisoTrasGuardar`.
      const aviso = avisoTrasGuardar(updated);
      d.setSaveState({ status: "success", message: aviso.mensaje });
      d.toastSuccess(aviso.mensaje, aviso.titulo);
    } catch (err) {
      const message = adminErrorMessage(
        err,
        d.isCreate ? "No se pudo crear la pieza." : "No se pudieron guardar los cambios."
      );
      // Con otra pieza abierta, el aviso sí (lo de la anterior no se guardó), pero el
      // mensaje bajo el formulario no: sería de otra pieza.
      d.setSaveState(!d.isCreate && esOtraPieza(d) ? NADA : { status: "error", message });
      d.toastError(message, d.isCreate ? "No se pudo crear" : "No se pudo guardar");
    }
  });

/**
 * Publicar, despublicar: `fn(id)` hace la petición y devuelve la pieza. Con lo mismo
 * en `d` que `guardarPieza`, más `setRecienPublicada`. `enviado`: el formulario sobre el
 * que responde el servidor (ver `aplicarRespuesta`); por omisión, el de cuando se pulsó.
 */
export const ejecutarAccion = ({ kind, fn, successMessage, failureMessage, toastTitle, enviado }, d) => {
  if (d.isCreate) return Promise.resolve();
  return conCandado(d, async () => {
    d.setSaveState({ status: "idle", message: "" });
    d.setActionState({ status: "loading", message: "", kind });
    try {
      const updated = await fn(d.numericPostId);
      if (esOtraPieza(d)) {
        d.setActionState({ status: "idle", message: "", kind: "" });
        return;
      }
      aplicarRespuesta(updated, d, enviado ?? d.form);
      d.setActionState({ status: "success", message: successMessage, kind });
      d.setRecienPublicada(kind === "publish");
      d.toastSuccess(successMessage, toastTitle);
    } catch (err) {
      const message = adminErrorMessage(err, failureMessage);
      d.setActionState(esOtraPieza(d) ? { status: "idle", message: "", kind: "" } : { status: "error", message, kind });
      d.toastError(message, toastTitle);
    }
  });
};

/**
 * «Eliminar la pieza»: pregunta (`d.confirm` con `d.dialogo`) y borra. El candado se
 * toma desde que se abre la pregunta hasta que se cierra: con el diálogo abierto, un
 * Ctrl+S no lanza un guardado que se cruce con el borrado. Mientras pregunta,
 * `preguntando` apaga los botones y los atajos (sin eso, Ctrl+S daba con el candado y
 * salía «Hay otra acción en marcha», que no es lo que pasa); `eliminando`, mientras se
 * borra.
 */
export const eliminarPieza = (d) => {
  if (d.isCreate) return Promise.resolve();
  return conCandado(d, async () => {
    d.setActionState({ status: "idle", message: "", kind: "" });
    await preguntar(d, {
      ...d.dialogo,
      onConfirm: async () => {
        d.setEliminando(true);
        try {
          await d.deleteAdminPost(d.numericPostId);
        } finally {
          d.setEliminando(false);
        }
        d.saltarGuarda.current = true;
        d.navigate("/admin/posts", {
          replace: true,
          state: { flash: "Pieza eliminada correctamente." },
        });
      },
    });
  });
};

/**
 * Una pregunta del editor (`d.confirm`) con `preguntando` puesto mientras está abierta.
 * Se quita siempre: al responder sí, al responder no y si otra pregunta la pisa
 * (`useAdminConfirm` la resuelve entonces como «no»).
 */
const preguntar = async (d, opciones) => {
  d.setPreguntando(true);
  try {
    return await d.confirm(opciones);
  } finally {
    d.setPreguntando(false);
  }
};

/**
 * La firma del colaborador, ya en el servidor, en el editor. Responde sobre lo guardado
 * (`d.base`): lo escrito sin guardar se queda. Con `firmaNueva` («Usar su cuenta») los
 * dos campos de la firma responden sobre lo que había al pulsar: tiene que traer la
 * firma nueva aunque se hubiera tocado antes; si se toca mientras va la petición, se
 * queda. «Quitar el vínculo» no cambia la firma: la tocada a mano se queda. Con otra
 * pieza abierta no se aplica nada (devuelve `false`).
 */
const aplicarFirma = (post, d, { firmaNueva }) => {
  if (esOtraPieza(d)) return false;
  const guardado = d.base ?? d.form;
  const enviado = firmaNueva
    ? { ...guardado, byline: d.form.byline, byline_photo_asset_id: d.form.byline_photo_asset_id }
    : guardado;
  const fotoTocada = !mismoValor(d.formActual.current?.byline_photo_asset_id, enviado.byline_photo_asset_id);
  aplicarRespuesta(post, d, enviado);
  d.setAssets((prev) => ({ ...prev, bylinePhoto: fotoTocada ? prev.bylinePhoto : post.byline_photo ?? null }));
  return true;
};

/**
 * «Usar el nombre y la foto de su cuenta»: guarda al momento, como publicar, y por eso
 * va con el candado y cuenta como `colaboradorOcupado` (ver `estaOcupado`).
 */
export const usarFirmaDeLaCuenta = (d) =>
  conCandado(d, async () => {
    d.setColaboradorOcupado(true);
    d.setActionState({ status: "idle", message: "", kind: "" });
    try {
      if (!aplicarFirma(await d.usarFirmaDeSuCuenta(d.numericPostId), d, { firmaNueva: true })) return;
      d.setActionState({ status: "success", message: "Firma puesta al día con su cuenta.", kind: "colaborador" });
    } catch (err) {
      d.setActionState({ status: "error", message: err?.message || "No se pudo cambiar la firma.", kind: "colaborador" });
    } finally {
      d.setColaboradorOcupado(false);
    }
  });

/** «Quitar el vínculo con el lector»: pregunta (`d.dialogo`) con el candado, como eliminar. */
export const quitarVinculo = (d) =>
  conCandado(d, async () => {
    await preguntar(d, {
      ...d.dialogo,
      onConfirm: async () => {
        d.setColaboradorOcupado(true);
        try {
          aplicarFirma(await d.quitarVinculoConElLector(d.numericPostId), d, { firmaNueva: false });
        } finally {
          d.setColaboradorOcupado(false);
        }
      },
    });
  });
