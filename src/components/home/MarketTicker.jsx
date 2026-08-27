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
/** El ultimo juego de cifras que llego bien, para no perder la banda por un fallo
 *  de red. En `localStorage` y no en la sesion: si el servidor tiene un tropiezo,
 *  una pestaña nueva tambien tiene que seguir mostrando la cinta. */
const ULTIMA = "sureconomics_cinta_ultima";
/** Medio dia. Son cifras de cierre: sostenerlas un rato mientras el servidor vuelve
 *  es razonable, arrastrar el cierre de anteayer no lo es. */
const CADUCA_MS = 12 * 60 * 60 * 1000;
const INTENTOS = [0, 600, 1800];

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

const guardarUltima = (datos) => {
  try {
    localStorage.setItem(ULTIMA, JSON.stringify({ t: Date.now(), datos }));
  } catch {
    /* nada que hacer */
  }
};

const ultimaBuena = () => {
  try {
    const crudo = localStorage.getItem(ULTIMA);
    if (!crudo) return null;
    const { t, datos } = JSON.parse(crudo);
    if (!datos?.indicators?.length) return null;
    if (!t || Date.now() - t > CADUCA_MS) return null;
    return datos;
  } catch {
    return null;
  }
};

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export const MarketTicker = () => {
  const [ticker, setTicker] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;

    (async () => {
      let ultimoError = null;
      for (const espera of INTENTOS) {
        if (espera) await dormir(espera);
        if (!vivo) return;
        try {
          const datos = await getMarketTicker();
          if (!vivo) return;
          setTicker(datos);
          setCargando(false);
          const hay = Boolean(datos?.indicators?.length);
          recordar(hay);
          // Se guarda lo que llego bien, y se limpia cuando la redaccion vacia la
          // cinta a proposito: una respuesta buena y vacia es una decision, y
          // sostener las cifras de ayer contra ella seria publicar por nuestra
          // cuenta. El respaldo es solo para cuando la peticion falla.
          if (hay) guardarUltima(datos);
          else {
            try { localStorage.removeItem(ULTIMA); } catch { /* nada */ }
          }
          return;
        } catch (error) {
          ultimoError = error;
        }
      }

      if (!vivo) return;
      // Se agotaron los intentos. Antes esto dejaba la cabecera sin banda: la cinta
      // desaparecia por un tropiezo de red aunque estuviera llena. Se sostiene el
      // ultimo juego bueno mientras no caduque.
      const respaldo = ultimaBuena();
      setTicker(respaldo);
      setCargando(false);
      recordar(Boolean(respaldo));
      if (!respaldo && ultimoError) {
        // Sin respaldo no se dibuja nada. Es contexto de ambiente, no contenido: no
        // puede convertirse en un mensaje de error cruzando lo alto de cada pagina.
        console.warn("[cinta] no se pudo cargar y no hay respaldo vigente", ultimoError);
      }
    })();

    return () => {
      vivo = false;
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
