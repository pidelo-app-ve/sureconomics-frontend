import { useEffect, useRef, useState } from "react";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha } from "../../i18n/motor";
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

/**
 * Los indices mundiales, por TradingView.
 *
 * Dos listas y no una, y la razon es de lectura, no de tecnica: la lista de simbolos se
 * fija al crear el widget y no se puede cambiar despues. Diecinueve simbolos
 * desfilando en 375 px significa que quien quiere ver el Merval **espera a que el
 * desfile lo traiga de vuelta**. En el telefono van cinco: los que un lector mira de
 * verdad en la mano.
 *
 * TradingView no es una API que llamemos: es su script, que se dibuja solo. Nosotros
 * nunca vemos esos numeros, y eso tiene dos consecuencias que conviene saber -- la
 * regla de "se calla con datos viejos" no se le puede aplicar a esta mitad, y esas
 * cifras no se pueden reutilizar en ningun otro sitio del sitio.
 *
 * Su atribucion es obligatoria por sus condiciones de uso. No se quita.
 *
 * Son funciones y no listas porque el oro es el unico nombre que cambia de idioma
 * («Oro» / «Gold»); los demas son nombres propios y van igual en los dos.
 */
const SIMBOLOS_ESCRITORIO = (oro) => [
  { proName: "BMFBOVESPA:IBOV", title: "Bovespa" },
  { proName: "INDEX:MXX", title: "IPC México" },
  { proName: "BCBA:IMV", title: "Merval" },
  { proName: "BVC:COLCAP", title: "Colcap" },
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
  { proName: "CAPITALCOM:EU50", title: "Euro Stoxx 50" },
  { proName: "BME:IBC", title: "IBEX 35" },
  { proName: "FOREXCOM:JPXJPY", title: "Nikkei 225" },
  { proName: "FX:EURUSD", title: "EUR/USD" },
  { proName: "OANDA:XAUUSD", title: oro },
  { proName: "TVC:UKOIL", title: "Brent" },
  { proName: "BITSTAMP:BTCUSD", title: "BTC/USD" },
];

/** En el telefono: petroleo, oro, la bolsa de referencia, el bitcoin y el euro. */
const SIMBOLOS_MOVIL = (oro) => [
  { proName: "TVC:UKOIL", title: "Brent" },
  { proName: "OANDA:XAUUSD", title: oro },
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "BITSTAMP:BTCUSD", title: "BTC/USD" },
  { proName: "FX:EURUSD", title: "EUR/USD" },
];

/** El mismo corte que usa el componente original: por debajo, los dos se apilan. */
const CORTE_MOVIL = "(max-width: 860px)";

