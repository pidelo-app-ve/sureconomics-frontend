import { useEffect, useState } from "react";
import { getCanal } from "../services/publicContentService";

/**
 * El canal de YouTube, pedido una sola vez por visita y compartido: «En la calle» (la
 * fila de shorts) y «Nuestro canal» (la ventana del último video) leen lo mismo, y no
 * tiene sentido pedirlo dos veces ni volver a pedirlo al cambiar de página. Lo nuevo
 * llega como mucho una vez por hora, así que lo de esta visita vale para toda ella.
 *
 * `null` mientras llega; después `{ canal, shorts, largos }` (canal nulo si no hay).
 *
 * **Si falta un tipo, cada sección usa el otro.** Con un canal que solo tiene shorts,
 * «Nuestro canal» enseña el último short (vertical) en vez de desaparecer; y al revés,
 * sin shorts, «En la calle» enseña los videos largos. En cuanto lleguen videos del tipo
 * que falta, cada uno vuelve a su sitio solo. Cada video lleva su `tipo` para que la
 * sección sepa cómo dibujarlo.
 */
let pedido = null;

const conTipo = (lista, tipo) => (lista ?? []).map((v) => ({ ...v, tipo }));

export const repartir = (d) => {
  if (!d?.canal) return d;
  const shorts = conTipo(d.shorts, "short");
  const largos = conTipo(d.largos, "largo");
  return { ...d, shorts: shorts.length ? shorts : largos, largos: largos.length ? largos : shorts };
};

export const useCanal = () => {
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    let vivo = true;
    pedido = pedido ?? getCanal().then(repartir);
    pedido.then((d) => {
      if (vivo) setDatos(d);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return datos;
};
