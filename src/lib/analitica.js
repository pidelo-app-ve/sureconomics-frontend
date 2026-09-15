/**
 * La medicion de audiencia, entera y sin dependencias.
 *
 * Cuatro cookies propias -- `user_id`, `session_id`, `last_activity`, `exit_page` --, un
 * latido cada veinte segundos y un aviso de salida que sobrevive al cierre de la
 * pestana. Nada de esto existe hasta que alguien dice que si; ver `arrancar`.
 *
 * ## Las cuatro decisiones que no son obvias
 *
 * **Las cookies no viajan solas.** El sitio esta en `www.sureconomics.com` y la API en
 * `onrender.com`: dominios distintos. Una cookie puesta aqui no se manda en la cabecera
 * `Cookie` de una peticion a la API -- seria contexto cross-site, que Safari y Firefox
 * bloquean de serie --, asi que los valores se leen aqui y se mandan **en el cuerpo**.
 * El efecto secundario es bueno: siguen siendo cookies propias de verdad, que es lo que
 * dice el aviso legal, y no dependen de que el navegador permita cookies de terceros.
 *
 * **El aviso de salida va como texto plano.** `navigator.sendBeacon` es lo unico que
 * sobrevive a que se cierre la pestana, y no sabe hacer la pregunta previa de CORS. Un
 * cuerpo declarado `application/json` hacia otro dominio la exige siempre, asi que el
 * navegador descartaria el evento **sin decir nada**. Declarado `text/plain` la peticion
 * es simple y sale. El contenido sigue siendo JSON.
 *
 * **El tiempo de lectura solo corre con la pestana visible.** Medir a reloj de pared
 * convierte una pestana olvidada toda la tarde en una lectura de cuatro horas, y con eso
 * el promedio de la seccion deja de querer decir nada.
 *
 * **Los treinta minutos de inactividad los cuenta este codigo.** Una "cookie de sesion"
 * del navegador dura lo que dure la ventana abierta, que puede ser una semana. La regla
 * de los treinta minutos se aplica comparando contra `last_activity`: si se paso, se
 * emite un `session_id` nuevo.
 */

const COOKIE_CONSENTIMIENTO = "cookie_consent";
const COOKIE_USUARIO = "user_id";
const COOKIE_SESION = "session_id";
const COOKIE_ACTIVIDAD = "last_activity";
const COOKIE_SALIDA = "exit_page";

/** Las cuatro de medicion. La del consentimiento no esta: sin ella no se sabria que borrar. */
export const COOKIES_DE_MEDICION = [
  COOKIE_USUARIO,
  COOKIE_SESION,
  COOKIE_ACTIVIDAD,
  COOKIE_SALIDA,
];

const DOS_ANOS = 60 * 60 * 24 * 730;
const SEIS_MESES = 60 * 60 * 24 * 183;
const INACTIVIDAD = 30 * 60 * 1000;
const LATIDO = 20 * 1000;

/** Por debajo de esto no es una lectura, es un rebote. No se manda. */
const MINIMO_LEGIBLE = 3;

const RUTA_EVENTOS = "/analitica/eventos";
const RUTA_OLVIDAR = "/analitica/olvidar";

/* ─── Cookies ──────────────────────────────────────────────────────────────── */

