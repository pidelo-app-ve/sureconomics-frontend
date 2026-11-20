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
import { AperturaMoneda, TablaDeMonedas, useMonedas } from "../../features/monedas";
import { Retrato } from "../piece/PieceByline";
import { listaDePiezas, piezaShape } from "./piezaShape";
import { TituloDePieza } from "../content/TituloDePieza";
import { IconoPausa } from "../comun/IconoPausa";
import { UltimaHoraColumna } from "../../features/titulares";
import { NuestroCanal } from "../canal/NuestroCanal";
import { AperturaShort } from "../canal/AperturaShort";
import { esShort, idDeYoutube } from "../../lib/youtube";
import { alLlegarLaFoto, fotoPrincipalLista, trasLaFoto } from "../../lib/trasLaFoto";
import { EN_LA_COLUMNA, SIZES_PRINCIPAL, elegirApertura, precargaDeLaApertura } from "../../lib/apertura";
import { EspacioPublicitario } from "../publicidad";
import { ESPACIOS } from "../../services/publicidadService";
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
 * - **«Nuestro canal»**, el último video del canal de YouTube: bajo Última hora en
 *   escritorio, detrás de la apertura en el teléfono.
 *
 * En el teléfono se apilan: Última hora (tres titulares), la que manda con las otras
 * debajo, la opinión y las monedas. En escritorio la rejilla las coloca por áreas.
 *
 * **Cuál manda.** La redacción puede fijarla desde el editor («Abrir la portada con
 * esta pieza»), de cualquier formato, mientras no venza `destacada_hasta`. Sin nada
 * fijado se elige entre las noticias: la más reciente, salvo que entre las tres
 * últimas haya una con foto y ella no; una apertura con imagen se lee como apertura.
 */

// Cuál manda y qué foto se precarga viven en `lib/apertura.js`: también los usa
// `api/portada.js`, que sirve el HTML de la portada. Se reexportan para quien los
// importaba de aquí.
export { EN_LA_COLUMNA, elegirApertura };

/** Lo que tarda la foto saliente en irse: `se-plana-barre` en el CSS. */
const SALIDA_MS = 900;

/** Cuántas monedas caben en la columna derecha sin alargarla más que el centro. */
const MONEDAS = 6;

/** Si la apertura abre con un short en vertical (`AperturaShort`) y no con su foto. */
const abreConShort = (pieza, rota) => !rota && esShort(pieza?.videoUrl);

const precargadas = new Set();
/** Los `<link rel=preload>` puestos en la cabecera, para quitarlos cuando ya no sirven. */
const enlaces = new Set();

/** Quita las precargas: al llegar la foto ya no hacen nada, y fuera de la portada, menos. */
export const quitarPrecargas = () => {
  enlaces.forEach((enlace) => enlace.remove());
  enlaces.clear();
};

/**
 * La foto de la apertura, pedida en cuanto se sabe cuál es: al llegar la primera página
 * (`usePieces`), y no cuando React llega a pintarla, después de armar la portada entera
 * (en un teléfono lento, un rato que no se ha medido). Con el mismo `srcset` y `sizes`
 * que pinta `CardMedia`, así que el navegador elige la misma talla y la `<img>` la
 * encuentra ya pedida.
 *
 * Sin `href` cuando hay `srcset`, a propósito: un navegador que no entiende
 * `imagesrcset` se salta la precarga entera, en vez de bajar la talla grande y luego otra
 * para la `<img>`. Ante la duda (un short, sin foto) no se precarga nada.
 *
 * El enlace se quita al llegar la foto (`alLlegarLaFoto`) o al salir de la portada
 * (`PrimeraPlana` al desmontarse).
 */
