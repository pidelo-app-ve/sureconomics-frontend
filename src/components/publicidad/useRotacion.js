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
 * Y «en pantalla» incluye la pestaña: con la pestaña oculta el observador no corre y la
 * caja sigue «cruzando» la ventana, así que el reloj seguía rotando y reportando piezas
 * que nadie veía (auditoría, oct-2026). Oculta, ni rota ni cuenta; al volver, se cuenta
 * la que está puesta si sigue en pantalla.
 *
 * ## No rota fuera de pantalla
 *
 * Un hueco que no se ve no gasta turnos. Sin esto, un lector que abre la pestaña y se
 * va a hacer otra cosa vuelve con el ciclo agotado y todas las piezas «vistas», que es
 * la misma factura inflada por otro camino.
 *
 * ## Sin nodo no hay nada a la vista
 *
 * Un hueco que llama a este hook y después devuelve `null` (la barra inferior cerrada,
 * un formato sin pintor) no tiene caja que observar: no está en pantalla y no se cuenta.
 * Antes «sin nodo» valía por «visible» y se facturaba lo que no se pintó. Ojo: el
 * observador se engancha cuando cambia el ciclo; un hueco que monte su nodo más tarde
 * sin cambiar el ciclo tiene que cambiarlo (ver `BarraPublicitaria`).
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

const pestanaVisible = () =>
  typeof document === "undefined" || document.visibilityState === "visible";

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

  const anotar = () => {
    if (!pestanaVisible()) return; // oculta = no vista
    const pieza = ciclo?.[indice];
    if (!pieza?.enlace || reportadas.current.has(pieza.enlace)) return;
    reportadas.current.add(pieza.enlace);
    reportarVisto(pieza.enlace);
  };
  // La versión de este render, para los oyentes que se enganchan una vez (el observador
  // y la vuelta a la pestaña): si no, contarían con el índice de cuando se montaron.
  const anotarActual = useRef(anotar);
  anotarActual.current = anotar;

  // ¿Está en pantalla? De eso dependen las dos cosas: contar y avanzar.
  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) {
      aLaVista.current = false;
      return undefined;
    }
    if (typeof IntersectionObserver !== "function") {
      // Sin soporte, se asume visible: es preferible contar de más en un navegador
      // viejo que no contar nada.
      aLaVista.current = true;
      return undefined;
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        aLaVista.current = entrada.isIntersecting;
        if (entrada.isIntersecting) anotarActual.current();
      },
      // La mitad del anuncio dentro de la pantalla. Un píxel asomando no es haberlo
      // visto, y exigir el 100% deja sin contar los que son más altos que la ventana.
      { threshold: 0.5 }
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [ciclo]);

  // Cada vez que cambia la pieza enseñada, si está a la vista, se cuenta.
  useEffect(() => {
    if (aLaVista.current) anotar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, ciclo]);

  // Al volver a la pestaña, la pieza puesta cuenta si sigue en pantalla. Tras un cuadro,
  // por si la maquetación cambió mientras estaba oculta y el observador aún no lo vio.
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const alVolver = () => {
      if (pestanaVisible() && aLaVista.current) requestAnimationFrame(() => anotarActual.current());
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, []);

  // El reloj.
  useEffect(() => {
    if (cuantas < 2 || quiereMenosMovimiento()) return undefined;
    const reloj = setInterval(() => {
      if (!aLaVista.current || detenida.current || !pestanaVisible()) return;
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
