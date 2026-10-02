/**
 * Cuándo se invita al boletín, y cuándo no. Sólo las reglas: nada de React ni del DOM.
 *
 * La tarjeta de invitación (`InvitacionAlBoletin`) es lo que más se parece a un
 * «popup» en todo el sitio, y la diferencia entre una invitación y una molestia está
 * entera en estas reglas. Por eso viven aparte y son funciones puras: se pueden probar
 * con Node sin montar un navegador, y cambiar un plazo es cambiar una cifra aquí.
 *
 * ## Las tres preguntas
 *
 * **¿Ya le interesa el sitio?** Se invita a quien ya ha visto más de una página en esta
 * sesión, o lleva cuarenta segundos en la visita. A quien acaba de llegar no: una
 * invitación en el primer segundo es la razón por la que la gente cierra pestañas.
 *
 * **¿Está leyendo de verdad?** Además de lo anterior, tiene que haber bajado por lo
 * menos el 40 % de la página actual. Un vistazo a la cabecera no cuenta.
 *
 * **¿Hay motivo para callarse?** Mientras el aviso de cookies espera respuesta no sale
 * nada más -- dos cosas fijas al pie se tapan y un aviso tapado no pide
 * consentimiento --; tampoco en las páginas que ya son el boletín, la cuenta, el panel
 * o un formulario; ni a quien ya se suscribió; ni a quien dijo «ahora no» hace poco.
 *
 * ## La memoria del «ahora no»
 *
 * Cerrar cuenta, y cuenta acumulado: a la primera y la segunda vez se calla catorce
 * días; a partir de la tercera, noventa. Tres «no» seguidos son un «no» y no hay que
 * seguir preguntando cada dos semanas. Lo que se guarda es `{cerradas, hasta}` y no sólo
 * una fecha, para poder distinguir las dos situaciones.
 *
 * Todo acceso al almacenamiento va en `try/catch`: en una ventana privada o con el
 * almacenamiento bloqueado puede lanzar, y una invitación nunca puede romper la página.
 */

/** `localStorage`: `{cerradas, hasta}` en JSON. */
export const CLAVE_INVITACION = "se_boletin_invitacion";
/** `localStorage`: vale `"suscrito"` en cuanto alguien se suscribe desde cualquier formulario. */
export const CLAVE_BOLETIN = "se_boletin";
/** `sessionStorage`: cuántas páginas lleva vistas esta pestaña. */
export const CLAVE_VISTAS = "se_boletin_vistas";

export const VALOR_SUSCRITO = "suscrito";

const UN_DIA = 24 * 60 * 60 * 1000;
export const ENFRIAMIENTO_CORTO_MS = 14 * UN_DIA;
export const ENFRIAMIENTO_LARGO_MS = 90 * UN_DIA;
/** A partir de este número de cierres el silencio pasa a ser el largo. */
export const CIERRES_PARA_EL_LARGO = 3;

/** Cuánto hay que llevar en la visita para invitar aunque sea la primera página. */
export const ESPERA_MS = 40 * 1000;
/** Qué fracción de la página hay que haber bajado. */
export const UMBRAL_LECTURA = 0.4;

/**
 * Donde no se invita. `/entorno` y `/suscribirse` ya son el boletín; `/cuenta` y
 * `/admin` son trabajo, no lectura; `/cookies` y `/contacto` son formularios o textos
 * legales donde una tarjeta encima estorba.
 */
export const RUTAS_SIN_INVITACION = [
  "/entorno",
  "/suscribirse",
  "/cuenta",
  "/admin",
  "/cookies",
  "/contacto",
];

export const rutaExcluida = (pathname) => {
  const ruta = typeof pathname === "string" ? pathname : "";
  return RUTAS_SIN_INVITACION.some(
    (prefijo) => ruta === prefijo || ruta.startsWith(`${prefijo}/`),
  );
};

/* ─── Almacenamiento ───────────────────────────────────────────────────────── */

const almacen = (nombre) => {
  try {
    return typeof window !== "undefined" ? window[nombre] : null;
  } catch {
    return null;
  }
};

const leerClave = (nombre, clave) => {
  try {
    return almacen(nombre)?.getItem(clave) ?? null;
  } catch {
    return null;
  }
};

/** Devuelve si quedó guardado: sin almacén o con uno que lanza, `false` y sin ruido. */
const escribirClave = (nombre, clave, valor) => {
  try {
    const sitio = almacen(nombre);
    if (!sitio) return false;
    sitio.setItem(clave, valor);
    return true;
  } catch {
    return false;
  }
};

