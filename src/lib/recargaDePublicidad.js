/**
 * El contador de recargas de quien mira, para la escalera de publicidad.
 *
 * El servidor reparte los anuncios con una escalera que baja un peldaño por recarga (ver
 * `publicidad_service._escalera` en el backend), y la recarga la cuenta el navegador:
 * cada página que se abre suma una. Va en `localStorage` para que siga sumando entre
 * visitas; no identifica a nadie, es un número.
 *
 * Devuelve la recarga **actual** (la primera visita es la 0) y deja preparada la
 * siguiente. Sin almacenamiento (modo privado), siempre 0: el sitio funciona igual, solo
 * que ese lector ve siempre la primera escalera.
 */
const CLAVE = "sureconomics_pub_recarga";

export const siguienteRecarga = () => {
  try {
    const actual = Math.max(0, Number(window.localStorage.getItem(CLAVE)) || 0);
    window.localStorage.setItem(CLAVE, String(actual + 1));
    return actual;
  } catch {
    return 0;
  }
};
