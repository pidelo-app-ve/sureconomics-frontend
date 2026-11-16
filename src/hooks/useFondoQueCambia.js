import { useEffect } from "react";

/**
 * El papel de la página cambia de tono, casi sin notarse, según la sección que cruza
 * el centro de la pantalla: el papel de siempre, uno con un pelo de verde y otro un
 * pelo más cálido. La idea es de las cabeceras impresas que alternan el papel por
 * cuadernillos; aquí solo se intuye.
 *
 * El color vive en `--fondo-vivo`, registrado con `@property` en `blog.css`; el papel
 * de `.se-publico` y el de cada sección lo leen de ahí. Mientras la portada está montada
 * la variable cambia de golpe y cada superficie funde su propio fondo (la clase
 * `se-papel-por-secciones`): fundir la variable en `<html>` recalculaba el estilo de
 * todo el documento en cada fotograma. Al irse de la página se vuelve al papel, y esa
 * vuelta sí la funde `<html>`, una vez.
 *
 * @param {{ current: HTMLElement | null }} ref  el contenedor cuyas hijas son las secciones
 * @param {unknown} clave  cambia cuando cambian las secciones (al cargar, al filtrar)
 */
export const TONOS_DEL_PAPEL = ["#f9f8f6", "#f3f5f0", "#faf6ee"];

/** La clase de `<html>` con la que cada superficie funde su papel (ver `blog.css`). */
const POR_SECCIONES = "se-papel-por-secciones";
/** Lo que dura el fundido, el de `blog.css`. */
const FUNDIDO_MS = 1200;

export const useFondoQueCambia = (ref, clave) => {
  useEffect(() => {
    const raiz = document.documentElement;
    const caja = ref.current;
    if (!caja || typeof IntersectionObserver === "undefined" || typeof ResizeObserver === "undefined") return undefined;

    raiz.classList.add(POR_SECCIONES);
    let ultimoCambio = -Infinity;
    let vigia = null;

    // Solo las que se ven: el `h1` oculto de la portada también es hija, y contarlo
    // haría que la primera plana abriera con el tono verde y no con el papel. El alto lo
    // da ResizeObserver tras la maquetación que el navegador iba a hacer de todos modos;
    // leer `offsetHeight` aquí la forzaba en el acto. Se mide una vez, como antes.
    const medidor = new ResizeObserver((medidas) => {
      medidor.disconnect();
      const altos = new Map(medidas.map((m) => [m.target, m.borderBoxSize?.[0]?.blockSize ?? m.target.offsetHeight]));
      const secciones = Array.from(caja.children).filter((el) => Math.round(altos.get(el) ?? 0) > 40);
      // Una línea en el centro de la pantalla: manda la sección que la cruza.
      vigia = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((e) => {
            if (!e.isIntersecting) return;
            const i = secciones.indexOf(e.target);
            raiz.style.setProperty("--fondo-vivo", TONOS_DEL_PAPEL[Math.max(i, 0) % TONOS_DEL_PAPEL.length]);
            ultimoCambio = performance.now();
          });
        },
        { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
      );
      secciones.forEach((s) => vigia.observe(s));
    });
    Array.from(caja.children).forEach((el) => medidor.observe(el));

    return () => {
      medidor.disconnect();
      vigia?.disconnect();
      // A mitad de un fundido el papel que se ve aún no es el tono puesto: la vuelta sale
      // del que se ve. Se fija sin fundir (con la clase aún puesta), y leerlo obliga al
      // navegador a aplicarlo antes de quitar la clase.
      const papel = performance.now() - ultimoCambio < FUNDIDO_MS && document.querySelector(".se-publico");
      if (papel) {
        raiz.style.setProperty("--fondo-vivo", getComputedStyle(papel).backgroundColor);
        void getComputedStyle(raiz).getPropertyValue("--fondo-vivo");
      }
      raiz.classList.remove(POR_SECCIONES);
      raiz.style.removeProperty("--fondo-vivo");
    };
  }, [ref, clave]);
};
