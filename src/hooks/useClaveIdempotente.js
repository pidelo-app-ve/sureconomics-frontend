import { useCallback, useRef } from "react";
import { nuevaClave } from "../lib/idempotencia";

/**
 * La clave de idempotencia de un formulario.
 *
 * `clave()` devuelve siempre la misma hasta que se llame a `renovar()`. Ese es todo el
 * asunto: si el envío falla y la persona vuelve a pulsar, la segunda petición lleva la
 * misma clave y el servidor devuelve la respuesta de la primera en vez de crear otra.
 * Se renueva solo cuando el envío cuaja, porque a partir de ahí lo que venga es una
 * cosa nueva y no un reintento.
 */
export const useClaveIdempotente = () => {
  const ref = useRef(null);

  const clave = useCallback(() => {
    if (!ref.current) ref.current = nuevaClave();
    return ref.current;
  }, []);

  const renovar = useCallback(() => {
    ref.current = null;
  }, []);

  return { clave, renovar };
};
