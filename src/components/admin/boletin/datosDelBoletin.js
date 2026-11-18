

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

export const fecha = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })
    : "";
