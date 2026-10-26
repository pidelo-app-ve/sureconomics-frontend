import { useEffect, useState } from "react";
import { getCanal } from "../services/publicContentService";

/**
 * El canal de YouTube, pedido una sola vez por visita y compartido: «En la calle» (la
 * fila de shorts) y «Nuestro canal» (la ventana del último video) leen lo mismo, y no
 * tiene sentido pedirlo dos veces ni volver a pedirlo al cambiar de página. Lo nuevo
 * llega como mucho una vez por hora, así que lo de esta visita vale para toda ella.
 *
 * `null` mientras llega; después `{ canal, shorts, largos }` (canal nulo si no hay).
 */
let pedido = null;

export const useCanal = () => {
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    let vivo = true;
    pedido = pedido ?? getCanal();
    pedido.then((d) => {
      if (vivo) setDatos(d);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return datos;
};
