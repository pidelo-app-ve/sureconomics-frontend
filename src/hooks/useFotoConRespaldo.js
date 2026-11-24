import { useState } from "react";

/**
 * Los atributos de una `<img>` con tallas (`{ src, srcSet, sizes }`) y su plan B: si la
 * talla elegida no carga (un 404 porque el servidor no la generó, un corte de red), la
 * `<img>` se queda solo con `src`, la original, y el navegador la pide. Como hace
 * `CardMedia` con las tallas pequeñas.
 *
 * Una sola vez por foto: ya sin tallas no hay `onError`, así que si la original tampoco
 * carga no hay bucle. Lo que se recuerda es qué `srcSet` falló, no un sí o un no: si la
 * misma `<img>` pasa a otra foto (otra edición, otra pieza), esa vuelve a probar sus tallas.
 *
 * Sin `srcSet` devuelve solo `src`, tal cual.
 */
export const useFotoConRespaldo = ({ src, srcSet, sizes }) => {
  const [fallida, setFallida] = useState(null);
  if (!srcSet || fallida === srcSet) return { src };
  return { src, srcSet, sizes, onError: () => setFallida(srcSet) };
};
