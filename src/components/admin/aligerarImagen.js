/**
 * El convertidor de imágenes del panel: dibuja una imagen en un `<canvas>` del navegador
 * y la guarda como WebP (o JPEG si el navegador no sabe hacer WebP), a un tamaño dado y,
 * si se le pide un tope de peso, bajando la calidad y el tamaño hasta que entre. Se usa
 * **antes** de subir: lo que llega al servidor es el archivo ya convertido, por el camino
 * de subida de siempre (`/admin/media/image`, que es también el del bot de Saúl y no se
 * toca).
 *
 * Uno solo para todo el panel. Lo usan:
 * - la publicidad (`features/publicidad/admin/aligerarArte.js`): el arte que pasa del
 *   tope se aligera al tamaño de su hueco;
 * - el editor de piezas (`editorDePieza/subirFotoDePieza.js`): un SVG se pasa a WebP de
 *   1.400 px como mucho, porque de un SVG el servidor no saca versiones pequeñas.
 *
 * Vive en una carpeta del panel (`components/admin/`): así no puede viajar en el paquete
 * del lector (lo vigila `src/arquitectura.test.mjs`).
 *
 * Arriba, las cuentas, sin navegador (se prueban en node: `npm run test:aligerar`); abajo,
 * el lienzo, que se puede cambiar por uno de mentira en las pruebas.
 */
import { pedirArchivoDelSitio } from "../../api/archivoDelSitio.js";

/* ─── Las cuentas ──────────────────────────────────────────────────────────────────── */

/** El tipo sin parámetros ni mayúsculas: «image/svg+xml; charset=utf-8» → «image/svg+xml». */
export const tipoLimpio = (mime) => String(mime || "").split(";")[0].trim().toLowerCase();

/** Si es un SVG: por el tipo o, si el sistema no lo da, por la extensión. */
export const esSvg = ({ mime, nombre } = {}) => tipoLimpio(mime) === "image/svg+xml" || /\.svg$/i.test(nombre || "");

/** Si es un GIF, por el tipo o por la extensión. */
export const esGif = ({ mime, nombre } = {}) => tipoLimpio(mime) === "image/gif" || /\.gif$/i.test(nombre || "");

/**
 * Las calidades que se prueban, de mejor a peor, y la más baja que se acepta: por debajo
 * de 0,6 un WebP ya enseña manchas en las letras. Si ni con la más baja entra, se achica
 * la imagen un 15 % y se vuelve a empezar, como mucho `ACHIQUES_MAXIMOS` veces (0,85⁶ es
 * algo más de un tercio del ancho: más pequeño ya no sirve).
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
 * mejor a peor, y si no, un 15 % más pequeño. Sin `tope`, la primera (calidad 0,82).
 * `exportar` es quien dibuja (en el navegador, un `<canvas>`; en las pruebas, una función
 * de mentira) y devuelve un `Blob`.
 *
 * Si el navegador devuelve otro tipo cuando se le pide WebP (Safari antiguo da un PNG),
 * se pasa a JPEG en el mismo tamaño y se sigue con él.
 *
 * @returns {Promise<{ blob: Blob, tipo: string, calidad: number, ancho: number, alto: number } | null>}
 *   `null` si ni achicando entra.
 */
