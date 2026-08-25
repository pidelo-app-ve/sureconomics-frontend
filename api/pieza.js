/**
 * Meta tags for one piece, injected before the HTML leaves the server.
 *
 * The site is assembled in the browser, so the HTML every URL served was the same
 * 1.2 KB shell with the outlet's name in the title and nothing else. A crawler
 * does not run JavaScript: WhatsApp, X and Google were all reading that shell, so
 * a shared link had no preview and a search engine could not see the content of a
 * single piece. There is no way around this for a client-rendered app -- somebody
 * has to know which piece it is at request time, and this is that somebody.
 *
 * It fails open, deliberately. Piece pages used to be static files that could
 * essentially not fail, and routing them through a function adds a dependency they
 * did not have. So: a short deadline on the API, and on anything going wrong the
 * plain shell goes out with a 200. The reader gets the page; only the preview is
 * missing, and only until the next request.
 *
 * The shell is read from the public domain and then *checked*, which is not
 * belt-and-braces caution -- it is the lesson from breaking this once. The first
 * version fetched `VERCEL_URL`, which has deployment protection on it, so what
 * came back was Vercel's own login page: 487 KB of somebody else's HTML, served to
 * readers with our meta tags injected into it. Anything that does not look like
 * this application is not served at all.
 */

const API =
  process.env.VITE_API_URL ||
  process.env.API_BASE_URL ||
  "https://sureconomics-backend.onrender.com";

/** The API is on Render's free tier, which sleeps. A cold start must not become a
 *  blank page, and the function's own ceiling is ten seconds. */
const LIMITE_MS = 3500;

const SITIO = "https://www.sureconomics.com";

/** Where the shell comes from: the public domain, never a deployment URL.
 *  A deployment URL can be behind Vercel's protection, and what it returns then is
 *  a login page that looks like a perfectly valid HTTP 200. */
const SHELL_URL = process.env.SHELL_URL || `${SITIO}/index.html`;

/** Query flag that routes straight to the static file, so this function has
 *  somewhere to send a request it cannot serve honestly. */
const SIN_META = "_s";

/** URL section -> the format slug the API knows, and the shape of the piece. */
const SECCIONES = {
  noticias: "noticia",
  articulos: "articulo",
  editorial: "editorial",
  entrevistas: "entrevista",
  informes: "informe",
};

const escapar = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Rich text in, plain sentence out: a description full of tags is not a
 *  description, and `<p></p>` is not a summary. */
const textoLlano = (html, maximo = 200) => {
  const limpio = String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (limpio.length <= maximo) return limpio;
  return `${limpio.slice(0, maximo - 1).trimEnd()}…`;
};

/**
 * The share image at the size WhatsApp and X actually want.
 *
 * Cloudinary resizes from the URL, so this costs nothing and avoids handing a
 * crawler a two-megabyte original it will refuse to fetch. A photograph hosted
 * anywhere else goes out untouched.
 */
