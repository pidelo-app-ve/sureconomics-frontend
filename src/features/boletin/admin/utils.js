/**
 * Lo de un número del boletín que no es React ni red: sus estados, el correo de la
 * prueba que se recuerda en este equipo y cómo se escriben sus fechas.
 */
export const ESTADOS = {
  draft: { texto: "Borrador", tono: "borrador" },
  ready: { texto: "Activo", tono: "listo" },
  sending: { texto: "Enviándose", tono: "enviando" },
  sent: { texto: "Enviado", tono: "enviado" },
};

const CLAVE_PRUEBA = "se-boletin-destino-prueba";

export const leerDestino = () => {
  try {
    return window.localStorage.getItem(CLAVE_PRUEBA) ?? "";
  } catch {
    return "";
  }
};

export const guardarDestino = (valor) => {
  try {
    window.localStorage.setItem(CLAVE_PRUEBA, valor);
  } catch {
    /* sin almacenamiento: se vuelve a escribir la próxima vez */
  }
};

/** «lunes, 28 de septiembre». La fecha llega como `2026-09-28`, sin hora ni huso. */
export const lunesLargo = (iso) => {
  if (!iso) return "";
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

/** Hoy como `2026-11-23`, en la hora de este equipo, para compararlo con `send_on`. */
export const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const fecha = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })
    : "";
