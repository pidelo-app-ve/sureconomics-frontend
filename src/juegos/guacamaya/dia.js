/**
 * El día del juego: la fecha en Caracas (UTC-4, sin horario de verano). El vuelo cambia
 * a la medianoche de Caracas para todos, juegue desde donde juegue.
 *
 * Aparte del motor a propósito: el banner de la portada solo necesita saber qué día es
 * para enseñar la racha, y importarlo del motor metía el juego entero (unos 25 KB) en lo
 * que descarga cualquier lector al entrar.
 */
export const diaDeCaracas = (ahora = new Date()) =>
  new Date(ahora.getTime() - 4 * 3600 * 1000).toISOString().slice(0, 10);
