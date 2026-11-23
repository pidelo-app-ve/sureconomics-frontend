/**
 * Piezas pequeñas de la publicidad, sin React ni red: cómo viajan los filtros de tema y
 * país en la dirección y el contador de recargas del lector. Prueba al lado:
 * `utils.test.mjs` (`npm run test:publicidad`).
 */

/**
 * Una lista de valores (tema, país) tal como viaja en la dirección: `a,b,c`, o `null`
 * si no hay nada que mandar.
 */
export const listaDeQuery = (valor) => {
  if (!valor) return null;
  // También un `Set`: la selección del lector en los listados viaja así
  // (`useContentFilter`), y con `[valor]` un Set se escribía `[object Object]` en la
  // dirección, así que el patrocinio por tema o país nunca coincidía.
  const lista = valor instanceof Set ? [...valor] : Array.isArray(valor) ? valor : [valor];
  const partes = lista.map((v) => String(v ?? "").trim()).filter(Boolean);
  return partes.length ? partes.join(",") : null;
};

/**
 * El contador de recargas de quien mira, para la escalera de publicidad.
 *
 * El servidor reparte los anuncios con una escalera que baja un peldaño por recarga (ver
 * la escalera en `app/domains/publicidad`, en el backend), y la recarga la cuenta el navegador:
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
