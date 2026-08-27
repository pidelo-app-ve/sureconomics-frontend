import { useEffect, useState } from "react";
import { getMarketTicker } from "../../services/marketTickerService";

/**
 * Market strip: the closing figures the newsroom typed in.
 *
 * There is no market feed in this project, so the caption is not decoration — it is
 * what stops a row of numbers from reading as live data. If there is no caption and
 * no figures, the strip renders **nothing at all**: an empty scroller, or worse a
 * row of placeholder zeros, would be a claim nobody made.
 *
 * The list is rendered twice so the marquee can loop without a visible seam.
 *
 * *Por qué recuerda si hubo cinta.* Las cifras llegan por red, así que en la
 * primera pintura no están: medido, aparecían a 2,3 s y empujaban la cabecera 33 px
 * hacia abajo, justo cuando el lector va a tocar el menú.
 *
 * Reservar el hueco siempre lo habría empeorado: hoy la cinta está vacía en
 * producción, así que se vería aparecer una banda y colapsarse. Así que se recuerda
 * en la sesión si la última carga trajo cifras. La primera visita se comporta como
 * ahora; a partir de ahí el hueco está desde el primer instante y nada se mueve.
 */
const RECUERDO = "sureconomics_cinta_con_datos";

const huboCinta = () => {
  try {
    return sessionStorage.getItem(RECUERDO) === "1";
  } catch {
    // Navegación privada o almacenamiento bloqueado: sin recuerdo, y sin reservar.
    return false;
  }
};

const recordar = (hay) => {
  try {
    sessionStorage.setItem(RECUERDO, hay ? "1" : "0");
  } catch {
    /* nada que hacer */
  }
};

export const MarketTicker = () => {
  const [ticker, setTicker] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let alive = true;
    getMarketTicker()
      .then((data) => {
        if (!alive) return;
        setTicker(data);
        setCargando(false);
        recordar(Boolean(data?.indicators?.length));
      })
      .catch(() => {
        // A strip that cannot load is a strip that shows nothing. It is ambient
        // context, not content, so it must never become an error message across
        // the top of every page.
        if (!alive) return;
        setTicker(null);
        setCargando(false);
        recordar(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!ticker?.indicators?.length) {
    // Mientras carga se guarda el sitio solo si la última vez hubo cifras. Sin
    // datos y ya cargada, no se dibuja nada: una banda vacía es una franja que no
    // dice nada, y una fila de ceros de relleno sería una afirmación que nadie hizo.
    return cargando && huboCinta() ? (
      <div className="se-ticker se-ticker--hueco" aria-hidden="true" />
    ) : null;
  }

  const run = ticker.indicators.map((item, i) => (
    <span className="se-ticker__item" key={`${item.label}-${i}`}>
      <span className="se-ticker__k">{item.label}</span>
      <span className={`se-ticker__v se-ticker__v--${item.direction}`}>{item.value}</span>
    </span>
  ));

  return (
    <div className="se-ticker" aria-label="Cifras de cierre de mercado">
      <div className="se-ticker__viewport">
        <div className="se-ticker__track">
          <div className="se-ticker__run">{run}</div>
          <div className="se-ticker__run" aria-hidden="true">
            {run}
          </div>
        </div>
      </div>
      {ticker.caption ? (
        ticker.sourceUrl ? (
          <a
            className="se-ticker__stamp"
            href={ticker.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            {ticker.caption}
            <span aria-hidden="true"> ↗</span>
          </a>
        ) : (
          <span className="se-ticker__stamp">{ticker.caption}</span>
        )
      ) : null}
    </div>
  );
};
