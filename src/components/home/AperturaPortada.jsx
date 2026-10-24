import { useEffect } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { temaPrincipal } from "../../lib/contentFilter";
import { LugarYFecha } from "./LugarYFecha";
import { useRotacion } from "../../hooks/useRotacion";
import { imagenAncho, imagenSrcSet, rutaDePieza } from "../../lib/pieza";
import { ANCHOS, CardMedia } from "./CardMedia";
import { listaDePiezas, piezaShape } from "./piezaShape";
import { TituloDePieza } from "../content/TituloDePieza";
import { IconoPausa, UltimaHoraTarjeta } from "../titulares/UltimaHoraTarjeta";

/**
 * La apertura de la portada: la noticia principal en grande y, a su lado, las
 * siguientes en una columna de titulares.
 *
 * Sin esto la portada no tenía jerarquía: debajo del filtro venía una rejilla de seis
 * tarjetas iguales, y en el teléfono no había un solo titular en la primera pantalla.
 * Un diario se reconoce por eso, porque una noticia manda.
 *
 * **Cuál manda.** Desde octubre de 2026 la redacción puede fijarla a mano, y de
 * cualquier formato: «Abrir la portada con esta pieza», en el editor, pone
 * `destacada_hasta` y mientras no venza esa pieza es la principal. Sin nada fijado --
 * o vencido -- se elige sola entre las noticias: la más reciente, salvo que entre las
 * tres últimas haya una con fotografía y ella no la tenga; una apertura con imagen se
 * lee como apertura, y un relleno de color, no.
 *
 * La columna es siempre de noticias, fijada o no: a la pieza que manda la acompañan
 * los titulares del día, no otras entrevistas o informes.
 *
 * La columna es sólo texto a propósito: al lado de una imagen grande, tres miniaturas
 * compiten con ella y no se lee ninguna. Lo que se compara ahí son titulares.
 *
 * Es la parte de arriba de la portada y se ve como una emisión: un solo bloque verde
 * con la cabecera, el titular grande en blanco y la foto a sangre hasta el borde. Las
 * otras tres noticias van debajo, y Última hora como el rótulo inferior de un canal.
 *
 * **Rota** cuando la principal la elige la regla y no la redacción: pasa por las cuatro
 * noticias con `useRotacion`. La foto nueva barre a la anterior de izquierda a derecha
 * y el titular entra con ella. La pieza fijada no rota: fijar es decir «esta manda».
 */

/** Cuántas noticias acompañan a la principal en la columna. */
export const EN_LA_COLUMNA = 3;

/** Lo que tarda la foto saliente en desvanecerse: `se-apertura-sale` en el CSS. */
const DESVANECE_MS = 700;

/** El `sizes` de la foto de la apertura: la mitad de la pantalla, no un tercio. */
const SIZES_APERTURA = "(max-width: 899px) 100vw, 60vw";


/**
 * Si una pieza está fijada **ahora**. `enPortada` lo dice el servidor; la fecha se
 * vuelve a mirar aquí porque una lista servida desde caché puede traer un «sí» de
 * hace horas, y la portada tiene que soltar la pieza sola al vencer, sin esperar a
 * que alguien recargue con suerte.
 */
const fijadaAhora = (p, ahora) =>
  Boolean(p?.enPortada) && p.destacadaHasta instanceof Date && p.destacadaHasta.getTime() > ahora;

const msDe = (p) => Date.parse(p?.fechaIso ?? "") || 0;

/**
 * La principal y las de la columna.
 *
 * `piezas` es la lista entera, de todos los formatos y ya ordenada por fecha: ahí se
 * busca la fijada. `noticias` son las que van a la columna; si no se pasan, se sacan
 * de `piezas`. `fijada` dice si la principal la eligió la redacción o la regla.
 */
export const elegirApertura = (piezas, noticias = null, ahora = Date.now()) => {
  const todas = piezas ?? [];
  const delDia = noticias ?? todas.filter((p) => p.formatoApi === "noticia");

  // Si hay más de una fijada -- el servidor limpia las demás al fijar una, pero una
  // lista cosida de varias páginas puede traer restos -- manda la más reciente.
  const fijada = todas
    .filter((p) => fijadaAhora(p, ahora))
    .sort((a, b) => msDe(b) - msDe(a))[0];

  if (fijada) {
    const secundarias = delDia.filter((n) => n.id !== fijada.id).slice(0, EN_LA_COLUMNA);
    return { principal: fijada, secundarias, fijada: true };
  }

  if (!delDia.length) return { principal: null, secundarias: [], fijada: false };
  const conFoto = delDia.slice(0, 3).find((n) => n.imagenUrl);
  const principal = delDia[0].imagenUrl ? delDia[0] : conFoto ?? delDia[0];
  const secundarias = delDia.filter((n) => n.id !== principal.id).slice(0, EN_LA_COLUMNA);
  return { principal, secundarias, fijada: false };
};

