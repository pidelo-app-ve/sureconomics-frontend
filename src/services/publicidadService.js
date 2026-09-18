import { userPublicRequest } from "../lib/userApi";

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
  PORTADA_BANNER: "portada-banner",
  LISTADO_PATROCINIO: "listado-patrocinio",
  LISTADO_NATIVO: "listado-nativo",
  ARTICULO_NATIVO: "articulo-nativo",
  ARTICULO_RAIL: "articulo-rail",
  BOLETIN: "boletin",
  BARRA_INFERIOR: "barra-inferior",
  PREROLL: "preroll",
};

const listaDeQuery = (valor) => {
  if (!valor) return null;
  const partes = (Array.isArray(valor) ? valor : [valor])
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);
  return partes.length ? partes.join(",") : null;
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

  const query = { espacios: pedidos.join(",") };
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

/**
 * Avisa de que una pieza acaba de aparecer en pantalla.
 *
 * Es lo que factura. Antes la impresión se contaba en el servidor al entregar, y con
 * varias piezas rotando en el mismo hueco eso cobraba de más de la forma más cara
 * posible: el servidor manda tres, el lector se va a los cuatro segundos, y se han
 * facturado tres de las que vio una.
 *
 * Va por `sendBeacon` y no por `fetch`: no lleva preflight —así que no hay una petición
 * `OPTIONS` por rotación— y sobrevive a que se cierre la pestaña, que es exactamente
 * cuando hay que contar la última que se vio. El cuerpo es el token firmado, en texto
 * plano, porque `sendBeacon` no admite cabeceras.
 *
 * No devuelve nada ni espera respuesta: una impresión que no se pudo reportar es una
 * cifra ligeramente baja, no un error que mostrarle a nadie.
 */
export const reportarVisto = (enlaceDelClic) => {
  const token = String(enlaceDelClic || "").split("/").pop();
  if (!token) return;
  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  const destino = `${base}/publicidad/visto`;
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(destino, new Blob([token], { type: "text/plain" }));
      return;
    }
    // Sin `sendBeacon` (Safari muy viejo), el intento normal. `keepalive` hace lo
    // mismo al cerrar la pestaña, dentro de su límite de 64 KB, que aquí sobra.
    fetch(destino, { method: "POST", body: token, keepalive: true }).catch(() => {});
  } catch {
    /* contar no puede romper la página */
  }
};
