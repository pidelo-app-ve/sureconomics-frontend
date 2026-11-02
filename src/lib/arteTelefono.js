/**
 * El arte de teléfono de un anuncio, sacado de su tira (nov-2026).
 *
 * Una tira de 8:1 mide en un teléfono unos 48 px de alto y casi no se ve. Su versión de
 * teléfono (1200x600) apila lo que la tira lleva en fila: logo, frase y botón. Esto la
 * arma sola, en el navegador, a partir de la tira que sube la redacción, para que con
 * subir un solo archivo valga para los dos. El SVG lo dibuja el navegador al tamaño de
 * trabajo, así que no pierde calidad.
 *
 * Cómo:
 * 1. El fondo es el color que domina el borde de la tira.
 * 2. Lo que se aparta de ese color es contenido. Por columnas, el contenido forma
 *    bloques separados por huecos (logo | frase | botón).
 * 3. Se descarta lo que es decoración: lo que toca el borde de arriba o de abajo (una
 *    foto que sangra, una flecha de fondo), los filetes finos y lo que no tiene cuerpo.
 * 4. Los bloques se apilan, centrados, sobre el color de fondo. Solo se copia lo que es
 *    contenido, así que las tramas tenues del fondo (rejillas, puntos) no se arrastran.
 *
 * Si la tira no se deja partir (una foto entera, por ejemplo) devuelve `null` y la pieza
 * sigue saliendo como tira, igual que antes.
 */

export const ANCHO_TELEFONO = 1200;
export const ALTO_TELEFONO = 600;

/** Alto al que se trabaja la tira: el doble de una de 2912x360, para que el logo, que
 *  en el arte de teléfono sale más alto que en la tira, no se amplíe. */
const ALTO_TRABAJO = 720;

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

/** Agrupa índices ocupados en tramos, uniendo los huecos de hasta `hueco`. */
const tramos = (ocupado, hueco) => {
  const salida = [];
  let inicio = -1;
  let ultimo = -1;
  for (let i = 0; i < ocupado.length; i += 1) {
    if (!ocupado[i]) continue;
    if (inicio < 0) {
      inicio = i;
    } else if (i - ultimo - 1 > hueco) {
      salida.push([inicio, ultimo + 1]);
      inicio = i;
    }
    ultimo = i;
  }
  if (inicio >= 0) salida.push([inicio, ultimo + 1]);
  return salida;
};

/**
 * @param {CanvasImageSource & {naturalWidth?: number, naturalHeight?: number, width: number, height: number}} imagen
 * @returns {HTMLCanvasElement | null}
 */
