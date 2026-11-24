/**
 * Aligera en el navegador el arte de un anuncio que pesa de más, antes de subirlo: lo
 * dibuja en un `<canvas>` al tamaño de su hueco y lo guarda como WebP (o JPEG si el
 * navegador no sabe hacer WebP), bajando la calidad y, si hace falta, el tamaño hasta
 * que entra en el tope. Las cuentas están en `utils.js` (`buscarVersionLigera` y
 * compañía); aquí, lo que necesita un navegador: leer la imagen y dibujarla.
 *
 * El dibujo va detrás de `lienzo`, que se puede cambiar: las pruebas (en node, sin
 * canvas) le pasan uno de mentira.
 *
 * La subida no cambia: el archivo aligerado se sube por el mismo camino de siempre
 * (`/admin/media/image`, que es también el del bot de Saúl y no se toca), y el tope del
 * servidor sigue ahí como red por si algo se cuela.
 */
import {
  AVISO_OPTIMIZANDO,
  TOPE_ARTE_IMAGEN,
  avisoDeAligerado,
  buscarVersionLigera,
  comprobarSenal,
  decidirAligerado,
  esArteGif,
  esArteSvg,
  esGifAnimado,
  medidasDeSalida,
  medidasDeSvg,
  nombreAligerado,
  origenDelArte,
  svgConMedidas,
  tipoLimpio,
} from "./utils.js";

/** Un fallo con un mensaje para la redacción (el panel lo enseña tal cual). */
const fallo = (mensaje) => new Error(mensaje);

const SVG_ILEGIBLE = (nombre) =>
  `No se pudo dibujar ${nombre ? `«${nombre}»` : "el SVG"}: puede estar dañado o usar algo que el navegador no pinta. ` +
  "No se ha subido nada. Ábralo en el programa con el que se hizo y expórtelo otra vez (mejor en WebP o PNG).";

