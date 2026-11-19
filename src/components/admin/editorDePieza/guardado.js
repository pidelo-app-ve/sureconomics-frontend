/**
 * Lo que decide el editor de piezas (`pages/admin/AdminPostEditor.jsx`) al guardar, sin
 * React: si hay cambios, adónde se va tras crear, qué se le dice a quien escribe y bajo
 * qué clave se guarda la copia en este equipo. Las pruebas, en `guardado.test.mjs`.
 */
import { comparable, fechaDeCaracas, hastaDeCaracas, isoToDateTimeLocal } from "./formulario";

/**
 * Si lo que hay en el formulario es distinto de lo último que se cargó o guardó. Sin
 * `base` (todavía no cargó nada) no hay cambios que perder. Compara con `comparable`:
 * un `<p></p>` del editor de texto no cuenta como cambio.
 */
export const hayCambios = (form, base) => base !== null && base !== undefined && comparable(form) !== comparable(base);

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
