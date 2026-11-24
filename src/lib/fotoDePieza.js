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

/** Los anchos que se le ofrecen al navegador en una tarjeta (`CardMedia`) y en la foto de
 *  la apertura. Cubren la caja de una tarjeta de 1x a 3x. Aquí y no en `CardMedia` porque
 *  también los usa `api/portada.js` para precargar la foto de la apertura (ver `apertura.js`). */
export const ANCHOS_DE_TARJETA = [400, 640, 800, 1100, 1400];

/** Las pequeñas, desde el 13-nov-2026 (`ANCHOS_PEQUENOS` en el backend): el retrato de una
 *  firma se ve a 56 px (44 en la portada) y la miniatura de una noticia a 112-150, y la talla menor era la de
 *  640. Fuera de `ANCHOS_EN_R2` a propósito: una foto de antes no las tiene hasta que se
 *  corre `flask tallas-jpeg-a-webp`, así que solo las pide quien sabe caer a las de siempre
 *  si faltan, y solo de un JPEG, que es lo que esa orden alcanza. */
const ANCHOS_PEQUENOS = [160, 320];

/** Una imagen guardada en nuestro bucket llega como ruta relativa, no como URL. */
const esDeNuestroBucket = (url) => typeof url === "string" && url.startsWith("/media/");

const esJpeg = (url) => /\.jpe?g(\?|$)/i.test(url);

/** La clave hermana de un ancho: `foo-abc.jpg` -> `foo-abc-640.jpg`. Igual que
 *  `clave_de_talla` en el backend. */
const tallaEnR2 = (ruta, ancho) => {
  const barra = ruta.lastIndexOf("/");
  const nombre = ruta.slice(barra + 1);
  if (!nombre.includes(".")) return `${ruta}-${ancho}`;
  const punto = nombre.lastIndexOf(".");
  return `${ruta.slice(0, barra + 1)}${nombre.slice(0, punto)}-${ancho}${nombre.slice(punto)}`;
};

/**
 * Con `pequenas`, también las tallas pequeñas (si es un JPEG; ver `ANCHOS_PEQUENOS`), y
 * con `original`, la original al final con su ancho: en una foto de menos de 640 las
 * pequeñas son las únicas tallas, y sin ella un teléfono que necesite más se quedaría con
 * la de 320; en la tira de un anuncio, de 2.912 px, la sigue recibiendo quien la necesita.
 */
