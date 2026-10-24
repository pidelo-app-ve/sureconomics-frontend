import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { haceCuanto, useHeadlines } from "../../hooks/useHeadlines";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useRotacion } from "../../hooks/useRotacion";
import "../../styles/titulares.css";

/**
 * La tarjeta verde «Última hora» de la portada, en la columna derecha de la apertura.
 *
 * Los seis titulares más recientes (lo fijado, primero), uno a la vez cada 4 segundos,
 * con una barra que dice cuánto falta para el siguiente: los mismos seis que enseña la
 * sección, así «Leer nota» siempre cae en uno que está allí. El contenido cambia con
 * cada ciclo de 10 minutos; la rotación es solo visual, entre esos seis.
 *
 * Al cambiar, el titular que estaba cae y se borra, y el nuevo entra desde arriba
 * con velocidad y se asienta con un pequeño rebote (lo pidió la redacción: que se
 * sienta que está pasando). El que sale se pinta encima, fuera del flujo, para que
 * la tarjeta no cambie de alto durante el cruce.
 *
 * - Se para con el cursor encima o con el foco dentro, y con su botón de pausa: en el
 *   teléfono no hay cursor, y un texto que se mueve solo tiene que poder pararse.
 * - Con «reducir movimiento» en el sistema, no rota: el primero y, debajo, los dos siguientes.
 * - Se oculta si no hay titulares o si el más reciente tiene más de un día.
 * - Lleva al titular dentro de la sección (`/ultima-hora#t-<id>`): los titulares no
 *   tienen página propia, son título, resumen y su fuente.
 */

const CUANTOS = 6;
/** Lo que dura la caída del que sale; tiene que coincidir con `se-uh-cae` en el CSS. */
const CAIDA_MS = 300;
const UN_DIA_MS = 24 * 60 * 60 * 1000;
/** El punto de «Última hora» late solo mientras la noticia tiene menos de una hora. */
const UNA_HORA_MS = 60 * 60 * 1000;

const useAhora = (cada) => {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cada);
    return () => clearInterval(id);
  }, [cada]);
  return ahora;
};

export const IconoPausa = ({ pausado }) =>
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

export const UltimaHoraTarjeta = ({ variante = "tarjeta" }) => {
  const { t } = useIdioma();
  const { items } = useHeadlines();
  const ahora = useAhora(30_000);
  const seis = items.slice(0, CUANTOS);
  const { indice, saliente, parado, quieto, pausado, alternarPausa, eventos } = useRotacion(seis, {
    salidaMs: CAIDA_MS,
  });

  const masReciente = seis.reduce((max, i) => Math.max(max, Date.parse(i.published_at || "") || 0), 0);
  if (!seis.length || ahora - masReciente > UN_DIA_MS) return null;

  const actual = seis[indice];
  return (
    <section
      className={`se-uh${variante === "rotulo" ? " se-uh--rotulo" : ""}`}
      aria-label={t("titulares.tarjeta.region")}
      {...eventos}
    >
      <div className="se-uh__cabeza">
        <span className="se-uh__etiqueta">
          <span
            className={`se-uh__punto${
              ahora - (Date.parse(actual.published_at || "") || 0) < UNA_HORA_MS ? " se-uh__punto--reciente" : ""
            }`}
            aria-hidden="true"
          />
          {t("titulares.tarjeta.etiqueta")}
        </span>
        <span className="se-uh__hace">{haceCuanto(actual.published_at, t, ahora)}</span>
      </div>

      <div className="se-uh__marco">
        {/* Solo se anuncia cuando está parado: uno que cambia cada pocos segundos no puede hablar a ese ritmo. */}
        <p
          key={actual.id}
          className="se-uh__titulo se-uh__titulo--entra"
          aria-live={parado ? "polite" : "off"}
        >
          {actual.title}
        </p>
        {saliente && saliente.id !== actual.id ? (
          <p key={`sale-${saliente.id}`} className="se-uh__titulo se-uh__titulo--sale" aria-hidden="true">
            {saliente.title}
          </p>
        ) : null}
      </div>

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
            aria-label={t("titulares.tarjeta.pausar")}
            onClick={alternarPausa}
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

UltimaHoraTarjeta.propTypes = {
  /** «tarjeta» (la caja verde) o «rotulo» (una línea a lo ancho, como el rótulo de un canal). */
  variante: PropTypes.oneOf(["tarjeta", "rotulo"]),
};
