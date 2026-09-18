import { useCallback, useEffect, useRef, useState } from "react";

/**
 * «Guardado ✓», y que se apague solo.
 *
 * Los dos paneles prometen en su cabecera que «los cambios se guardan al momento» y en
 * pantalla no pasaba nada: se pulsa Guardar, el botón se apaga medio segundo y vuelve.
 * Quien no está seguro vuelve a pulsar, o recarga para comprobar — las dos cosas son
 * trabajo que la interfaz está creando por no decir una palabra.
 *
 * ## Por qué un temporizador y no un aviso permanente
 *
 * Un «Guardado» que se queda puesto deja de significar nada a los diez segundos: no se
 * sabe si es de este cambio o del anterior. Desaparecer es parte del mensaje.
 *
 * El temporizador se limpia al desmontar y también antes de cada aviso nuevo. Sin lo
 * segundo, guardar dos veces seguidas deja dos cuentas atrás corriendo y la primera
 * apaga el aviso de la segunda — el caso clásico de «a veces desaparece enseguida».
 */
export const useConfirmacionDeGuardado = (ms = 2600) => {
  const [guardado, setGuardado] = useState(false);
  const reloj = useRef(null);

  const limpiar = useCallback(() => {
    if (reloj.current) {
      clearTimeout(reloj.current);
      reloj.current = null;
    }
  }, []);

  useEffect(() => limpiar, [limpiar]);

  const confirmar = useCallback(() => {
    limpiar();
    setGuardado(true);
    reloj.current = setTimeout(() => {
      setGuardado(false);
      reloj.current = null;
    }, ms);
  }, [limpiar, ms]);

  return { guardado, confirmar };
};
