/**
 * Encontrar la cara en una foto, para encuadrar el avatar solo.
 *
 * **Por qué hace falta.** Las fotos del equipo son de cuerpo entero. Un recorte
 * cuadrado al centro se queda con el torso y la cara acaba midiendo diez píxeles
 * dentro del círculo. Detectar dónde está la cara permite abrir el recorte ya
 * encuadrado, que es la diferencia entre "queda bonita" y "hay que pelearse con
 * el zoom cada vez".
 *
 * **Por qué `pico.js` y no un detector de los grandes.** Son 6 KB de código y un
 * clasificador de 234 KB, sin WebAssembly ni WebGL -- así no hay que tocar la
 * política de seguridad del sitio, que hoy sólo permite scripts propios. Los
 * detectores modernos (face-api, MediaPipe) aciertan algo más y cuestan varios
 * megabytes de modelos: para quince fotos al año, no compensa.
 *
 * El detector vive en `lib/pico.js`, copiado al proyecto en vez de instalado: el
 * paquete de npm no funciona en modo estricto. El motivo largo está en su cabecera.
 *
 * Todo esto se carga sólo cuando alguien abre el recorte -- `import()` diferido --
 * así el lector de la página pública no descarga ni un byte de esto.
 *
 * **Y siempre es una sugerencia, nunca la última palabra.** Si no encuentra cara
 * -- o encuentra la de otra persona en el fondo -- el recuadro sale centrado como
 * antes y quien sube ajusta a mano. Un detector que a veces falla es útil; uno en
 * el que hay que confiar a ciegas, no.
 */

/** Dónde vive el clasificador. Se sirve desde el propio sitio, no de un CDN. */
const RUTA_CASCADA = "/facefinder.bin";

/**
 * Ancho al que se analiza. Más grande no mejora el acierto y sí cuesta tiempo;
 * más chico empieza a perder caras pequeñas dentro de una foto de cuerpo entero.
 */
const ANCHO_ANALISIS = 640;

/**
 * Parámetros del barrido.
 *
 * `scalefactor` en 1.05 y no en el 1.1 habitual: medido con las fotos reales del
 * equipo, con 1.1 se saltaba la escala donde caía una de las tres caras y la daba
 * por no encontrada. El paso fino tarda alrededor de un segundo en vez de una
 * décima, y para algo que se hace al subir una foto eso no se nota.
 */
const PARAMETROS = {
  shiftfactor: 0.05,
  minsize: 40,
  maxsize: 1000,
  scalefactor: 1.05,
};

/**
 * Cuánta confianza se exige.
 *
 * Por debajo de esto son casi siempre falsos positivos -- una mancha en la pared,
 * un cuadro al fondo. Medido en las fotos del equipo: las caras de verdad salen
 * con 100, 185 y 245; la basura, con 2 y 3.
 */
const CONFIANZA_MINIMA = 40;

let cascadaCargada = null;

/** El clasificador, una sola vez por sesión. */
const cargarCascada = async () => {
  if (cascadaCargada) return cascadaCargada;
  cascadaCargada = (async () => {
    const { default: pico } = await import("./pico");
    const bytes = new Int8Array(await (await fetch(RUTA_CASCADA)).arrayBuffer());
    return { pico, clasificar: pico.unpack_cascade(bytes) };
  })();
  return cascadaCargada;
};

/**
 * La cara más creíble de la imagen, en coordenadas del propio bitmap que se pasa.
 *
 * @param {ImageBitmap} bitmap
 * @returns {Promise<{x: number, y: number, diametro: number} | null>} el centro y
 *   el diámetro de la cara, o `null` si no hay ninguna de la que fiarse.
 */
export const buscarCara = async (bitmap) => {
  try {
    const { pico, clasificar } = await cargarCascada();

    // Se analiza en pequeño y luego se devuelven las coordenadas a la escala del
    // bitmap original: así el coste no depende del tamaño de la foto.
    const factor = Math.min(1, ANCHO_ANALISIS / bitmap.width);
    const ancho = Math.round(bitmap.width * factor);
    const alto = Math.round(bitmap.height * factor);

    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    const rgba = ctx.getImageData(0, 0, ancho, alto).data;

    // pico trabaja en gris. La fórmula es la que trae su propia documentación.
    const gris = new Uint8Array(ancho * alto);
    for (let i = 0; i < ancho * alto; i += 1) {
      gris[i] = (2 * rgba[i * 4] + 7 * rgba[i * 4 + 1] + rgba[i * 4 + 2]) / 10;
    }

    const crudas = pico.run_cascade(
      { pixels: gris, nrows: alto, ncols: ancho, ldim: ancho },
      clasificar,
      PARAMETROS
    );
    const agrupadas = pico.cluster_detections(crudas, 0.2);

    // `[fila, columna, tamaño, confianza]`, en ese orden.
    const mejor = agrupadas
      .filter((d) => d[3] >= CONFIANZA_MINIMA)
      .sort((a, b) => b[3] - a[3])[0];
    if (!mejor) return null;

    return {
      x: mejor[1] / factor,
      y: mejor[0] / factor,
      diametro: mejor[2] / factor,
    };
  } catch (err) {
    // Que falle la detección no puede impedir subir una foto: quien llama se queda
    // con el encuadre centrado de siempre. Pero se deja dicho en la consola -- un
    // fallo tragado del todo convierte "no encontré la cara" y "el detector está
    // roto" en el mismo síntoma, y son cosas muy distintas de arreglar.
    console.warn("La detección de caras falló; se encuadra al centro.", err);
    return null;
  }
};