export const precargarApertura = (piezas) => {
  if (typeof document === "undefined") return;
  const precarga = precargaDeLaApertura(elegirApertura(piezas).principal);
  if (!precarga || precargadas.has(precarga.clave)) return;
  precargadas.add(precarga.clave);
  const enlace = document.createElement("link");
  enlace.setAttribute("rel", "preload");
  enlace.setAttribute("as", "image");
  if (precarga.imagesrcset) {
    enlace.setAttribute("imagesrcset", precarga.imagesrcset);
    enlace.setAttribute("imagesizes", precarga.imagesizes);
  } else {
    enlace.setAttribute("href", precarga.href);
  }
  enlace.setAttribute("fetchpriority", "high");
  document.head.appendChild(enlace);
  enlaces.add(enlace);
  alLlegarLaFoto(quitarPrecargas);
};

const Monedas = ({ monedas }) => {
  const { t } = useIdioma();
  return (
    <section className="se-plana__bloque se-plana__monedas" aria-labelledby="plana-monedas">
      <h2 id="plana-monedas" className="se-plana__cabeza">
        <Enlace to="/monedas">{t("portada.franja.monedas")}</Enlace>
      </h2>
      <p className="se-plana__monedas-nota">{t("monedas.masMovidas")}</p>
      <TablaDeMonedas monedas={monedas} />
      <Enlace className="se-plana__mas" to="/monedas">
        {t("portada.franja.todasLasMonedas")}
      </Enlace>
      {/* Una tarjeta chica de publicidad, en el blanco que queda bajo las monedas. Solo
          la pide la portada en escritorio; sin campaña no pinta nada. */}
      <EspacioPublicitario espacio={ESPACIOS.PORTADA_TARJETA} className="se-plana__tarjeta-ad" />
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
        <article key={a.id} className={`se-plana__analisis${a.autorFoto ? " se-plana__analisis--con-retrato" : ""}`}>
          {/* El retrato de quien firma, si la pieza lo trae: cuadrado y en gris, como
              la columna de un diario. Sin retrato, el texto ocupa todo el ancho. */}
          {a.autorFoto ? <Retrato className="se-plana__retrato" url={a.autorFoto} ancho={a.autorFotoAncho} alt="" width="44" height="44" loading="lazy" decoding="async" /> : null}
          <div className="se-plana__analisis-texto">
            <h3 className="se-plana__titulo-analisis">
              <Enlace to={rutaDePieza(a)}>
                <TituloDePieza pieza={a} />
              </Enlace>
            </h3>
            {a.autor ? <p className="se-plana__firma">{t("portada.tarjeta.por", { autor: a.autor })}</p> : null}
          </div>
        </article>
      ))}
    </section>
  );
};

