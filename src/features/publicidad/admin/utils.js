/**
 * Los formatos publicitarios vistos desde el panel, sin React: qué publica cada uno,
 * cómo se llama en cristiano y cómo se resume una pieza. Lo usan el formulario de la
 * pieza, el asistente y el mural de anunciantes. Y, al final, el tope de peso del arte y
 * qué se hace con el que pasa (lo usa `aligerarArte.js`).
 */
import { esGif, esSvg } from "../../../components/admin/aligerarImagen.js";

/**
 * A qué tamaño (px) deja el panel un arte cuando lo aligera: el de su hueco, al doble
 * para que se vea nítido en las pantallas que tienen dos puntos por píxel. Es una caja:
 * el arte cabe dentro sin deformarse y, si es una foto más pequeña, no se agranda.
 * Un solo sitio para todas; los formatos de abajo las nombran.
 */
export const MEDIDAS_DE_ARTE = {
  // La tira (banner, franja, boletín y la tarjeta en un listado) se ve a 1456 × 180.
  cinta: { ancho: 2912, alto: 360 },
  // El arte de teléfono: 1200 × 600 es lo que se le pide al anunciante.
  cinta_movil: { ancho: 1200, alto: 600 },
  // La imagen de la tarjeta (16:9): una celda de la portada en el computador, y todo el
  // ancho en el teléfono (unos 400 px, a tres puntos por píxel).
  tarjeta: { ancho: 1200, alto: 675 },
  // La imagen del rail (4:3): su columna mide menos de 320 px, pero en el teléfono va a
  // todo el ancho, como la tarjeta.
  rail: { ancho: 1200, alto: 900 },
  // El logotipo: nunca se ve a más de 320 px de ancho en el computador ni a todo el
  // ancho en el teléfono. Llegó alguno de 4.500 px.
  logo: { ancho: 1200, alto: 1200 },
};

/**
 * Para cada formato: cómo se llama en cristiano, dónde sale, y qué campos imprime.
 *
 * Es el reflejo de lo que hace `EspacioPublicitario`, que es quien pinta de verdad. Si
 * allí se cambia lo que un formato dibuja, hay que cambiarlo aquí: el precio de que el
 * formulario no mienta es que las dos listas tienen que ir juntas.
 *
 * `arte` va en orden de importancia y nombra el campo por su papel en *ese* formato.
 * `campo` es la columna donde se guarda —`imagen` o `cinta`—, y sólo la tarjeta nativa
 * lleva las dos. Sin `arte`, el formato no publica ninguna imagen.
 */
