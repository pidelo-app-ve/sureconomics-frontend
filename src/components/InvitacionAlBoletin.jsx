import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { EVENTO_CONSENTIMIENTO, consentimiento } from "../lib/analitica";
import {
  ESPERA_MS,
  debeInvitar,
  contarVista,
  fraccionLeida,
  leerInvitacion,
  marcarSuscrito,
  registrarCierre,
  rutaExcluida,
  yaSuscrito,
} from "../lib/invitacionBoletin";
import { subscribeToNewsletter } from "../services/newsletterService";

/**
 * La invitación al boletín: una ventana en medio de la pantalla, sobre una capa oscura,
 * que aparece a quien ya está leyendo y se va cuando se le dice que se vaya.
 *
 * Es el cuarto formulario del boletín en el sitio -- portada, pie, `/entorno` y éste --
 * y el único que no espera a que lo busquen. Por eso tiene más reglas para callarse que
 * para salir; todas están en `lib/invitacionBoletin.js`, que es donde se prueban. Aquí
 * sólo se mide lo que esas reglas necesitan -- páginas vistas, tiempo, cuánto se bajó --
 * y se pinta.
 *
 * ## Interrumpe, y por eso se porta como un diálogo de verdad
 *
 * Empezó como una tarjeta en la esquina que no molestaba; la redacción la quiso en el
 * centro, para que se vea. Si interrumpe, tiene que hacerlo bien: `role="dialog"` con
 * `aria-modal`, el foco entra al campo del correo, Tab no se escapa a la página de
 * detrás, la página no se desplaza mientras está abierta, y al cerrarse el foco vuelve
 * a donde estaba. Se cierra con el aspa o «Ahora no», y Escape para quien usa teclado;
 * las tres cuentan como «ahora no». Pulsar en la capa oscura **no** la cierra, a
 * propósito: la redacción la quiere ahí hasta que se responda, no hasta el primer clic
 * distraído en el margen.
 *
 * ## Lo que no hace, a propósito
 *
 * **No sale encima del aviso de cookies.** Mientras el aviso espera respuesta esta
 * tarjeta no existe; sale cuando se contesta, sin recargar, escuchando el mismo evento
 * que la barra publicitaria.
 *
 * **No vuelve a los dos minutos.** Un «ahora no» -- el botón, el aspa o Escape -- se
 * recuerda catorce días; tres seguidos, noventa. Y un acierto en cualquiera de los
 * cuatro formularios la apaga del todo.
 *
 */

/** Cuándo se cargó el sitio. Al evaluarse el módulo y no al montar: es la visita, no el componente. */
const INICIO_VISITA = Date.now();

/** El acierto se queda en pantalla este tiempo y se va solo: ya cumplió. */
const AUTOCIERRE_MS = 6000;

/** Lo que recibe el foco dentro de la ventana, para que Tab dé la vuelta sin salir. */
const FOCALES =
  'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

const medirLectura = () =>
  fraccionLeida({
    scrollY: window.scrollY,
    altoVentana: window.innerHeight,
    altoDocumento: document.documentElement.scrollHeight,
  });

