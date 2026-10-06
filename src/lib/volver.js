/**
 * A dónde vuelve el lector después de entrar, registrarse o confirmar su correo.
 *
 * Llega de dos maneras: `?volver=/el-analista` en la dirección (un enlace desde fuera
 * de React Router, o que se puede copiar) o `state.from`, que es lo que ya pasaban los
 * comentarios y los marcadores. Se acepta **solo una ruta de este sitio**: empieza por
 * una barra y no por dos (`//otra-web.com` es otro dominio) ni por barra invertida. Sin
 * esto, `?volver=https://…` serviría para mandar a alguien a otra web tras entrar.
 */

const esRutaInterna = (ruta) =>
  typeof ruta === "string" && ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.startsWith("/\\");

/** La ruta de vuelta de esta pantalla, o `null` si no hay ninguna válida. */
export const leerVolver = (location) => {
  const deLaDireccion = new URLSearchParams(location?.search ?? "").get("volver");
  if (esRutaInterna(deLaDireccion)) return deLaDireccion;
  const delEstado = location?.state?.volver ?? location?.state?.from;
  return esRutaInterna(delEstado) ? delEstado : null;
};

/** `ruta` con `?volver=` puesto, para no perderlo al pasar de entrar a registrarse. */
export const conVolver = (ruta, volver) =>
  esRutaInterna(volver) ? `${ruta}?volver=${encodeURIComponent(volver)}` : ruta;