/** Convierte lo guardado en `{cerradas, hasta}` saneado; basura o nada dan el estado vacío. */
export const interpretarInvitacion = (crudo) => {
  const vacio = { cerradas: 0, hasta: null };
  if (!crudo) return vacio;
  try {
    const datos = typeof crudo === "string" ? JSON.parse(crudo) : crudo;
    const cerradas = Number.isInteger(datos?.cerradas) && datos.cerradas > 0 ? datos.cerradas : 0;
    const fecha = typeof datos?.hasta === "string" ? Date.parse(datos.hasta) : NaN;
    return { cerradas, hasta: Number.isNaN(fecha) ? null : new Date(fecha).toISOString() };
  } catch {
    return vacio;
  }
};

export const leerInvitacion = () => interpretarInvitacion(leerClave("localStorage", CLAVE_INVITACION));

/** Si el «ahora no» todavía manda. `ahora` en milisegundos, para poder probarlo. */
export const enEnfriamiento = (invitacion, ahora = Date.now()) => {
  const hasta = invitacion?.hasta ? Date.parse(invitacion.hasta) : NaN;
  return !Number.isNaN(hasta) && hasta > ahora;
};

/**
 * El estado que queda tras un cierre más. Puro: devuelve, no guarda. Catorce días las
 * dos primeras veces, noventa desde la tercera.
 */
export const siguienteCierre = (invitacion, ahora = Date.now()) => {
  const cerradas = (invitacion?.cerradas ?? 0) + 1;
  const plazo = cerradas >= CIERRES_PARA_EL_LARGO ? ENFRIAMIENTO_LARGO_MS : ENFRIAMIENTO_CORTO_MS;
  return { cerradas, hasta: new Date(ahora + plazo).toISOString() };
};

/** Guarda un cierre y devuelve lo guardado. */
export const registrarCierre = (ahora = Date.now()) => {
  const nuevo = siguienteCierre(leerInvitacion(), ahora);
  escribirClave("localStorage", CLAVE_INVITACION, JSON.stringify(nuevo));
  return nuevo;
};

export const yaSuscrito = () => leerClave("localStorage", CLAVE_BOLETIN) === VALOR_SUSCRITO;

/**
 * Lo llaman los tres formularios del sitio al acertar. Una persona que ya está en la
 * lista no tiene que volver a ver la invitación en ninguna página.
 */
export const marcarSuscrito = () => escribirClave("localStorage", CLAVE_BOLETIN, VALOR_SUSCRITO);

/** Suma una página vista a la sesión y devuelve el total. Sin almacén, cuenta uno. */
export const contarVista = () => {
  const previas = Number.parseInt(leerClave("sessionStorage", CLAVE_VISTAS) ?? "0", 10) || 0;
  const total = previas + 1;
  escribirClave("sessionStorage", CLAVE_VISTAS, String(total));
  return total;
};

/* ─── Lectura ──────────────────────────────────────────────────────────────── */

/**
 * Qué fracción del documento ha pasado ya por la pantalla: el borde inferior de la
 * ventana sobre el alto total. Sin haber bajado nada vale cero aunque la página entera
 * quepa en pantalla: «bajó un 40 %» exige haber bajado.
 */
export const fraccionLeida = ({ scrollY, altoVentana, altoDocumento }) => {
  if (!(scrollY > 0) || !(altoDocumento > 0)) return 0;
  return Math.min(1, (scrollY + altoVentana) / altoDocumento);
};

/* ─── La decisión ──────────────────────────────────────────────────────────── */

/**
 * ¿Se invita ahora? Todo lo que mira llega por parámetro; nada se lee de fuera.
 *
 * @param {object} s
 * @param {string} s.pathname          ruta actual
 * @param {"si"|"no"|null} s.consentimiento  lo que devuelve `consentimiento()`; `null` = sin contestar
 * @param {number} s.vistas            páginas vistas en la sesión, contando ésta
 * @param {number} s.msEnVisita        milisegundos desde que se cargó el sitio
 * @param {number} s.maximoLeido       mayor `fraccionLeida` alcanzada en la página actual
 * @param {boolean} s.suscrito         `yaSuscrito()`
 * @param {{cerradas:number, hasta:string|null}} s.invitacion  `leerInvitacion()`
 * @param {number} [s.ahora]           reloj, para las pruebas
 */
export const debeInvitar = ({
  pathname,
  consentimiento,
  vistas,
  msEnVisita,
  maximoLeido,
  suscrito,
  invitacion,
  ahora = Date.now(),
}) => {
  // Primero los silencios: ninguno se puede saltar por mucho interés que haya.
  if (consentimiento !== "si" && consentimiento !== "no") return false;
  if (rutaExcluida(pathname)) return false;
  if (suscrito) return false;
  if (enEnfriamiento(invitacion, ahora)) return false;

  const interesada = vistas > 1 || msEnVisita >= ESPERA_MS;
  const leyendo = maximoLeido >= UMBRAL_LECTURA;
  return interesada && leyendo;
};
