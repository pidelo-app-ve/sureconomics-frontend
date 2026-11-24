import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lo que cuenta una subida que prepara el archivo antes de mandarlo (convertir una imagen,
 * `aligerarImagen.js`): el aviso mientras trabaja, la nota que queda al acabar y la señal
 * para cancelarla. Lo usan el selector de archivo (`AssetField`) y la ventana de la foto
 * del cuerpo (`cuerpo/DialogoDeImagen.jsx`).
 *
 * - `empezar()` corta la subida anterior, borra aviso y nota, y devuelve `{ opciones,
 *   acabar }`: `opciones` (`onAviso`, `onNota`, `signal`) es lo que se le pasa a quien
 *   sube; `acabar()` quita el aviso y deja la nota.
 * - Lo que llegue de una subida que ya no es la de ahora no se pinta.
 * - `olvidar()` corta la que vaya y borra aviso y nota (quitar el archivo, elegir otro,
 *   cerrar la ventana).
 * - Si el componente desaparece a mitad, se corta: no se sube nada que ya nadie va a usar.
 */
export const useAvisoDeSubida = () => {
  const [aviso, setAviso] = useState("");
  const [nota, setNota] = useState("");
  const actual = useRef(null);

  const cortar = useCallback(() => {
    actual.current?.abort();
    actual.current = null;
  }, []);
  useEffect(() => cortar, [cortar]);

  const olvidar = useCallback(() => {
    cortar();
    setAviso("");
    setNota("");
  }, [cortar]);

  const empezar = useCallback(() => {
    olvidar();
    const control = new AbortController();
    actual.current = control;
    const vigente = () => actual.current === control;
    return {
      opciones: {
        onAviso: (texto) => vigente() && setAviso(texto),
        onNota: (texto) => vigente() && setNota(texto),
        signal: control.signal,
      },
      acabar: () => {
        if (!vigente()) return;
        actual.current = null;
        setAviso("");
      },
    };
  }, [olvidar]);

  return { aviso, nota, empezar, olvidar };
};
