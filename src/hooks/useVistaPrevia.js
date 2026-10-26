import { useEffect, useState } from "react";
import { EVENTO_CONSENTIMIENTO, consentimiento } from "../lib/analitica";

/** Una consulta de medios, o nada donde no hay ventana (pruebas). */
export const consulta = (q) => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(q) : null);

/**
 * Si este lector puede ver videos que arrancan solos (mudos): la fila «En la calle» y la
 * apertura con un short. Hace falta todo:
 *  - que **aceptara las cookies**: el reproductor de YouTube guarda datos al arrancar, y
 *    sin ese sí las portadas se quedan quietas (son copias nuestras);
 *  - que no pidiera «movimiento reducido»;
 *  - que no tenga el ahorro de datos encendido.
 * Cambia en vivo si el lector acepta las cookies o cambia la preferencia del sistema.
 */
export const usePuedePrevisualizar = () => {
  const [acepto, setAcepto] = useState(() => consentimiento() === "si");
  const [quieto, setQuieto] = useState(() => Boolean(consulta("(prefers-reduced-motion: reduce)")?.matches));
  useEffect(() => {
    const mirar = () => setAcepto(consentimiento() === "si");
    window.addEventListener(EVENTO_CONSENTIMIENTO, mirar);
    const mq = consulta("(prefers-reduced-motion: reduce)");
    const alCambiar = () => setQuieto(Boolean(mq?.matches));
    mq?.addEventListener?.("change", alCambiar);
    return () => {
      window.removeEventListener(EVENTO_CONSENTIMIENTO, mirar);
      mq?.removeEventListener?.("change", alCambiar);
    };
  }, []);
  const ahorro = typeof navigator !== "undefined" && navigator.connection?.saveData === true;
  return acepto && !quieto && !ahorro;
};
