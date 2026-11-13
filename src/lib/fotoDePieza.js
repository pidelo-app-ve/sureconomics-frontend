/**
 * La foto de una pieza: qué archivo pide cada `<img>`, por dónde se recorta y, para la
 * de cabecera, la etiqueta entera.
 *
 * Sin importaciones, y así tiene que quedarse: además de la página lo carga
 * `api/pieza.js`, que corre en Node sin Vite y pinta la foto en el HTML que sirve antes
 * de que llegue la aplicación. Una importación aquí (y más una sin `.js`, como se
 * escriben en el resto de `src/`) tumbaría esa función y con ella todas las páginas de
 * pieza; `npm test` lo nota, porque carga `api/pieza.js`.
 *
 * `lib/pieza.js` reexporta lo que había allí antes, así que quien lo importaba de ahí
 * no cambia.
 */

/**
 * Una derivada del tamaño en que la imagen se va a ver.
 *
 * Las imágenes que la redacción sube son PNG de 1536 px y cerca de 2 MB cada una.
 * En una tarjeta de 400 px eso son veinte veces más píxeles de los que se pintan,
 * y el listado de artículos llegaba a pesar unos 17 MB — inaceptable en móvil, que
 * es donde se lee un medio económico de la región.
 *
 * Cloudinary sirve derivadas por URL, así que basta insertar la transformación:
 * `f_auto` entrega WebP o AVIF a quien los acepte, `q_auto` ajusta la compresión, y
 * `c_fill` recorta al encuadre en vez de deformar.
 *
 * Solo toca direcciones de Cloudinary y solo cuando no traen ya una transformación
 * — `featured_image_url` es un campo libre y puede apuntar a cualquier sitio, que
 * se devuelve intacto.
 */
