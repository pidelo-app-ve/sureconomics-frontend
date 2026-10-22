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
 * El elemento se lleva al hueco que deja libre la tarjeta, no al centro de la pantalla:
 * en el teléfono la tarjeta ocupa media pantalla y lo tapaba.
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

export const RecorridoVista = ({ recorrido }) => {
  const { t } = useIdioma();
  const [paso, setPaso] = useState(() => recorrido.pasoActivo());
  const [caja, setCaja] = useState(null);
  const siguiente = useRef(null);
  const tarjeta = useRef(null);
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
    const medir = () => {
      const el = document.querySelector(selector);
      const r = el?.getBoundingClientRect();
      if (!el || !r || (r.width === 0 && r.height === 0)) {
        setCaja(null);
        return;
      }
      if (!centrado) {
        centrado = true;
        // Centrado en lo que queda por encima de la tarjeta (con 72 px arriba para la
        // barra fija del panel en el teléfono). `scroll-margin` vale para cualquier
        // contenedor con desplazamiento, no solo para la ventana.
        const libre = window.innerHeight - (tarjeta.current?.offsetHeight ?? 0) - 32;
        const margen = Math.max(72, (libre - r.height) / 2);
        const previo = el.style.scrollMarginTop;
        el.style.scrollMarginTop = `${margen}px`;
        const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "start", behavior: quieto ? "auto" : "smooth" });
        el.style.scrollMarginTop = previo;
      }
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

  // El foco va al botón de avanzar en cada paso: con el teclado se recorre con Enter.
  useEffect(() => {
    if (paso !== null) siguiente.current?.focus({ preventScroll: true });
  }, [paso]);

  if (paso === null || !definicion) return null;

  const esUltimo = paso === recorrido.pasos.length - 1;

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

      <div className="se-recorrido__tarjeta" ref={tarjeta}>
        <div className="se-recorrido__cabeza">
          <h2 id={tituloId} className="se-recorrido__titulo">
            {definicion.titulo}
          </h2>
          <span className="se-recorrido__cuenta">
            {t("comun.recorrido.cuenta", { n: paso + 1, total: recorrido.pasos.length })}
          </span>
        </div>
        <div className="se-recorrido__cuerpo">
          {definicion.texto ? <p>{definicion.texto}</p> : null}
          {definicion.puntos?.length ? (
            <ul>
              {definicion.puntos.map((p) => (
                <Punto key={p} texto={p} />
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
    pasos: PropTypes.arrayOf(PropTypes.shape({ titulo: PropTypes.string.isRequired })).isRequired,
    atributo: PropTypes.string.isRequired,
    pasoActivo: PropTypes.func.isRequired,
    irAPaso: PropTypes.func.isRequired,
    suscribir: PropTypes.func.isRequired,
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
      {...{ [recorrido.atributo]: "guia" }}
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
  recorrido: PropTypes.shape({ iniciar: PropTypes.func.isRequired, atributo: PropTypes.string.isRequired })
    .isRequired,
  className: PropTypes.string,
};
