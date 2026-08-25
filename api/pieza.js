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
 */

const API =
  process.env.VITE_API_URL ||
  process.env.API_BASE_URL ||
  "https://sureconomics-backend.onrender.com";

/** The API is on Render's free tier, which sleeps. A cold start must not become a
 *  blank page, and the function's own ceiling is ten seconds. */
const LIMITE_MS = 3500;

const SITIO = "https://www.sureconomics.com";

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

/** Excerpts are stored as rich text; a description full of tags is not a
 *  description. */
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
  return `${url.slice(0, corte + marca.length)}f_auto,q_auto,c_fill,w_1200,h_630/${resto}`;
};

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
    filas.push(`<meta property="og:image:width" content="1200" />`);
    filas.push(`<meta property="og:image:height" content="630" />`);
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

export default async function handler(req, res) {
  const anfitrion = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : SITIO;

  // The shell as this very deployment built it, so the script tags always point at
  // the current bundle hashes. Reading a copy from the repo would go stale.
  let shell = "";
  try {
    const respuesta = await conDeadline(`${anfitrion}/index.html`, LIMITE_MS);
    shell = await respuesta.text();
  } catch {
    // Nothing to serve and nothing to fall back to; let Vercel serve the static
    // file on a retry rather than return a page that is not the app.
    res.status(502).send("");
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

  const { seccion, slug } = req.query ?? {};
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
    descripcion: textoLlano(pieza.excerpt || pieza.meta_description || ""),
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