export const imagenAncho = (url, ancho) => {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  const marca = "/image/upload/";
  const corte = url.indexOf(marca);
  if (corte === -1) return url;
  const resto = url.slice(corte + marca.length);
  // `v<digitos>/` justo después de `upload/` significa que no hay transformación.
  if (!/^v\d+\//.test(resto)) return url;
  return `${url.slice(0, corte + marca.length)}f_auto,q_auto,c_fill,w_${ancho}/${resto}`;
};

/**
 * El mismo recorte a varios anchos, para que el navegador elija.
 *
 * Sin esto la tarjeta pedia `w_800` y punto. Medido contra produccion: en un iPhone
 * de 390 px la caja mide 340 y a 3x necesita 1020, asi que llegaba una imagen de 800
 * estirada. Un `srcset` con `sizes` lo resuelve sin que nadie tenga que adivinar la
 * densidad: la eleccion es del navegador, que es el unico que sabe en que pantalla
 * esta.
 *
 * Devuelve nulo cuando no hay nada que elegir -- una URL ajena o ya transformada no
 * se puede reescalar -- y un `srcset` nulo simplemente no se pinta.
 */
/** Los anchos que el backend genera al subir a R2. Tiene que coincidir con
 *  `ANCHOS_DERIVADOS` de `imagenes_service.py`: si aquí se pide un ancho que allí no se
 *  genera, el navegador se lleva un 404 y la tarjeta se queda sin foto. */
const ANCHOS_EN_R2 = [640, 1100, 1400];

/** Una imagen guardada en nuestro bucket llega como ruta relativa, no como URL. */
const esDeNuestroBucket = (url) => typeof url === "string" && url.startsWith("/media/");

/** La clave hermana de un ancho: `foo-abc.jpg` -> `foo-abc-640.jpg`. Igual que
 *  `clave_de_talla` en el backend. */
const tallaEnR2 = (ruta, ancho) => {
  const barra = ruta.lastIndexOf("/");
  const nombre = ruta.slice(barra + 1);
  if (!nombre.includes(".")) return `${ruta}-${ancho}`;
  const punto = nombre.lastIndexOf(".");
  return `${ruta.slice(0, barra + 1)}${nombre.slice(0, punto)}-${ancho}${nombre.slice(punto)}`;
};

export const imagenSrcSet = (url, anchos, anchoOriginal = null) => {
  if (!url) return null;

  // —— Nuestro bucket ——
  // R2 no redimensiona al vuelo como hacía Cloudinary, así que las tallas se generan al
  // subir y viven en claves hermanas. Sólo se ofrecen las que existen de verdad: el
  // backend no genera tallas mayores que la original, porque agrandar una foto no la
  // mejora, y pedir una que no está devuelve un 404 y deja la tarjeta en blanco.
  if (esDeNuestroBucket(url)) {
    // Un SVG no las tiene: el backend lo guarda tal cual, sin tallas (`subir_imagen`),
    // porque el navegador lo dibuja al tamaño que haga falta. Pedir `-640.svg` era un 404.
    if (/\.svg(\?|$)/i.test(url)) return null;
    const utiles = anchoOriginal
      ? ANCHOS_EN_R2.filter((a) => a < anchoOriginal)
      : ANCHOS_EN_R2;
    if (!utiles.length) return null;
    return utiles.map((a) => `${tallaEnR2(url, a)} ${a}w`).join(", ");
  }

  // —— Cloudinary ——
  // Lo que ya estaba allí sigue sirviéndose, y allí los anchos los calcula el servidor.
  if (!anchos?.length) return null;
  const candidatos = anchos
    .map((a) => [a, imagenAncho(url, a)])
    // Si `imagenAncho` devolvio la URL tal cual, no hubo transformacion posible.
    .filter(([, u]) => u !== url);
  if (!candidatos.length) return null;
  return candidatos.map(([a, u]) => `${u} ${a}w`).join(", ");
};

/**
 * El encuadre de la foto («x,y» en por ciento) como `[x, y]`, o `null` si no hay o está
 * al centro. Lo elige la redacción en el editor (`EncuadreDeFoto`).
 */
export const focoDelTexto = (texto) => {
  const partes = String(texto ?? "").split(",").map((n) => Number(n));
  if (partes.length !== 2 || partes.some((n) => !Number.isFinite(n) || n < 0 || n > 100)) return null;
  return partes;
};

/** El `object-position` de una foto encuadrada, o `undefined` (el centro de siempre). */
export const posicionDeFoco = (texto) => {
  const foco = focoDelTexto(texto);
  return foco && !(foco[0] === 50 && foco[1] === 50) ? `${foco[0]}% ${foco[1]}%` : undefined;
};

/** Las tallas que se ofrecen para la foto de cabecera, las mismas que en las tarjetas.
 *  En nuestro bucket mandan las que el backend generó (ver `imagenSrcSet`). */
const ANCHOS_DE_PORTADA = [640, 800, 1100, 1400];

/**
 * La foto de cabecera de una pieza: los atributos de su `<img>`.
 *
 * La pintan la página (`Media`, en `PieceBody.jsx`) y el HTML que sirve `api/pieza.js`,
 * y tiene que salir igual en los dos. Con el mismo `srcset` y el mismo `sizes` el
 * navegador elige el mismo archivo y, al montar React, reutiliza el que ya bajó; con el
 * mismo tamaño, Google da la foto por pintada cuando se vio y no cuando llegó React (LCP).
 *
 * `width` y `height` son los de la original y solo dicen la proporción: el CSS estira la
 * foto al ancho de la columna (`width: 100%; height: auto`). Con ellos el navegador
 * reserva el alto antes de que llegue; sin ellos el hueco medía cero y la foto, al
 * llegar, empujaba firma y texto 179 px hacia abajo. Si no se conocen (piezas viejas,
 * fotos enlazadas de otra web) no se ponen, y queda como antes.
 */
export const fotoDePortada = (url, ancho = null, alto = null) => {
  const medida = Number.isInteger(ancho) && Number.isInteger(alto) && ancho > 0 && alto > 0;
  return {
    src: imagenAncho(url, 1400),
    srcSet: imagenSrcSet(url, ANCHOS_DE_PORTADA, ancho) ?? undefined,
    sizes: "(max-width: 960px) 100vw, 1100px",
    width: medida ? ancho : undefined,
    height: medida ? alto : undefined,
  };
};
