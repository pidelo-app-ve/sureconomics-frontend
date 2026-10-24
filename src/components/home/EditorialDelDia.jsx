import PropTypes from "prop-types";
import { useRef, useState } from "react";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";
import { Enlace } from "../Enlace";
import { BRAND } from "../../brand/publicBrandLogos";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha } from "../../i18n/motor";
import { imagenAncho, imagenSrcSet, rutaDePieza } from "../../lib/pieza";
import { piezaShape } from "./piezaShape";
import { TituloDePieza } from "../content/TituloDePieza";

/**
 * La editorial más reciente, en su propio bloque alto en la portada.
 *
 * Es la única pieza de la página que habla *por* el medio en vez de informar. Por eso
 * no es una tarjeta: es una sección del periódico, entre la regla de tinta y el filete,
 * firmada por la casa con su isotipo, como en la página de la editorial.
 *
 * Con foto, la foto tiene su columna (al lado del texto en pantalla ancha, encima en el
 * teléfono). Sin foto no hay columna: un recuadro de color del tamaño de una foto se
 * leía como algo que no cargó.
 *
 * No pinta nada cuando no hay editorial: anunciar la posición de la casa con un marco
 * vacío dentro es peor que no tener bloque.
 */
/** La columna de la imagen: todo el ancho en telefono, el 44% al lado del texto. */
const ANCHOS = [600, 900, 1200, 1600];
const SIZES = "(max-width: 859px) 100vw, 44vw";

export const EditorialDelDia = ({ pieza }) => {
  const { t } = useIdioma();
  const [fallo, setFallo] = useState(false);
  // Al asomarse en pantalla, la regla de tinta de arriba se dibuja de izquierda a
  // derecha (`se-reveal--in` + CSS): la casa anunciándose.
  const seccion = useRef(null);
  useRevealOnScroll(seccion);
  if (!pieza) return null;

  const entradilla = pieza.entrada || pieza.resumen || "";
  // La fotografía cuando la hay y llega. Auditando producción salió que hay imágenes
  // alojadas fuera que contestan 429, y el recuadro roto del navegador en el bloque de
  // la editorial es lo peor que puede salir en esa posición: si falla, sin columna.
  const hayFoto = Boolean(pieza.imagenUrl) && !fallo;

  return (
    <section ref={seccion} className="se-section se-eddia" aria-label={t("portada.editorialDelDia.titulo")}>
      <div className="se-container">
        <Enlace
          to={rutaDePieza(pieza)}
          className={`se-eddia__card${hayFoto ? "" : " se-eddia__card--sin-foto"}`}
        >
          {hayFoto ? (
            <div className="se-eddia__media">
              <img
                className="se-eddia__img"
                src={imagenAncho(pieza.imagenUrl, 1200)}
                srcSet={imagenSrcSet(pieza.imagenUrl, ANCHOS, pieza.imagenAnchoOriginal) ?? undefined}
                sizes={SIZES}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setFallo(true)}
              />
            </div>
          ) : null}
          <div className="se-eddia__body">
            {/* La firma de la casa: el isotipo, «Editorial» y la fecha, como en la
                página de la pieza (`PieceByline`). Es lo que ningún otro bloque tiene. */}
            <div className="se-eddia__firma">
              <img className="se-eddia__marca" src={BRAND.isotipo} alt="" width="44" height="44" />
              <span className="se-eddia__quien">
                <span className="se-eddia__rotulo">{t("portada.editorialDelDia.titulo")}</span>
                {/* La fecha larga sale del ISO, en el idioma del documento; si la pieza no
                    lo trae, queda la corta que ya viene formateada. */}
                {pieza.fecha ? (
                  <time className="se-eddia__fecha" dateTime={pieza.fechaIso ?? pieza.fecha}>
                    {formatearFecha(pieza.fechaIso, "larga") || pieza.fecha}
                  </time>
                ) : null}
              </span>
            </div>
            <h2 className="se-eddia__title"><TituloDePieza pieza={pieza} /></h2>
            {entradilla ? <p className="se-eddia__lead">{entradilla}</p> : null}
            <span className="se-eddia__cta">{t("portada.editorialDelDia.leer")}</span>
          </div>
        </Enlace>
      </div>
    </section>
  );
};

EditorialDelDia.propTypes = { pieza: piezaShape({ fechaIso: PropTypes.string }) };

EditorialDelDia.defaultProps = { pieza: null };
