import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import "../../styles/recorrido.css";

/**
 * La superposición de la guía de una página (ver `lib/recorridoVista.js`).
 *
 * Un recuadro encima del elemento iluminado con una sombra enorme alrededor
 * (`box-shadow: 0 0 0 9999px …`) oscurece todo lo demás sin taparlo, y la tarjeta de
 * abajo explica el paso. El elemento se mide cada 300 ms porque puede aparecer después
 * (datos cargando) o moverse (desplazamiento, una lista que crece). Si no está en
 * pantalla, se oscurece todo y el texto vale por sí mismo. Escape la cierra.
 *
 * La misma clave puede estar en dos elementos, uno por tamaño de pantalla (tarjetas en
 * el teléfono, tabla en la computadora; el CSS esconde una): vale el primero que se ve.
 *
 * Abierta, lo de detrás es `inert`: el tabulador no llega a los botones tapados de la
 * página. Al cerrar, la página vuelve a donde estaba y el foco, a quien la abrió (el
 * botón «Guía»); si quedó fuera de la pantalla (el «?» del menú plegado del teléfono),
 * al botón que abre ese menú.
 *
 * El elemento se lleva al hueco que deja libre la tarjeta, no al centro de la pantalla:
 * en el teléfono la tarjeta ocupa media pantalla y lo tapaba. Lo que está al fondo de la
 * página no podía subir hasta ahí, porque la página ya no bajaba más: mientras la guía
 * está abierta, un hueco invisible tras el final le da el recorrido que falte. Y si aun
 * así la tarjeta lo tapa (una barra pegada al borde de abajo), en ese paso va arriba.
 *
 * Va colgada del `body`: dentro del panel, el contenido anima su entrada con
 * `transform`, y un antepasado transformado rompe el `position: fixed` (ver
 * `ModalDelPanel`).
 */

/** «Nombre: qué es» → el nombre en negrita. */
const Punto = ({ texto }) => {
  const corte = texto.indexOf(": ");
  if (corte === -1) return <li>{texto}</li>;
  return (
    <li>
      <strong>{texto.slice(0, corte)}:</strong> {texto.slice(corte + 2)}
    </li>
  );
};

Punto.propTypes = { texto: PropTypes.string.isRequired };

/** Si se ve: con tamaño y dentro de la pantalla a lo ancho (no en un menú plegado). */
const seVe = (el) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.right > 0 && r.left < window.innerWidth;
};

