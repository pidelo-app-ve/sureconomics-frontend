/**
 * Si el lector pidió menos movimiento en su sistema (`prefers-reduced-motion`).
 *
 * Lo miran las piezas que se mueven solas -- la tarjeta de Última hora, la apertura
 * que rota -- para quedarse quietas y pintar la versión estática. Una sola función
 * para que todas decidan igual.
 */
export const prefiereQuieto = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