export const buscarVersionLigera = async ({ medidas, tope = Infinity, exportar, senal }) => {
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

/** El nombre del archivo convertido: el de antes, con la extensión nueva. */
export const nombreAligerado = (nombre, tipo) => {
  const base = String(nombre || "").replace(/\.[^./\\]*$/, "").trim() || "imagen";
  return `${base}.${tipo === "image/jpeg" ? "jpg" : "webp"}`;
};

/** KB redondeados, nunca 0 (un archivo de 300 bytes no «pesa 0 KB»). */
export const kilobytes = (bytes) => Math.max(1, Math.round((Number(bytes) || 0) / 1024));

/** Lo que dice el panel al terminar. */
export const avisoDeAligerado = (antes, despues) =>
  `Se aligeró de ${kilobytes(antes)} KB a ${kilobytes(despues)} KB.`;

/** «WebP» o «JPEG», para decirlo en un aviso. */
export const nombreDelFormato = (tipo) => (tipoLimpio(tipo) === "image/jpeg" ? "JPEG" : "WebP");

/**
 * Lo que se dice al acabar una conversión. Si pesa menos, «Se aligeró de X KB a Y KB».
 * Si pesa más (un SVG pequeño pasado a imagen), decir «se aligeró» sería mentir: se dice
 * que se convirtió, a qué formato (WebP, o JPEG en un Safari antiguo) y `porQue` valió
 * la pena.
 *
 * @param {number} antes bytes del original
 * @param {{ size: number, type?: string }} nuevo el archivo convertido
 * @param {string} [porQue]
 */
export const notaDeConversion = (antes, nuevo, porQue) =>
  nuevo.size < antes
    ? avisoDeAligerado(antes, nuevo.size)
    : `Se convirtió a ${nombreDelFormato(nuevo.type)} (de ${kilobytes(antes)} KB a ${kilobytes(nuevo.size)} KB)` +
      (porQue ? `: ${porQue}` : ".");

/** Lo que dice mientras trabaja. */
export const AVISO_OPTIMIZANDO = "Optimizando la imagen…";

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

/**
 * Cuántos píxeles CSS vale cada unidad de un `width`/`height` de SVG. `em` y `ex` van a
 * la letra por defecto del navegador (16 px). El `%` no se puede saber: depende de dónde
 * se pinte.
 */
const PX_POR_UNIDAD = { "": 1, px: 1, pt: 4 / 3, pc: 16, in: 96, cm: 96 / 2.54, mm: 96 / 25.4, q: 96 / 101.6, em: 16, rem: 16, ex: 8 };

/** Una longitud de SVG en píxeles («1456», «1456px», «546pt», «10cm»); null con % o sin número. */
export const longitudEnPx = (valor) => {
  const m = /^\s*([\d.]+(?:e[+-]?\d+)?)\s*([a-z]*)\s*$/i.exec(valor ?? "");
  const factor = m ? PX_POR_UNIDAD[m[2].toLowerCase()] : undefined;
  const n = factor ? Number(m[1]) * factor : NaN;
  return n > 0 ? Math.round(n * 1000) / 1000 : null;
};

/** La etiqueta `<svg …>` de arriba (la primera; el prólogo XML no cuenta). */
const ETIQUETA_SVG = /<svg\b[^>]*>/i;

/** Un atributo de la etiqueta (`\s` delante: `stroke-width` no es `width`). */
const atributo = (etiqueta, nombre) =>
  new RegExp(`\\s${nombre}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(etiqueta);

/**
 * Las medidas propias de un SVG, en píxeles: `width` y `height` (en px, pt, mm… pasados a
 * px), si no las del `viewBox`. `null` si no dice ninguna (entonces se miden en el
 * navegador, y si tampoco, se dibuja al tamaño de la caja).
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
  const ancho = longitudEnPx(valor("width"));
  const alto = longitudEnPx(valor("height"));
  if (ancho && alto) return { ancho, alto, viewBox: conCaja };
  if (conCaja) return { ancho: caja[2], alto: caja[3], viewBox: true };
  return null;
};

/**
 * El mismo SVG con un ancho y un alto fijos, para que el navegador lo dibuje a ese tamaño
 * (sin ellos, Firefox no sabe cuánto mide uno que solo trae `viewBox` y no lo pinta).
 *
 * Si no traía `viewBox`, se le pone uno con lo que medía antes en píxeles (`original`: de
 * sus atributos, ya pasados a px, o medido en el navegador). Sin él, cambiar el ancho
 * agrandaría el lienzo y no el dibujo, que se quedaría en una esquina.
 *
 * @param {{ ancho: number, alto: number } | null} [original]
 */
export const svgConMedidas = (texto, ancho, alto, original = medidasDeSvg(texto)) => {
  const etiqueta = ETIQUETA_SVG.exec(texto ?? "")?.[0];
  if (!etiqueta) return texto;
  let nueva = etiqueta
    .replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/^<svg\b/i, `<svg width="${ancho}" height="${alto}"`);
  if (original?.ancho > 0 && original?.alto > 0 && !atributo(etiqueta, "viewBox")) {
    nueva = nueva.replace(/^<svg\b/i, `<svg viewBox="0 0 ${original.ancho} ${original.alto}"`);
  }
  return texto.replace(etiqueta, () => nueva);
};

/**
 * De dónde es la dirección de una imagen: `propio` si es de este sitio (`/media/…`, o el
 * mismo origen), `ajeno` si es de otro, `null` si no hay. Solo lo propio se descarga para
 * convertirlo: lo de otro sitio el navegador no deja leerlo (CORS).
 */
export const origenDeLaImagen = (url, origen) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("/") && !url.startsWith("//")) return "propio";
  try {
    return new URL(url).origin === origen ? "propio" : "ajeno";
  } catch {
    return "ajeno";
  }
};

/* ─── El lienzo (navegador) ─────────────────────────────────────────────────────────── */

/** Un fallo con un mensaje para la redacción (el panel lo enseña tal cual). */
const fallo = (mensaje) => new Error(mensaje);
/** «nombre», o lo que se diga sin él. */
const quien = (nombre, sinNombre) => (nombre ? `«${nombre}»` : sinNombre);

const SVG_ILEGIBLE = (nombre) =>
  `No se pudo dibujar ${quien(nombre, "el SVG")}: puede estar dañado o usar algo que el navegador no pinta. ` +
  "No se ha subido nada. Ábralo en el programa con el que se hizo y expórtelo otra vez (mejor en WebP o PNG).";

const NO_SE_DEJA = (nombre) =>
  `El navegador no deja convertir ${quien(nombre, "esta imagen")}: la trata como si fuera de otro sitio ` +
  "(pasa con algunos SVG que llevan dentro un trozo de página web). No se ha subido nada. Ábrala en el " +
  "programa con el que se hizo, expórtela en PNG o WebP y súbala así.";

/** Una `<img>` cargada desde un `Blob` (y la dirección temporal, ya soltada). */
const imagenDeBlob = (blob) =>
  new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolver(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error("imagen ilegible"));
    };
    img.src = url;
  });

/**
 * El lienzo del navegador. `cargar` lee el archivo y devuelve sus medidas propias, si es
 * vectorial y `dibujable(ancho, alto)`, lo que se pinta a ese tamaño. `exportar` lo pinta
 * en un `<canvas>` y lo guarda con el tipo y la calidad pedidos.
 */
export const lienzoDelNavegador = {
  async cargar(archivo, { nombre } = {}) {
    if (esSvg({ mime: archivo.type, nombre })) {
      const texto = await archivo.text();
      let medidas = medidasDeSvg(texto);
      try {
        const prueba = await imagenDeBlob(new Blob([texto], { type: "image/svg+xml" }));
        if (!medidas && prueba.naturalWidth > 0 && prueba.naturalHeight > 0) {
          medidas = { ancho: prueba.naturalWidth, alto: prueba.naturalHeight };
        }
      } catch {
        throw fallo(SVG_ILEGIBLE(nombre));
      }
      // Cada tamaño se dibuja desde el SVG con ese ancho y alto: así sale nítido, y
      // Firefox no se queda sin saber cuánto mide uno que solo trae `viewBox`.
      const dibujable = (ancho, alto) =>
        imagenDeBlob(new Blob([svgConMedidas(texto, ancho, alto, medidas)], { type: "image/svg+xml" }));
      return { medidas, vectorial: true, dibujable, cerrar() {} };
    }
    // Una foto: `createImageBitmap` la decodifica fuera del hilo de la página, donde lo
    // hay; si no, una `<img>` de siempre.
    let mapa;
    try {
      mapa = typeof createImageBitmap === "function" ? await createImageBitmap(archivo) : await imagenDeBlob(archivo);
    } catch {
      throw fallo(`No se pudo leer ${quien(nombre, "la imagen")}: puede estar dañada. No se ha subido nada.`);
    }
    return {
      medidas: { ancho: mapa.width || mapa.naturalWidth, alto: mapa.height || mapa.naturalHeight },
      vectorial: false,
      dibujable: async () => mapa,
      cerrar: () => mapa.close?.(),
    };
  },

  async exportar(dibujable, { ancho, alto, tipo, calidad }) {
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d");
    // El JPEG no tiene transparencia: lo transparente saldría negro. El WebP la guarda.
    if (tipo === "image/jpeg") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, ancho, alto);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(dibujable, 0, 0, ancho, alto);
    try {
      const blob = await new Promise((resolver, rechazar) => {
        try {
          lienzo.toBlob(resolver, tipo, calidad);
        } catch (err) {
          rechazar(err);
        }
      });
      if (!blob) throw new Error("toBlob vacío");
      return blob;
    } finally {
      // Suelta la memoria del lienzo ya: una tira de 2.912 px son 4 MB por intento.
      lienzo.width = 0;
      lienzo.height = 0;
    }
  },
};

/** Si un archivo GIF es animado (lee sus bytes). */
export const archivoEsGifAnimado = async (archivo) => esGifAnimado(new Uint8Array(await archivo.arrayBuffer()));

/**
 * Convierte una imagen a WebP (o JPEG) que quepa en `medidas` y, si se da, pese como
 * mucho `tope`. No decide si hace falta: eso lo dice quien la llama.
 *
 * @param {File | Blob} archivo
 * @param {{ medidas: { ancho: number, alto: number }, tope?: number, nombre?: string,
 *   senal?: AbortSignal, lienzo?: typeof lienzoDelNavegador }} opciones
 * @returns {Promise<File | null>} `null` si ni bajando calidad y tamaño entra en el tope.
 */
export const convertirImagen = async (
  archivo,
  { medidas, tope = Infinity, nombre, senal, lienzo = lienzoDelNavegador } = {},
) => {
  const suNombre = nombre ?? archivo?.name ?? "";
  comprobarSenal(senal);
  const leido = await lienzo.cargar(archivo, { nombre: suNombre });
  try {
    const salida = medidasDeSalida(leido.medidas, medidas, { vectorial: leido.vectorial });
    // Lo que se dibuja, por tamaño: un SVG se vuelve a pintar a cada tamaño que se prueba.
    const dibujables = new Map();
    const dibujableDe = (ancho, alto) => {
      const clave = `${ancho}x${alto}`;
      if (!dibujables.has(clave)) {
        dibujables.set(
          clave,
          leido.dibujable(ancho, alto).catch(() => {
            throw fallo(SVG_ILEGIBLE(suNombre));
          }),
        );
      }
      return dibujables.get(clave);
    };
    let resultado;
    try {
      resultado = await buscarVersionLigera({
        medidas: salida,
        tope,
        senal,
        exportar: async (pedido) => lienzo.exportar(await dibujableDe(pedido.ancho, pedido.alto), pedido),
      });
    } catch (err) {
      // El lienzo «contaminado»: el navegador no deja sacar los píxeles.
      if (err?.name === "SecurityError") throw fallo(NO_SE_DEJA(suNombre));
      throw err;
    }
    if (!resultado) return null;
    comprobarSenal(senal);
    return new File([resultado.blob], nombreAligerado(suNombre, resultado.tipo), { type: resultado.tipo });
  } finally {
    leido.cerrar?.();
  }
};

/**
 * Baja una imagen ya subida (para medirla y convertirla). Solo si es de este sitio
 * (`/media/…`, que en producción reescribe Vercel y en local el proxy de Vite): una de
 * otro sitio el navegador no deja leerla, y se dice qué hacer en vez de intentarlo.
 *
 * @param {{ url?: string, original_filename?: string }} asset
 * @returns {Promise<File>}
 */
export const descargarImagen = async (asset, { senal, origen = globalThis.location?.origin } = {}) => {
  const url = asset?.url;
  const nombre = asset?.original_filename || String(url || "").split(/[?#]/)[0].split("/").pop() || "imagen";
  if (origenDeLaImagen(url, origen) !== "propio") {
    throw fallo(
      `«${nombre}» está guardada en otro sitio y el navegador no deja leerla para convertirla. ` +
        "Descárguela y súbala otra vez con «Subir un archivo»: al subirla, el panel la convierte sola.",
    );
  }
  let blob;
  try {
    blob = await pedirArchivoDelSitio(url, { senal, origen });
  } catch (error) {
    if (error?.status) throw fallo(`No se pudo descargar «${nombre}» (respuesta ${error.status}).`);
    throw error;
  }
  return new File([blob], nombre, { type: tipoLimpio(blob.type) });
};
