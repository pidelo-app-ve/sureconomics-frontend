/**
 * Si el lector pidió menos movimiento en su sistema (`prefers-reduced-motion`).
 *
 * Lo mira lo que rota solo con `hooks/useRotacion.js` -- la apertura de la portada y los
 * huecos de anuncios del mapa del sitio, en el panel -- para quedarse quieto y pintar la
 * versión estática.
 */
export const prefiereQuieto = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * El compás de todo lo que cambia solo en la primera pantalla: la apertura y el reloj.
 * Con compases distintos (eran 4, 5 y 8 s) la cabecera titilaba.
 */
export const ROTACION_MS = 8000;