export const RecorridoVista = ({ recorrido }) => {
  const { t } = useIdioma();
  const [paso, setPaso] = useState(() => recorrido.pasoActivo());
  const [caja, setCaja] = useState(null);
  // El paso en el que la tarjeta va arriba (ver `medir`); en los demás, abajo.
  const [arribaEn, setArribaEn] = useState(null);
  const siguiente = useRef(null);
  const tarjeta = useRef(null);
  const hueco = useRef(null);
  const tituloId = useId();

  useEffect(() => recorrido.suscribir(() => setPaso(recorrido.pasoActivo())), [recorrido]);

  const definicion = paso !== null ? recorrido.pasos[paso] ?? null : null;

  useEffect(() => {
    if (!definicion?.clave) {
      setCaja(null);
      return undefined;
    }
    const selector = `[${recorrido.atributo}="${definicion.clave}"]`;
    let centrado = false;
    let colocada = false;
    let antes = null;
    const medir = () => {
      let el = null;
      let r = null;
      for (const candidato of document.querySelectorAll(selector)) {
        r = candidato.getBoundingClientRect();
        if (r.width !== 0 || r.height !== 0) {
          el = candidato;
          break;
        }
      }
      if (!el) {
        setCaja(null);
        return;
      }
      if (!centrado) {
        centrado = true;
        // Centrado en lo que queda por encima de la tarjeta (con 72 px arriba para la
        // barra fija del panel en el teléfono). `scroll-margin` vale para cualquier
        // contenedor con desplazamiento, no solo para la ventana. El navegador le suma
        // el `scroll-padding-top` del sitio (lo que mide la cabecera fija de la parte
        // pública): se descuenta, sin bajar de él, y el elemento ya no queda 89 px más
        // abajo de la cuenta.
        const libre = window.innerHeight - (tarjeta.current?.offsetHeight ?? 0) - 32;
        const relleno = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const margen = Math.max(72, relleno, (libre - r.height) / 2);
        // El hueco del final: empieza donde acaba la página (o donde acabe ahora, si
        // creció) y se alarga lo que falte para centrar este elemento. No encoge
        // mientras la guía siga abierta: así la página no salta de un paso a otro.
        const h = hueco.current;
        if (h) {
          const fin = document.documentElement.scrollHeight;
          if ((parseFloat(h.style.top) || 0) + h.offsetHeight < fin) h.style.top = `${fin}px`;
          const falta = r.top + window.scrollY - margen + window.innerHeight - parseFloat(h.style.top);
          if (falta > h.offsetHeight) h.style.height = `${Math.ceil(falta)}px`;
        }
        const previo = el.style.scrollMarginTop;
        el.style.scrollMarginTop = `${margen - relleno}px`;
        const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "start", behavior: quieto ? "auto" : "smooth" });
        el.style.scrollMarginTop = previo;
      } else if (!colocada && antes !== null && Math.abs(antes - r.top) < 1) {
        // Ya quieto: si la tarjeta de abajo aún lo tapa (una barra pegada al borde de
        // abajo baja con la página; el menú lateral del teléfono no se mueve), en este
        // paso sube: si arriba se ve entero, o si abajo apenas asomaba y arriba se ve
        // más. Lo que no cabe entero se queda con la tarjeta abajo: se ve su principio.
        colocada = true;
        const tj = tarjeta.current?.getBoundingClientRect();
        if (tj) {
          const alto = window.innerHeight;
          const aire = Math.min(tj.top, alto - tj.bottom); // el 1,5 rem del borde, esté donde esté
          const entero = Math.min(r.bottom, alto) - Math.max(r.top, 0);
          const visto = Math.min(r.bottom, alto - aire - tj.height) - Math.max(r.top, 0);
          const vistoArriba = Math.min(r.bottom, alto) - Math.max(r.top, aire + tj.height);
          const sube = visto < entero && (vistoArriba >= entero || (visto < Math.min(r.height, 40) && vistoArriba > visto));
          setArribaEn(sube ? definicion : null);
        }
      }
      antes = r.top;
      setCaja((previa) =>
        previa &&
        Math.abs(previa.top - r.top) < 1 &&
        Math.abs(previa.left - r.left) < 1 &&
        Math.abs(previa.width - r.width) < 1 &&
        Math.abs(previa.height - r.height) < 1
          ? previa
          : { top: r.top, left: r.left, width: r.width, height: r.height },
      );
    };
    medir();
    const id = window.setInterval(medir, 300);
    return () => window.clearInterval(id);
  }, [definicion, recorrido.atributo]);

  useEffect(() => {
    if (paso === null) return undefined;
    const alPulsar = (e) => {
      if (e.key === "Escape") recorrido.irAPaso(null);
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [paso, recorrido]);

  // Antes que el efecto de abajo: `activeElement` es todavía quien abrió la guía. Si no
  // hay nadie (Safari no enfoca un botón al pulsarlo), el botón que la abre: el del
  // último paso («Guía», o el «?» de las bienvenidas). Las otras guías no se tocan: con
  // dos abiertas a la vez, cada una dejaba inerte a la otra y ninguna se cerraba con el dedo.
  const abierta = definicion !== null;
  useEffect(() => {
    if (!abierta) return undefined;
    const previo = document.activeElement;
    const desde = window.scrollY;
    const boton = `[${recorrido.atributo}="${recorrido.pasos[recorrido.pasos.length - 1]?.clave}"]`;
    const volver = previo && previo !== document.body ? previo : document.querySelector(boton);
    const tapados = [...document.body.children].filter((el) => !el.inert && !el.classList.contains("se-recorrido"));
    for (const el of tapados) el.inert = true;
    return () => {
      for (const el of tapados) el.inert = false;
      // La guía mueve la página paso a paso, y al quitar el hueco del final el navegador
      // la subía de golpe hasta donde llegara: vuelve, sin animar, a donde estaba. Solo
      // si la página sigue ahí: al irse a otra (atrás, con la guía abierta), no se toca.
      if (volver?.isConnected) window.scrollTo({ top: desde, behavior: "instant" });
      volver?.focus({ preventScroll: true });
      // Si quien la abrió quedó fuera de la pantalla (el «?» del menú plegado del
      // teléfono: la guía abre ese menú y al acabar se cierra), el foco pasa al botón
      // que abre el menú, el que lo controla (`aria-controls`). Se mira cuando el menú
      // ya ha terminado de cerrarse.
      window.setTimeout(() => {
        if (document.activeElement !== volver || seVe(volver)) return;
        const abre = [...document.querySelectorAll("[aria-controls]")].find(
          (b) => seVe(b) && document.getElementById(b.getAttribute("aria-controls"))?.contains(volver),
        );
        abre?.focus({ preventScroll: true });
      }, 400);
    };
  }, [abierta, recorrido.atributo, recorrido.pasos]);

  // El foco va al botón de avanzar en cada paso: con el teclado se recorre con Enter.
  useEffect(() => {
    if (paso !== null) siguiente.current?.focus({ preventScroll: true });
  }, [paso]);

  if (paso === null || !definicion) return null;

  const esUltimo = paso === recorrido.pasos.length - 1;
  const arriba = arribaEn === definicion;
  // Guías de la parte pública: los textos son claves de idioma (ver `crearRecorrido`).
  const tx = recorrido.traducir ? (clave) => t(clave) : (texto) => texto;

  return createPortal(
    <div className="se-recorrido" role="dialog" aria-modal="true" aria-labelledby={tituloId} aria-roledescription={t("comun.recorrido.region")}>
      {caja ? (
        <div
          className="se-recorrido__foco"
          style={{ top: caja.top - 6, left: caja.left - 6, width: caja.width + 12, height: caja.height + 12 }}
        />
      ) : (
        <div className="se-recorrido__velo" />
      )}

      {/* El hueco del final (ver `medir`), con su propio portal: fuera de esta capa fija,
          porque tiene que alargar la página. */}
      {createPortal(<div className="se-recorrido-hueco" ref={hueco} aria-hidden="true" />, document.body)}

      <div className={`se-recorrido__tarjeta${arriba ? " se-recorrido__tarjeta--arriba" : ""}`} ref={tarjeta}>
        <div className="se-recorrido__cabeza">
          <h2 id={tituloId} className="se-recorrido__titulo">
            {tx(definicion.titulo)}
          </h2>
          <span className="se-recorrido__cuenta">
            {t("comun.recorrido.cuenta", { n: paso + 1, total: recorrido.pasos.length })}
          </span>
        </div>
        <div className="se-recorrido__cuerpo">
          {definicion.texto ? <p>{tx(definicion.texto)}</p> : null}
          {definicion.puntos?.length ? (
            <ul>
              {definicion.puntos.map((p) => (
                <Punto key={p} texto={tx(p)} />
              ))}
            </ul>
          ) : null}
        </div>
        <div className="se-recorrido__pie">
          <button type="button" className="se-recorrido__omitir" onClick={() => recorrido.irAPaso(null)}>
            {t("comun.recorrido.omitir")}
          </button>
          <div className="se-recorrido__botones">
            {paso > 0 ? (
              <button type="button" className="se-recorrido__boton" onClick={() => recorrido.irAPaso(paso - 1)}>
                {t("comun.recorrido.anterior")}
              </button>
            ) : null}
            <button
              ref={siguiente}
              type="button"
              className="se-recorrido__boton se-recorrido__boton--principal"
              onClick={() => recorrido.irAPaso(esUltimo ? null : paso + 1)}
            >
              {esUltimo ? t("comun.recorrido.entendido") : t("comun.recorrido.siguiente")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

RecorridoVista.propTypes = {
  recorrido: PropTypes.shape({
    pasos: PropTypes.arrayOf(PropTypes.shape({ clave: PropTypes.string, titulo: PropTypes.string.isRequired })).isRequired,
    atributo: PropTypes.string.isRequired,
    pasoActivo: PropTypes.func.isRequired,
    irAPaso: PropTypes.func.isRequired,
    suscribir: PropTypes.func.isRequired,
    // Los recorridos de la cuenta del lector traen claves de idioma en vez de textos.
    traducir: PropTypes.bool,
  }).isRequired,
};

/** El botón «Guía» de la cabecera de cada página. Lleva su propio anclaje (`guia`). */
export const BotonGuia = ({ recorrido, className }) => {
  const { t } = useIdioma();
  return (
    <button
      type="button"
      className={className || "se-btn se-btn--secondary"}
      onClick={recorrido.iniciar}
      {...recorrido.ancla("guia")}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="16.9" r="1.05" fill="currentColor" />
      </svg>
      {t("comun.recorrido.boton")}
    </button>
  );
};

BotonGuia.propTypes = {
  recorrido: PropTypes.shape({ iniciar: PropTypes.func.isRequired, ancla: PropTypes.func.isRequired })
    .isRequired,
  className: PropTypes.string,
};
