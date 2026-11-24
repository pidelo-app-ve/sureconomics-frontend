/**
 * Los formatos publicitarios vistos desde el panel, sin React: qué publica cada uno,
 * cómo se llama en cristiano y cómo se resume una pieza. Lo usan el formulario de la
 * pieza, el asistente y el mural de anunciantes. Y, al final, las cuentas sin navegador
 * de cómo se aligera un arte que pesa de más (las usa `aligerarArte.js`).
 */

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
  const esSvg = esArteSvg({ mime, nombre });
  const tope = esSvg ? TOPE_ARTE_SVG : TOPE_ARTE_IMAGEN;
  if (bytes <= tope) return null;
  // Hacia arriba: con 50 KB y un byte, «pesa 50 KB y el máximo es 50 KB» no se entendería.
  const kb = Math.ceil(bytes / 1024);
  const quien = nombre ? `«${nombre}»` : esSvg ? "El SVG" : "La imagen";
  const que = esSvg ? "un SVG de anuncio" : "una imagen de anuncio";
  const consejo = esSvg
    ? `Si es una foto o una ilustración pasada a vectorial, expórtela en WebP (hasta ${TOPE_ARTE_IMAGEN / 1024} KB); si es un logo, simplifíquelo.`
    : "Expórtela en WebP o en JPG con menos calidad, o más pequeña.";
  return `${quien} pesa ${kb} KB; ${que} puede pesar hasta ${tope / 1024} KB, porque cada lector se baja el archivo entero en cada portada. ${consejo}`;
};

/* ─── Aligerar un arte que pesa de más ─────────────────────────────────────────────────
 *
 * Cuando un arte pasa del tope, el panel no lo rechaza: lo redibuja en el navegador como
 * WebP, en el tamaño de su hueco, y lo baja de calidad (y si hace falta de tamaño) hasta
 * que entra. Aquí están las cuentas, sin navegador, para poder probarlas en node; el
 * dibujo de verdad (el `<canvas>`) está en `aligerarArte.js`. */

/** El tipo sin parámetros ni mayúsculas: «image/svg+xml; charset=utf-8» → «image/svg+xml». */
export const tipoLimpio = (mime) => String(mime || "").split(";")[0].trim().toLowerCase();

/** Si es un SVG: por el tipo o, si el sistema no lo da, por la extensión. */
export const esArteSvg = ({ mime, nombre } = {}) =>
  tipoLimpio(mime) === "image/svg+xml" || /\.svg$/i.test(nombre || "");

/** El tope que le toca a un archivo (bytes). */
export const topeDelArte = (archivo) => (esArteSvg(archivo) ? TOPE_ARTE_SVG : TOPE_ARTE_IMAGEN);

/** Si es un GIF, por el tipo o por la extensión. */
export const esArteGif = ({ mime, nombre } = {}) =>
  tipoLimpio(mime) === "image/gif" || /\.gif$/i.test(nombre || "");

/**
 * Las calidades que se prueban, de mejor a peor, y la más baja que se acepta: por debajo
 * de 0,6 un WebP ya enseña manchas en las letras. Si ni con la más baja entra, se achica
 * la imagen un 15 % y se vuelve a empezar, como mucho `ACHIQUES_MAXIMOS` veces (0,85⁶ es
 * algo más de un tercio del ancho: más pequeño ya no sirve como anuncio).
 *
 * El JPEG es el plan B para un navegador que no sabe hacer WebP (Safari antiguo): empieza
 * más alto porque a igual número pierde más que el WebP.
 */
export const CALIDADES_WEBP = [0.82, 0.75, 0.68, 0.6];
export const CALIDADES_JPEG = [0.9, 0.82, 0.75, 0.68, 0.6];
export const ACHIQUE = 0.85;
export const ACHIQUES_MAXIMOS = 6;
const MENOR_LADO = 16;

/**
 * A qué tamaño se dibuja: lo más grande que cabe en `caja` sin deformar. Una foto más
 * pequeña que la caja se queda como está (agrandarla solo la emborrona); un SVG es
 * vectorial y se dibuja al tamaño de la caja. Sin medidas propias, la caja.
 *
 * @param {{ ancho?: number, alto?: number } | null} propias
 * @param {{ ancho: number, alto: number }} caja
 * @param {{ vectorial?: boolean }} [opciones]
 */
