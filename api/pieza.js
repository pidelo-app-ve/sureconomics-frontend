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

/** A slow API must not become a blank page, and the function's own ceiling is ten
 *  seconds. Past this, the page goes out with the site's generic card instead. */
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
  podcast: "podcast",
};

/**
 * The brand card: a static 21 KB JPEG served by Vercel itself, so it is never slow and
 * never missing. It stands in whenever the piece's own image cannot be trusted to
 * arrive -- no photograph, an SVG (X does not draw SVG), or the API not answering.
 *
 * Why never "no image": X caches a card for days, and it caches a failed one too. A
 * preview that went out bare stays bare long after the cause is fixed. The brand
 * card at least says whose link it is.
 */
export const IMAGEN_DE_MARCA = { url: `${SITIO}/brand/og-default.jpg`, medido: true };

/** What a page says about itself when there is no piece to describe. */
const GENERICO = {
  titulo: "SurEconomics — Economía, mercados e inversión",
  descripcion: "Economía, mercados e inversión con inteligencia regional.",
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
export const imagenParaCompartir = (url) => {
  if (!url) return null;
  if (/\.svg(\?|$)/i.test(url)) return IMAGEN_DE_MARCA;

  // Absolute, always. The API now answers `/media/image/...` for anything stored in
  // R2, and a relative `og:image` is simply dropped: WhatsApp, X, Facebook and
  // Telegram all require a full URL and none of them resolve one against the page.
  // This was the bug -- the tag was there, correct-looking, and worth nothing.
  const absoluta = url.startsWith("/") ? `${SITIO}${url}` : url;

  // R2: the backend keeps a sibling made for exactly this -- `foo-abc.png` has
  // `foo-abc-og.jpg`, always a 1200x630 JPEG of ~150 KB -- and creates it on first
  // request if an older photo does not have one yet (`vista_previa.py`). Before
  // this, X was handed the 1.9 MB original, uncached, in ~2 s, and gave up.
  const enR2 = absoluta.indexOf(`${SITIO}/media/image/`) === 0;
  if (enR2) {
    const sinConsulta = absoluta.split("?")[0];
    const punto = sinConsulta.lastIndexOf(".");
    const base = punto > sinConsulta.lastIndexOf("/") ? sinConsulta.slice(0, punto) : sinConsulta;
    return { url: `${base}-og.jpg`, medido: true };
  }

  const marca = "/image/upload/";
  const corte = absoluta.indexOf(marca);
  if (!absoluta.includes("res.cloudinary.com") || corte === -1) {
    // Served as it is, so its real size is unknown here. `medido: false` is what
    // stops the tags from claiming 1200x630 over a photograph that is not.
    return { url: absoluta, medido: false };
  }
  const resto = absoluta.slice(corte + marca.length);
  if (!/^v\d+\//.test(resto)) return { url: absoluta, medido: false };
  // `f_jpg` and not `f_auto`: the only consumer of this URL is a crawler, and
  // `f_auto` makes the format depend on who asks. It happens to answer JPEG to
  // WhatsApp today, which is one more thing that could quietly change.
  return {
    url: `${absoluta.slice(0, corte + marca.length)}f_jpg,q_auto,c_fill,w_1200,h_630/${resto}`,
    medido: true,
  };
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
  if (imagen?.url) {
    filas.push(`<meta property="og:image" content="${escapar(imagen.url)}" />`);
    // Some clients read only `secure_url`.
    filas.push(`<meta property="og:image:secure_url" content="${escapar(imagen.url)}" />`);
    // Size and type only when this function produced the file and therefore knows
    // them. They used to be printed always, and were wrong for every piece whose
    // image is served straight from storage: 1200x630 declared over a 679x452
    // photograph. A crawler that trusts those numbers crops to a size that does
    // not exist; one that checks decides the tags are unreliable. Left out, every
    // client measures the file itself, which is right by definition.
    if (imagen.medido) {
      filas.push(`<meta property="og:image:type" content="image/jpeg" />`);
      filas.push(`<meta property="og:image:width" content="1200" />`);
      filas.push(`<meta property="og:image:height" content="630" />`);
    }
    filas.push(`<meta property="og:image:alt" content="${escapar(titulo)}" />`);
    filas.push(`<meta name="twitter:image" content="${escapar(imagen.url)}" />`);
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
  // The shell carries the site's generic card for every other page (`index.html`,
  // between these markers). Left in, a piece would have two `og:image` tags and each
  // crawler would pick whichever it likes.
  const sinGenerico = shell.replace(
    /<!-- og:generico -->[\s\S]*?<!-- \/og:generico -->\s*/i,
    ""
  );
  const conTitulo = sinGenerico.replace(
    /<title>[\s\S]*?<\/title>/i,
    titulo.includes("SurEconomics")
      ? `<title>${escapar(titulo)}</title>`
      : `<title>${escapar(titulo)} — SurEconomics</title>`
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
    // Fell back: the page works, and the preview is the site's generic card rather
    // than nothing -- X would cache "nothing" for days. Cached briefly here so the
    // next request tries for the real one instead of inheriting the miss.
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=30");
    res.setHeader("X-Pieza-Meta", mensaje);
    res.status(200).send(
      inyectar(shell, {
        ...GENERICO,
        imagen: IMAGEN_DE_MARCA,
        url: `${SITIO}/${seccion ?? ""}${slug ? `/${slug}` : ""}`,
      })
    );
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
    imagen:
      imagenParaCompartir(pieza.image_asset?.url || pieza.featured_image_url) ??
      IMAGEN_DE_MARCA,
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