export const imagenSrcSet = (url, anchos, anchoOriginal = null, { pequenas = false, original = false } = {}) => {
  if (!url) return null;

  // —— Nuestro bucket ——
  // R2 no redimensiona al vuelo como hacía Cloudinary, así que las tallas se generan al
  // subir y viven en claves hermanas. Sólo se ofrecen las que existen de verdad: el
  // backend no genera tallas mayores que la original, porque agrandar una foto no la
  // mejora, y pedir una que no está devuelve un 404 y deja la tarjeta en blanco.
  if (esDeNuestroBucket(url)) {
    // Un SVG no las tiene: el backend lo guarda tal cual, sin tallas (`subir_imagen`),
    // porque el navegador lo dibuja al tamaño que haga falta. Pedir `-640.svg` era un 404.
    // Un GIF animado tampoco (reescalarlo lo aplanaría a un fotograma), y desde aquí no se
    // sabe si lo es: un GIF se sirve entero.
    if (/\.(svg|gif)(\?|$)/i.test(url)) return null;
    const lista = pequenas && esJpeg(url) ? [...ANCHOS_PEQUENOS, ...ANCHOS_EN_R2] : ANCHOS_EN_R2;
    const utiles = anchoOriginal
      ? lista.filter((a) => a < anchoOriginal)
      : lista;
    if (!utiles.length) return null;
    const tallas = utiles.map((a) => `${tallaEnR2(url, a)} ${a}w`);
    if (original && anchoOriginal) tallas.push(`${url} ${anchoOriginal}w`);
    return tallas.join(", ");
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
 * La mayor talla pequeña de una foto, para lo que se ve muy pequeño: el retrato de una firma
 * se ve a 56 px, 168 en una pantalla 3x, y con `cover` una foto apaisada necesita aún más
 * alto; la de 160 se quedaba corta, la de 320 no (la original llegaba a 93 KB). Nula si no
 * la hay. Puede faltar en una foto de antes (ver `ANCHOS_PEQUENOS`): quien la usa cae a la
 * original si no carga (`Retrato`).
 */
export const fotoPequena = (url, anchoOriginal) => {
  if (!esDeNuestroBucket(url) || !esJpeg(url)) return null;
  const ancho = [...ANCHOS_PEQUENOS].reverse().find((a) => a < anchoOriginal);
  return ancho ? tallaEnR2(url, ancho) : null;
};

/**
 * Las tallas pequeñas de una foto como `srcset` (16-nov-2026), para que un retrato baje la
 * de 160 donde le basta y la de 320 solo en una pantalla densa. Con solo la de 320,
 * PageSpeed marcaba el retrato de 44 px de la portada: 320 px para pintar 77. Nulo donde
 * `fotoPequena` lo es, y con las mismas condiciones.
 */
export const tallasPequenas = (url, anchoOriginal) => {
  if (!esDeNuestroBucket(url) || !esJpeg(url)) return null;
  const anchos = ANCHOS_PEQUENOS.filter((a) => a < anchoOriginal);
  return anchos.length ? anchos.map((a) => `${tallaEnR2(url, a)} ${a}w`).join(", ") : null;
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

/**
 * Las tallas de una foto que hasta ahora se pintaba entera, sin `srcset` (la del resumen
 * diario, la de «Siguiente lectura»), con la original al final cuando no pasa de 1.400 px.
 *
 * La original va para que nadie la vea peor que antes: quien necesita más que la mayor
 * talla (un teléfono 3x con una foto de 900) sigue recibiendo la original, como siempre; los
 * demás, una talla WebP. Por encima de 1.400 no hace falta: la talla de 1.400 cubre cualquier
 * caja de estas, y la original suele ser el PNG de 1.536 px y 2 MB que sube la redacción.
 *
 * Nulo, y se pinta la original como antes, sin ancho conocido (piezas viejas: sin él se
 * pedirían tallas que quizá no existen, y una `<img>` sin plan B se quedaría rota), de fuera,
 * SVG o GIF, o de menos de 640 (sin más tallas que las pequeñas, que aquí se verían borrosas).
 */
export const tallasHastaLaOriginal = (url, anchoOriginal) => {
  if (!Number.isInteger(anchoOriginal) || anchoOriginal <= 0) return null;
  return imagenSrcSet(url, ANCHOS_DE_TARJETA, anchoOriginal, { original: anchoOriginal <= 1400 });
};

/** Las tallas que se ofrecen para la foto de cabecera, las mismas que en las tarjetas.
 *  En nuestro bucket mandan las que el backend generó (ver `imagenSrcSet`). */
const ANCHOS_DE_PORTADA = [640, 800, 1100, 1400];

/**
 * El `sizes` de la foto de cabecera: lo que mide su caja (`.se-piece__head--media` en
 * `blog.css`), medido el 24-nov-2026:
 *  - teléfono en horizontal (hasta 500 de alto): la mitad de dos columnas 1,05/0,95;
 *  - hasta 899: una columna, el ancho menos los márgenes (24 px a cada lado; 32 desde 768);
 *  - desde 900: la columna de la foto, 0,8 de 2 (rejilla 1,2fr/0,8fr con 48 px entre las
 *    dos): 315 a 900, 525 a 1440, fija desde ahí (contenedor de 1440) y 589 desde 1920 (1600).
 * Decía `(max-width: 960px) 100vw, 1100px`: a 1440 pedía 1100 px para una caja de 525 y en
 * un teléfono 3x de 390 bajaba la de 1400 donde basta la de 1100. Cada tramo redondea hacia
 * arriba, como el de la apertura (`SIZES_PRINCIPAL`).
 */
export const SIZES_DE_CABECERA =
  "(orientation: landscape) and (max-height: 500px) and (max-width: 899px) 48vw, " +
  "(max-width: 899px) calc(100vw - 48px), (max-width: 1439px) calc(40vw - 45px), " +
  "(max-width: 1919px) 525px, 589px";

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
    sizes: SIZES_DE_CABECERA,
    width: medida ? ancho : undefined,
    height: medida ? alto : undefined,
  };
};