export const GUIA_DE_FORMATO = {
  A: {
    nombre: "Tarjeta entre las noticias",
    donde:
      "En tres sitios: la portada, los listados y dentro de un artículo. Es el único formato que viaja — por eso lleva dos artes: en la portada ocupa una celda de la rejilla, y en los otros dos se estira a todo lo ancho.",
    arte: [
      {
        campo: "imagen",
        etiqueta: "Imagen de la tarjeta",
        forma: { ancho: 16, alto: 9 },
        medidas: MEDIDAS_DE_ARTE.tarjeta,
        pista:
          "La que sale en la portada, entre las noticias. Tiene la misma forma que la foto de una noticia y va encima del titular.",
      },
      {
        campo: "cinta",
        etiqueta: "Tira ancha — 1456 × 180 px",
        forma: { ancho: 1456, alto: 180 },
        medidas: MEDIDAS_DE_ARTE.cinta,
        pista:
          "La misma pieza, cuando cae en un listado o dentro de un artículo. Ahí no hay celda: es una franja de lado a lado, ocho veces más ancha que alta. Los botones de la vista previa enseñan las dos.",
      },
    ],
    titular: true,
    pie: true,
  },
  B: {
    nombre: "Banner grande",
    donde: "Sólo en la portada, cruzándola de lado a lado. Es el espacio más caro del sitio y no sale en ninguna otra página.",
    arte: [
      {
        campo: "cinta",
        etiqueta: "Arte del banner — 1456 × 180 px",
        forma: { ancho: 1456, alto: 180 },
        medidas: MEDIDAS_DE_ARTE.cinta,
        pista:
          "Es lo único que se publica de este formato: el arte entero, sin recortar. Ni el titular ni el pie salen en ninguna parte.",
      },
    ],
  },
  C: {
    nombre: "Franja de patrocinio",
    // El juego de /pausa también es C (`pausa-patrocinio`), pero no publica el arte:
    // pinta el logotipo del anunciante, de su ficha. Decirlo aquí evita que alguien
    // suba una franja pensando que es lo que sale en el juego.
    donde:
      "En los listados (Noticias, Artículos, Editorial…), encabezándolos. Y en el juego «Un minuto de pausa» como «Patrocinado por», con el logotipo del anunciante (el de su ficha, no este arte): para venderlo solo, elija la sección «Juego: Un minuto de pausa» en «Dónde sale».",
    arte: [
      {
        campo: "cinta",
        etiqueta: "Arte de la franja — 1456 × 180 px",
        forma: { ancho: 1456, alto: 180 },
        medidas: MEDIDAS_DE_ARTE.cinta,
        pista:
          "Se recorta por arriba y por abajo para quedar más baja que un banner. No ponga texto pegado al borde.",
      },
    ],
  },
  D: {
    nombre: "Patrocinio del boletín",
    donde: "En el bloque de suscripción al boletín, que hoy sólo se pinta en la portada. No viaja dentro del correo.",
    arte: [
      {
        campo: "cinta",
        etiqueta: "Arte del boletín — 1456 × 180 px",
        forma: { ancho: 1456, alto: 180 },
        medidas: MEDIDAS_DE_ARTE.cinta,
        pista: "Igual que la franja: se recorta por arriba y por abajo.",
      },
    ],
  },
  F: {
    nombre: "Cintillo de cabecera",
    donde: "La línea fina sobre la cabecera.",
    // Tiene pintor, pero ninguna vista pide el espacio `cintillo`: salio de
    // `ESPACIOS_DE_SITIO` cuando el cliente lo quito de la cinta de mercado (09/2026) y
    // no se repuso en ningun sitio. Se puede guardar y no sale. Decirlo aqui es lo
    // unico que evita vender un hueco que no existe.
    sinSalida:
      "Hoy ninguna página pide este espacio, así que no se publica en ninguna parte. Se quitó de la cabecera en septiembre de 2026 y no se ha repuesto.",
  },
  I: {
    nombre: "Rail lateral",
    donde: "Sólo dentro de un artículo, en la columna estrecha de la derecha.",
    arte: [
      {
        campo: "imagen",
        etiqueta: "Imagen del rail",
        forma: { ancho: 4, alto: 3 },
        medidas: MEDIDAS_DE_ARTE.rail,
        pista:
          "La columna de la derecha tiene menos de la mitad de ancho que un banner: una tira larga se ve diminuta aquí.",
      },
    ],
    titular: true,
  },
  E: {
    nombre: "Mención pre-roll",
    donde: "Antes de un vídeo.",
    sinSalida:
      "Este formato todavía no se sirve en ninguna parte del sitio. Puede guardarlo, pero no se publicará.",
  },
  H: {
    nombre: "Barra fija inferior",
    donde: "Pegada al pie de la pantalla.",
    sinSalida:
      "Este formato todavía no se sirve en ninguna parte del sitio. Puede guardarlo, pero no se publicará.",
  },
};

/**
 * El arte para teléfono de los formatos de tira: va aparte de `arte` porque no cambia de
 * un formato a otro. La tira es 8:1: en un teléfono mide unos 48 px de alto y el texto
 * deja de leerse, y escalar no reacomoda (da igual SVG o JPEG).
 */
export const ARTE_DE_TELEFONO = {
  campo: "cinta_movil",
  etiqueta: "Arte para teléfono — 1200 × 600 px (recomendado)",
  pista:
    "Lo hace el anunciante: 1200 × 600 px (PNG, JPG, WebP o SVG), con el logo, la frase y el botón apilados y centrados, nada importante a menos de 60 px del borde y letra grande. Se usa en pantallas de menos de 640 px, donde sale unas cuatro veces más alto. Sin él, en el teléfono sale la tira entera, de unos 45 px de alto.",
  forma: { ancho: 2, alto: 1 },
  medidas: MEDIDAS_DE_ARTE.cinta_movil,
};

/** El nombre legible, con el del servidor de respaldo por si aparece un formato nuevo. */
export const nombreDeFormato = (letra, formatos) =>
  GUIA_DE_FORMATO[letra]?.nombre ?? formatos?.[letra] ?? letra;

/** Una línea que diga en qué estado está la pieza sin tener que abrirla. */
export const resumenDePieza = (pieza, guia) => {
  if (guia?.titular) return pieza.titular_corto || pieza.titular || "Sin titular";
  if (guia?.arte?.length) return pieza.cinta || pieza.imagen ? "Con arte" : "Sin arte";
  return pieza.enlace || "Sin destino";
};

/**
 * Lo más que puede pesar el arte de un anuncio (bytes, KB de 1024), los dos incluidos:
 * cada lector lo baja entero en cada portada. Un SVG que era una foto vectorizada pesaba
 * 243 KB ya comprimido (23-nov-2026). Los mismos que `TOPE_ARTE_*` en el backend
 * (`app/domains/publicidad/rules.py`), que es quien manda: aquí solo se avisa antes de
 * subir, para no mandar a la biblioteca un archivo que luego no se podrá usar.
 */
