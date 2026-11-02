/**
 * El arte de teléfono de un anuncio, sacado de su tira (nov-2026).
 *
 * Una tira de 8:1 mide en un teléfono unos 48 px de alto y casi no se ve. Su versión de
 * teléfono (1200x600) se arma sola, en el navegador, a partir de la tira que sube la
 * redacción: con subir un solo archivo vale para los dos. El SVG lo dibuja el navegador
 * al tamaño de trabajo, así que no pierde calidad.
 *
 * **La misma tira, en dos pisos.** La mitad izquierda arriba y la derecha debajo, cada
 * piso a todo el ancho. Se corta por la columna con menos bordes cerca del centro, que
 * es por donde no pasa texto: entre el logo y la frase, casi siempre. No se reinventa
 * nada -- el fondo, la foto, las letras y el botón son los del anunciante --.
 *
 * Una primera versión separaba logo, frase y botón y los recomponía sobre un fondo liso;
 * con fotos de fondo, SVG con imágenes dentro o botones pegados a la decoración salía
 * deshecho, y los logos que llegan hasta el borde ni se hacían.
 *
 * **Un logo suelto** (más estrecho que una tira, o sobre transparente) va entero y
 * grande, centrado.
 */

export const ANCHO_TELEFONO = 1200;
export const ALTO_TELEFONO = 600;

/** Alto al que se trabaja: el doble de una tira de 2912x360. */
const ALTO_TRABAJO = 720;

/** Por debajo de esta proporción no es una tira: es un logo y no se parte. */
const PROPORCION_DE_TIRA = 5;

/** Este sufijo marca el arte hecho por esta versión (ver `esArteAutomaticoViejo`). */
export const SUFIJO = "telefono-pisos-1200x600";

const lienzo = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

const mediana = (valores) => {
  const v = [...valores].sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)] ?? 0;
};

/**
 * La caja de la imagen sin el marco liso que traen muchas tiras (un filo blanco en los
 * JPG, un margen transparente en los SVG), en píxeles de trabajo. Solo si el marco es
 * fino: si no, no era un marco.
 */
const sinMarco = (data, W, H) => {
  const esquina = [data[0], data[1], data[2], data[3]];
  let [x0, y0, x1, y1] = [W, H, 0, 0];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 4;
      const distinto =
        Math.abs(data[i + 3] - esquina[3]) > 64 ||
        (data[i + 3] > 64 &&
          Math.hypot(data[i] - esquina[0], data[i + 1] - esquina[1], data[i + 2] - esquina[2]) > 40);
      if (distinto) {
        if (x < x0) x0 = x;
        if (x >= x1) x1 = x + 1;
        if (y < y0) y0 = y;
        if (y >= y1) y1 = y + 1;
      }
    }
  }
  if (x1 <= x0 || y1 <= y0) return null;
  const fino = x0 < W * 0.06 && W - x1 < W * 0.06 && y0 < H * 0.06 && H - y1 < H * 0.06;
  if (!fino || (x0 === 0 && y0 === 0 && x1 === W && y1 === H)) return [0, 0, W, H];
  // Un píxel más hacia dentro: el filo de un JPG trae la mezcla con el marco.
  const m = Math.max(1, Math.round(H * 0.004));
  return [x0 + m, y0 + m, x1 - m, y1 - m];
};

/**
 * @param {CanvasImageSource & {naturalWidth?: number, naturalHeight?: number, width: number, height: number}} imagen
 * @returns {HTMLCanvasElement | null}
 */