Opinion.propTypes = {
  editorial: piezaShape({ entrada: PropTypes.string, resumen: PropTypes.string }),
  // `listaDePiezas` ya es obligatoria; con otro `.isRequired` encima el validador era
  // `undefined` y React lo avisaba en la consola de cada visitante.
  analisis: listaDePiezas({ autor: PropTypes.string, autorFoto: PropTypes.string }),
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
  // el relleno de color. Pero después de la que abre la portada (`trasLaFoto`): pedida a
  // la vez, le quitaba ancho de banda a la foto que Google mide. Le toca a los segundos.
  const siguiente = rota ? conjunto[(indice + 1) % conjunto.length] : null;
  useEffect(() => {
    if (!siguiente?.imagenUrl) return undefined;
    let vigente = true;
    trasLaFoto().then(() => {
      if (!vigente) return;
      const img = new Image();
      const srcset = imagenSrcSet(siguiente.imagenUrl, ANCHOS, siguiente.imagenAnchoOriginal);
      if (srcset) {
        img.sizes = SIZES_PRINCIPAL;
        img.srcset = srcset;
      }
      img.src = imagenAncho(siguiente.imagenUrl, 1200);
    });
    return () => {
      vigente = false;
    };
  }, [siguiente?.imagenUrl, siguiente?.imagenAnchoOriginal]);

  // Fuera de la portada, la precarga de su foto ya no tiene a quién servir.
  useEffect(() => quitarPrecargas, []);

  // Lo de debajo del pliegue espera a la foto de la apertura (`trasLaFoto`), que avisa al
  // cargar (`CardMedia`). Una apertura sin foto, o con su short, no tiene a quién
  // esperar: avisa aquí.
  const sinFoto = Boolean(principal) && (!principal.imagenUrl || abreConShort(principal, rota));
  useEffect(() => {
    if (sinFoto) fotoPrincipalLista();
  }, [sinFoto]);

  if (!principal) return null;
  const actual = rota ? conjunto[Math.min(indice, conjunto.length - 1)] : principal;
  const debajo = rota ? conjunto.filter((n) => n.id !== actual.id) : secundarias;
  const cruzando = Boolean(saliente && saliente.id !== actual.id);
  // Bajo la apertura, una o dos piezas del mismo tema, elegidas entre lo que la
  // portada ya cargó: el contexto de la noticia, sin pedir nada más. Como el
  // «Related» de Bloomberg, pero con un filete y no con una caja.
  const contexto = actual.temaSlug
    ? recientes.filter((p) => p.id !== actual.id && p.temaSlug === actual.temaSlug).slice(0, 2)
    : [];
  // Una apertura cuyo video es un short abre en vertical (`AperturaShort`). Solo quieta:
  // un video que se mueve en medio de la rotación de cuatro piezas sería un mareo, así
  // que para salir así la redacción la fija.
  const short = abreConShort(actual, rota) ? idDeYoutube(actual.videoUrl) : null;

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
          <article className={`se-plana__principal${short ? " se-plana__principal--short" : ""}`}>
            {short ? <AperturaShort pieza={actual} id={short} /> : (
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
                {/* La foto que abre la portada: la única que se pide con prioridad. */}
                <CardMedia pieza={actual} ancho={1200} etiqueta={temaPrincipal(actual)} sizes={SIZES_PRINCIPAL} prioridad />
              </Enlace>
            </div>
            )}
            <div key={actual.id} className={`se-plana__texto${cruzando ? " se-plana__texto--entra" : ""}`}>
              <h3 className={`se-plana__titulo${actual.formatoApi === "informe" ? " se-plana__titulo--a-fondo" : ""}`}>
                <Enlace to={rutaDePieza(actual)}>
                  <TituloDePieza pieza={actual} />
                </Enlace>
              </h3>
              {actual.entrada || actual.resumen ? (
                <p className="se-plana__resumen">{actual.entrada || actual.resumen}</p>
              ) : null}
              {/* Si la pieza habla de una moneda: su ficha de hoy y la gráfica de 30 días. */}
              {actual.moneda ? <AperturaMoneda codigo={actual.moneda} /> : null}
              <p className="se-plana__meta">
                <LugarYFecha pieza={actual} clase="se-plana__cuando" />
                {actual.autor ? <span className="se-plana__autor">{t("portada.tarjeta.por", { autor: actual.autor })}</span> : null}
              </p>
              {contexto.length ? (
                <div className="se-plana__contexto">
                  <span className="se-plana__contexto-rotulo">{t("portada.plana.contexto")}</span>
                  <ul className="se-plana__contexto-lista">
                    {contexto.map((p) => (
                      <li key={p.id}>
                        <Enlace to={rutaDePieza(p)}>
                          <TituloDePieza pieza={p} />
                        </Enlace>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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

        {/* El último video del canal: en escritorio, bajo Última hora (la columna derecha
            sigue siendo de la opinión); en el teléfono, detrás de la apertura, para no
            empujarla hacia abajo. Sin canal, no pinta nada. */}
        <NuestroCanal />
        <Opinion editorial={editorial} analisis={analisis} />
        <Monedas monedas={monedas} />
      </div>
    </section>
  );
};

const CAMPOS = { imagenUrl: PropTypes.string, resumen: PropTypes.string, entrada: PropTypes.string, autor: PropTypes.string, videoUrl: PropTypes.string, moneda: PropTypes.string };

PrimeraPlana.propTypes = {
  principal: piezaShape(CAMPOS),
  secundarias: listaDePiezas(CAMPOS),
  fijada: PropTypes.bool,
  editorial: piezaShape({ entrada: PropTypes.string, resumen: PropTypes.string }),
  analisis: listaDePiezas({ autor: PropTypes.string }),
  recientes: listaDePiezas({ temaSlug: PropTypes.string }),
};

export default PrimeraPlana;
