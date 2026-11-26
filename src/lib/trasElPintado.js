/**
 * Hacer algo justo después de que el navegador pinte lo que ya cambió.
 *
 * Lo que mide Google como INP es lo que tarda la pantalla en responder a un toque: desde
 * el toque hasta el siguiente pintado. Todo lo que se hace dentro del toque (o en un efecto
 * que React corre en el mismo turno) retrasa ese pintado, aunque no tenga nada que ver con
 * lo que el lector ve cambiar: mover el foco obliga a maquetar la página entera, arrancar
 * la medición, quitar una clase de `<html>`... Con `trasElPintado` eso va después: primero
 * se ve la respuesta y luego se hace el resto.
 *
 * Cómo: `requestAnimationFrame` corre justo antes del siguiente pintado, y un `setTimeout`
 * desde ahí cae ya después de él. Con la pestaña oculta el navegador no pinta y
 * `requestAnimationFrame` no corre nunca: por eso hay también un reloj de reserva
 * (`RESERVA_MS`), para que lo pendiente (guardar una respuesta, por ejemplo) no se quede
 * sin hacer si el lector cambia de pestaña justo entonces. Lo que llegue primero; nunca
 * las dos. Un segundo y no menos: en un teléfono lento un fotograma puede tardar cientos de
 * milisegundos, y una reserva corta se adelantaría al pintado que se quiere esperar.
 *
 * Devuelve con qué cancelarlo (para la limpieza de un efecto). Sin importaciones, para
 * probarlo con `node` solo (`trasElPintado.test.mjs`).
 */

/** Lo más que espera si el navegador no pinta (pestaña oculta). */
export const RESERVA_MS = 1000;

export const trasElPintado = (hacer, ventana = globalThis.window) => {
  let hecho = false;
  let cuadro = null;
  let tras = null;
  let reserva = null;
  const una = () => {
    if (hecho) return;
    hecho = true;
    ventana?.cancelAnimationFrame?.(cuadro);
    clearTimeout(reserva);
    hacer();
  };
  if (typeof ventana?.requestAnimationFrame === "function") {
    cuadro = ventana.requestAnimationFrame(() => {
      tras = setTimeout(una, 0);
    });
  }
  reserva = setTimeout(una, RESERVA_MS);
  return () => {
    hecho = true;
    ventana?.cancelAnimationFrame?.(cuadro);
    clearTimeout(tras);
    clearTimeout(reserva);
  };
};