export const InvitacionAlBoletin = () => {
  const { pathname } = useLocation();
  const [abierta, setAbierta] = useState(false);

  const [email, setEmail] = useState("");
  // El campo trampa, el mismo que en los otros formularios: una persona no lo ve y
  // los rastreadores rellenan todo lo que encuentran.
  const [trampa, setTrampa] = useState("");
  const [estado, setEstado] = useState({ status: "idle", mensaje: "" });
  // El correo con el que se suscribió, para decírselo en la bienvenida: el campo se
  // vacía al acertar y el lector merece ver a dónde le va a llegar.
  const [correoSuscrito, setCorreoSuscrito] = useState("");

  const enviando = estado.status === "loading";
  const hayError = estado.status === "error";
  const listo = estado.status === "success";

  // Lo que miden los efectos, en referencias y no en estado: cambia en cada scroll y
  // no hay nada que repintar hasta que la decisión sea «sí».
  const vistas = useRef(0);
  const rutaContada = useRef(null);
  const maximoLeido = useRef(0);
  const abiertaRef = useRef(false);
  abiertaRef.current = abierta;
  const cajaRef = useRef(null);
  const campoRef = useRef(null);
  const exitoRef = useRef(null);
  // Dónde estaba el foco antes de abrir, para devolverlo al cerrar: quien leía con el
  // teclado no puede quedarse en lo alto de la página.
  const focoPrevio = useRef(null);

  const evaluar = useCallback(() => {
    if (abiertaRef.current) return;
    const invitar = debeInvitar({
      pathname,
      consentimiento: consentimiento(),
      vistas: vistas.current,
      msEnVisita: Date.now() - INICIO_VISITA,
      maximoLeido: maximoLeido.current,
      suscrito: yaSuscrito(),
      invitacion: leerInvitacion(),
    });
    if (invitar) setAbierta(true);
  }, [pathname]);

  // Cambio de ruta: una página vista más y la lectura vuelve a cero. La misma ruta no
  // se cuenta dos veces seguidas -- en desarrollo React monta cada efecto dos veces.
  useEffect(() => {
    if (rutaContada.current !== pathname) {
      rutaContada.current = pathname;
      vistas.current = contarVista();
      maximoLeido.current = 0;
    }
    // Si la tarjeta estaba abierta y se entra en una página donde no cabe -- la de
    // suscripción, por ejemplo --, se retira sin contarlo como un «ahora no».
    if (abiertaRef.current && rutaExcluida(pathname)) setAbierta(false);
    evaluar();
  }, [pathname, evaluar]);

  // Scroll, con un fotograma de margen entre medidas: el evento llega decenas de veces
  // por segundo y la decisión no cambia más deprisa que la pantalla. `passive` porque
  // nunca se cancela el desplazamiento.
  useEffect(() => {
    let pendiente = false;
    const alBajar = () => {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(() => {
        pendiente = false;
        maximoLeido.current = Math.max(maximoLeido.current, medirLectura());
        evaluar();
      });
    };
    window.addEventListener("scroll", alBajar, { passive: true });
    return () => window.removeEventListener("scroll", alBajar);
  }, [evaluar]);

  // Los cuarenta segundos de visita: un despertador para el caso de quien lee una sola
  // página despacio. Si ya pasaron, se mira ahora mismo.
  useEffect(() => {
    const falta = ESPERA_MS - (Date.now() - INICIO_VISITA);
    if (falta <= 0) {
      evaluar();
      return undefined;
    }
    const reloj = window.setTimeout(evaluar, falta);
    return () => window.clearTimeout(reloj);
  }, [evaluar]);

  // Contestar el aviso de cookies levanta el silencio. Mismo evento que escucha la
  // barra publicitaria.
  useEffect(() => {
    window.addEventListener(EVENTO_CONSENTIMIENTO, evaluar);
    return () => window.removeEventListener(EVENTO_CONSENTIMIENTO, evaluar);
  }, [evaluar]);

  // El acierto se despide solo. Y mientras dura, el foco va a la bienvenida: el campo
  // donde estaba ya no existe, y un foco perdido cae al fondo de la página.
  useEffect(() => {
    if (!listo) return undefined;
    exitoRef.current?.focus({ preventScroll: true });
    const reloj = window.setTimeout(() => setAbierta(false), AUTOCIERRE_MS);
    return () => window.clearTimeout(reloj);
  }, [listo]);

  const cerrar = useCallback(() => {
    registrarCierre();
    setAbierta(false);
  }, []);

  // Abierta: la página de detrás queda quieta y el foco entra al campo. Al cerrarse,
  // por la vía que sea, todo vuelve como estaba.
  useEffect(() => {
    if (!abierta) return undefined;
    focoPrevio.current = document.activeElement;
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = "hidden";
    // Un fotograma de margen: el campo existe ya, pero la entrada todavía no se pintó.
    const id = window.requestAnimationFrame(() =>
      campoRef.current?.focus({ preventScroll: true })
    );
    return () => {
      window.cancelAnimationFrame(id);
      html.style.overflow = antes;
      const previo = focoPrevio.current;
      if (previo && typeof previo.focus === "function" && document.contains(previo)) {
        previo.focus({ preventScroll: true });
      }
    };
  }, [abierta]);

  // Escape y Tab, escuchados en el documento y no en la caja: si un clic deja el foco
  // en el fondo, Escape sigue cerrando y Tab lo trae de vuelta.
  useEffect(() => {
    if (!abierta) return undefined;
    const alPulsarTecla = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrar();
        return;
      }
      if (e.key !== "Tab") return;
      const caja = cajaRef.current;
      if (!caja) return;
      const focales = Array.from(caja.querySelectorAll(FOCALES)).filter(
        (el) => el.getClientRects().length > 0
      );
      if (!focales.length) return;
      const primero = focales[0];
      const ultimo = focales[focales.length - 1];
      const activo = document.activeElement;
      if (!caja.contains(activo)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primero).focus();
      } else if (e.shiftKey && activo === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", alPulsarTecla);
    return () => document.removeEventListener("keydown", alPulsarTecla);
  }, [abierta, cerrar]);


  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const correo = email.trim();
    if (!correo) return;

    setEstado({ status: "loading", mensaje: "" });
    try {
      await subscribeToNewsletter(correo, { source: "invitacion", honeypot: trampa });
      marcarSuscrito();
      setCorreoSuscrito(correo);
      setEmail("");
      setEstado({ status: "success", mensaje: "Listo. El primer número le llega el lunes." });
    } catch (err) {
      setEstado({
        status: "error",
        mensaje:
          err?.status === 422
            ? "Ese correo no parece completo. Revíselo y vuelva a probar."
            : err?.status === 429
              ? "Demasiados intentos seguidos. Espere un momento."
              : "No se pudo completar la suscripción. Inténtelo de nuevo.",
      });
    }
  };

  if (!abierta) return null;

  return (
    <div className="se-invitacion">
      <div
        className="se-invitacion__caja"
        ref={cajaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitacion-boletin-titulo"
        aria-describedby={listo ? undefined : "invitacion-boletin-texto"}
      >
        <button
          type="button"
          className="se-invitacion__cerrar"
          onClick={cerrar}
          aria-label="Cerrar"
        >
          <span aria-hidden="true">✕</span>
        </button>

        {listo ? (
          // El único momento de celebración del sitio, y se vive una vez: un sello que se
          // dibuja, la bienvenida con su correo y una barra que se vacía mientras la
          // ventana se despide sola. `role="status"` y no `alert`: es una confirmación,
          // no una urgencia. El título conserva el id para que el diálogo siga teniendo
          // nombre.
          <div className="se-invitacion__exito" role="status" tabIndex={-1} ref={exitoRef}>
            <span className="se-invitacion__sello" aria-hidden="true">
              <svg viewBox="0 0 52 52" focusable="false">
                <circle className="se-invitacion__sello-aro" cx="26" cy="26" r="25" />
                <path className="se-invitacion__sello-marca" d="M15.5 27.5l7 7 14.5-16" />
              </svg>
            </span>
            <h2 className="se-invitacion__titulo" id="invitacion-boletin-titulo">
              Ya está dentro
            </h2>
            <p className="se-invitacion__texto se-invitacion__texto--exito">
              El primer número de <strong>Entorno en Viñetas</strong> le llega el lunes por
              la mañana{correoSuscrito ? (
                <>
                  {" "}a <span className="se-invitacion__correo">{correoSuscrito}</span>
                </>
              ) : null}
              .
            </p>
            <p className="se-invitacion__nota">
              Si no lo ve, búsquelo en «Promociones» o en el correo no deseado.
            </p>
            <span
              className="se-invitacion__cuenta"
              aria-hidden="true"
              style={{ animationDuration: `${AUTOCIERRE_MS}ms` }}
            />
          </div>
        ) : (
          <>
            <p className="se-invitacion__kicker">Boletín semanal · los lunes por la mañana</p>
            <h2 className="se-invitacion__titulo" id="invitacion-boletin-titulo">
              Entorno en Viñetas
            </h2>
            <p className="se-invitacion__texto" id="invitacion-boletin-texto">
              El entorno económico de la semana, contado en viñetas. Le llega cada lunes,
              antes de que la semana empiece a moverse.
            </p>

            <form
              className="se-invitacion__form"
              onSubmit={enviar}
              aria-busy={enviando}
              aria-labelledby="invitacion-boletin-titulo"
              noValidate
            >
              <label htmlFor="invitacion-boletin-email" className="se-invitacion__label">
                Su correo
              </label>
              <input
                ref={campoRef}
                id="invitacion-boletin-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="se-invitacion__input"
                placeholder="nombre@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={enviando}
                required
                aria-invalid={hayError || undefined}
                aria-describedby={hayError ? "invitacion-boletin-error" : undefined}
              />
              {/* Fuera del tabulador y de los lectores de pantalla: si una persona la
                  rellenara sin querer, su suscripción se descartaría. */}
              <input
                type="text"
                name="website"
                className="se-sr-only"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
                value={trampa}
                onChange={(e) => setTrampa(e.target.value)}
              />

              {hayError ? (
                <p id="invitacion-boletin-error" className="se-invitacion__error" role="alert">
                  {estado.mensaje}
                </p>
              ) : null}

              <div className="se-invitacion__acciones">
                <button type="submit" className="se-invitacion__btn" disabled={enviando}>
                  {enviando ? "Enviando…" : "Únase al boletín"}
                </button>
                <button type="button" className="se-invitacion__luego" onClick={cerrar}>
                  Ahora no
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
