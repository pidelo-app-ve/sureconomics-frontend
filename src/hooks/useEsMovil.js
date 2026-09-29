import { useEffect, useState } from "react";

/**
 * Si la pantalla es de teléfono. El mismo corte que la hoja (`max-width: 640px`), para
 * que el componente y el CSS nunca discrepen sobre en qué lado del corte se está.
 *
 * Escucha el cambio y no sólo lo mide al montar: girar el teléfono o estrechar la
 * ventana cambia de modo sin recargar.
 */
export const CONSULTA_MOVIL = "(max-width: 640px)";

const medir = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(CONSULTA_MOVIL).matches
    : false;

export const useEsMovil = () => {
  const [esMovil, setEsMovil] = useState(medir);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const consulta = window.matchMedia(CONSULTA_MOVIL);
    const alCambiar = () => setEsMovil(consulta.matches);
    alCambiar();
    consulta.addEventListener?.("change", alCambiar);
    return () => consulta.removeEventListener?.("change", alCambiar);
  }, []);

  return esMovil;
};

export default useEsMovil;
