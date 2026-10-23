import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { prefiereQuieto } from "../../lib/movimiento";
import { imagenAncho, rutaDePieza } from "../../lib/pieza";
import { CardMedia } from "./CardMedia";
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
 * **Rota.** Desde el 23-oct-2026, cuando la principal la elige la regla (no la
 * redacción), la apertura va pasando por las cuatro noticias -- la principal y las tres
 * de la columna -- con el mismo mecanismo que la tarjeta de Última hora: un intervalo,
 * pausa con el ratón o el foco encima, un botón de pausa, y quieta del todo si el
 * lector pidió menos movimiento. La foto saliente se desvanece sobre la que entra, que
 * se asienta desde un poco más grande; el texto sube con ella. La columna enseña las
 * otras tres: la que está en grande sale de la lista y entra la que acaba de dejar de
 * estarlo, así que nunca se lee el mismo titular dos veces en la misma pantalla (en el
 * teléfono la lista va justo debajo del titular grande, y repetirlo se notaba). Cada 8 s
 * y no cada 4 como Última hora: dos cosas al mismo compás en la misma pantalla se
 * anulan. La pieza fijada por la redacción no rota: fijar es decir «esta manda».
 */

/** Cuántas noticias acompañan a la principal en la columna. */
export const EN_LA_COLUMNA = 3;

/** Cada cuánto cambia la principal cuando rota. */
export const CADA_MS = 8000;

/** Lo que tarda la foto saliente en desvanecerse: `se-apertura-sale` en el CSS. */
const DESVANECE_MS = 700;

/** El `sizes` de la foto de la apertura: la mitad de la pantalla, no un tercio. */
const SIZES_APERTURA = "(max-width: 899px) 92vw, 56vw";

