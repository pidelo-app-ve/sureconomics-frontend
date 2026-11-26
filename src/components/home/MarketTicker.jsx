import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha } from "../../i18n/motor";
import { getMarketTicker } from "../../services/marketTickerService";
import { enlaceWeb } from "../../lib/enlaces";

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
 * *Por qué guarda el hueco mientras carga.* Las cifras llegan por red, así que en la
 * primera pintura no están: medido, aparecían a 2,3 s y empujaban la página 34 px
 * hacia abajo, justo cuando el lector va a tocar el menú.
 *
 * Se guarda también en la primera visita, que es la de casi todos los que llegan de un
 * buscador: la cinta casi siempre trae cifras (el servidor solo calla las de más de dos
 * días hábiles). Lo que se recuerda en la sesión es lo contrario, que la última carga
 * vino **sin** cifras: entonces el hueco va como cinta del mundo (`--solo-mundo`), que
 * en escritorio ocupa lo mismo y en el teléfono no se pinta, y tampoco ahí se mueve nada.
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

const vinoSinCifras = () => {
  try {
    return sessionStorage.getItem(RECUERDO) === "0";
  } catch {
    // Navegación privada o almacenamiento bloqueado: sin recuerdo, como en la primera visita.
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
 * TradingView no es una API que llamemos: es su marco, que se dibuja solo. Nosotros
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

/**
 * **Un marco nuestro que apunta a TradingView, no su script en nuestra página.**
 *
 * Antes se metía en la página el script de `s3.tradingview.com`, y ese script creaba el
 * marco. Mientras tanto corría con los mismos poderes que nuestro propio código: en
 * nuestro origen, al lado de la sesión del equipo, que se guarda en `sessionStorage`
 * (y la página de entrada del panel también monta la cinta). Si alguien comprometía ese
 * script, podía leer la llave de sesión de un editor (C-04, auditoría del 17-nov-2026).
 *
 * El marco ya lo dibujaba TradingView en su propio dominio (`www.tradingview-widget.com`):
 * aquí se pide **directamente**, con la misma dirección que armaba su script
 * (`direccionDelMarco`). Un marco de otro dominio no ve nada de la página que lo contiene:
 * ni su `sessionStorage`, ni sus cookies, ni su DOM. Y así la CSP ya no deja cargar
 * scripts de TradingView (`vercel.json`, `script-src`).
 *
 * Dos cerrojos más en el propio marco:
 * - `sandbox`: puede ejecutar su código y abrir pestañas nuevas (cada símbolo enlaza a su
 *   página), pero no llevarse la pestaña del lector a otra dirección ni abrir avisos.
 *   Necesita `allow-same-origin` (su propio origen, no el nuestro): sin él el marco sale
 *   en blanco, medido en Edge el 26-nov-2026.
 * - `credentialless`: en Chrome y Edge el marco arranca con un cajón de cookies propio y
 *   de usar y tirar, que se vacía al cerrar la página. Lo que su medición (Snowplow) guarde
 *   dentro no sobrevive a la visita (D-22). Firefox y Safari no lo conocen, pero ya aíslan
 *   o bloquean las cookies de terceros por su cuenta.
 */
const MARCO = "https://www.tradingview-widget.com/embed-widget/ticker-tape/";
const CERROJOS = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox";

/**
 * La dirección del marco, como la armaba su script (`embed-widget-ticker-tape.js`): el
 * idioma en la consulta y los ajustes, en JSON, detrás de `#` (lo que va detrás de `#` no
 * viaja al servidor; lo lee el código del marco). `sitio` es nuestro dominio, que su
 * script mandaba como `utm_source` y `page-uri`. Ese script mandaba en `page-uri` la
 * dirección entera de la página que se estaba leyendo; aquí va solo el dominio.
 */
export const direccionDelMarco = ({ simbolos, tema, lang, sitio }) => {
  const ajustes = {
    symbols: simbolos,
    showSymbolLogo: true,
    isTransparent: true,
    // `compact` y no `adaptive`: en adaptive TradingView pinta dos lineas por simbolo
    // -- nombre arriba, precio abajo -- y pide 72 px de alto. La franja mide 46, asi
    // que le cortabamos la mitad y se veia amputado. En compact va todo en una linea,
    // que es como van nuestras cifras: los dos lados pesan lo mismo sin estirar la
    // cabecera. Medido antes de cambiarlo: iframe 72 px en una caja de 46.
    displayMode: "compact",
    colorTheme: tema,
    width: "100%",
    // El alto que pedía su script para `compact` (84 px); la caja lo recorta (CSS).
    height: 84,
    utm_source: sitio,
    utm_medium: "widget_new",
    utm_campaign: "ticker-tape",
    "page-uri": `${sitio}/`,
  };
  // El idioma del documento: TradingView acepta "es" y "en" tal cual.
  return `${MARCO}?locale=${encodeURIComponent(lang)}#${encodeURIComponent(JSON.stringify(ajustes))}`;
};

/**
 * Lo que dice que el lector ya está leyendo y no esperando a que cargue la página:
 * mover el ratón, tocar, una tecla, la rueda o desplazar. Con el primero se pide la
 * cinta del mundo; si no hay ninguno, a los `ESPERA_SIN_GESTOS` de cargar la página.
 *
 * Medido el 16-nov-2026 con PageSpeed en el teléfono: pedida apenas el navegador quedaba
 * libre, sus once hojas de estilo bajaban a la vez que la foto principal, y su marco
 * deja tres cookies de medición propia de TradingView, que Google cuenta en contra.
 * Para quien lee casi no cambia: en escritorio la cinta sale en cuanto mueve el ratón.
 */
const GESTOS_DEL_LECTOR = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];
const ESPERA_SIN_GESTOS = 6000;
/** En captura y pasivas: un desplazamiento dentro de una lista también cuenta, y no frenan nada. */
const ESCUCHA = { capture: true, passive: true };
/** Una vez que el lector se movió, las cintas que se monten después ya no esperan. */
let huboGesto = false;

/**
 * `true` cuando toca pedir el marco: **al primer gesto del lector, o a los pocos segundos
 * de cargar** (ver `GESTOS_DEL_LECTOR`), y entonces cuando el navegador esté libre. El
 * marco de TradingView pesa (más scripts y once hojas de estilo); pedido al pintar la
 * cabecera, competía por la red con la foto principal justo cuando el lector espera verla.
 * Nadie mira primero la cinta de mercados. Una vez en `true` se queda: al cruzar el corte
 * o cambiar de idioma solo cambia la dirección del marco.
 */
const useTrasElPrimerGesto = (activo) => {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!activo || listo) return undefined;
    const ocioso = typeof window.requestIdleCallback === "function";
    let turno = null;
    let reloj = null;
    const montar = () => setListo(true);
    const programar = () => {
      if (turno !== null) return;
      quitarEscuchas();
      turno = ocioso
        ? window.requestIdleCallback(montar, { timeout: 2500 })
        : window.setTimeout(montar, 0);
    };
    const alGesto = () => {
      huboGesto = true;
      programar();
    };
    const alCargar = () => {
      reloj = window.setTimeout(programar, ESPERA_SIN_GESTOS);
    };
    function quitarEscuchas() {
      GESTOS_DEL_LECTOR.forEach((g) => window.removeEventListener(g, alGesto, ESCUCHA));
      window.removeEventListener("load", alCargar);
      window.clearTimeout(reloj);
    }

    if (huboGesto) {
      // Ya se movió en esta visita (otra página, o al girar el teléfono): sin esperar.
      programar();
    } else {
      GESTOS_DEL_LECTOR.forEach((g) => window.addEventListener(g, alGesto, ESCUCHA));
      if (document.readyState === "complete") alCargar();
      else window.addEventListener("load", alCargar, { once: true });
    }

    return () => {
      quitarEscuchas();
      if (turno !== null) {
        if (ocioso) window.cancelIdleCallback(turno);
        else window.clearTimeout(turno);
      }
    };
  }, [activo, listo]);

  return listo;
};