export const armarArteTelefono = (imagen) => {
  const nw = imagen.naturalWidth || imagen.width;
  const nh = imagen.naturalHeight || imagen.height;
  if (!nw || !nh) return null;

  // La imagen a tamaño de trabajo, para medirla.
  const H0 = ALTO_TRABAJO;
  const W0 = Math.round((nw * H0) / nh);
  const prueba = lienzo(W0, H0);
  const pctx = prueba.getContext("2d", { willReadFrequently: true });
  pctx.drawImage(imagen, 0, 0, W0, H0);
  const caja = sinMarco(pctx.getImageData(0, 0, W0, H0).data, W0, H0);
  if (!caja) return null;

  // La imagen sin marco, otra vez desde el original (nítida también si es SVG).
  const [cx0, cy0, cx1, cy1] = caja;
  const sx = (cx0 / W0) * nw;
  const sy = (cy0 / H0) * nh;
  const sw = ((cx1 - cx0) / W0) * nw;
  const sh = ((cy1 - cy0) / H0) * nh;
  const H = ALTO_TRABAJO;
  const W = Math.round((sw * H) / sh);
  const fuente = lienzo(W, H);
  const fctx = fuente.getContext("2d", { willReadFrequently: true });
  fctx.drawImage(imagen, sx, sy, sw, sh, 0, 0, W, H);
  const { data } = fctx.getImageData(0, 0, W, H);

  let transparentes = 0;
  for (let i = 3; i < data.length; i += 16) if (data[i] < 128) transparentes += 1;
  const transparente = transparentes / (data.length / 16) > 0.2;

  const salida = lienzo(ANCHO_TELEFONO, ALTO_TELEFONO);
  const sctx = salida.getContext("2d");
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";

  // Un logo: entero y grande, centrado. Sobre transparente se queda transparente; si
  // no, sobre el color de su borde.
  if (W / H < PROPORCION_DE_TIRA || transparente) {
    if (!transparente) {
      const borde = [];
      for (let x = 0; x < W; x += 4) borde.push(x, (H - 1) * W + x);
      for (let y = 0; y < H; y += 4) borde.push(y * W, y * W + W - 1);
      sctx.fillStyle = `rgb(${[0, 1, 2].map((c) => mediana(borde.map((i) => data[i * 4 + c]))).join(",")})`;
      sctx.fillRect(0, 0, ANCHO_TELEFONO, ALTO_TELEFONO);
    }
    const s = Math.min((ANCHO_TELEFONO * 0.84) / W, (ALTO_TELEFONO * 0.66) / H);
    sctx.drawImage(fuente, (ANCHO_TELEFONO - W * s) / 2, (ALTO_TELEFONO - H * s) / 2, W * s, H * s);
    return salida;
  }

  // La columna de corte: la de menos bordes entre el 35 % y el 65 % del ancho y, entre
  // las igual de limpias, la más cercana al centro.
  const gris = new Float32Array(W * H);
  for (let i = 0; i < W * H; i += 1) gris[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  const bordes = new Float32Array(W);
  for (let y = 0; y < H - 1; y += 1) {
    for (let x = 0; x < W - 1; x += 1) {
      const i = y * W + x;
      bordes[x] += Math.abs(gris[i + 1] - gris[i]) + Math.abs(gris[i + W] - gris[i]);
    }
  }
  const ventana = Math.max(3, Math.round(W / 200));
  const i0 = Math.round(W * 0.35);
  const i1 = Math.round(W * 0.65);
  const centro = (i0 + i1) / 2;
  let corte = Math.round(W / 2);
  let mejor = Infinity;
  for (let x = i0; x < i1; x += 1) {
    let suma = 0;
    for (let k = x - ventana; k <= x + ventana; k += 1) suma += bordes[k] ?? 0;
    const valor = suma * (1 + (0.6 * Math.abs(x - centro)) / (i1 - i0));
    if (valor < mejor) {
      mejor = valor;
      corte = x;
    }
  }

  // Cada piso a todo el ancho. Si entre los dos pasan del alto, se encogen juntos y lo
  // que sobra a los lados se rellena estirando la columna del borde de cada piso: así el
  // fondo sigue sin costura.
  const pisos = [
    [0, corte],
    [corte, W],
  ];
  const altos = pisos.map(([a, b]) => (ANCHO_TELEFONO * H) / (b - a));
  const f = Math.min(1, ALTO_TELEFONO / (altos[0] + altos[1]));
  const ancho = Math.round(ANCHO_TELEFONO * f);
  const x = Math.round((ANCHO_TELEFONO - ancho) / 2);
  let y = Math.round((ALTO_TELEFONO - (altos[0] + altos[1]) * f) / 2);
  const arriba = y;
  pisos.forEach(([a, b], k) => {
    const alto = Math.round(altos[k] * f);
    sctx.drawImage(fuente, a, 0, b - a, H, x, y, ancho, alto);
    if (x > 0) {
      sctx.drawImage(fuente, a, 0, 1, H, 0, y, x, alto);
      sctx.drawImage(fuente, b - 1, 0, 1, H, x + ancho, y, ANCHO_TELEFONO - x - ancho, alto);
    }
    y += alto;
  });
  // Arriba y abajo, si sobra, la fila del borde estirada.
  if (arriba > 0) sctx.drawImage(salida, 0, arriba, ANCHO_TELEFONO, 1, 0, 0, ANCHO_TELEFONO, arriba);
  if (y < ALTO_TELEFONO) sctx.drawImage(salida, 0, y - 1, ANCHO_TELEFONO, 1, 0, y, ANCHO_TELEFONO, ALTO_TELEFONO - y);
  return salida;
};

/**
 * El arte de teléfono de una tira ya subida, como archivo listo para subir, o `null` si
 * no se pudo leer. `url` es la de la tira (la del recurso de Medios); se pide con CORS
 * para poder leer sus píxeles aunque venga de otro dominio.
 */
export const arteTelefonoDesdeUrl = async (url, nombre = "anuncio") => {
  const imagen = new Image();
  imagen.crossOrigin = "anonymous";
  imagen.src = url;
  await imagen.decode();
  const lienzoFinal = armarArteTelefono(imagen);
  if (!lienzoFinal) return null;
  // WebP donde el navegador sabe escribirlo; si no (Safari), PNG.
  const blob =
    (await new Promise((ok) => lienzoFinal.toBlob(ok, "image/webp", 0.92))) ||
    (await new Promise((ok) => lienzoFinal.toBlob(ok, "image/png")));
  if (!blob) return null;
  const tipo = blob.type === "image/webp" ? "webp" : "png";
  return new File([blob], `${nombre}-${SUFIJO}.${tipo}`, { type: blob.type });
};

/**
 * Si el arte de teléfono de una pieza lo hizo la primera versión de esto (la que
 * recomponía logo, frase y botón): esos se rehacen. Los subidos a mano no se tocan.
 */
export const esArteAutomaticoViejo = (asset) => {
  const nombre = String(asset?.original_filename || asset?.url || "");
  return /-telefono-1200x600[.-]/.test(nombre) && !nombre.includes(SUFIJO);
};
