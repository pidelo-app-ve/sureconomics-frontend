import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { EVENTO_CONSENTIMIENTO, consentimiento } from "../analitica";
import {
  ESPERA_MS,
  debeInvitar,
  contarVista,
  enEnfriamiento,
  fraccionLeida,
  leerInvitacion,
  rutaExcluida,
  yaSuscrito,
} from "./utils";

/**
 * La invitación al boletín: una ventana en medio de la pantalla, sobre una capa oscura,
 * que aparece a quien ya está leyendo y se va cuando se le dice que se vaya.
 *
 * Es el cuarto formulario del boletín en el sitio -- portada, pie, `/entorno` y éste --
 * y el único que no espera a que lo busquen. Por eso tiene más reglas para callarse que
 * para salir; todas están en `features/boletin/utils.js`, que es donde se prueban. Aquí
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
 * ## Dos trozos
 *
 * Lo que mide va aquí, con la página, porque empieza con ella: el reloj de la visita, las
 * páginas vistas y cuánto se bajó. La ventana (el formulario, la verificación, el foco)
 * baja aparte, `InvitacionAlBoletinAbierta`, en cuanto la página está quieta: cuando toca
 * abrirla ya está, y se abre en el acto.
 */

/** Cuándo se cargó el sitio. Al evaluarse el módulo y no al montar: es la visita, no el componente. */
const INICIO_VISITA = Date.now();

const cargarVentana = () => import("./InvitacionAlBoletinAbierta");
// Si no llega (sin red, o una versión nueva del sitio, que recarga la página), no hay invitación.
const Ventana = lazy(() =>
  cargarVentana()
    .then((m) => ({ default: m.InvitacionAlBoletinAbierta }))
    .catch(() => ({ default: () => null }))
);

const medirLectura = () =>
  fraccionLeida({
    scrollY: window.scrollY,
    altoVentana: window.innerHeight,
    altoDocumento: document.documentElement.scrollHeight,
  });

export const InvitacionAlBoletin = () => {
  const { pathname } = useLocation();
  const [abierta, setAbierta] = useState(false);

  // Lo que miden los efectos, en referencias y no en estado: cambia en cada scroll y
  // no hay nada que repintar hasta que la decisión sea «sí».
  const vistas = useRef(0);
  const rutaContada = useRef(null);
  const maximoLeido = useRef(0);
  const abiertaRef = useRef(false);
  abiertaRef.current = abierta;

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

  // La ventana baja cuando la página ya está quieta (el turno de la cinta mundial, ver
  // `MarketTicker`). A quien ya no se va a invitar, no.
  useEffect(() => {
    if (yaSuscrito() || enEnfriamiento(leerInvitacion())) return undefined;
    const bajar = () => cargarVentana().catch(() => {});
    const ocioso = typeof window.requestIdleCallback === "function";
    const turno = ocioso ? window.requestIdleCallback(bajar, { timeout: 2500 }) : window.setTimeout(bajar, 1200);
    return () => (ocioso ? window.cancelIdleCallback(turno) : window.clearTimeout(turno));
  }, []);

  // Sin contarlo como un «ahora no»: el acierto, que se despide solo.
  const retirar = useCallback(() => setAbierta(false), []);

  if (!abierta) return null;

  return (
    <Suspense fallback={null}>
      <Ventana onRetirar={retirar} />
    </Suspense>
  );
};