export const armarArteTelefono = (imagen) => {
  const nw = imagen.naturalWidth || imagen.width;
  const nh = imagen.naturalHeight || imagen.height;
  if (!nw || !nh) return null;

  // 0. Fuera el marco liso que traen muchas tiras (un filo blanco en los JPG, un margen
  //    transparente en los SVG): si no, ese filo pasaría por el color de fondo.
  const H = ALTO_TRABAJO;
  let W = Math.round((nw * H) / nh);
  let fuente = lienzo(W, H);
  let fctx = fuente.getContext("2d", { willReadFrequently: true });
  fctx.drawImage(imagen, 0, 0, W, H);
  let data = fctx.getImageData(0, 0, W, H).data;
  const esquina = [0, 1, 2, 3].map((c) => data[c]);
  let [mx0, my0, mx1, my1] = [W, H, 0, 0];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 4;
      const distinto =
        Math.abs(data[i + 3] - esquina[3]) > 64 ||
        (data[i + 3] > 64 && Math.hypot(data[i] - esquina[0], data[i + 1] - esquina[1], data[i + 2] - esquina[2]) > 40);
      if (distinto) {
        if (x < mx0) mx0 = x;
        if (x >= mx1) mx1 = x + 1;
        if (y < my0) my0 = y;
        if (y >= my1) my1 = y + 1;
      }
    }
  }
  if (mx1 <= mx0 || my1 <= my0) return null;
  // Solo si el marco es fino (menos del 6 % por cada lado): si no, no era un marco.
  const fino = mx0 < W * 0.06 && W - mx1 < W * 0.06 && my0 < H * 0.06 && H - my1 < H * 0.06;
  if (fino && (mx0 > 0 || my0 > 0 || mx1 < W || my1 < H)) {
    const sx = (mx0 / W) * nw;
    const sy = (my0 / H) * nh;
    const sw = ((mx1 - mx0) / W) * nw;
    const sh = ((my1 - my0) / H) * nh;
    W = Math.round((sw * H) / sh);
    fuente = lienzo(W, H);
    fctx = fuente.getContext("2d", { willReadFrequently: true });
    fctx.drawImage(imagen, sx, sy, sw, sh, 0, 0, W, H);
    data = fctx.getImageData(0, 0, W, H).data;
  }

  // 1. El fondo: el color del borde (arriba, abajo y los dos lados). Con mucho
  //    transparente (un logo suelto), el fondo es la transparencia.
  //    Un poco hacia dentro: el filo de un JPG trae la mezcla del marco recortado.
  const dentro = Math.max(2, Math.round(H * 0.03));
  const borde = [];
  for (let x = dentro; x < W - dentro; x += 2) borde.push(dentro * W + x, (H - 1 - dentro) * W + x);
  for (let y = dentro; y < H - dentro; y += 2) borde.push(y * W + dentro, y * W + W - 1 - dentro);
  let transparentes = 0;
  for (let i = 3; i < data.length; i += 16) if (data[i] < 128) transparentes += 1;
  const transparente = transparentes / (data.length / 16) > 0.2;
  const fondo = [0, 1, 2].map((c) => mediana(borde.map((i) => data[i * 4 + c])));

  // Un fondo de foto (el borde no es de un color) no se deja partir en logo, frase y
  // botón: ahí no se inventa nada y la pieza sigue saliendo como tira.
  if (!transparente) {
    const desvio = mediana(
      borde.map((i) =>
        Math.hypot(data[i * 4] - fondo[0], data[i * 4 + 1] - fondo[1], data[i * 4 + 2] - fondo[2])
      )
    );
    if (desvio > 18) return null;
  }

  // 2. Cuánto es contenido cada píxel, de 0 a 1.
  const peso = new Float32Array(W * H);
  for (let i = 0; i < W * H; i += 1) {
    const a = data[i * 4 + 3] / 255;
    if (transparente) {
      peso[i] = a;
      continue;
    }
    const d = Math.hypot(data[i * 4] - fondo[0], data[i * 4 + 1] - fondo[1], data[i * 4 + 2] - fondo[2]);
    peso[i] = a * Math.max(0, Math.min(1, (d - 40) / 50));
  }

  // La decoración que entra por arriba o por abajo (una foto que sangra, una flecha de
  // fondo, unas velas) se quita entera: todo lo que esté unido a esos bordes. Un logo,
  // una frase o un botón nunca los tocan. Con un logo suelto sobre transparente no se
  // hace: ahí el logo puede ir de borde a borde.
  if (!transparente) {
    const filo = Math.max(1, Math.round(H * 0.01));
    const visto = new Uint8Array(W * H);
    const pila = [];
    for (let x = 0; x < W; x += 1) {
      for (let y = 0; y < filo; y += 1) pila.push(y * W + x, (H - 1 - y) * W + x);
    }
    while (pila.length) {
      const i = pila.pop();
      if (visto[i] || peso[i] <= 0.5) continue;
      visto[i] = 1;
      peso[i] = 0;
      const x = i % W;
      if (x > 0) pila.push(i - 1);
      if (x < W - 1) pila.push(i + 1);
      if (i >= W) pila.push(i - W);
      if (i < W * (H - 1)) pila.push(i + W);
    }
  }

  // Por columnas: ocupada si tiene contenido de cierto alto (un filete no cuenta).
  const minCol = Math.max(3, Math.round(H * 0.025));
  const porColumna = new Array(W).fill(false);
  for (let x = 0; x < W; x += 1) {
    let n = 0;
    for (let y = 0; y < H; y += 1) if (peso[y * W + x] > 0.5) n += 1;
    porColumna[x] = n >= minCol;
  }

  let bloques = tramos(porColumna, Math.round(W * 0.022))
    .map(([x0, x1]) => {
      // Las filas del bloque: el grupo de filas con más contenido (fuera los filetes de
      // un marco, que quedan sueltos arriba o abajo).
      const filas = new Array(H).fill(0);
      for (let y = 0; y < H; y += 1) {
        for (let x = x0; x < x1; x += 1) if (peso[y * W + x] > 0.5) filas[y] += 1;
      }
      const grupos = tramos(filas.map((n) => n >= 2), Math.round(H * 0.05));
      let mejor = null;
      let masContenido = -1;
      for (const [y0, y1] of grupos) {
        let suma = 0;
        for (let y = y0; y < y1; y += 1) suma += filas[y];
        if (suma > masContenido) {
          masContenido = suma;
          mejor = [y0, y1];
        }
      }
      if (!mejor) return null;
      // Las columnas, otra vez, dentro de esas filas y con algo de holgura a los lados:
      // recorta lo que solo era filete y recupera lo bajo que quedó fuera (el palo de
      // una «T», que no llega al alto mínimo de una columna).
      let cx0 = x1;
      let cx1 = x0;
      const holgura = Math.round(W * 0.012);
      for (let x = Math.max(0, x0 - holgura); x < Math.min(W, x1 + holgura); x += 1) {
        let n = 0;
        for (let y = mejor[0]; y < mejor[1]; y += 1) if (peso[y * W + x] > 0.5) n += 1;
        if (n >= 2) {
          cx0 = Math.min(cx0, x);
          cx1 = Math.max(cx1, x + 1);
        }
      }
      return { x0: cx0, x1: cx1, y0: mejor[0], y1: mejor[1], masa: masContenido };
    })
    .filter(Boolean)
    // Sin cuerpo: una mota o un filete suelto.
    .filter((b) => b.x1 - b.x0 >= W * 0.012 && b.y1 - b.y0 >= H * 0.06);

  // Un logo suelto sobre transparente va entero: partirlo separaría el símbolo de las
  // letras.
  if (transparente && bloques.length > 1) {
    bloques = [
      {
        x0: Math.min(...bloques.map((b) => b.x0)),
        x1: Math.max(...bloques.map((b) => b.x1)),
        y0: Math.min(...bloques.map((b) => b.y0)),
        y1: Math.max(...bloques.map((b) => b.y1)),
        masa: bloques.reduce((n, b) => n + b.masa, 0),
      },
    ];
  }

  // 3. La decoración que sangra por arriba o por abajo (una foto, una flecha de fondo)
  //    no es un bloque: salvo que no haya otra cosa.
  const margen = Math.round(H * 0.01);
  const tocaBorde = (b) => b.y0 <= margen || b.y1 >= H - margen;
  if (bloques.some((b) => !tocaBorde(b))) bloques = bloques.filter((b) => !tocaBorde(b));
  if (!bloques.length) return null;
  if (bloques.length === 1 && tocaBorde(bloques[0]) && !transparente) return null;

  // Más de tres: se juntan los dos más cercanos hasta quedar en tres.
  while (bloques.length > 3) {
    let k = 0;
    let menor = Infinity;
    for (let i = 0; i < bloques.length - 1; i += 1) {
      const h = bloques[i + 1].x0 - bloques[i].x1;
      if (h < menor) {
        menor = h;
        k = i;
      }
    }
    const a = bloques[k];
    const b = bloques[k + 1];
    bloques.splice(k, 2, {
      x0: a.x0,
      x1: b.x1,
      y0: Math.min(a.y0, b.y0),
      y1: Math.max(a.y1, b.y1),
      masa: a.masa + b.masa,
    });
  }

  // 4. Apilados y centrados. El primero (el logo) manda; el último (el botón) cierra.
  const altos = { 1: [0.62], 2: [0.4, 0.26], 3: [0.34, 0.25, 0.17] }[bloques.length];
  const anchoMax = ANCHO_TELEFONO * 0.86;
  const hueco = ALTO_TELEFONO * 0.045;
  const medidas = bloques.map((b, i) => {
    const w = b.x1 - b.x0;
    const h = b.y1 - b.y0;
    const s = Math.min(anchoMax / w, (ALTO_TELEFONO * altos[i]) / h);
    return { ...b, s, w: w * s, h: h * s };
  });
  const total = medidas.reduce((n, m) => n + m.h, 0) + hueco * (medidas.length - 1);

  const salida = lienzo(ANCHO_TELEFONO, ALTO_TELEFONO);
  const sctx = salida.getContext("2d");
  if (!transparente) {
    sctx.fillStyle = `rgb(${fondo.join(",")})`;
    sctx.fillRect(0, 0, ANCHO_TELEFONO, ALTO_TELEFONO);
  }
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";

  let y = (ALTO_TELEFONO - total) / 2;
  for (const m of medidas) {
    // Solo el contenido del bloque, mezclado con el fondo según su peso: así la trama
    // tenue del fondo no viaja con él y no se nota el recorte.
    const w = m.x1 - m.x0;
    const h = m.y1 - m.y0;
    const trozo = lienzo(w, h);
    const tctx = trozo.getContext("2d");
    const img = tctx.createImageData(w, h);
    for (let yy = 0; yy < h; yy += 1) {
      for (let xx = 0; xx < w; xx += 1) {
        const i = (m.y0 + yy) * W + (m.x0 + xx);
        const o = (yy * w + xx) * 4;
        const p = peso[i];
        if (transparente) {
          img.data[o] = data[i * 4];
          img.data[o + 1] = data[i * 4 + 1];
          img.data[o + 2] = data[i * 4 + 2];
          img.data[o + 3] = data[i * 4 + 3];
        } else {
          for (let c = 0; c < 3; c += 1) img.data[o + c] = Math.round(fondo[c] + (data[i * 4 + c] - fondo[c]) * p);
          img.data[o + 3] = 255;
        }
      }
    }
    tctx.putImageData(img, 0, 0);
    sctx.drawImage(trozo, (ANCHO_TELEFONO - m.w) / 2, y, m.w, m.h);
    y += m.h + hueco;
  }
  return salida;
};

/**
 * El arte de teléfono de una tira ya subida, como archivo listo para subir, o `null` si
 * la tira no se deja partir. `url` es la de la tira (la del recurso de Medios); se
 * pide con CORS para poder leer sus píxeles aunque venga de otro dominio.
 */
export const arteTelefonoDesdeUrl = async (url, nombre = "arte-telefono") => {
  const imagen = new Image();
  imagen.crossOrigin = "anonymous";
  imagen.src = url;
  await imagen.decode();
  const lienzoFinal = armarArteTelefono(imagen);
  if (!lienzoFinal) return null;
  // WebP donde el navegador sabe escribirlo; si no (Safari), PNG.
  const blob =
    (await new Promise((ok) => lienzoFinal.toBlob(ok, "image/webp", 0.9))) ||
    (await new Promise((ok) => lienzoFinal.toBlob(ok, "image/png")));
  if (!blob) return null;
  const tipo = blob.type === "image/webp" ? "webp" : "png";
  return new File([blob], `${nombre}-telefono-1200x600.${tipo}`, { type: blob.type });
};
