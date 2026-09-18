import { useEffect, useRef, useState } from "react";

import { reportarVisto } from "../../services/publicidadService";

/**
 * Qué pieza del ciclo se enseña ahora, y cuándo pasa a la siguiente.
 *
 * ## Solo cuenta lo que se ve
 *
 * La impresión se reporta cuando la pieza está **de verdad en pantalla**, no cuando el
 * servidor la mandó. Eso arregla dos cosas a la vez: que entregar tres piezas facturara
 * tres aunque el lector se fuera en la primera, y algo que ya pasaba antes de la
 * rotación —un anuncio al pie sumaba impresión aunque nadie bajara nunca hasta él—.
 *
 * ## No rota fuera de pantalla
 *
 * Un hueco que no se ve no gasta turnos. Sin esto, un lector que abre la pestaña y se
 * va a hacer otra cosa vuelve con el ciclo agotado y todas las piezas «vistas», que es
 * la misma factura inflada por otro camino.
 *
 * ## Se para al pasar por encima
 *
 * Quien acerca el ratón está mirando ese anuncio, y cambiárselo justo entonces es la
 * forma más rápida de que no llegue a leerlo. También al llegar con el teclado, que es
 * lo mismo para quien no usa ratón.
 *
 * ## Y con `prefers-reduced-motion` no rota en absoluto
 *
 * Se enseña la primera y ya. Quien pide menos movimiento no está pidiendo un movimiento
 * más suave: está pidiendo que no lo haya.
 */

/** Siete segundos. Menos se lee como un parpadeo; más y la segunda pieza casi nunca
 *  llega, porque la permanencia media en una página no da para tres turnos largos. */
const TURNO_MS = 7000;

const quiereMenosMovimiento = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useRotacion = (ciclo) => {
  const cuantas = ciclo?.length ?? 0;
  const contenedor = useRef(null);
  const [indice, setIndice] = useState(0);
  const [entrando, setEntrando] = useState(false);
  // La pieza que se va, viva un instante más que su turno. Hace falta para que se
  // pueda despegar **por encima** de la siguiente: si se desmontara al cambiar, no
  // habría nada que despegar y la nueva aparecería sin más.
  const [saliente, setSaliente] = useState(null);

  // Las que ya se reportaron, por enlace: el token es único por pieza y por carga, así
  // que sirve de identidad sin inventarse una.
  const reportadas = useRef(new Set());
  const aLaVista = useRef(false);
  const detenida = useRef(false);

  // Un ciclo nuevo —otra página— empieza de cero.
  useEffect(() => {
    setIndice(0);
    reportadas.current = new Set();
  }, [ciclo]);

  // ¿Está en pantalla? De eso dependen las dos cosas: contar y avanzar.
  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo || typeof IntersectionObserver !== "function") {
      // Sin soporte, se asume visible: es preferible contar de más en un navegador
      // viejo que no contar nada.
      aLaVista.current = true;
      return undefined;
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        aLaVista.current = entrada.isIntersecting;
        if (entrada.isIntersecting) anotar();
      },
      // La mitad del anuncio dentro de la pantalla. Un píxel asomando no es haberlo
      // visto, y exigir el 100% deja sin contar los que son más altos que la ventana.
      { threshold: 0.5 }
    );
    observador.observe(nodo);
    return () => observador.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciclo]);

  const anotar = () => {
    const pieza = ciclo?.[indice];
    if (!pieza?.enlace || reportadas.current.has(pieza.enlace)) return;
    reportadas.current.add(pieza.enlace);
    reportarVisto(pieza.enlace);
  };

  // Cada vez que cambia la pieza enseñada, si está a la vista, se cuenta.
  useEffect(() => {
    if (aLaVista.current) anotar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, ciclo]);

  // El reloj.
  useEffect(() => {
    if (cuantas < 2 || quiereMenosMovimiento()) return undefined;
    const reloj = setInterval(() => {
      if (!aLaVista.current || detenida.current) return;
      setEntrando(true);
      setIndice((i) => {
        setSaliente(ciclo[i] ?? null);
        return (i + 1) % cuantas;
      });
    }, TURNO_MS);
    return () => clearInterval(reloj);
  }, [cuantas, ciclo]);

  // La clase de entrada dura lo que la animación y se quita sola: dejarla puesta haría
  // que cualquier repintado posterior la volviera a disparar.
  useEffect(() => {
    if (!entrando) return undefined;
    const t = setTimeout(() => {
      setEntrando(false);
      setSaliente(null);
    }, 700);
    return () => clearTimeout(t);
  }, [entrando, indice]);

  const pausa = {
    onMouseEnter: () => {
      detenida.current = true;
    },
    onMouseLeave: () => {
      detenida.current = false;
    },
    onFocusCapture: () => {
      detenida.current = true;
    },
    onBlurCapture: () => {
      detenida.current = false;
    },
  };

  return { contenedor, indice, entrando, pausa, saliente, pieza: ciclo?.[indice] ?? null };
};
