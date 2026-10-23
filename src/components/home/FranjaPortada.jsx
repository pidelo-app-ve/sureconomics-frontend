import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha, formatearNumero } from "../../i18n/motor";
import { porDolar } from "../../lib/monedas";
import { rutaDePieza } from "../../lib/pieza";
import { getMonedas } from "../../services/monedasService";
import { TituloDePieza } from "../content/TituloDePieza";
import { listaDePiezas } from "./piezaShape";
import { CintaMundial } from "./MarketTicker";

/**
 * La franja bajo la apertura: tres columnas de diario, como la segunda maqueta de la
 * redacción (23-oct-2026).
 *
 * - **Últimas noticias**: las que vienen después de las de la apertura, con su hora.
 *   Una lista densa y no tarjetas: lo que se compara aquí son titulares.
 * - **Análisis**: los artículos más recientes, con firma y un párrafo.
 * - **Monedas**: seis cotizaciones de /monedas, que hasta hoy no tenía enlace desde
 *   el sitio. La misma regla del cintillo: un dato viejo o sin valor no se pinta.
 * - **Mercados del mundo**: la cuarta fila, a lo ancho, con el widget de TradingView
 *   (índices, oro, Brent, bitcoin). Salió de la cinta de arriba, donde la hacía alta y
 *   pesada; aquí, bajo las monedas, es contexto de mercado y no mástil.
 *
 * Cada columna sólo existe si tiene con qué llenarse; la franja entera se calla si no
 * hay nada. Las monedas se piden aquí y no en la portada porque son un dato aparte
 * del contenido: si fallan, la franja sigue con las otras dos columnas.
 */

/** Cuántas cotizaciones caben en la columna sin que se alargue más que las otras. */
const MONEDAS_EN_FRANJA = 6;

/** La hora si la pieza es de hoy; si no, día y mes («6 ago»): aquí lo que importa es
 *  lo reciente, y el año es ruido en una columna estrecha. */
const cuando = (pieza, ahora) => {
  const momento = Date.parse(pieza.fechaIso ?? "");
  if (!momento) return pieza.fecha ?? "";
  const hoy = new Date(ahora);
  const esa = new Date(momento);
  const mismoDia =
    hoy.getFullYear() === esa.getFullYear() &&
    hoy.getMonth() === esa.getMonth() &&
    hoy.getDate() === esa.getDate();
  return formatearFecha(esa, mismoDia ? "hora" : "diaMes");
};

export const FranjaPortada = ({ noticias, analisis }) => {
  const { t, lang } = useIdioma();
  const [monedas, setMonedas] = useState([]);

  useEffect(() => {
    let vivo = true;
    getMonedas()
      .then((datos) => {
        if (!vivo) return;
        const conDato = (datos?.monedas ?? []).filter((m) => m.valor !== null && !m.vieja);
        setMonedas(conDato.slice(0, MONEDAS_EN_FRANJA));
      })
      .catch(() => {
        /* Sin monedas la franja sigue con las otras columnas. */
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (!noticias.length && !analisis.length && !monedas.length) return null;
  const ahora = Date.now();

  return (
    <section className="se-section se-franja" aria-label={t("portada.franja.region")}>
      <div className="se-container">
        <div className="se-franja__rejilla">
          {noticias.length ? (
            <div className="se-franja__celda se-franja__celda--noticias">
              <h2 className="se-franja__titulo">
                <Enlace to="/articulos?formato=noticia">{t("portada.franja.ultimasNoticias")}</Enlace>
              </h2>
              <ol className="se-franja__lista">
                {noticias.map((n) => (
                  <li key={n.id} className="se-franja__nota">
                    <time className="se-franja__hora" dateTime={n.fechaIso ?? undefined}>
                      {cuando(n, ahora)}
                    </time>
                    <Enlace to={rutaDePieza(n)} className="se-franja__enlace">
                      <TituloDePieza pieza={n} />
                    </Enlace>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {analisis.length ? (
            <div className="se-franja__celda se-franja__celda--analisis">
              <h2 className="se-franja__titulo">
                <Enlace to="/articulos?formato=articulo">{t("portada.franja.analisis")}</Enlace>
              </h2>
              {analisis.map((a) => (
                <article key={a.id} className="se-franja__analisis">
                  <h3 className="se-franja__analisis-titulo">
                    <Enlace to={rutaDePieza(a)}>
                      <TituloDePieza pieza={a} />
                    </Enlace>
                  </h3>
                  {a.autor ? <p className="se-franja__autor">{a.autor}</p> : null}
                  {a.resumen ? <p className="se-franja__resumen">{a.resumen}</p> : null}
                </article>
              ))}
            </div>
          ) : null}

          {monedas.length ? (
            <div className="se-franja__celda se-franja__celda--monedas">
              <h2 className="se-franja__titulo">
                <Enlace to="/monedas">{t("portada.franja.monedas")}</Enlace>
              </h2>
              <dl className="se-franja__monedas">
                {monedas.map((m) => (
                  <div key={m.codigo} className="se-franja__moneda">
                    <dt className="se-franja__moneda-nombre">
                      <span className="se-franja__codigo">{m.codigo}</span>
                      <span className="se-franja__nombre">{t(`monedas.nombres.${m.codigo}`)}</span>
                    </dt>
                    <dd className="se-franja__moneda-dato">
                      <span className="se-franja__valor">{porDolar(m.valor, lang)}</span>
                      {typeof m.variacion === "number" && !m.fija ? (
                        <span className={`se-franja__var se-franja__var--${m.direccion}`}>
                          {m.variacion > 0 ? "+" : ""}
                          {formatearNumero(m.variacion, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </span>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="se-franja__pie">
                <Enlace to="/monedas">{t("portada.franja.todasLasMonedas")}</Enlace>
              </p>
            </div>
          ) : null}

          <div className="se-franja__mundo">
            <span className="se-franja__mundo-rotulo">{t("portada.franja.mundo")}</span>
            <CintaMundial tema="light" />
          </div>
        </div>
      </div>
    </section>
  );
};

FranjaPortada.propTypes = {
  noticias: listaDePiezas({ fechaIso: PropTypes.string }),
  analisis: listaDePiezas({ autor: PropTypes.string, resumen: PropTypes.string }),
};

export default FranjaPortada;
