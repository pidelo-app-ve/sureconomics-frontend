

const ESTADO = {
  vacio: { texto: "Sin contenido nuevo", clase: "se-res-adm-chip--vacio" },
  borrador: { texto: "Borrador", clase: "se-res-adm-chip--borrador" },
  retenido: { texto: "Retenida", clase: "se-res-adm-chip--retenido" },
  publicado: { texto: "Publicado", clase: "se-res-adm-chip--publicado" },
  retirado: { texto: "Retirada", clase: "se-res-adm-chip--vacio" },
};
const CANAL = {
  apagado: "sin configurar",
  pendiente: "pendiente",
  enviando: "enviando…",
  enviado: "enviado",
  fallo: "falló",
  borrando: "borrándolo del canal…",
  retirado: "retirado",
};
/** Cómo quedó cada canal en una edición retirada. */
const CANAL_RETIRADA = {
  telegram: {
    apagado: "sin configurar",
    pendiente: "borrándolo del canal…",
    enviando: "borrándolo del canal…",
    enviado: "borrándolo del canal…",
    borrando: "borrándolo del canal…",
    retirado: "retirado del canal",
    fallo: "no se pudo borrar",
  },
  whatsapp: {
    apagado: "sin configurar",
    // Retirada antes de salir, o tras un fallo: puede que saliera la foto (la ficha lo dice).
    retirado: "ya no se manda",
    enviando: "salió: hay que borrarlo a mano",
    enviado: "salió: hay que borrarlo a mano",
  },
};
export const canal = (r, nombre, estado) =>
  (r.estado === "retirado" ? CANAL_RETIRADA[nombre][estado] : null) ?? CANAL[estado] ?? estado;
export const MOMENTO = { manana: "Mañana", tarde: "Tarde", noche: "Noche" };

const zona = { timeZone: "America/Caracas" };
export const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("es-VE", { ...zona, hour: "2-digit", minute: "2-digit" }) : "—");
/** «17-nov 02:03 p. m.»: el día y la hora, en la de Caracas. */
export const cuando = (iso) => {
  if (!iso) return "—";
  const f = new Date(iso);
  const dia = f.toLocaleDateString("es-VE", { ...zona, day: "numeric" });
  const mes = f.toLocaleDateString("es-VE", { ...zona, month: "short" }).replace(".", "");
  return `${dia}-${mes} ${hora(iso)}`;
};
/** El chip de una edición: un borrador dice a qué hora sale solo o, si ya no va a salir, que no salió. */
export const chipDe = (r) => {
  // No salió y ya no sale: se le pasó la franja (el servidor lo dice con `caducada`).
  if (r.caducada) return { texto: "Caducada: ya pasó su hora, lo que llevaba entra en la siguiente", clase: "se-res-adm-chip--vacio" };
  if (r.estado !== "borrador") return ESTADO[r.estado] ?? { texto: r.estado, clase: "" };
  if (r.en_pausa) return { texto: "En pausa: el resumen está apagado", clase: "se-res-adm-chip--retenido" };
  if (r.sale_sola_a_las) return { texto: `Sale sola · ${hora(r.sale_sola_a_las)}`, clase: "se-res-adm-chip--borrador" };
  return { texto: r.pasa_a ? "No salió: pasó a la siguiente" : "No salió", clase: "se-res-adm-chip--vacio" };
};

/** «esta tarde»: como lo nombra el servidor (`momento`). */
export const MOMENTO_LARGO = { manana: "esta mañana", tarde: "esta tarde", noche: "esta noche" };

/**
 * El aviso tras encender el resumen, con lo que el servidor dice que hará en el minuto
 * (`al_encender`): «Sale ya: la edición de esta tarde.», «Se arma ahora la de esta noche:
 * sale a las 19:00.».
 */
export const queHaraAlEncender = (alEncender, ediciones) => {
  const salen = alEncender?.salen_ya ?? [];
  const seArma = alEncender?.se_arma ?? null;
  const partes = ["Resumen encendido."];
  if (salen.length) {
    partes.push(`Sale ya: ${enumerar(salen.map((s) => `la edición de ${s.momento ?? MOMENTO_LARGO[s.edicion] ?? s.edicion}`))}.`);
  }
  if (seArma) {
    const sale = ediciones.find((e) => e.clave === seArma.edicion)?.sale;
    partes.push(`Se arma ahora la de ${seArma.momento ?? MOMENTO_LARGO[seArma.edicion]}${sale ? `: sale a las ${sale} o, si esa hora ya pasó, unos minutos después de armarse` : ""}.`);
  }
  if (!salen.length && !seArma) partes.push("No sale nada ahora: la próxima edición sale a su hora.");
  return partes.join(" ");
};

/** Lo que cambió al guardar, con el nombre que le da la redacción. */
const CAMPO = { secciones: "los puntos", frase: "la frase", imagen_id: "la foto", cifras_manuales: "las cifras a mano" };
export const enumerar = (cosas) => (cosas.length > 1 ? `${cosas.slice(0, -1).join(", ")} y ${cosas[cosas.length - 1]}` : cosas[0] ?? "");

