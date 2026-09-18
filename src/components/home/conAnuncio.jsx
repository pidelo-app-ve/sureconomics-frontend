import { cloneElement, isValidElement } from "react";

/**
 * Dónde entra la tarjeta de publicidad dentro de una rejilla de piezas.
 *
 * Iba al final, y al final de una rejilla de tres columnas significa «pegada al borde
 * derecho»: se lee como un apéndice que sobró, no como parte de la fila. El cliente
 * pidió que vaya en medio, y en medio de verdad — la columna central de la fila
 * central, no el punto medio de la lista, que no son lo mismo.
 *
 * Con seis noticias la diferencia se ve: el punto medio de la lista deja el anuncio
 * abriendo la segunda fila, otra vez contra un borde. El cálculo de aquí lo pone en el
 * hueco del centro de esa misma fila.
 *
 * ## Sobre las tres columnas
 *
 * `.se-artgrid` es `auto-fill` con un mínimo de 280 px, así que el número real de
 * columnas depende del ancho: tres en escritorio, dos en tableta, una en el móvil. El
 * cálculo asume tres porque es donde la colocación importa — en una sola columna
 * «centrado» y «a la derecha» son lo mismo, y el anuncio queda a mitad de la pila, que
 * es exactamente lo que se quiere. Ajustarlo por ancho exigiría medir el contenedor en
 * el cliente y repintar al redimensionar: mucha maquinaria para algo que ya cae bien.
 */
export const posicionDelAnuncio = (cuantas, columnas = 3) => {
  const total = cuantas + 1;
  const filas = Math.ceil(total / columnas);
  // `filas / 2` y no `(filas - 1) / 2`: con dos filas la segunda version daba la
  // primera, y el anuncio subia a la fila de arriba en cuanto el bloque pasaba de
  // siete piezas a seis. Con esta, tres filas siguen dando la de en medio y dos dan
  // la de abajo, que es donde estaba y donde se aprobo.
  const filaDelMedio = Math.floor(filas / 2);
  const centroDeLaFila = Math.floor((columnas - 1) / 2);
  // El tope evita que un bloque con menos piezas que columnas deje huecos delante.
  return Math.min(filaDelMedio * columnas + centroDeLaFila, cuantas);
};

/**
 * Intercala el anuncio entre las tarjetas ya pintadas.
 *
 * Recibe los nodos hechos y no las piezas: cada rejilla dibuja su tarjeta a su manera
 * —la de noticia abre por el lugar, la de artículo firma— y esta función no tiene por
 * qué saber de ninguna de las dos. Sin anuncio devuelve la lista intacta.
 *
 * ## El anuncio **ocupa** un sitio, no se añade
 *
 * Con seis noticias y un anuncio salían siete tarjetas: la rejilla crecía una fila y
 * el bloque ya no eran seis noticias. Ahora el anuncio se queda con el hueco de la
 * última, así que el bloque mide siempre lo mismo lo haya o no —seis celdas en
 * Noticias, tres en Artículos— y lo único que cambia es cuántas son piezas.
 *
 * Se descarta la última y no la del sitio donde entra: las rejillas vienen de más
 * reciente a más antigua, así que la que se cae es la más vieja del bloque, que es la
 * que menos duele.
 */
export const conAnuncio = (tarjetas, anuncio) => {
  if (!anuncio) return tarjetas;
  const visibles = tarjetas.slice(0, Math.max(0, tarjetas.length - 1));
  const i = posicionDelAnuncio(visibles.length);
  // Con su `key`: entra en un array junto a las tarjetas, y sin ella React avisa por
  // consola en cada render. Se pone aqui y no en quien lo pasa porque es aqui donde
  // el elemento se convierte en un elemento de lista.
  const conClave = isValidElement(anuncio)
    ? cloneElement(anuncio, { key: "anuncio" })
    : anuncio;
  return [...visibles.slice(0, i), conClave, ...visibles.slice(i)];
};