const NO_SE_DEJA = (nombre) =>
  `El navegador no deja convertir ${nombre ? `«${nombre}»` : "este arte"}: lo trata como si fuera de otro sitio. ` +
  "Descárguelo (en Archivos) y súbalo otra vez con «Subir un archivo»: al subirlo, el panel lo aligera solo.";

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
    if (esArteSvg({ mime: archivo.type, nombre })) {
      const texto = await archivo.text();
      const propias = medidasDeSvg(texto);
      // Cada tamaño se dibuja desde el SVG con ese ancho y alto: así sale nítido, y
      // Firefox no se queda sin saber cuánto mide uno que solo trae `viewBox`.
      const dibujable = (ancho, alto) =>
        imagenDeBlob(new Blob([svgConMedidas(texto, ancho, alto)], { type: "image/svg+xml" }));
      let medidas = propias;
      try {
        const prueba = await imagenDeBlob(new Blob([texto], { type: "image/svg+xml" }));
        if (!medidas && prueba.naturalWidth > 0 && prueba.naturalHeight > 0) {
          medidas = { ancho: prueba.naturalWidth, alto: prueba.naturalHeight };
        }
      } catch {
        throw fallo(SVG_ILEGIBLE(nombre));
      }
      return { medidas, vectorial: true, dibujable, cerrar() {} };
    }
    // Una foto: `createImageBitmap` la decodifica fuera del hilo de la página, donde lo
    // hay; si no, una `<img>` de siempre.
    let mapa;
    try {
      mapa = typeof createImageBitmap === "function" ? await createImageBitmap(archivo) : await imagenDeBlob(archivo);
    } catch {
      throw fallo(`No se pudo leer ${nombre ? `«${nombre}»` : "la imagen"}: puede estar dañada. No se ha subido nada.`);
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

/** Los bytes del principio de un archivo (para mirar si un GIF es animado). */
const bytesDe = async (archivo) => new Uint8Array(await archivo.arrayBuffer());

/**
 * Deja un archivo listo para subirlo como arte: tal cual si no pasa del tope, o
 * aligerado si pasa. Un GIF animado que pasa no se toca y se rechaza con el aviso de
 * siempre.
 *
 * @param {File | Blob} archivo
 * @param {{ medidas: { ancho: number, alto: number }, nombre?: string,
 *   onAviso?: (texto: string) => void, senal?: AbortSignal,
 *   lienzo?: typeof lienzoDelNavegador }} opciones
 * @returns {Promise<{ archivo: File | Blob, nota: string | null }>} `nota`: «Se aligeró de…».
 */
export const prepararArte = async (archivo, { medidas, nombre, onAviso, senal, lienzo = lienzoDelNavegador } = {}) => {
  const suNombre = nombre ?? archivo?.name ?? "";
  const datos = { mime: archivo?.type, bytes: archivo?.size, nombre: suNombre };
  let decision = decidirAligerado(datos);
  if (decision.accion === "subir") return { archivo, nota: null };
  if (esArteGif(datos)) {
    decision = decidirAligerado({ ...datos, gifAnimado: esGifAnimado(await bytesDe(archivo)) });
  }
  if (decision.accion === "rechazar") throw fallo(decision.motivo);

  onAviso?.(AVISO_OPTIMIZANDO);
  comprobarSenal(senal);
  const leido = await lienzo.cargar(archivo, { nombre: suNombre });
  try {
    const salida = medidasDeSalida(leido.medidas, medidas, { vectorial: leido.vectorial });
    // Lo que se dibuja, por tamaño: un SVG se vuelve a pintar a cada tamaño que se prueba.
    const dibujables = new Map();
    const dibujableDe = async (ancho, alto) => {
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
        tope: TOPE_ARTE_IMAGEN,
        senal,
        exportar: async (pedido) => lienzo.exportar(await dibujableDe(pedido.ancho, pedido.alto), pedido),
      });
    } catch (err) {
      // El lienzo «contaminado»: el navegador no deja sacar los píxeles.
      if (err?.name === "SecurityError") throw fallo(NO_SE_DEJA(suNombre));
      throw err;
    }
    if (!resultado) {
      throw fallo(
        `No se pudo dejar ${suNombre ? `«${suNombre}»` : "el arte"} por debajo de ${TOPE_ARTE_IMAGEN / 1024} KB ni ` +
          "bajando la calidad y el tamaño. No se ha subido nada. Pida al anunciante una versión más sencilla.",
      );
    }
    comprobarSenal(senal);
    const nuevo = new File([resultado.blob], nombreAligerado(suNombre, resultado.tipo), { type: resultado.tipo });
    return { archivo: nuevo, nota: avisoDeAligerado(archivo.size, nuevo.size) };
  } finally {
    leido.cerrar?.();
  }
};

/**
 * Baja el arte que ya tiene una pieza, para medirlo y, si pesa de más, aligerarlo
 * («Aligerar»). Solo si es de este sitio (`/media/…`, que en producción reescribe Vercel
 * y en local el proxy de Vite): uno de otro sitio el navegador no deja leerlo, y se dice
 * qué hacer en vez de intentarlo.
 *
 * @param {{ url?: string, original_filename?: string }} asset
 * @returns {Promise<File>}
 */
export const descargarArte = async (asset, { senal, origen = globalThis.location?.origin } = {}) => {
  const url = asset?.url;
  const nombre = asset?.original_filename || String(url || "").split(/[?#]/)[0].split("/").pop() || "arte";
  if (origenDelArte(url, origen) !== "propio") {
    throw fallo(
      `«${nombre}» está guardado en otro sitio y el navegador no deja leerlo para aligerarlo. ` +
        "Descárguelo y súbalo otra vez con «Subir un archivo»: al subirlo, el panel lo aligera solo.",
    );
  }
  const respuesta = await fetch(url, { credentials: "same-origin", signal: senal });
  if (!respuesta.ok) throw fallo(`No se pudo descargar «${nombre}» para aligerarlo (respuesta ${respuesta.status}).`);
  const blob = await respuesta.blob();
  return new File([blob], nombre, { type: tipoLimpio(blob.type) });
};