const CAMPOS = {
  imagenUrl: PropTypes.string,
  resumen: PropTypes.string,
  educativo: PropTypes.bool,
};

export const AperturaPortada = ({ principal, secundarias, fijada = false }) => {
  const { t } = useIdioma();
  const conjunto = principal ? [principal, ...secundarias] : [];
  const { indice, saliente, rota, pausado, alternarPausa, eventos } = useRotacion(conjunto, {
    activa: !fijada,
    salidaMs: DESVANECE_MS,
  });

  // La siguiente foto se pide antes de que le toque, con el mismo `srcset` y `sizes` que
  // pinta `CardMedia`: así el navegador elige la misma talla y la encuentra en caché, y
  // el cruce no enseña el relleno de color.
  const siguiente = rota ? conjunto[(indice + 1) % conjunto.length] : null;
  useEffect(() => {
    if (!siguiente?.imagenUrl) return;
    const img = new Image();
    const srcset = imagenSrcSet(siguiente.imagenUrl, ANCHOS, siguiente.imagenAnchoOriginal);
    if (srcset) {
      img.sizes = SIZES_APERTURA;
      img.srcset = srcset;
    }
    img.src = imagenAncho(siguiente.imagenUrl, 1400);
  }, [siguiente?.imagenUrl, siguiente?.imagenAnchoOriginal]);

  if (!principal) return null;
  const actual = rota ? conjunto[Math.min(indice, conjunto.length - 1)] : principal;
  const columna = rota ? conjunto.filter((n) => n.id !== actual.id) : secundarias;
  const cruzando = Boolean(saliente && saliente.id !== actual.id);

  return (
    <section className="se-apertura" aria-labelledby="apertura-titulo" {...eventos}>
      {/* Fijada a mano no es «lo más reciente»: puede ser un informe de hace una
          semana, y el encabezado oculto tiene que decir la verdad al lector de pantalla. */}
      <h2 id="apertura-titulo" className="se-sr-only">
        {fijada ? t("portada.apertura.apertura") : t("portada.apertura.loMasReciente")}
      </h2>
      <div className="se-container se-apertura__marco">
        <article className="se-apertura__principal">
          <div
            key={actual.id}
            className={`se-apertura__cuerpo${cruzando ? " se-apertura__cuerpo--entra" : ""}`}
          >
            <LugarYFecha pieza={actual} clase="se-apertura__meta" />
            <h3 className="se-apertura__titulo">
              <Enlace to={rutaDePieza(actual)}><TituloDePieza pieza={actual} /></Enlace>
            </h3>
            {actual.resumen ? <p className="se-apertura__resumen">{actual.resumen}</p> : null}
          </div>

          {/* La foto, a sangre hasta el borde derecho. La que entra barre a la que sale. */}
          <div className="se-apertura__escena">
            {cruzando ? (
              <div key={`sale-${saliente.id}`} className="se-apertura__media se-apertura__media--sale" aria-hidden="true">
                <CardMedia pieza={saliente} ancho={1400} etiqueta={temaPrincipal(saliente)} sizes={SIZES_APERTURA} />
              </div>
            ) : null}
            <Enlace
              key={actual.id}
              to={rutaDePieza(actual)}
              className={`se-apertura__media${cruzando ? " se-apertura__media--entra" : ""}`}
              aria-hidden="true"
              tabIndex={-1}
            >
              <CardMedia pieza={actual} ancho={1400} etiqueta={temaPrincipal(actual)} sizes={SIZES_APERTURA} />
            </Enlace>
            {rota ? (
              <div className="se-apertura__mando">
                {/* Qué noticia de las cuatro está en pantalla, y la pausa. */}
                <ol className="se-apertura__puntos" aria-hidden="true">
                  {conjunto.map((n, i) => (
                    <li key={n.id} className={i === indice ? "se-apertura__punto--actual" : undefined} />
                  ))}
                </ol>
                <button
                  type="button"
                  className="se-apertura__pausa"
                  aria-pressed={pausado}
                  aria-label={t("portada.apertura.pausar")}
                  onClick={alternarPausa}
                >
                  <IconoPausa pausado={pausado} />
                </button>
              </div>
            ) : null}
          </div>
        </article>

        {columna.length ? (
          <ol className="se-apertura__columna" aria-label={t("portada.apertura.otrasNoticias")}>
            {columna.map((n) => (
              <li key={n.id} className="se-apertura__item">
                <LugarYFecha pieza={n} clase="se-apertura__meta" />
                <Enlace className="se-apertura__enlace" to={rutaDePieza(n)}>
                  <TituloDePieza pieza={n} />
                </Enlace>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      {/* Última hora, como el rótulo inferior de un canal: no pinta nada sin titulares
          recientes. */}
      <UltimaHoraTarjeta variante="rotulo" />
    </section>
  );
};

AperturaPortada.propTypes = {
  principal: piezaShape(CAMPOS),
  secundarias: listaDePiezas(CAMPOS),
  fijada: PropTypes.bool,
};

export default AperturaPortada;