const imagenParaCompartir = (url) => {
  if (!url) return null;
  const marca = "/image/upload/";
  const corte = url.indexOf(marca);
  if (!url.includes("res.cloudinary.com") || corte === -1) return url;
  const resto = url.slice(corte + marca.length);
  if (!/^v\d+\//.test(resto)) return url;
  // `f_jpg` and not `f_auto`: the only consumer of this URL is a crawler, and
  // `f_auto` makes the format depend on who asks. It happens to answer JPEG to
  // WhatsApp today, which is one more thing that could quietly change.
  return `${url.slice(0, corte + marca.length)}f_jpg,q_auto,c_fill,w_1200,h_630/${resto}`;
};

/**
 * The description, from whatever the piece actually has.
 *
 * Three of eighty-four pieces in production had an excerpt -- the field exists and
 * the newsroom does not fill it, which is fair, it is optional. So the body stands
 * in: the opening of a piece is a summary of it, and a preview with a headline and
 * no line under it is the version a phone is most likely to refuse to draw.
 */
export const descripcionDe = (pieza) =>
  textoLlano(pieza?.excerpt) ||
  textoLlano(pieza?.meta_description) ||
  textoLlano(pieza?.content) ||
  null;

const etiquetas = ({ titulo, descripcion, imagen, url, publicado, seccion }) => {
  const filas = [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="SurEconomics" />`,
    `<meta property="og:locale" content="es_LA" />`,
    `<meta property="og:title" content="${escapar(titulo)}" />`,
    `<meta property="og:url" content="${escapar(url)}" />`,
    `<link rel="canonical" href="${escapar(url)}" />`,
  ];
  if (descripcion) {
    filas.push(`<meta name="description" content="${escapar(descripcion)}" />`);
    filas.push(`<meta property="og:description" content="${escapar(descripcion)}" />`);
  }
  if (imagen) {
    filas.push(`<meta property="og:image" content="${escapar(imagen)}" />`);
    // Some clients read only `secure_url`, and a couple want the type spelled out
    // rather than sniffed.
    filas.push(`<meta property="og:image:secure_url" content="${escapar(imagen)}" />`);
    filas.push(`<meta property="og:image:type" content="image/jpeg" />`);
    filas.push(`<meta property="og:image:width" content="1200" />`);
    filas.push(`<meta property="og:image:height" content="630" />`);
    filas.push(`<meta property="og:image:alt" content="${escapar(titulo)}" />`);
    filas.push(`<meta name="twitter:image" content="${escapar(imagen)}" />`);
    // Large card only when there is a photograph to fill it; asking for one
    // without an image gets a broken-looking empty card.
    filas.push(`<meta name="twitter:card" content="summary_large_image" />`);
  } else {
    filas.push(`<meta name="twitter:card" content="summary" />`);
  }
  filas.push(`<meta name="twitter:title" content="${escapar(titulo)}" />`);
  if (descripcion) {
    filas.push(`<meta name="twitter:description" content="${escapar(descripcion)}" />`);
  }
  if (publicado) {
    filas.push(`<meta property="article:published_time" content="${escapar(publicado)}" />`);
  }
  if (seccion) {
    filas.push(`<meta property="article:section" content="${escapar(seccion)}" />`);
  }
  return filas.join("\n    ");
};

/**
 * Replace the shell's title and add the piece's tags.
 *
 * Exported for the tests, which is the only way to check this without deploying:
 * a wrong `<head>` looks fine to a person and is invisible to every crawler.
 */
export const inyectar = (shell, { titulo, ...resto }) => {
  const bloque = etiquetas({ titulo, ...resto });
  const conTitulo = shell.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapar(titulo)} — SurEconomics</title>`
  );
  return conTitulo.replace(/<\/head>/i, `  ${bloque}\n  </head>`);
};

const conDeadline = async (url, ms) => {
  const corta = new AbortController();
  const reloj = setTimeout(() => corta.abort(), ms);
  try {
    return await fetch(url, { signal: corta.signal });
  } finally {
    clearTimeout(reloj);
  }
};

/** Is this actually our application, or something that merely returned 200? */
export const esNuestroShell = (html) =>
  typeof html === "string" &&
  html.length > 200 &&
  html.length < 60_000 &&
  html.includes('id="root"') &&
  html.includes("/assets/");

export default async function handler(req, res) {
  const { seccion, slug } = req.query ?? {};

  /** Hand the request back to the static file. Used whenever we cannot produce
   *  the application's own HTML: one redirect, and the reader gets the page. */
  const alEstatico = (motivo) => {
    res.setHeader("X-Pieza-Meta", motivo);
    res.setHeader("Cache-Control", "public, s-maxage=30");
    res.redirect(307, `/${seccion}/${slug}?${SIN_META}=1`);
  };

  let shell = "";
  try {
    const respuesta = await conDeadline(SHELL_URL, LIMITE_MS);
    shell = await respuesta.text();
  } catch {
    alEstatico("shell-sin-respuesta");
    return;
  }

  if (!esNuestroShell(shell)) {
    // What came back is not this application. Serving it with our tags on top is
    // exactly the failure this check exists for.
    alEstatico("shell-no-reconocido");
    return;
  }

  const seco = (mensaje) => {
    // Fell back: the page works, the preview does not. Cached briefly so the next
    // request tries again instead of inheriting the miss for a day.
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=30");
    res.setHeader("X-Pieza-Meta", mensaje);
    res.status(200).send(shell);
  };

  const formato = SECCIONES[seccion];
  if (!formato || !slug) {
    seco("ruta-desconocida");
    return;
  }

  let pieza = null;
  try {
    const respuesta = await conDeadline(
      `${API}/posts/${encodeURIComponent(slug)}`,
      LIMITE_MS
    );
    if (!respuesta.ok) {
      seco(`api-${respuesta.status}`);
      return;
    }
    const cuerpo = await respuesta.json();
    pieza = cuerpo?.data ?? cuerpo;
  } catch {
    seco("api-sin-respuesta");
    return;
  }

  if (!pieza?.title) {
    seco("pieza-sin-titulo");
    return;
  }

  const html = inyectar(shell, {
    titulo: pieza.title,
    descripcion: descripcionDe(pieza),
    imagen: imagenParaCompartir(pieza.image_asset?.url || pieza.featured_image_url),
    url: `${SITIO}/${seccion}/${slug}`,
    publicado: pieza.published_at || null,
    seccion: pieza.topics?.[0]?.name || null,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Cached at the edge, so after the first visitor this is as fast as the static
  // file it replaced. `stale-while-revalidate` means a correction to a headline
  // shows up without anyone waiting for it.
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  res.status(200).send(html);
}