/**
 * Va en la cinta de arriba, en línea con nuestras cifras, en escritorio; y en el
 * teléfono, bajo las monedas de la primera plana (`PrimeraPlana`), donde hay sitio.
 * `solo` dice en cuál de los dos anchos se pinta, para que nunca se monten dos marcos:
 * "ancho" (de 861 arriba) o "estrecho". `tema` es el de TradingView: "dark" sobre
 * verde, "light" sobre papel.
 */
export const CintaMundial = ({ tema = "light", solo = null }) => {
  const { t, lang } = useIdioma();
  const oro = t("portada.cinta.oro");
  /** El nombre con el que se anuncia el marco de TradingView. */
  const tituloDelMarco = t("portada.cinta.indicesMundiales");
  const [estrecho, setEstrecho] = useState(() => {
    try {
      return window.matchMedia?.(CORTE_MOVIL)?.matches ?? false;
    } catch {
      return false;
    }
  });

  // Cambia solo al cruzar el corte, que pasa casi nunca -- girar el telefono. Escuchar
  // el `resize` y cambiar en cada pixel seria pedir el marco decenas de veces por
  // arrastrar una ventana.
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

  const fuera = (solo === "ancho" && estrecho) || (solo === "estrecho" && !estrecho);
  const listo = useTrasElPrimerGesto(!fuera);

  if (fuera) return null;

  // Solo cuando toca pedirlo: antes no hace falta, y así no se lee `window.location`
  // al pintar en el servidor (las pruebas de `pintar.mjs`).
  const direccion = listo
    ? direccionDelMarco({
        simbolos: estrecho ? SIMBOLOS_MOVIL(oro) : SIMBOLOS_ESCRITORIO(oro),
        tema,
        lang,
        sitio: window.location.hostname,
      })
    : null;

  return (
    <div className="se-ticker__mundo">
      {/* `data-lista` deja a la vista cual de las dos listas esta puesta: la lista va
          dentro de la direccion del marco, que no se lee de un vistazo. */}
      <div className="se-ticker__mundo-caja" data-lista={estrecho ? "movil" : "escritorio"}>
        {listo ? (
          // `key`: la lista va detrás del `#`, y cambiar solo eso no recarga un marco
          // (el navegador lo toma por un salto dentro de la misma página). Con la
          // dirección como clave, al cruzar el corte se monta uno nuevo con la otra lista.
          //
          // `tabIndex={-1}`: dentro hay un enlace por símbolo, hasta trece paradas del
          // tabulador antes de llegar a la cabecera, en cada página. Así el marco sale del
          // recorrido del teclado sin esconderse de un lector de pantalla, y el `title` le
          // da el nombre que un marco necesita para anunciarse.
          <iframe
            key={direccion}
            className="se-ticker__mundo-marco"
            src={direccion}
            title={tituloDelMarco}
            tabIndex={-1}
            scrolling="no"
            sandbox={CERROJOS}
            // React 18 no lo conoce y lo pasa tal cual al HTML (ver `CERROJOS`, arriba).
            // eslint-disable-next-line react/no-unknown-property
            credentialless=""
          />
        ) : null}
      </div>
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

CintaMundial.propTypes = {
  tema: PropTypes.oneOf(["light", "dark"]),
  solo: PropTypes.oneOf(["ancho", "estrecho"]),
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
  // Mientras carga se guarda el sitio (ver arriba): con la forma de la cinta sin cifras
  // si la última vez vino así.
  if (!hayCifras && cargando) {
    return (
      <div className={`se-ticker se-ticker--hueco${vinoSinCifras() ? " se-ticker--solo-mundo" : ""}`} aria-hidden="true" />
    );
  }

  const flecha = (direccion) => (direccion === "up" ? "▲" : direccion === "down" ? "▼" : "▬");
  const run = (ticker?.indicators ?? []).map((item, i) => (
    <span className="se-ticker__item" key={`${item.label}-${i}`}>
      <span className="se-ticker__k">{item.label}</span>
      <span className="se-ticker__fila">
      <span className="se-ticker__v">{item.value}</span>
      {/* La variación sólo existe por la vía automática. Cuando falta no se dibuja
          nada: un "0,00%" de relleno afirmaría que no se movió, y lo cierto es que no
          lo sabemos. La flecha es decorativa: el signo ya lo dice. */}
      {typeof item.change === "number" ? (
        <span className={`se-ticker__d se-ticker__d--${item.direction}`}>
          {item.change > 0 ? "+" : ""}
          {item.change.toFixed(2)}%
          <span aria-hidden="true"> {flecha(item.direction)}</span>
        </span>
      ) : null}
      </span>
    </span>
  ));

  return (
    // `region` para que el nombre sirva de algo: un `aria-label` sobre un `div` sin
    // papel no lo lee ningun lector de pantalla.
    //
    // Una línea: la pastilla «Mercados», el desfile de nuestras cifras, de dónde salen,
    // y a la derecha los mercados del mundo de TradingView recortados a la misma altura.
    // Sin cifras nuestras la cinta sigue en escritorio con el mundo dentro; en el
    // teléfono el mundo va en la franja, y una cinta vacía se oculta (CSS).
    <div
      className={`se-ticker${hayCifras ? "" : " se-ticker--solo-mundo"}`}
      role="region"
      aria-label={t("portada.cinta.cifrasDeMercado")}
    >
      {hayCifras ? (
        <>
          <span className="se-ticker__pill">
            <span className="se-ticker__pulso" aria-hidden="true" />
            {t("portada.cinta.mercados")}
          </span>
          <div className="se-ticker__viewport">
            <div className="se-ticker__track">
              <div className="se-ticker__run">{run}</div>
              <div className="se-ticker__run" aria-hidden="true">
                {run}
              </div>
            </div>
          </div>
          {ticker.caption ? (
            enlaceWeb(ticker.sourceUrl) ? (
              <a
                className="se-ticker__stamp"
                href={enlaceWeb(ticker.sourceUrl)}
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
        </>
      ) : null}
      {/* Los mercados del mundo, en la misma línea (escritorio). */}
      <CintaMundial tema="dark" solo="ancho" />
    </div>
  );
};
