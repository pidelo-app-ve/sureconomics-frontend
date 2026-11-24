/**
 * Qué ancho dice un `sizes` en una ventana dada y qué talla de un `srcset` elegiría el
 * navegador, para las pruebas que fijan los `sizes` de las fotos contra lo que mide su caja
 * en el CSS (`apertura.js`, `fotoDePieza.js`, `resumen.js`).
 *
 * Entiende lo que esos `sizes` usan y nada más: condiciones `(max-width: N px)`,
 * `(min-width: N px)`, `(max-height: N px)` y `(orientation: landscape|portrait)` unidas con
 * `and`, y valores `N px`, `N vw` o `calc(A vw - B px)`. Cualquier otra cosa lanza un error,
 * para que una prueba no pase por no haber entendido lo que mira.
 */

const condicionCumple = (condicion, { ancho, alto }) =>
  condicion.split(/\s+and\s+/).every((parte) => {
    const m = parte.trim().match(/^\((max-width|min-width|max-height|orientation):\s*([a-z]+|\d+px)\)$/);
    if (!m) throw new Error(`condición que no entiendo: ${parte}`);
    const [, que, valor] = m;
    if (que === "orientation") return valor === (ancho >= alto ? "landscape" : "portrait");
    const n = Number.parseInt(valor, 10);
    if (que === "max-width") return ancho <= n;
    if (que === "min-width") return ancho >= n;
    return alto <= n;
  });

const valorEnPx = (valor, { ancho }) => {
  const v = valor.trim();
  let m = v.match(/^(\d+(?:\.\d+)?)px$/);
  if (m) return Number(m[1]);
  m = v.match(/^(\d+(?:\.\d+)?)vw$/);
  if (m) return (Number(m[1]) * ancho) / 100;
  m = v.match(/^calc\((\d+(?:\.\d+)?)vw - (\d+(?:\.\d+)?)px\)$/);
  if (m) return (Number(m[1]) * ancho) / 100 - Number(m[2]);
  throw new Error(`valor que no entiendo: ${v}`);
};

/** El ancho en px CSS que `sizes` le da a la foto en una ventana de `ancho`×`alto`. */
export const anchoDeSizes = (sizes, ancho, alto = 900) => {
  const ventana = { ancho, alto };
  for (const entrada of sizes.split(/,\s*/)) {
    const m = entrada.trim().match(/^(\(.*\))\s+(\S+(?: - \S+)?)$/);
    if (!m) return valorEnPx(entrada, ventana);
    if (condicionCumple(m[1], ventana)) return valorEnPx(m[2], ventana);
  }
  throw new Error(`un sizes sin valor por omisión: ${sizes}`);
};

/**
 * La talla que pide el navegador: la menor que cubre el ancho por la densidad de la pantalla,
 * o la mayor si ninguna llega. Es lo que hacen Firefox y Safari; Chrome a veces se queda con
 * la de debajo si está cerca (media geométrica), nunca con una mayor.
 */
export const tallaElegida = (srcset, sizes, ancho, dpr, alto = 900) => {
  const necesita = anchoDeSizes(sizes, ancho, alto) * dpr;
  const tallas = srcset
    .split(/,\s*/)
    .map((c) => {
      const [url, w] = c.trim().split(/\s+/);
      return { url, w: Number.parseInt(w, 10) };
    })
    .sort((a, b) => a.w - b.w);
  return tallas.find((t) => t.w >= necesita) ?? tallas[tallas.length - 1];
};