/** A partir de cuántos caracteres la entradilla se parte en dos columnas. */
const ENTRADILLA_DOBLE = 260;

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
  const [quieto] = useState(prefiereQuieto);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [encima, setEncima] = useState(false);
  // La pieza cuya foto se está desvaneciendo, mientras se desvanece. `null` el resto.
  const [saliente, setSaliente] = useState(null);

  const conjunto = principal ? [principal, ...secundarias] : [];
  const rota = !fijada && !quieto && conjunto.length > 1;
  const parado = !rota || pausado || encima;

  useEffect(() => {
    if (indice >= conjunto.length) setIndice(0);
  }, [indice, conjunto.length]);

  // Por referencia, como en Última hora: `conjunto` es otra lista en cada render, y
  // como dependencia reiniciaría el intervalo a cada rato.
  const conjuntoRef = useRef(conjunto);
  conjuntoRef.current = conjunto;
  const indiceRef = useRef(indice);
  indiceRef.current = indice;

  useEffect(() => {
    if (parado) return undefined;
    const id = setInterval(() => {
      const lista = conjuntoRef.current;
      const i = Math.min(indiceRef.current, lista.length - 1);
      setSaliente(lista[i] ?? null);
      setIndice((i + 1) % lista.length);
    }, CADA_MS);
    return () => clearInterval(id);
  }, [parado, conjunto.length]);

  useEffect(() => {
    if (!saliente) return undefined;
    const id = setTimeout(() => setSaliente(null), DESVANECE_MS);
    return () => clearTimeout(id);
  }, [saliente]);

  // La siguiente foto se pide antes de que le toque: sin esto el cruce enseñaba el
  // relleno de color un momento y luego la foto de golpe. El mismo `srcset` y `sizes`
  // que pinta `CardMedia`, para que el navegador elija la misma talla y la encuentre
  // en caché.
  useEffect(() => {
    if (!rota) return;
    const lista = conjuntoRef.current;
    const siguiente = lista[(indice + 1) % lista.length];
    if (!siguiente?.imagenUrl) return;
    const img = new Image();
    img.sizes = SIZES_APERTURA;
    img.src = imagenAncho(siguiente.imagenUrl, 1400);
  }, [rota, indice]);

  if (!principal) return null;
  const actual = rota ? conjunto[Math.min(indice, conjunto.length - 1)] : principal;
  const columna = rota ? conjunto.filter((n) => n.id !== actual.id) : secundarias;
  const cruzando = Boolean(saliente && saliente.id !== actual.id);
  const lugar = geoPrincipal(actual);
  const entradillaDoble = (actual.resumen?.length ?? 0) > ENTRADILLA_DOBLE;

  return (
    <section
      className="se-section se-apertura"
      aria-labelledby="apertura-titulo"
      onMouseEnter={rota ? () => setEncima(true) : undefined}
      onMouseLeave={rota ? () => setEncima(false) : undefined}
      onFocus={rota ? () => setEncima(true) : undefined}
      onBlur={
        rota
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setEncima(false);
            }
          : undefined
      }
    >
      <div className="se-container">
        {/* Fijada a mano no es «lo más reciente»: puede ser un informe de hace una
            semana, y el encabezado oculto tiene que decir la verdad al lector de
            pantalla. */}
        <h2 id="apertura-titulo" className="se-sr-only">
          {fijada ? t("portada.apertura.apertura") : t("portada.apertura.loMasReciente")}
        </h2>
        <div className={`se-apertura__rejilla${columna.length ? "" : " se-apertura__rejilla--sola"}`}>
          <article className="se-apertura__principal">
            <div className="se-apertura__escena">
              {/* La foto que se va, encima de la que entra y fuera del flujo, para que
                  la escena mida lo mismo durante el cruce. */}
              {cruzando ? (
                <div
                  key={`sale-${saliente.id}`}
                  className="se-apertura__media se-apertura__media--sale"
                  aria-hidden="true"
                >
                  <CardMedia
                    pieza={saliente}
                    ancho={1400}
                    etiqueta={temaPrincipal(saliente)}
                    sizes={SIZES_APERTURA}
                  />
                </div>
              ) : null}
              <Enlace
                key={actual.id}
                to={rutaDePieza(actual)}
                className={`se-apertura__media${cruzando ? " se-apertura__media--entra" : ""}`}
                aria-hidden="true"
                tabIndex={-1}
              >
                {/* Su propio `sizes`: con el de las tarjetas (un tercio de pantalla) el
                    navegador pedía la talla pequeña para una imagen que ocupa la mitad,
                    y en la apertura se veía blanda. */}
                <CardMedia
                  pieza={actual}
                  ancho={1400}
                  etiqueta={temaPrincipal(actual)}
                  sizes={SIZES_APERTURA}
                />
              </Enlace>
            </div>
            <div
              key={actual.id}
              className={`se-apertura__cuerpo${cruzando ? " se-apertura__cuerpo--entra" : ""}`}
            >
              <div className="se-apertura__linea">
                <span className="se-apertura__meta">
                  <span className="se-meta__lugar">{lugar}</span>
                  {actual.fecha ? <span aria-hidden="true"> · </span> : null}
                  {actual.fecha}
                </span>
                {rota ? (
                  <button
                    type="button"
                    className="se-apertura__pausa"
                    aria-pressed={pausado}
                    aria-label={pausado ? t("portada.apertura.reanudar") : t("portada.apertura.pausar")}
                    onClick={() => setPausado((p) => !p)}
                  >
                    <IconoPausa pausado={pausado} />
                  </button>
                ) : null}
              </div>
              <h3 className="se-apertura__titulo">
                <Enlace to={rutaDePieza(actual)}><TituloDePieza pieza={actual} /></Enlace>
              </h3>
              {actual.resumen ? (
                <p className={`se-apertura__resumen${entradillaDoble ? " se-apertura__resumen--doble" : ""}`}>
                  {actual.resumen}
                </p>
              ) : null}
            </div>
          </article>

          {columna.length ? (
            <div className="se-apertura__lado">
            {/* La última hora, encima de los titulares de la apertura (maqueta del 21-oct-2026).
                No pinta nada si no hay titulares recientes, y la columna queda como antes. */}
            <UltimaHoraTarjeta />
            <ol className="se-apertura__columna" aria-label={t("portada.apertura.otrasNoticias")}>
              {columna.map((n) => (
                <li key={n.id} className="se-apertura__item">
                  <span className="se-apertura__meta">
                    <span className="se-meta__lugar">{geoPrincipal(n)}</span>
                    {n.fecha ? <span aria-hidden="true"> · </span> : null}
                    {n.fecha}
                  </span>
                  <Enlace className="se-apertura__enlace" to={rutaDePieza(n)}>
                    <TituloDePieza pieza={n} />
                  </Enlace>
                </li>
              ))}
            </ol>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

AperturaPortada.propTypes = {
  principal: piezaShape(CAMPOS),
  secundarias: listaDePiezas(CAMPOS),
  fijada: PropTypes.bool,
};

export default AperturaPortada;
