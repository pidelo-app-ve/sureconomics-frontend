import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha } from "../../i18n/motor";
import { temaPrincipal } from "../../lib/contentFilter";
import { imagenAncho, imagenSrcSet, rutaDeFormato, rutaDePieza } from "../../lib/pieza";
import { useRotacion } from "../../hooks/useRotacion";
import { LugarYFecha } from "./LugarYFecha";
import { ANCHOS, CardMedia } from "./CardMedia";
import { CintaMundial } from "./MarketTicker";
import { TablaDeMonedas, useMonedas } from "../monedas/TablaDeMonedas";
import { listaDePiezas, piezaShape } from "./piezaShape";
import { TituloDePieza } from "../content/TituloDePieza";
import { IconoPausa } from "../comun/IconoPausa";
import { UltimaHoraColumna } from "../titulares/UltimaHoraColumna";
import "./primeraPlana.css";

/**
 * La primera plana: tres columnas de diario separadas por filetes.
 *
 * - **Izquierda, Última hora**: los titulares con su hora. Sin titulares del día, las
 *   noticias más recientes (`UltimaHoraColumna`).
 * - **Centro, la que manda**: la noticia principal con su foto, titular grande y
 *   bajada, y debajo otras tres. Rota entre las cuatro cuando la elige la regla; la
 *   foto nueva barre a la anterior. La fijada por la redacción no rota.
 * - **Derecha, opinión e indicadores**: la editorial del día, dos análisis con firma y
 *   las monedas de la región.
 *
 * En el teléfono se apilan: Última hora (tres titulares), la que manda con las otras
 * debajo, la opinión y las monedas. En escritorio la rejilla las coloca por áreas.
 *
 * **Cuál manda.** La redacción puede fijarla desde el editor («Abrir la portada con
 * esta pieza»), de cualquier formato, mientras no venza `destacada_hasta`. Sin nada
 * fijado se elige entre las noticias: la más reciente, salvo que entre las tres
 * últimas haya una con foto y ella no; una apertura con imagen se lee como apertura.
 */

/** Cuántas noticias acompañan a la principal bajo ella. */
export const EN_LA_COLUMNA = 3;

/** Lo que tarda la foto saliente en irse: `se-plana-barre` en el CSS. */
const SALIDA_MS = 900;

/** Cuántas monedas caben en la columna derecha sin alargarla más que el centro. */
const MONEDAS = 6;

const SIZES_PRINCIPAL = "(max-width: 959px) 100vw, 50vw";

/**
 * Si una pieza está fijada **ahora**. La fecha se vuelve a mirar aquí porque una lista
 * servida desde caché puede traer un «sí» de hace horas.
 */
const fijadaAhora = (p, ahora) =>
  Boolean(p?.enPortada) && p.destacadaHasta instanceof Date && p.destacadaHasta.getTime() > ahora;

const msDe = (p) => Date.parse(p?.fechaIso ?? "") || 0;

/**
 * La principal y las que van bajo ella. `piezas` es la lista entera, de todos los
 * formatos y ordenada por fecha: ahí se busca la fijada.
 */
