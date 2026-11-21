import { listaDeQuery } from "../utils/listaDeQuery";
import { userPublicRequest } from "../../../lib/userApi";
import { siguienteRecarga } from "../utils/recargaDePublicidad";
import { CLAVE_SOPORTE, crearEnvioDeVistos } from "../utils/envioDeVistos";

/**
 * La publicidad, desde el lado del navegador.
 *
 * Este archivo es deliberadamente corto, y esa es la decisión importante: **aquí no se
 * elige nada**. El navegador pide los huecos de la página que está pintando y recibe un
 * anuncio por hueco, ya decidido. No baja el inventario, no rota con un temporizador,
 * no cuenta impresiones.
 *
 * Los tres motivos, por orden de importancia:
 *
 * **El inventario es información comercial.** Si el navegador eligiera, tendría que
 * conocer todas las campañas -- quién es cliente, qué está vendido, con qué prioridad --
 * y eso quedaría en el código fuente de una página pública.
 *
 * **Lo que se factura no se cuenta en el cliente.** Un contador aquí lo infla cualquiera
 * con la consola abierta y lo borra cualquier bloqueador.
 *
 * **Se rota por carga de página, no por reloj.** La maqueta cambiaba de anunciante cada
 * cinco segundos; eso sirve para enseñar dónde van las piezas y no para servirlas. Un
 * anuncio que se mueve solo mientras alguien lee es lo que hace que la gente instale
 * bloqueadores -- y una impresión que el lector no llegó a ver no se puede cobrar.
 *
 * El clic tampoco pasa por aquí: el enlace que llega apunta a nuestra propia API, que
 * cuenta y redirige. Un aviso desde el navegador lo tumba cualquier bloqueador; una
 * redirección funciona aunque el JavaScript no corra.
 */

/** Las claves que el backend reconoce. Sirven para no pedir un hueco que no existe. */
export const ESPACIOS = {
  CINTILLO: "cintillo",
  PORTADA_NATIVO: "portada-nativo",
  PORTADA_NATIVO_ARTICULOS: "portada-nativo-articulos",
  // La tarjeta nativa dentro de la rejilla de Editorial de la portada.
  PORTADA_NATIVO_EDITORIAL: "portada-nativo-editorial",
  PORTADA_BANNER: "portada-banner",
  // El banner de debajo de la primera plana: el primero que se ve al bajar.
  PORTADA_APERTURA: "portada-apertura",
  LISTADO_PATROCINIO: "listado-patrocinio",
  // «Patrocinado por» del juego de /pausa. Formato C, como la franja de los listados:
  // se vende igual, apuntando la campaña a la sección `pausa`.
  PAUSA_PATROCINIO: "pausa-patrocinio",
  // «Presentado por» de la página de la LVBP. Formato C, campaña con `seccion=lvbp`.
  LVBP_PATROCINIO: "lvbp-patrocinio",
  LISTADO_NATIVO: "listado-nativo",
  ARTICULO_NATIVO: "articulo-nativo",
  ARTICULO_RAIL: "articulo-rail",
  // La tarjeta chica bajo las monedas de la primera plana, solo en escritorio.
  PORTADA_TARJETA: "portada-tarjeta",
  // El banner de debajo de la foto de una pieza, donde la foto va bajo el titular.
  ARTICULO_APERTURA: "articulo-apertura",
  BOLETIN: "boletin",
  BARRA_INFERIOR: "barra-inferior",
  PREROLL: "preroll",
};

/**
 * Los anuncios de esta página, todos de una vez.
 *
 * Se piden juntos y no uno por hueco **a propósito**: la regla de "dos espacios de la
 * misma pantalla no pueden llevar al mismo anunciante" sólo se puede aplicar si quien
 * decide ve la página entera. Con una llamada por hueco cada una decidiría a ciegas, y
 * el lector acabaría viendo el mismo logotipo tres veces.
 *
 * @param {string[]} espacios claves de `ESPACIOS`
 * @param {{seccion?: string, formato?: string, tema?: string[], pais?: string[]}} contexto
 */
