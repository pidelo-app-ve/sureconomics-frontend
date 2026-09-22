import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom/dist";

import { ESPACIOS, getEspacios } from "../../services/publicidadService";

/**
 * Quién pide los anuncios de la página, y cuándo.
 *
 * ## Una sola petición por página, y la declara la página
 *
 * El proveedor no adivina qué huecos hay: **cada vista declara los suyos** con
 * `useEspacios`, y eso dispara una única llamada con todos de golpe. Dos motivos, y
 * ninguno es de rendimiento:
 *
 * **La regla de "dos huecos de la misma pantalla no llevan al mismo anunciante" sólo se
 * puede aplicar si quien decide ve la página entera.** Con una llamada por hueco cada
 * una decidiría a ciegas y el lector acabaría viendo el mismo logotipo tres veces.
 *
 * **Con el contexto correcto, o no se pide.** Se pide una vez por ruta. Una vista cuyo
 * contexto sale de su contenido -- una pieza y sus temas, un listado y su filtro --
 * tiene que esperar a tenerlo y pasar `listo`: pedir antes serviría anuncios elegidos
 * con un contexto que todavía no es el de la página.
 *
 * Lo que **no** es motivo para esperar es la facturación. La impresión no se cuenta al
 * entregar sino cuando el navegador avisa de que la pieza apareció de verdad en
 * pantalla (`POST /publicidad/visto`), así que pedir pronto no cobra nada de más. Por
 * eso la portada, cuyo contexto es la constante `portada`, no espera a nada: hacerlo
 * sólo ponía la petición de publicidad detrás de la del contenido y el anuncio
 * aparecía notablemente después que la página.
 *
 * ## Qué pasa cuando una vista no declara nada
 *
 * No se pide nada y no se pinta nada. Es deliberado: el formulario de contacto, la
 * política de cookies y el panel no llevan publicidad, y la manera de decirlo es no
 * pedirla -- no una lista de excepciones en algún sitio que alguien tenga que recordar
 * actualizar.
 */

const PublicidadContexto = createContext({
  activa: true,
  huecos: {},
  registrar: () => {},
});

//: Los huecos que acompañan a toda la navegación de lectura. Una vista los añade a los
//: suyos si quiere llevarlos; no se cuelan solos.
//:
//: El cintillo (formato F) salió de aquí cuando el cliente lo quitó de la cinta de
//: mercado (09/2026). Tiene que salir de **esta lista** y no solo del componente que
//: lo pintaba: un hueco que se sigue pidiendo suma una impresión por página, y esa
//: impresión se factura. Un anuncio que nadie ve no se le puede cobrar a nadie.
export const ESPACIOS_DE_SITIO = [ESPACIOS.BARRA_INFERIOR];

const VACIO = { activa: true, huecos: {} };

export const ProveedorDePublicidad = ({ children }) => {
  const { pathname } = useLocation();
  const [pedido, setPedido] = useState(null);
  const [estado, setEstado] = useState(VACIO);

  // Cambiar de ruta borra lo anterior. Sin esto, el banner de la portada seguiría
  // pintado durante el primer fotograma de un artículo -- con su anunciante y su
  // contexto, que ya no son los de esta página.
  //
  // Aquí **sólo se borra lo pintado**, nunca el pedido. React ejecuta los efectos de
  // los hijos antes que los del padre: cuando este efecto corre, una vista que declara
  // sus huecos al montar ya ha llamado a `registrar`. Un `setPedido(null)` a secas
  // borraba ese pedido recién hecho y no se pedía nada -- el fallo llevaba aquí desde
  // siempre, tapado porque todas las vistas esperaban a tener contenido antes de
  // registrarse, y para entonces este efecto ya había pasado.
  //
  // Un pedido de la ruta anterior no hace falta borrarlo: lo descarta el efecto de
  // abajo al ver que su `ruta` ya no es la de ahora. Así el resultado no depende de en
  // qué orden corran los dos efectos, que es la clase de detalle que vuelve a morder
  // meses después.
  useEffect(() => {
    setEstado(VACIO);
  }, [pathname]);

  // El pedido se sella con la ruta desde la que se hizo, que es lo que permite al
  // efecto de arriba distinguir «esto es de la página anterior» de «esto acaba de
  // declararlo la página nueva».
  const registrar = useCallback(
    (nuevo) => setPedido({ ...nuevo, ruta: pathname }),
    [pathname],
  );

  useEffect(() => {
    if (!pedido || !pedido.espacios?.length) return undefined;
    // De la página anterior: la vista nueva todavía no ha declarado los suyos, o no
    // lleva publicidad. Pedirlo serviría anuncios con el contexto equivocado.
    if (pedido.ruta !== pathname) return undefined;

    let vivo = true;
    getEspacios(pedido.espacios, pedido.contexto)
      .then((r) => {
        if (vivo) setEstado({ activa: r.activa, huecos: r.espacios });
      })
      // Un fallo aquí no puede romper la lectura: sin anuncios se lee igual de bien.
      .catch(() => {});

    return () => {
      vivo = false;
    };
  }, [pedido, pathname]);

  const valor = useMemo(
    () => ({ activa: estado.activa, huecos: estado.huecos, registrar }),
    [estado, registrar],
  );

  return <PublicidadContexto.Provider value={valor}>{children}</PublicidadContexto.Provider>;
};

ProveedorDePublicidad.propTypes = {
  children: PropTypes.node,
};

/**
 * Declara los huecos de esta vista.
 *
 * @param {object} args
 * @param {string[]} args.espacios claves de `ESPACIOS`
 * @param {object} [args.contexto] sección, formato, temas y países de la página
 * @param {boolean} [args.listo] `false` mientras la vista todavía no sabe su contexto
 */
export const useEspacios = ({ espacios, contexto = {}, listo = true }) => {
  const { registrar } = useContext(PublicidadContexto);

  // La clave serializada y no los objetos: un `{}` nuevo en cada render dispararía el
  // efecto en cada render, y con él una petición y una impresión por fotograma.
  const clave = useMemo(
    () => JSON.stringify({ espacios, contexto }),
    [espacios, contexto],
  );

  useEffect(() => {
    if (!listo) return;
    const { espacios: e, contexto: c } = JSON.parse(clave);
    registrar({ espacios: e, contexto: c });
  }, [clave, listo, registrar]);
};

/**
 * Las piezas que le tocaron a un hueco, en orden. Vacío si no salió nada.
 *
 * El servidor manda varias para que roten en el sitio. Vienen ya ordenadas y sin
 * repetir anunciante —ni dentro del hueco ni con los demás huecos de la pantalla—,
 * así que aquí no hay nada que decidir: solo enseñarlas por turno.
 */
//: Un solo array vacio para todos los huecos sin anuncio. Devolver `[]` nuevo en cada
//: llamada le cambiaria la identidad al ciclo en cada render, y quien la usa para saber
//: si empezo un ciclo nuevo -- `useRotacion` -- se reiniciaria sin parar.
const SIN_NADA = [];

export const useCiclo = (espacio) => {
  const { huecos } = useContext(PublicidadContexto);
  const ciclo = huecos?.[espacio];
  return Array.isArray(ciclo) ? ciclo : SIN_NADA;
};

/**
 * La primera pieza de un hueco, o `null`.
 *
 * Para quien necesita saber **si hay anuncio** sin montar la rotación: el envoltorio
 * que decide si dibujar su sección, y la barra fija, que no rota.
 */
export const useHueco = (espacio) => useCiclo(espacio)[0] ?? null;