/** Una línea del historial de la edición: «retiró la edición: «motivo»». Sin el nombre. */
export const queHizo = (a) => {
  const d = a.datos || {};
  switch (a.accion) {
    case "armar":
      return `armó la edición${d.armado_con === "ia" ? " con la IA" : d.armado_con ? " por reglas" : ""}`;
    case "rehacer":
      return `rehízo la edición${d.armado_con === "ia" ? " con la IA" : d.armado_con ? " por reglas" : ""}`;
    case "editar": {
      const campos = (d.campos ?? []).map((c) => CAMPO[c]).filter(Boolean);
      return campos.length ? `cambió ${enumerar(campos)}` : "guardó cambios";
    }
    case "retener":
      return "la retuvo: no sale";
    case "soltar":
      return "dejó que saliera";
    case "retirar":
      return `${d.reintento ? "volvió a intentar borrarla de Telegram" : "retiró la edición"}${d.motivo ? `: «${d.motivo}»` : ""}`;
    case "whatsapp_reintentar":
      return "volvió a mandarla a WhatsApp";
    default:
      return a.accion;
  }
};

/**
 * Qué pasa en Telegram al retirarla. Solo se borra sola si se guardaron sus mensajes; una
 * que salió antes de guardarlos se borra a mano (el servidor lo marca al retirarla).
 */
const telegramAlRetirar = (t) => {
  if (t.estado === "apagado") return null;
  if (t.mensajes > 0) return "Se borra del canal de Telegram en el próximo minuto.";
  if (t.estado === "enviado") return "En Telegram salió sin que se guardaran sus mensajes: después tendrás que borrarlo a mano.";
  if (t.estado === "enviando") return "Lo que se estaba mandando a Telegram se borra al terminar de mandarse.";
  if (t.estado === "fallo") return "Si algo llegó a salir por Telegram, la ficha te dirá si hay que borrarlo a mano.";
  return "No sale por Telegram.";
};

/** Qué pasa en cada canal al retirar esta edición, para el diálogo. */
export const alRetirar = (r) => {
  const t = r.canales?.telegram ?? {};
  const w = r.canales?.whatsapp ?? {};
  return [
    "Deja de verse en la web enseguida: quien abra su enlace verá que se retiró.",
    telegramAlRetirar(t),
    w.estado === "apagado"
      ? null
      : ["enviando", "enviado"].includes(w.estado)
        ? "En WhatsApp ya salió (o al menos su foto) y desde aquí no se puede borrar: después tendrás que borrarlo a mano en el canal."
        : "No sale por WhatsApp.",
    "Lo que llevaba no vuelve a entrar solo en la siguiente edición.",
  ].filter(Boolean);
};
export const conVariacion = (c) =>
  typeof c.variacion === "number" && Math.abs(c.variacion) >= 0.005
    ? `${c.valor} (${c.variacion > 0 ? "+" : "−"}${Math.abs(c.variacion).toFixed(2).replace(".", ",")} %)`
    : c.valor;

/** Lo editable de un resumen, en la forma que se manda al guardar. */
export const editable = (r) => ({
  secciones: (r?.secciones ?? []).map((s) => ({
    clave: s.clave,
    puntos: s.puntos.map((p) => ({ id: p.id, linea: p.linea, linea_en: p.linea_en })),
  })),
  frase: r?.frase ?? "",
  cifras_manuales: (r?.cifras_manuales ?? []).map((c) => ({ etiqueta: c.etiqueta, valor: c.valor })),
  imagen_id: r?.imagen_id ?? null,
});

/** La foto de una pieza del mensaje, en la forma en que `AssetField` describe un adjunto. */
export const comoAdjunto = (f) => ({
  id: f.id, url: f.url, original_filename: f.titulo || f.alt || "Foto", width: f.ancho, height: f.alto, credit: f.credito,
});

/* —— el historial: sus filtros y lo que se pide (`GET /admin/resumen/ediciones`) —— */

/** Sin filtros: todas las ediciones, de 21 en 21 (una semana de tres). */
export const FILTROS_DEL_HISTORIAL = { estado: "", edicion: "", desde: "", hasta: "", fallo: "" };

/** Los estados que se pueden elegir (los de la base; «caducada» no es uno: es un borrador que no salió). */
export const ESTADOS_DEL_HISTORIAL = {
  publicado: "Publicadas",
  borrador: "Borradores",
  retenido: "Retenidas",
  vacio: "Sin contenido nuevo",
  retirado: "Retiradas",
};

/** «Solo con fallos de envío»: en qué canal. */
export const FALLOS_DE_ENVIO = { telegram: "En Telegram", whatsapp: "En WhatsApp" };

/** Si hay algún filtro puesto. */
export const hayFiltrosEnElHistorial = (f) => Object.values(f ?? {}).some(Boolean);

/**
 * Lo que se le pide al servidor: la página y solo los filtros puestos. Unas fechas al revés
 * («del 20 al 10») se dan la vuelta: es lo que quiso decir quien las puso.
 */
export const consultaDelHistorial = (f = FILTROS_DEL_HISTORIAL, pagina = 1) => {
  let { desde, hasta } = f;
  if (desde && hasta && desde > hasta) [desde, hasta] = [hasta, desde];
  return Object.fromEntries(Object.entries({ ...f, desde, hasta, pagina }).filter(([, v]) => v));
};