export const elegirApertura = (piezas, noticias = null, ahora = Date.now()) => {
  const todas = piezas ?? [];
  const delDia = noticias ?? todas.filter((p) => p.formatoApi === "noticia");

  // Con más de una fijada (restos de una lista cosida de varias páginas) manda la más reciente.
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

const Monedas = ({ monedas }) => {
  const { t } = useIdioma();
  return (
    <section className="se-plana__bloque se-plana__monedas" aria-labelledby="plana-monedas">
      <h2 id="plana-monedas" className="se-plana__cabeza">
        <Enlace to="/monedas">{t("portada.franja.monedas")}</Enlace>
      </h2>
      <TablaDeMonedas monedas={monedas} />
      <Enlace className="se-plana__mas" to="/monedas">
        {t("portada.franja.todasLasMonedas")}
      </Enlace>
      {/* Los índices del mundo: en escritorio van en la cinta; aquí solo en el teléfono. */}
      <div className="se-plana__mundo">
        <span className="se-plana__mundo-rotulo">{t("portada.franja.mundo")}</span>
        <CintaMundial tema="light" solo="estrecho" />
      </div>
    </section>
  );
};

Monedas.propTypes = {
  monedas: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const Opinion = ({ editorial, analisis }) => {
  const { t } = useIdioma();
  if (!editorial && !analisis.length) return null;
  return (
    <section className="se-plana__bloque se-plana__opinion" aria-labelledby="plana-opinion">
      <h2 id="plana-opinion" className="se-plana__cabeza">
        <Enlace to={rutaDeFormato("editorial")}>{t("portada.plana.opinion")}</Enlace>
      </h2>
      {editorial ? (
        <article className="se-plana__editorial">
          <h3 className="se-plana__titulo-editorial">
            <Enlace to={rutaDePieza(editorial)}>
              <TituloDePieza pieza={editorial} />
            </Enlace>
          </h3>
          <p className="se-plana__firma">{t("portada.editorialDelDia.titulo")}</p>
          {editorial.entrada || editorial.resumen ? (
            <p className="se-plana__bajada">{editorial.entrada || editorial.resumen}</p>
          ) : null}
        </article>
      ) : null}
      {analisis.map((a) => (
        <article key={a.id} className="se-plana__analisis">
          <h3 className="se-plana__titulo-analisis">
            <Enlace to={rutaDePieza(a)}>
              <TituloDePieza pieza={a} />
            </Enlace>
          </h3>
          {a.autor ? <p className="se-plana__firma">{t("portada.tarjeta.por", { autor: a.autor })}</p> : null}
        </article>
      ))}
    </section>
  );
};

Opinion.propTypes = {
  editorial: piezaShape({ entrada: PropTypes.string, resumen: PropTypes.string }),
  analisis: listaDePiezas({ autor: PropTypes.string }).isRequired,
};

export const PrimeraPlana = ({ principal, secundarias, fijada = false, editorial = null, analisis = [], recientes = [] }) => {
  const { t, lang } = useIdioma();
  const [hoyIso] = useState(() => new Date().toISOString());
  const monedas = useMonedas(MONEDAS);
  const conjunto = principal ? [principal, ...secundarias] : [];
  const { indice, saliente, rota, pausado, alternarPausa, eventos } = useRotacion(conjunto, {
    activa: !fijada,
    salidaMs: SALIDA_MS,
  });

  // La siguiente foto se pide antes de que le toque, con el mismo `srcset` y `sizes`
  // que pinta `CardMedia`: el navegador la encuentra en caché y el barrido no enseña
  // el relleno de color.
  const siguiente = rota ? conjunto[(indice + 1) % conjunto.length] : null;
  useEffect(() => {
    if (!siguiente?.imagenUrl) return;
    const img = new Image();
    const srcset = imagenSrcSet(siguiente.imagenUrl, ANCHOS, siguiente.imagenAnchoOriginal);
    if (srcset) {
      img.sizes = SIZES_PRINCIPAL;
      img.srcset = srcset;
    }
    img.src = imagenAncho(siguiente.imagenUrl, 1200);
  }, [siguiente?.imagenUrl, siguiente?.imagenAnchoOriginal]);

  if (!principal) return null;
  const actual = rota ? conjunto[Math.min(indice, conjunto.length - 1)] : principal;
  const debajo = rota ? conjunto.filter((n) => n.id !== actual.id) : secundarias;
  const cruzando = Boolean(saliente && saliente.id !== actual.id);

  return (
    <section className="se-plana" aria-labelledby="plana-titulo">
      <h2 id="plana-titulo" className="se-sr-only">
        {fijada ? t("portada.apertura.apertura") : t("portada.apertura.loMasReciente")}
      </h2>
      {/* La fecha de la edición, como la lleva un diario bajo la cabecera. */}
      <div className="se-container">
        <p className="se-plana__fecha">
          <time dateTime={hoyIso}>{formatearFecha(hoyIso, "larga", lang, { weekday: "long" })}</time>
        </p>
      </div>
      <div className="se-container se-plana__rejilla">
        <UltimaHoraColumna recientes={recientes} />

        <div className="se-plana__centro" {...eventos}>
          <article className="se-plana__principal">
            <div className="se-plana__foto">
              {cruzando ? (
                <div key={`sale-${saliente.id}`} className="se-plana__media se-plana__media--sale" aria-hidden="true">
                  <CardMedia pieza={saliente} ancho={1200} etiqueta={temaPrincipal(saliente)} sizes={SIZES_PRINCIPAL} />
                </div>
              ) : null}
              <Enlace
                key={actual.id}
                to={rutaDePieza(actual)}
                className={`se-plana__media${cruzando ? " se-plana__media--entra" : ""}`}
                aria-hidden="true"
                tabIndex={-1}
              >
                <CardMedia pieza={actual} ancho={1200} etiqueta={temaPrincipal(actual)} sizes={SIZES_PRINCIPAL} />
              </Enlace>
            </div>
            <div key={actual.id} className={`se-plana__texto${cruzando ? " se-plana__texto--entra" : ""}`}>
              <h3 className={`se-plana__titulo${actual.formatoApi === "informe" ? " se-plana__titulo--a-fondo" : ""}`}>
                <Enlace to={rutaDePieza(actual)}>
                  <TituloDePieza pieza={actual} />
                </Enlace>
              </h3>
              {actual.entrada || actual.resumen ? (
                <p className="se-plana__resumen">{actual.entrada || actual.resumen}</p>
              ) : null}
              <p className="se-plana__meta">
                <LugarYFecha pieza={actual} clase="se-plana__cuando" />
                {actual.autor ? <span className="se-plana__autor">{t("portada.tarjeta.por", { autor: actual.autor })}</span> : null}
              </p>
            </div>
            {rota ? (
              <div className="se-plana__mando">
                <ol className="se-plana__puntos" aria-hidden="true">
                  {conjunto.map((n, i) => (
                    <li key={n.id} className={i === indice ? "se-plana__punto--actual" : undefined} />
                  ))}
                </ol>
                <button
                  type="button"
                  className="se-plana__pausa"
                  aria-pressed={pausado}
                  aria-label={t("portada.apertura.pausar")}
                  onClick={alternarPausa}
                >
                  <IconoPausa pausado={pausado} />
                </button>
              </div>
            ) : null}
          </article>

          {debajo.length ? (
            <ol className="se-plana__otras" aria-label={t("portada.apertura.otrasNoticias")}>
              {debajo.map((n) => (
                <li key={n.id} className="se-plana__otra">
                  <Enlace className="se-plana__otra-titulo" to={rutaDePieza(n)}>
                    <TituloDePieza pieza={n} />
                  </Enlace>
                  <LugarYFecha pieza={n} clase="se-plana__cuando" />
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        <Opinion editorial={editorial} analisis={analisis} />
        <Monedas monedas={monedas} />
      </div>
    </section>
  );
};

const CAMPOS = { imagenUrl: PropTypes.string, resumen: PropTypes.string, entrada: PropTypes.string, autor: PropTypes.string };

PrimeraPlana.propTypes = {
  principal: piezaShape(CAMPOS),
  secundarias: listaDePiezas(CAMPOS),
  fijada: PropTypes.bool,
  editorial: piezaShape({ entrada: PropTypes.string, resumen: PropTypes.string }),
  analisis: listaDePiezas({ autor: PropTypes.string }),
  recientes: listaDePiezas({}),
};

export default PrimeraPlana;