export const TOPE_ARTE_SVG = 50 * 1024;
export const TOPE_ARTE_IMAGEN = 150 * 1024;

/**
 * Por qué no vale este arte por su peso, en una frase; `null` si vale. Mismas palabras
 * que el servidor (`rules.arte_demasiado_pesado`).
 *
 * @param {{ mime?: string, bytes?: number, nombre?: string }} archivo
 * @returns {string | null}
 */
export const arteDemasiadoPesado = ({ mime, bytes, nombre } = {}) => {
  if (!bytes) return null;
  // Sin tipo (algún sistema no lo da), por la extensión.
  const svg = esSvg({ mime, nombre });
  const tope = svg ? TOPE_ARTE_SVG : TOPE_ARTE_IMAGEN;
  if (bytes <= tope) return null;
  // Hacia arriba: con 50 KB y un byte, «pesa 50 KB y el máximo es 50 KB» no se entendería.
  const kb = Math.ceil(bytes / 1024);
  const quien = nombre ? `«${nombre}»` : svg ? "El SVG" : "La imagen";
  const que = svg ? "un SVG de anuncio" : "una imagen de anuncio";
  const consejo = svg
    ? `Si es una foto o una ilustración pasada a vectorial, expórtela en WebP (hasta ${TOPE_ARTE_IMAGEN / 1024} KB); si es un logo, simplifíquelo.`
    : "Expórtela en WebP o en JPG con menos calidad, o más pequeña.";
  return `${quien} pesa ${kb} KB; ${que} puede pesar hasta ${tope / 1024} KB, porque cada lector se baja el archivo entero en cada portada. ${consejo}`;
};

/* ─── Aligerar el arte que pesa de más ─────────────────────────────────────────────────
 *
 * Cuando un arte pasa del tope, el panel no lo rechaza: lo convierte en el navegador
 * (`aligerarArte.js`, con el convertidor de todo el panel,
 * `components/admin/aligerarImagen.js`). Aquí, qué se hace con cada archivo. */

/** El tope que le toca a un archivo (bytes). */
export const topeDelArte = (archivo) => (esSvg(archivo) ? TOPE_ARTE_SVG : TOPE_ARTE_IMAGEN);

/**
 * Qué hacer con un archivo antes de subirlo: `subir` tal cual (no pasa del tope),
 * `aligerar`, o `rechazar` con su motivo (un GIF animado: pasarlo a WebP le quitaría el
 * movimiento, así que se avisa como siempre y no se sube).
 *
 * @param {{ mime?: string, bytes?: number, nombre?: string, gifAnimado?: boolean }} archivo
 * @returns {{ accion: "subir" | "aligerar" | "rechazar", motivo?: string }}
 */
export const decidirAligerado = (archivo = {}) => {
  const motivo = arteDemasiadoPesado(archivo);
  if (!motivo) return { accion: "subir" };
  if (esGif(archivo) && archivo.gifAnimado !== false) {
    return {
      accion: "rechazar",
      motivo: `${motivo} Es un GIF animado: el panel no lo aligera solo porque perdería el movimiento.`,
    };
  }
  return { accion: "aligerar" };
};

/* ─── La tabla de campañas: qué se ve, en el navegador ──────────────────────────── */

/** Lo que se puede elegir en «Ver» de la tabla de campañas. Se entra «Sin terminadas». */
export const VISTAS_DE_CAMPANAS = {
  sin_terminadas: "Sin terminadas",
  al_aire: "Al aire",
  programadas: "Programadas",
  terminadas: "Terminadas",
  todas: "Todas",
};

/**
 * En qué momento está una campaña, con `hoy` (AAAA-MM-DD, Caracas): `terminada` (se dio
 * por terminada o ya pasó su último día), `programada` (todavía no llegó su primer día),
 * `al_aire` (activa y sin nada que la frene: el servidor manda `freno` si no sale) u `otra`
 * (en pausa, borrador, tope alcanzado, sin pieza…).
 */
export const momentoDeCampana = (c, hoy) => {
  if (c?.estado === "terminada" || (c?.hasta && c.hasta < hoy)) return "terminada";
  if (c?.desde && c.desde > hoy) return "programada";
  return c?.estado === "activa" && !c?.freno ? "al_aire" : "otra";
};

const PASA_LA_VISTA = {
  sin_terminadas: (m) => m !== "terminada",
  al_aire: (m) => m === "al_aire",
  programadas: (m) => m === "programada",
  terminadas: (m) => m === "terminada",
  todas: () => true,
};

/** Si la campaña sale con la vista elegida (una vista que no existe es «Sin terminadas»). */
export const campanaEnLaVista = (c, vista, hoy) => (PASA_LA_VISTA[vista] ?? PASA_LA_VISTA.sin_terminadas)(momentoDeCampana(c, hoy));
