/**
 * Lo que se le revisa a un mensaje de contacto antes de mandarlo, en `/contacto` y en
 * el contacto comercial de la portada. Los dos acaban en el mismo sitio (`POST /contact`,
 * que lo pasa a n8n y llega a info@), así que avisan de lo mismo y con las mismas
 * palabras.
 *
 * Comprobación mínima a propósito: la buena la hace el servidor, y una expresión
 * estricta aquí rechaza direcciones válidas raras y deja pasar las inventadas igual.
 * Lo que se quiere atajar es la errata, no validar el correo.
 *
 * Devuelve el aviso del campo o `null`. Un campo que no está en la lista (la empresa,
 * que es opcional) nunca falla.
 */
export const errorDeContacto = (clave, valor, t) => {
  const v = String(valor ?? "").trim();
  if (!v) {
    return (
      {
        name: t("paginas.contacto.errores.nombre"),
        email: t("paginas.contacto.errores.correo"),
        subject: t("paginas.contacto.errores.asunto"),
        message: t("paginas.contacto.errores.mensaje"),
      }[clave] ?? null
    );
  }
  if (clave === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    return t("paginas.contacto.errores.correoIncompleto");
  }
  if (clave === "message" && v.length < 10) return t("paginas.contacto.errores.mensajeCorto");
  return null;
};