const leer = (nombre) => {
  if (typeof document === "undefined") return null;
  const trozo = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${nombre}=`));
  if (!trozo) return null;
  try {
    return decodeURIComponent(trozo.slice(nombre.length + 1));
  } catch {
    return null;
  }
};

/**
 * `SameSite=Lax` y no `None`: estas cookies no tienen que viajar desde otro sitio, y
 * `None` las convertiria en cookies de contexto cruzado -- justo lo que el aviso
 * promete que no son. `Secure` salvo en local, donde no hay https y el navegador la
 * descartaria. Nunca `HttpOnly`: este codigo tiene que poder leerlas.
 */
const escribir = (nombre, valor, segundos) => {
  if (typeof document === "undefined") return;
  const seguro = window.location.protocol === "https:" ? "; Secure" : "";
  const caduca = segundos ? `; Max-Age=${segundos}` : "";
  document.cookie = `${nombre}=${encodeURIComponent(valor)}; Path=/; SameSite=Lax${seguro}${caduca}`;
};

const borrar = (nombre) => {
  if (typeof document === "undefined") return;
  document.cookie = `${nombre}=; Path=/; Max-Age=0; SameSite=Lax`;
};

/** `crypto.randomUUID` no existe en contexto inseguro; de ahi el respaldo. */
const uuid = () => {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((n) => n.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  } catch {
    return null;
  }
};

/* ─── Consentimiento ───────────────────────────────────────────────────────── */

/** `"si"`, `"no"`, o `null` mientras no haya contestado. */
export const consentimiento = () => {
  const valor = leer(COOKIE_CONSENTIMIENTO);
  return valor === "si" || valor === "no" ? valor : null;
};

export const aceptado = () => consentimiento() === "si";

/**
 * Guarda la decision. Seis meses: pasado ese plazo se vuelve a preguntar, que es lo que
 * las autoridades de proteccion de datos consideran razonable para no dar por eterno un
 * si dicho una vez.
 *
 * La cookie del consentimiento se pone **tambien cuando la respuesta es no**. Es la
 * unica manera de respetar el no: sin ella habria que preguntar en cada pagina. Esa
 * cookie es tecnica necesaria y esta exenta de consentimiento, y aun asi va declarada en
 * el aviso -- omitirla seria el tipico defecto de un documento que nadie contrasto con
 * el codigo.
 */
export const decidir = (respuesta) => {
  const valor = respuesta === "si" ? "si" : "no";
  escribir(COOKIE_CONSENTIMIENTO, valor, SEIS_MESES);
  if (valor === "si") arrancar();
  else parar({ borrarCookies: true });
  return valor;
};

/**
 * Revoca y borra. Devuelve la promesa del borrado en el servidor para que la pantalla
 * pueda decir "hecho" cuando este hecho de verdad y no cuando se pidio.
 */
export const revocar = () => {
  const id = leer(COOKIE_USUARIO);
  const peticion = id ? olvidarEnServidor(id) : Promise.resolve();
  decidir("no");
  return peticion;
};

/* ─── Estado del modulo ────────────────────────────────────────────────────── */

let encendido = false;
let temporizador = null;
let rutaActual = null;
/** Milisegundos visibles acumulados en la ruta actual. */
let acumulado = 0;
/** Cuando empezo a contar el tramo visible en curso; `null` si esta pausado. */
let desde = null;
let quitarOyentes = null;

const base = () => (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/* ─── Envio ────────────────────────────────────────────────────────────────── */

/**
 * Manda uno o varios eventos.
 *
 * Con `conBeacon` va por `sendBeacon`, que encola el envio en el navegador y lo suelta
 * aunque la pagina ya no exista. Sin el, `fetch` con `keepalive`. Los dos van como
 * `text/plain` por lo del preflight; el servidor lo espera asi.
 */
const enviar = (eventos, { conBeacon = false } = {}) => {
  const url = base() + RUTA_EVENTOS;
  if (!base() || !eventos.length) return;
  const cuerpo = JSON.stringify(eventos.length === 1 ? eventos[0] : { eventos });

  if (conBeacon && navigator.sendBeacon) {
    try {
      // El tipo del Blob es el Content-Type de la peticion. `text/plain` la mantiene
      // simple; con `application/json` el navegador la descartaria sin avisar.
      const ok = navigator.sendBeacon(url, new Blob([cuerpo], { type: "text/plain;charset=UTF-8" }));
      if (ok) return;
    } catch {
      // Cae al fetch de abajo.
    }
  }

  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: cuerpo,
      keepalive: true,
      // Ni cookies ni credenciales: los identificadores van en el cuerpo. Mandar
      // `credentials` obligaria a `SameSite=None` y las convertiria en cookies de
      // contexto cruzado.
      credentials: "omit",
    }).catch(() => {});
  } catch {
    // Medir nunca puede romper una pagina.
  }
};

const olvidarEnServidor = (userId) => {
  if (!base()) return Promise.resolve();
  return fetch(base() + RUTA_OLVIDAR, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ user_id: userId }),
    credentials: "omit",
  }).catch(() => {});
};

/* ─── Identidad ────────────────────────────────────────────────────────────── */

const identidad = () => {
  let userId = leer(COOKIE_USUARIO);
  if (!userId) {
    userId = uuid();
    if (!userId) return null;
  }
  // Se reescribe en cada visita para que los dos anos cuenten desde la ultima y no
  // desde la primera: es lo que mide "audiencia recurrente".
  escribir(COOKIE_USUARIO, userId, DOS_ANOS);

  const ultima = Number(leer(COOKIE_ACTIVIDAD)) || 0;
  const caducada = !ultima || Date.now() - ultima > INACTIVIDAD;
  let sessionId = leer(COOKIE_SESION);
  if (!sessionId || caducada) {
    sessionId = uuid();
    if (!sessionId) return null;
    escribir(COOKIE_SESION, sessionId);
  }
  escribir(COOKIE_ACTIVIDAD, String(Date.now()));

  return { user_id: userId, session_id: sessionId };
};

const evento = (tipo, extra = {}) => {
  const quien = identidad();
  if (!quien) return null;
  return { tipo, ruta: rutaActual ?? window.location.pathname, ...quien, ...extra };
};

/* ─── Tiempo visible ───────────────────────────────────────────────────────── */

const pausar = () => {
  if (desde != null) {
    acumulado += Date.now() - desde;
    desde = null;
  }
};

const reanudar = () => {
  if (desde == null) desde = Date.now();
};

const segundosLeidos = () => {
  const total = acumulado + (desde != null ? Date.now() - desde : 0);
  return Math.round(total / 1000);
};

/** Cierra la ruta en curso y devuelve su evento de salida, o `null` si no hubo lectura. */
const cerrarRuta = () => {
  if (!rutaActual) return null;
  pausar();
  const segundos = segundosLeidos();
  const ruta = rutaActual;
  acumulado = 0;
  desde = null;
  if (segundos < MINIMO_LEGIBLE) return null;
  return evento("salida", { ruta, segundos });
};

/* ─── Ciclo de vida ────────────────────────────────────────────────────────── */

const latir = () => {
  if (!encendido || document.visibilityState !== "visible") return;
  const e = evento("latido");
  if (e) enviar([e]);
};

/**
 * Irse a otra pestana no es salir del sitio, pero puede ser lo ultimo que ocurra antes
 * de cerrarla -- y entonces ya no corre nada. Asi que se manda lo leido **ahora**, con
 * beacon, y si la persona vuelve se sigue contando desde cero sobre la misma ruta. El
 * servidor suma las dos lecturas de esa ruta; lo que no hace es perder la primera.
 */
const alCambiarVisibilidad = () => {
  if (document.visibilityState === "hidden") {
    const salida = cerrarRuta();
    if (salida) enviar([salida], { conBeacon: true });
  } else {
    reanudar();
    latir();
  }
};

const alSalir = () => {
  if (!encendido) return;
  // Si no da ni el minimo legible se manda un latido igual: renueva la sesion y deja
  // `exit_page` al dia en el servidor, que es la mitad de lo que se vino a medir.
  const ultimo = cerrarRuta() ?? evento("latido");
  if (ultimo) enviar([ultimo], { conBeacon: true });
};

/**
 * Enciende la medicion. Idempotente: llamarla dos veces no duplica latidos ni oyentes,
 * que es justo lo que pasaria en desarrollo, donde React monta cada efecto dos veces.
 */
export const arrancar = () => {
  if (encendido || typeof document === "undefined") return;
  if (!aceptado()) return;
  encendido = true;

  rutaActual = window.location.pathname;
  acumulado = 0;
  desde = document.visibilityState === "visible" ? Date.now() : null;
  escribir(COOKIE_SALIDA, rutaActual);

  const primera = evento("vista");
  if (primera) enviar([primera]);

  temporizador = window.setInterval(latir, LATIDO);
  document.addEventListener("visibilitychange", alCambiarVisibilidad);
  // `pagehide` y no `beforeunload`: es el unico que se dispara de verdad en iOS, y no
  // impide que el navegador guarde la pagina en su cache de atras/adelante.
  window.addEventListener("pagehide", alSalir);

  quitarOyentes = () => {
    document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    window.removeEventListener("pagehide", alSalir);
  };
};

export const parar = ({ borrarCookies = false } = {}) => {
  if (temporizador) window.clearInterval(temporizador);
  temporizador = null;
  if (quitarOyentes) quitarOyentes();
  quitarOyentes = null;
  encendido = false;
  rutaActual = null;
  acumulado = 0;
  desde = null;
  if (borrarCookies) COOKIES_DE_MEDICION.forEach(borrar);
};

/**
 * Cambio de pagina dentro del sitio. Cierra la anterior -- con su tiempo -- y abre la
 * nueva, en una sola peticion.
 */
export const registrarVista = (ruta) => {
  if (!encendido) return;
  const destino = ruta || window.location.pathname;
  if (destino === rutaActual) return;

  const eventos = [];
  const salida = cerrarRuta();
  if (salida) eventos.push(salida);

  rutaActual = destino;
  acumulado = 0;
  desde = document.visibilityState === "visible" ? Date.now() : null;
  escribir(COOKIE_SALIDA, destino);

  const vista = evento("vista");
  if (vista) eventos.push(vista);
  if (eventos.length) enviar(eventos);
};

/** Lo que la pagina de cookies ensena: que hay puesto ahora mismo, sin inventar nada. */
export const estado = () => ({
  decision: consentimiento(),
  user_id: leer(COOKIE_USUARIO),
  session_id: leer(COOKIE_SESION),
  last_activity: leer(COOKIE_ACTIVIDAD),
  exit_page: leer(COOKIE_SALIDA),
});
