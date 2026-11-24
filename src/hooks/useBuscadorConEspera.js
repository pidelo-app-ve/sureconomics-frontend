import { useEffect, useRef, useState } from "react";
import { ESPERA_DEL_BUSCADOR_MS, limpiarBusqueda } from "../lib/listasDelPanel";

/**
 * El buscador de una lista del panel: espera a que se deje de escribir antes de pedir.
 *
 * Dos valores y no uno: `texto` es lo que se ve en la caja mientras se escribe, y
 * `pedido` lo que de verdad se le pide al servidor (lo guarda quien llama, con sus
 * filtros). Sin esa separación cada tecla sería una petición. Pasada la espera, si lo
 * escrito (sin espacios de más) no es lo pedido, llama a `alPedir(limpio)`: ahí quien
 * llama lo pone en sus filtros y vuelve a la página 1.
 *
 * Devuelve `[texto, setTexto]`. «Limpiar filtros» hace `setTexto("")` además de vaciar lo
 * pedido.
 */
export const useBuscadorConEspera = (pedido, alPedir, espera = ESPERA_DEL_BUSCADOR_MS) => {
  const [texto, setTexto] = useState(pedido ?? "");
  // La última `alPedir`: sin esto, una función nueva en cada pintada reiniciaría la espera.
  const pedir = useRef(alPedir);
  pedir.current = alPedir;

  useEffect(() => {
    const limpio = limpiarBusqueda(texto);
    if (limpio === (pedido ?? "")) return undefined;
    const reloj = setTimeout(() => pedir.current(limpio), espera);
    return () => clearTimeout(reloj);
  }, [texto, pedido, espera]);

  return [texto, setTexto];
};