export const getEspacios = async (espacios, contexto = {}) => {
  const pedidos = (espacios || []).filter(Boolean);
  if (!pedidos.length) return { activa: true, espacios: {} };

  // La recarga de quien mira: con ella la escalera del servidor baja un peldaño (ver
  // `utils/recargaDePublicidad`).
  const query = { espacios: pedidos.join(","), recarga: siguienteRecarga() };
  if (contexto.seccion) query.seccion = String(contexto.seccion);
  if (contexto.formato) query.formato = String(contexto.formato);
  const tema = listaDeQuery(contexto.tema);
  if (tema) query.tema = tema;
  const pais = listaDeQuery(contexto.pais);
  if (pais) query.pais = pais;

  const datos = await userPublicRequest("/publicidad/espacios", { query });
  return {
    activa: datos?.activa !== false,
    espacios: datos?.espacios && typeof datos.espacios === "object" ? datos.espacios : {},
  };
};

/**
 * La dirección completa del salto del clic.
 *
 * El backend manda una ruta y no una dirección entera porque el sitio y la API viven en
 * dominios distintos, y el que sabe cuál es el de la API es este lado, que lo tiene en
 * una variable de compilación. Armarla allí obligaría a deducir el dominio de las
 * cabeceras del proxy, que es justo donde una mala configuración se convierte en
 * enlaces rotos sin que nadie se entere.
 */
export const enlaceDeClic = (ruta) => {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  return `${base}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
};

const baseDeLaApi = () => String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

let envio = null;

/** El envío de impresiones de esta carga del sitio (ver `utils/envioDeVistos`). */
const envioDeVistos = () => {
  if (envio) return envio;
  envio = crearEnvioDeVistos({
    base: baseDeLaApi(),
    // El tipo del Blob es el Content-Type: `text/plain` la deja sin pregunta previa de
    // CORS, que `sendBeacon` no sabe hacer.
    beacon: (url, cuerpo) =>
      typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function"
        ? navigator.sendBeacon(url, new Blob([cuerpo], { type: "text/plain" }))
        : false,
    // `keepalive`: sigue aunque se cierre la pestaña (hasta 64 KB; un envío no pasa de 16).
    // Sin credenciales: la ficha ya dice todo lo que hace falta.
    peticion: (url, cuerpo) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: cuerpo,
        keepalive: true,
        credentials: "omit",
      }),
    reloj: () => Date.now(),
    programar: (fn, ms) => setTimeout(fn, ms),
    cancelar: (id) => clearTimeout(id),
    almacen: {
      leer: () => window.sessionStorage.getItem(CLAVE_SOPORTE),
      escribir: (v) => window.sessionStorage.setItem(CLAVE_SOPORTE, v),
    },
  });
  // Ocultar la pestaña puede ser lo último que pase antes de cerrarla, y `pagehide` es
  // lo único que se dispara de verdad al salir en iOS: en los dos casos sale todo.
  if (typeof document !== "undefined" && typeof window !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") envio.vaciar({ saliendo: true });
    });
    window.addEventListener("pagehide", () => envio.vaciar({ saliendo: true }));
  }
  return envio;
};

/**
 * Avisa de que una pieza acaba de aparecer en pantalla.
 *
 * Es lo que factura. Antes la impresión se contaba en el servidor al entregar, y con
 * varias piezas rotando en el mismo hueco eso cobraba de más de la forma más cara
 * posible: el servidor manda tres, el lector se va a los cuatro segundos, y se han
 * facturado tres de las que vio una.
 *
 * Cómo sale hacia el servidor -- la primera de cada página al momento, las rotaciones
 * juntas, y por qué juntar no cambia lo que se factura -- está en `utils/envioDeVistos`.
 * `pieza` es la que se vio: con su hueco, su marca y su arte se reconoce la misma pieza
 * en el mismo hueco servida en otra carga, que es lo que mira el cupo de 30 s.
 *
 * No devuelve nada ni espera respuesta: una impresión que no se pudo reportar es una
 * cifra ligeramente baja, no un error que mostrarle a nadie.
 */
export const reportarVisto = (enlaceDelClic, pieza = null) => {
  const token = String(enlaceDelClic || "").split("/").pop();
  if (!token) return;
  const clave = pieza
    ? [pieza.espacio, pieza.anunciante, pieza.titular, pieza.imagen, pieza.cinta].join("|")
    : null;
  try {
    const pagina = typeof window !== "undefined" ? window.location.pathname : null;
    envioDeVistos().ver(token, { clave, pagina });
  } catch {
    /* contar no puede romper la página */
  }
};