const CintaMundial = () => {
  const { t, lang } = useIdioma();
  // Textos resueltos fuera del efecto: son cadenas, asi que solo cambian con el
  // idioma y el widget no se vuelve a pedir en cada navegacion.
  const oro = t("portada.cinta.oro");
  /** El nombre con el que se anuncia el marco de TradingView. */
  const tituloDelMarco = t("portada.cinta.indicesMundiales");
  const caja = useRef(null);
  const [estrecho, setEstrecho] = useState(() => {
    try {
      return window.matchMedia?.(CORTE_MOVIL)?.matches ?? false;
    } catch {
      return false;
    }
  });

  // Se vuelve a montar solo al cruzar el corte, que pasa casi nunca -- girar el
  // telefono. Escuchar el `resize` y remontar en cada pixel seria tirar el widget y
  // volverlo a pedir decenas de veces por arrastrar una ventana.
  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia?.(CORTE_MOVIL);
    } catch {
      return undefined;
    }
    if (!mq) return undefined;
    const alCambiar = (e) => setEstrecho(e.matches);
    mq.addEventListener?.("change", alCambiar);
    return () => mq.removeEventListener?.("change", alCambiar);
  }, []);

  useEffect(() => {
    const destino = caja.current;
    if (!destino) return undefined;

    // Se vacia antes de inyectar. Sin esto, el doble efecto de StrictMode en desarrollo
    // deja dos cintas apiladas, y al cruzar el corte se acumularian.
    destino.innerHTML = "";

    const contenedor = document.createElement("div");
    contenedor.className = "tradingview-widget-container";
    const hueco = document.createElement("div");
    hueco.className = "tradingview-widget-container__widget";
    contenedor.appendChild(hueco);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    // La configuracion va como TEXTO dentro del script, que es como lo pide TradingView.
    script.text = JSON.stringify({
      symbols: estrecho ? SIMBOLOS_MOVIL(oro) : SIMBOLOS_ESCRITORIO(oro),
      showSymbolLogo: true,
      isTransparent: true,
      // `compact` y no `adaptive`: en adaptive TradingView pinta dos lineas por simbolo
      // -- nombre arriba, precio abajo -- y pide 72 px de alto. La franja mide 46, asi
      // que le cortabamos la mitad y se veia amputado. En compact va todo en una linea,
      // que es como van nuestras cifras: los dos lados pesan lo mismo sin estirar la
      // cabecera. Medido antes de cambiarlo: iframe 72 px en una caja de 46.
      displayMode: "compact",
      colorTheme: "dark",
      // El idioma del documento: TradingView acepta "es" y "en" tal cual.
      locale: lang,
    });
    contenedor.appendChild(script);
    destino.appendChild(contenedor);

    // El iframe lo crea su script cuando quiere, no nosotros, asi que se le espera.
    // Dentro trae un enlace por simbolo: hasta trece paradas del tabulador antes de llegar a
    // la cabecera, en cada pagina. `tabindex="-1"` saca el marco entero del recorrido
    // del teclado sin esconderselo a un lector de pantalla, que sigue pudiendo leerlo,
    // y el `title` le da el nombre que un marco necesita para anunciarse.
    const domar = () => {
      destino.querySelectorAll("iframe").forEach((marco) => {
        if (marco.getAttribute("tabindex") !== "-1") marco.setAttribute("tabindex", "-1");
        if (marco.getAttribute("title") !== tituloDelMarco) {
          marco.setAttribute("title", tituloDelMarco);
        }
      });
    };
    domar();
    let vigia = null;
    if (typeof MutationObserver !== "undefined") {
      // Tambien atributos: si el script reescribe el `title` o el `tabindex` despues
      // de crear el marco, se vuelven a poner. `domar` no escribe si ya estan bien, asi
      // que esto no se realimenta.
      vigia = new MutationObserver(domar);
      vigia.observe(destino, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["tabindex", "title"],
      });
    }

    return () => {
      vigia?.disconnect();
      destino.innerHTML = "";
    };
  }, [estrecho, lang, oro, tituloDelMarco]);

  return (
    <div className="se-ticker__mundo">
      {/* `data-lista` deja a la vista cual de las dos listas esta puesta. Se anadio
          porque comprobarlo desde fuera era imposible: TradingView se lleva el script
          inyectado en cuanto lo consume, asi que una sonda que lo busque casi nunca
          llega a tiempo. Un atributo cuesta nada y hace la decision observable. */}
      <div className="se-ticker__mundo-caja" ref={caja} data-lista={estrecho ? "movil" : "escritorio"} />
      <a
        className="se-ticker__mundo-credito"
        href="https://www.tradingview.com/"
        target="_blank"
        rel="noreferrer noopener"
      >
        TradingView
      </a>
    </div>
  );
};

export const MarketTicker = () => {
  const { t } = useIdioma();
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

  const hayCifras = Boolean(ticker?.indicators?.length);

  // Sin cifras nuestras la franja **sigue saliendo**, con el mundo dentro. Antes aquí
  // se devolvía nada, y era lo correcto cuando no había nada más que poner: una banda
  // vacía es una franja que no dice nada. Ahora la mitad mundial es contenido real y
  // vive por su cuenta, así que si el BCV se calla -- porque el dato es viejo, que es
  // la regla -- el lector sigue viendo el Brent y el oro en vez de un hueco.
  //
  // Mientras carga se guarda el sitio sólo si la última vez hubo cifras: reservarlo
  // siempre haría aparecer y colapsar una banda en la primera visita.
  if (!hayCifras && cargando && huboCinta()) {
    return <div className="se-ticker se-ticker--hueco" aria-hidden="true" />;
  }

  const run = (ticker?.indicators ?? []).map((item, i) => (
    <span className="se-ticker__item" key={`${item.label}-${i}`}>
      <span className="se-ticker__k">{item.label}</span>
      <span className={`se-ticker__v se-ticker__v--${item.direction}`}>{item.value}</span>
      {/* La variación sólo existe por la vía automática. Cuando falta no se dibuja
          nada: un "0,00%" de relleno afirmaría que no se movió, y lo cierto es que no
          lo sabemos. */}
      {typeof item.change === "number" ? (
        <span className={`se-ticker__d se-ticker__d--${item.direction}`}>
          {item.change > 0 ? "+" : ""}
          {item.change.toFixed(2)}%
        </span>
      ) : null}
    </span>
  ));

  return (
    // `region` para que el nombre sirva de algo: un `aria-label` sobre un `div` sin
    // papel no lo lee ningun lector de pantalla.
    <div className="se-ticker" role="region" aria-label={t("portada.cinta.cifrasDeMercado")}>
      {hayCifras ? (
        <div className="se-ticker__casa">
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
              <span
                className="se-ticker__stamp"
                title={
                  ticker.effectiveDate
                    ? t("portada.cinta.cierreDel", {
                        fecha: formatearFecha(ticker.effectiveDate, "larga") || ticker.effectiveDate,
                      })
                    : undefined
                }
              >
                {ticker.caption}
              </span>
            )
          ) : null}
        </div>
      ) : null}

      <CintaMundial />
    </div>
  );
};
