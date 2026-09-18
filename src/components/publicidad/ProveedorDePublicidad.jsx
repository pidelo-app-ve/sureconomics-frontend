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
 * **Una impresión de más es una impresión que se factura y no existió.** Por eso se
 * pide una vez, cuando la vista dice que está lista, y no se vuelve a pedir hasta que
 * cambia la ruta. Una vista que carga su contenido en dos pasos -- la pieza primero, sus
 * temas después -- tiene que esperar a tenerlo todo y pasar `listo`, o contaría dos
 * veces cada hueco.
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
  useEffect(() => {
    setPedido(null);
    setEstado(VACIO);
  }, [pathname]);

  const registrar = useCallback((nuevo) => setPedido(nuevo), []);

  useEffect(() => {
    if (!pedido || !pedido.espacios?.length) return undefined;

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
  }, [pedido]);

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
