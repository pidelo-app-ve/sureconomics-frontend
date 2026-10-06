import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MEDICION_HABILITADA,
  aceptado,
  arrancar,
  consentimiento,
  contarDecision,
  decidir,
  registrarVista,
} from "../lib/analitica";

/**
 * El aviso de cookies y el interruptor de la medicion.
 *
 * Hace dos cosas que van juntas y por eso viven en el mismo sitio: preguntar, y encender
 * o no la medicion segun la respuesta. Separarlas es como se acaba teniendo un banner
 * que dice una cosa y un script que hace otra.
 *
 * ## Lo que lo hace valido, y no solo bonito
 *
 * **No se pone nada antes de contestar.** Ni un identificador, ni una marca de tiempo.
 * El unico efecto de entrar al sitio sin haber contestado es ver esta barra.
 *
 * **"Rechazar" pesa lo mismo que "Aceptar".** Mismo tamano, mismo contraste, misma
 * distancia del dedo. Un rechazo escondido en gris claro invalida el consentimiento
 * entero: no es una opinion de diseno, es lo que dicen las guias del Comite Europeo de
 * Proteccion de Datos y lo que sanciona la AEPD.
 *
 * **No hay aspa ni "seguir navegando".** Cerrar sin elegir no puede contar como si;
 * seguir leyendo tampoco. Por eso la barra no se cierra sola ni tiene boton de cerrar:
 * sus dos salidas son las dos respuestas.
 *
 * **No bloquea.** Ni capa oscura ni foco secuestrado: se puede leer el sitio sin
 * contestar. Un muro que obliga a aceptar para pasar tampoco es consentimiento libre.
 *
 * ## Por que tambien vive aqui el aviso de navegacion
 *
 * El sitio es una sola pagina que cambia de ruta sin recargar, asi que nadie se entera
 * de un cambio de articulo salvo que alguien lo cuente. Este componente ya esta montado
 * en todas las vistas y ya sabe si hay permiso: es el sitio natural. Si no hay permiso,
 * `registrarVista` no hace nada.
 *
 * ## En pausa mientras el aviso esta en revision
 *
 * Con `MEDICION_HABILITADA` en `false` este componente no dibuja nada: ni la barra, ni
 * los efectos que arrancan la medicion o cuentan cambios de ruta. Es a proposito el
 * mismo interruptor que usan `arrancar` y `decidir`, y no uno propio de aqui -- asi un
 * enlace directo a `/cookies` no puede activar la medicion por otra puerta mientras el
 * texto siga sin aprobar.
 */
export const AvisoDeCookies = () => {
  const [decision, setDecision] = useState(() => consentimiento());
  const { pathname } = useLocation();

  // Un si dicho en una visita anterior enciende la medicion sin volver a preguntar.
  useEffect(() => {
    if (MEDICION_HABILITADA && aceptado()) arrancar();
  }, []);

  useEffect(() => {
    if (!MEDICION_HABILITADA) return;
    // La primera ruta ya la cuenta `arrancar`, y `registrarVista` no repite la ruta en
    // la que ya esta. Antes aqui se saltaba la primera a mano, y eso perdia la vista de
    // quien volvia al sitio desde una pagina fuera del `Layout` (El Analista, /entorno):
    // el `Layout` se montaba de nuevo y su primera ruta no se contaba.
    registrarVista(pathname);
  }, [pathname]);

  const responder = useCallback((respuesta) => {
    // Se cuenta la respuesta -- las dos -- en un contador diario sin identificador: ver
    // `contarDecision`. Aqui y no en `decidir`, porque esto es la unica vez que se
    // *pregunta*; lo que se cambie despues desde `/cookies` es otra pregunta. La barra
    // desaparece con la respuesta, asi que el clic no puede repetirse.
    contarDecision(respuesta);
    setDecision(decidir(respuesta));
  }, []);

  const visible = MEDICION_HABILITADA && !decision;
  const barra = useRef(null);

  // WCAG 2.4.11: la barra va fija al pie, y lo que recibe el foco al tabular podia
  // quedar debajo de ella. Mientras esta abierta, el documento reserva su alto con
  // `scroll-padding-bottom` (ver `accesibilidad.css`) y el navegador deja el foco por
  // encima. El alto se mide en vivo y no se supone: cambia con el ancho, con el tamaño
  // de letra y con el texto, y una cifra fija se queda corta en cuanto algo de eso se
  // mueve.
  useEffect(() => {
    if (!visible) return undefined;
    const raiz = document.documentElement;
    raiz.classList.add("se-con-aviso-cookies");
    const medir = () => {
      const alto = barra.current?.getBoundingClientRect().height;
      if (alto) raiz.style.setProperty("--se-aviso-cookies-alto", `${Math.ceil(alto)}px`);
    };
    medir();
    let vigia = null;
    if (typeof ResizeObserver !== "undefined" && barra.current) {
      vigia = new ResizeObserver(medir);
      vigia.observe(barra.current);
    }
    return () => {
      vigia?.disconnect();
      raiz.classList.remove("se-con-aviso-cookies");
      raiz.style.removeProperty("--se-aviso-cookies-alto");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <aside
      ref={barra}
      className="se-cookies"
      // `region` y no `dialog`: un dialogo se lleva el foco y atrapa el teclado, y esto
      // no debe interrumpir la lectura. Se anuncia, y quien quiera llega tabulando.
      role="region"
      aria-label="Aviso de cookies"
    >
      <div className="se-cookies__caja">
        <div className="se-cookies__texto">
          <p className="se-cookies__titulo">Medimos cuánta gente nos lee</p>
          <p className="se-cookies__cuerpo">
            Con su permiso usamos cuatro cookies propias para saber cuántas personas nos
            leen, si vuelven y qué se lee de verdad. No llevan su nombre, no se comparten
            con nadie y no le siguen fuera de este sitio.{" "}
            <Link to="/cookies" className="se-cookies__enlace">
              Qué guarda cada una
            </Link>
            .
          </p>
        </div>

        <div className="se-cookies__acciones">
          {/* El rechazo va primero en el orden del documento: quien navega con teclado
              lo encuentra antes, y quien lee de izquierda a derecha lo ve igual de
              pronto. Ninguno de los dos es el boton "bonito". */}
          <button
            type="button"
            className="se-cookies__btn se-cookies__btn--no"
            onClick={() => responder("no")}
          >
            Rechazar
          </button>
          <button
            type="button"
            className="se-cookies__btn se-cookies__btn--si"
            onClick={() => responder("si")}
          >
            Aceptar
          </button>
        </div>
      </div>
    </aside>
  );
};
