import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { haceCuanto, useHeadlines } from "../../hooks/useHeadlines";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import "../../styles/titulares.css";

/**
 * La tarjeta verde «Última hora» de la portada, en la columna derecha de la apertura.
 *
 * Los seis titulares más calientes, uno a la vez cada 4 segundos, con una barra que
 * dice cuánto falta para el siguiente. El contenido cambia con cada ciclo de 10
 * minutos; la rotación es solo visual, entre esos seis.
 *
 * - Se para con el cursor encima o con el foco dentro, y con su botón de pausa: en el
 *   teléfono no hay cursor, y un texto que se mueve solo tiene que poder pararse.
 * - Con «reducir movimiento» en el sistema, no rota: el primero y, debajo, los dos siguientes.
 * - Se oculta si no hay titulares o si el más reciente tiene más de un día.
 * - Lleva al titular dentro de la sección (`/ultima-hora#t-<id>`): los titulares no
 *   tienen página propia, son título, resumen y su fuente.
 */

const CADA_MS = 4000;
const CUANTOS = 6;
const UN_DIA_MS = 24 * 60 * 60 * 1000;

const prefiereQuieto = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const useAhora = (cada) => {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cada);
    return () => clearInterval(id);
  }, [cada]);
  return ahora;
};

const IconoPausa = ({ pausado }) =>
  pausado ? (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  );

IconoPausa.propTypes = { pausado: PropTypes.bool };

export const UltimaHoraTarjeta = () => {
  const { t } = useIdioma();
  const { items } = useHeadlines();
  const ahora = useAhora(30_000);
  const [quieto] = useState(prefiereQuieto);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [encima, setEncima] = useState(false);

  const seis = items.slice(0, CUANTOS);
  const parado = quieto || pausado || encima || seis.length < 2;

  useEffect(() => {
    if (indice >= seis.length) setIndice(0);
  }, [indice, seis.length]);

  useEffect(() => {
    if (parado) return undefined;
    const id = setInterval(() => setIndice((i) => (i + 1) % seis.length), CADA_MS);
    return () => clearInterval(id);
  }, [parado, seis.length]);

  const masReciente = seis.reduce((max, i) => Math.max(max, Date.parse(i.published_at || "") || 0), 0);
  if (!seis.length || ahora - masReciente > UN_DIA_MS) return null;

  const actual = seis[Math.min(indice, seis.length - 1)];
  return (
    <section
      className="se-uh"
      aria-label={t("titulares.tarjeta.region")}
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      onFocus={() => setEncima(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setEncima(false);
      }}
    >
      <div className="se-uh__cabeza">
        <span className="se-uh__etiqueta">
          <span className="se-uh__punto" aria-hidden="true" />
          {t("titulares.tarjeta.etiqueta")}
        </span>
        <span className="se-uh__hace">{haceCuanto(actual.published_at, t, ahora)}</span>
      </div>

      {/* Solo se anuncia cuando está parado: uno que rota cada 4 s no puede hablar cada 4 s. */}
      <p className="se-uh__titulo" aria-live={parado ? "polite" : "off"}>
        {actual.title}
      </p>

      <div className="se-uh__pie">
        <Enlace to={`/ultima-hora#t-${actual.id}`} className="se-uh__leer">
          {t("titulares.tarjeta.leer")}
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false">
            <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Enlace>
        {seis.length > 1 && !quieto ? (
          <button
            type="button"
            className="se-uh__pausa"
            aria-pressed={pausado}
            aria-label={pausado ? t("titulares.tarjeta.reanudar") : t("titulares.tarjeta.pausar")}
            onClick={() => setPausado((p) => !p)}
          >
            <IconoPausa pausado={pausado} />
          </button>
        ) : null}
      </div>

      {quieto && seis.length > 1 ? (
        <ul className="se-uh__lista">
          {seis.slice(1, 3).map((i) => (
            <li key={i.id}>{i.title}</li>
          ))}
        </ul>
      ) : null}

      {seis.length > 1 && !quieto ? (
        <div className="se-uh__barra" aria-hidden="true">
          <span
            key={`${actual.id}-${parado ? "p" : "a"}`}
            className={`se-uh__progreso${parado ? " se-uh__progreso--quieto" : ""}`}
          />
        </div>
      ) : null}
    </section>
  );
};