export const medidasDeSalida = (propias, caja, { vectorial = false } = {}) => {
  const ancho = Number(propias?.ancho);
  const alto = Number(propias?.alto);
  if (!(ancho > 0 && alto > 0)) return { ancho: caja.ancho, alto: caja.alto };
  let escala = Math.min(caja.ancho / ancho, caja.alto / alto);
  if (!vectorial) escala = Math.min(escala, 1);
  return { ancho: Math.max(1, Math.round(ancho * escala)), alto: Math.max(1, Math.round(alto * escala)) };
};

/** Corta si alguien canceló (cerró la ventana, eligió otro archivo). */
export const comprobarSenal = (senal) => {
  if (senal?.aborted) {
    const error = new Error("Se canceló antes de terminar.");
    error.name = "AbortError";
    throw error;
  }
};

/**
 * Busca la versión más fiel que pese como mucho `tope`: cada tamaño con sus calidades de
 * mejor a peor, y si no, un 15 % más pequeño. `exportar` es quien dibuja (en el navegador,
 * un `<canvas>`; en las pruebas, una función de mentira) y devuelve un `Blob`.
 *
 * Si el navegador devuelve otro tipo cuando se le pide WebP (Safari antiguo da un PNG),
 * se pasa a JPEG en el mismo tamaño y se sigue con él.
 *
 * @returns {Promise<{ blob: Blob, tipo: string, calidad: number, ancho: number, alto: number } | null>}
 *   `null` si ni achicando entra.
 */
export const buscarVersionLigera = async ({ medidas, tope, exportar, senal }) => {
  let tipo = "image/webp";
  let { ancho, alto } = medidas;
  for (let achique = 0; achique <= ACHIQUES_MAXIMOS; achique += 1) {
    const calidades = () => (tipo === "image/webp" ? CALIDADES_WEBP : CALIDADES_JPEG);
    for (let i = 0; i < calidades().length; i += 1) {
      comprobarSenal(senal);
      const calidad = calidades()[i];
      const blob = await exportar({ ancho, alto, tipo, calidad });
      if (tipo === "image/webp" && blob?.type !== "image/webp") {
        // No sabe hacer WebP: a JPEG, desde su primera calidad y en este mismo tamaño.
        tipo = "image/jpeg";
        i = -1;
        continue;
      }
      if (blob && blob.size <= tope) return { blob, tipo, calidad, ancho, alto };
    }
    const siguiente = { ancho: Math.round(ancho * ACHIQUE), alto: Math.round(alto * ACHIQUE) };
    if (Math.min(siguiente.ancho, siguiente.alto) < MENOR_LADO) break;
    ({ ancho, alto } = siguiente);
  }
  return null;
};

/** El nombre del archivo aligerado: el de antes, con la extensión nueva. */
export const nombreAligerado = (nombre, tipo) => {
  const base = String(nombre || "").replace(/\.[^./\\]*$/, "").trim() || "arte";
  return `${base}.${tipo === "image/jpeg" ? "jpg" : "webp"}`;
};

/** KB redondeados, nunca 0 (un archivo de 300 bytes no «pesa 0 KB»). */
export const kilobytes = (bytes) => Math.max(1, Math.round((Number(bytes) || 0) / 1024));

/** Lo que dice el panel al terminar. */
export const avisoDeAligerado = (antes, despues) =>
  `Se aligeró de ${kilobytes(antes)} KB a ${kilobytes(despues)} KB.`;

export const AVISO_OPTIMIZANDO = "Optimizando la imagen…";

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
  if (esArteGif(archivo) && archivo.gifAnimado !== false) {
    return {
      accion: "rechazar",
      motivo: `${motivo} Es un GIF animado: el panel no lo aligera solo porque perdería el movimiento.`,
    };
  }
  return { accion: "aligerar" };
};

/**
 * Si un GIF tiene más de un cuadro. Recorre sus bloques (cabecera, paleta, extensiones e
 * imágenes) sin descomprimir nada. Si el archivo no se entiende, se da por animado: es lo
 * prudente, porque convertirlo se comería la animación.
 *
 * @param {Uint8Array} b
 */
