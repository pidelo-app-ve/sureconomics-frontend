import { useEffect } from "react";

/**
 * El papel de la página cambia de tono, casi sin notarse, según la sección que cruza
 * el centro de la pantalla: el papel de siempre, uno con un pelo de verde y otro un
 * pelo más cálido. La idea es de las cabeceras impresas que alternan el papel por
 * cuadernillos; aquí solo se intuye.
 *
 * El color vive en `--fondo-vivo`, registrado con `@property` en `blog.css` para que
 * el navegador lo funda solo; el papel de `.se-publico` lo lee de ahí. Al irse de la
 * página se vuelve al papel.
 *
 * @param {{ current: HTMLElement | null }} ref  el contenedor cuyas hijas son las secciones
 * @param {unknown} clave  cambia cuando cambian las secciones (al cargar, al filtrar)
 */
export const TONOS_DEL_PAPEL = ["#f9f8f6", "#f3f5f0", "#faf6ee"];

export const useFondoQueCambia = (ref, clave) => {
  useEffect(() => {
    const raiz = document.documentElement;
    const caja = ref.current;
    if (!caja || typeof IntersectionObserver === "undefined") return undefined;

    // Solo las que se ven: el `h1` oculto de la portada también es hija, y contarlo
    // haría que la primera plana abriera con el tono verde y no con el papel.
    const secciones = Array.from(caja.children).filter((el) => el.offsetHeight > 40);
    // Una línea en el centro de la pantalla: manda la sección que la cruza.
    const vigia = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = secciones.indexOf(e.target);
          raiz.style.setProperty("--fondo-vivo", TONOS_DEL_PAPEL[Math.max(i, 0) % TONOS_DEL_PAPEL.length]);
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    secciones.forEach((s) => vigia.observe(s));
    return () => {
      vigia.disconnect();
      raiz.style.removeProperty("--fondo-vivo");
    };
  }, [ref, clave]);
};
