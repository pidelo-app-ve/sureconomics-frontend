import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearNumero } from "../../i18n/motor";
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

export const FranjaPortada = ({ analisis }) => {
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

  if (!analisis.length && !monedas.length) return null;

  return (
    <section className="se-section se-franja" aria-label={t("portada.franja.region")}>
      <div className="se-container">
        <div className="se-franja__rejilla">
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

          {/* Solo en el teléfono: en escritorio los mercados del mundo van en la cinta. */}
          <div className="se-franja__mundo">
            <span className="se-franja__mundo-rotulo">{t("portada.franja.mundo")}</span>
            <CintaMundial tema="light" solo="estrecho" />
          </div>
        </div>
      </div>
    </section>
  );
};

FranjaPortada.propTypes = {
  analisis: listaDePiezas({ autor: PropTypes.string, resumen: PropTypes.string }),
};

export default FranjaPortada;