export const esGifAnimado = (b) => {
  const fin = b?.length ?? 0;
  if (fin < 13 || String.fromCharCode(b[0], b[1], b[2]) !== "GIF") return true;
  let p = 13;
  if (b[10] & 0x80) p += 3 * 2 ** ((b[10] & 0x07) + 1); // paleta global
  /** Salta los subbloques (tamaño + datos) hasta el que mide 0. */
  const saltarSubbloques = () => {
    while (p < fin && b[p] !== 0) p += b[p] + 1;
    p += 1;
  };
  let cuadros = 0;
  while (p < fin) {
    const bloque = b[p];
    if (bloque === 0x3b) break; // fin del archivo
    if (bloque === 0x21) {
      p += 2; // extensión: marca y etiqueta
      saltarSubbloques();
    } else if (bloque === 0x2c) {
      cuadros += 1;
      if (cuadros > 1) return true;
      if (p + 10 > fin) return true;
      const empaquetado = b[p + 9];
      p += 10;
      if (empaquetado & 0x80) p += 3 * 2 ** ((empaquetado & 0x07) + 1); // paleta local
      p += 1; // tamaño mínimo del código LZW
      saltarSubbloques();
    } else {
      return true;
    }
  }
  return cuadros > 1;
};

/** Un número de un atributo de SVG en píxeles («1456», «1456px»); null con %, em… */
const pixeles = (valor) => {
  const m = /^\s*([\d.]+)\s*(px)?\s*$/i.exec(valor ?? "");
  const n = m ? Number(m[1]) : NaN;
  return n > 0 ? n : null;
};

/** La etiqueta `<svg …>` de arriba (la primera; el prólogo XML y los comentarios no cuentan). */
const ETIQUETA_SVG = /<svg\b[^>]*>/i;

/** Un atributo de la etiqueta (`\s` delante: `stroke-width` no es `width`). */
const atributo = (etiqueta, nombre) =>
  new RegExp(`\\s${nombre}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(etiqueta);

/**
 * Las medidas propias de un SVG: `width` y `height` si están en píxeles, si no las del
 * `viewBox`. `null` si no dice ninguna (entonces se dibuja al tamaño de la caja).
 *
 * @param {string} texto
 * @returns {{ ancho: number, alto: number, viewBox: boolean } | null}
 */
export const medidasDeSvg = (texto) => {
  const etiqueta = ETIQUETA_SVG.exec(texto ?? "")?.[0];
  if (!etiqueta) return null;
  const valor = (nombre) => {
    const m = atributo(etiqueta, nombre);
    return m ? (m[2] ?? m[3]) : null;
  };
  const caja = (valor("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  const conCaja = caja.length === 4 && caja[2] > 0 && caja[3] > 0;
  const ancho = pixeles(valor("width"));
  const alto = pixeles(valor("height"));
  if (ancho && alto) return { ancho, alto, viewBox: conCaja };
  if (conCaja) return { ancho: caja[2], alto: caja[3], viewBox: true };
  return null;
};

/**
 * El mismo SVG con un ancho y un alto fijos, para que el navegador lo dibuje a ese tamaño
 * (sin ellos, Firefox no sabe cuánto mide uno que solo trae `viewBox` y no lo pinta). Si
 * no traía `viewBox`, se le pone uno con sus medidas de antes: sin él, cambiar el ancho
 * recortaría el dibujo en vez de escalarlo.
 */
export const svgConMedidas = (texto, ancho, alto) => {
  const etiqueta = ETIQUETA_SVG.exec(texto ?? "")?.[0];
  if (!etiqueta) return texto;
  const propias = medidasDeSvg(texto);
  let nueva = etiqueta
    .replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/^<svg\b/i, `<svg width="${ancho}" height="${alto}"`);
  if (propias && !propias.viewBox) {
    nueva = nueva.replace(/^<svg\b/i, `<svg viewBox="0 0 ${propias.ancho} ${propias.alto}"`);
  }
  return texto.replace(etiqueta, () => nueva);
};

/**
 * De dónde es la dirección de un arte: `propio` si es de este sitio (`/media/…`, o el
 * mismo origen), `ajeno` si es de otro, `null` si no hay. Solo lo propio se descarga
 * para aligerarlo: lo de otro sitio el navegador no deja leerlo (CORS).
 */
export const origenDelArte = (url, origen) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("/") && !url.startsWith("//")) return "propio";
  try {
    return new URL(url).origin === origen ? "propio" : "ajeno";
  } catch {
    return "ajeno";
  }
};
