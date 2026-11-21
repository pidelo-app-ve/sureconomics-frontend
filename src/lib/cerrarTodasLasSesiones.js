/**
 * «Cerrar sesión en todos los aparatos»: lo que pasa al confirmar, igual en el panel
 * (`AdminMiPerfil`) y en la cuenta del lector (`CuentaPerfil`).
 *
 * El servidor (`POST /auth/logout-all` o `/user-auth/logout-all`) sube la versión de
 * sesión de la cuenta y todos sus tokens dejan de valer, también los de este aparato. Por
 * eso, si dice que sí, aquí se borra la sesión guardada y se lleva a entrar.
 *
 * - **Un 401** quiere decir que la sesión de aquí ya no valía (caducó, o se cerró desde
 *   otro aparato), y entonces el servidor **no** cerró las demás: con un token que no vale
 *   no se puede. Se cierra la de aquí igual (ya no sirve) y se lleva a entrar con el
 *   resultado `"caducada"`, para que la página de entrar diga que hay que entrar y
 *   repetirlo (`cuenta.entrar.sesionCaducada`).
 * - **Cualquier otro fallo** (sin red, el tope de peticiones, un 500) no se sabe si llegó:
 *   la sesión de aquí se queda como estaba y el error sube, para que la página lo diga
 *   y se pueda volver a intentar. Cerrar aquí sin saberlo haría creer a la persona que
 *   las demás se cerraron.
 */

/** `fetch` falla sin respuesta (sin red, el servidor no contesta): no hay `status`. */
export const esFalloDeRed = (err) => err?.status === undefined || err?.status === 0;

/** Lo que llega a `irAEntrar`: se cerraron todas, o la de aquí ya había caducado. */
export const TODAS = "todas";
export const CADUCADA = "caducada";

/**
 * @param {{
 *   pedir: () => Promise<unknown>,
 *   cerrarLocal: () => Promise<void> | void,
 *   irAEntrar: (resultado: "todas" | "caducada") => void,
 * }} pasos
 * @returns {Promise<"todas" | "caducada">}
 */
export const cerrarTodasLasSesiones = async ({ pedir, cerrarLocal, irAEntrar }) => {
  let resultado = TODAS;
  try {
    await pedir();
  } catch (err) {
    if (err?.status !== 401) throw err;
    resultado = CADUCADA;
  }
  await cerrarLocal();
  irAEntrar(resultado);
  return resultado;
};

/**
 * El estado de la navegación a «Entrar»: con la sesión caducada, la página lo avisa.
 * @param {"todas" | "caducada"} resultado
 */
export const estadoAlEntrar = (resultado) => (resultado === CADUCADA ? { sesionCaducada: true } : undefined);

/**
 * Qué decir si falló, con los textos de quien llama (el panel no está traducido; la
 * cuenta sí).
 *
 * @param {unknown} err
 * @param {{ red: string, demasiadas: string, otro: string }} textos
 */
export const mensajeDeFallo = (err, textos) => {
  if (esFalloDeRed(err)) return textos.red;
  if (err?.status === 429) return textos.demasiadas;
  return textos.otro;
};
