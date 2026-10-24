/**
 * Si el lector pidió menos movimiento en su sistema (`prefers-reduced-motion`).
 *
 * Lo miran las piezas que se mueven solas -- la tarjeta de Última hora, la apertura
 * que rota, el reloj -- para quedarse quietas y pintar la versión estática.
 */
export const prefiereQuieto = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * El compás de todo lo que cambia solo en la primera pantalla: la apertura, Última hora
 * y el reloj. Con compases distintos (eran 4, 5 y 8 s) la cabecera titilaba. La barra
 * de progreso de Última hora (`se-uh-avance` en titulares.css) dura lo mismo.
 */
export const ROTACION_MS = 8000;
