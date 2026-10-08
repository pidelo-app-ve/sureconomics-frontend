/**
 * Los mapas del sitio: `/sitemap.xml` (todo) y `/sitemap-noticias.xml` (lo de 48 horas).
 *
 * Hasta octubre de 2026 no había ninguno: las dos direcciones devolvían la portada, y la
 * portada llega al buscador sin un solo enlace (los titulares los pinta el navegador).
 * Google y Bing no tenían por dónde descubrir las ~500 piezas publicadas, y en
 * `site:sureconomics.com` salían las secciones pero casi ninguna noticia.
 *
 * - **`/sitemap.xml`**: cada pieza publicada con su fecha de última edición, más las
 *   páginas fijas del sitio. Es lo que se envía en Search Console.
 * - **`/sitemap-noticias.xml`**: el formato de Google Noticias, solo lo publicado en las
 *   últimas 48 horas, que es lo que ese formato admite. En noticias llegar tarde es no
 *   salir: Noticias destacadas se llena en las primeras horas.
 *
 * La lista sale de la API pública (`GET /posts`), la misma que lee la portada. La API
 * entrega como mucho 100 por página, así que se pide la primera, se lee `meta.pages` y
 * se piden las demás a la vez. Se guarda en el borde de Vercel: un buscador que lo pida
 * cien veces no le pide cien listados a Render.
 */

const API =
  process.env.VITE_API_URL ||
  process.env.API_BASE_URL ||
  "https://sureconomics-backend.onrender.com";

const SITIO = "https://www.sureconomics.com";
const LIMITE_MS = 8000;
const POR_PAGINA = 100;
/** Google Noticias solo admite lo publicado en los dos últimos días. */
const VENTANA_NOTICIAS_MS = 48 * 3600 * 1000;

/** Formato de la API -> la sección de la dirección. Igual que en `pieza.js`. */
export const SECCION_DE = {
  noticia: "noticias",
  articulo: "articulos",
  editorial: "editorial",
  entrevista: "entrevistas",
  informe: "informes",
  podcast: "podcast",
};

/** Las páginas fijas que vale la pena que el buscador conozca. Ni cuenta, ni panel, ni legales. */
export const PAGINAS_FIJAS = [
  "/",
  "/articulos?formato=noticias",
  "/articulos?formato=articulos",
  "/articulos?formato=editorial",
  "/informes",
  "/audiovisual",
  "/educacion",
  "/explorar",
  "/quienes-somos",
  "/consultoria",
  "/anunciate",
  "/suscribirse",
  "/entorno",
  "/pausa",
  "/clave",
  "/el-analista",
];

const xml = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const conDeadline = async (url, ms) => {
  const corta = new AbortController();
  const reloj = setTimeout(() => corta.abort(), ms);
  try {
    return await fetch(url, { signal: corta.signal });
  } finally {
    clearTimeout(reloj);
  }
};

const pagina = async (n) => {
  const respuesta = await conDeadline(`${API}/posts?page=${n}&limit=${POR_PAGINA}`, LIMITE_MS);
  if (!respuesta.ok) throw new Error(`api-${respuesta.status}`);
  return respuesta.json();
};

/** Todas las piezas publicadas, de todas las páginas del listado. */
export const todasLasPiezas = async () => {
  const primera = await pagina(1);
  const paginas = Math.min(Number(primera?.meta?.pages) || 1, 100);
  const resto = await Promise.all(
    Array.from({ length: paginas - 1 }, (_, i) => pagina(i + 2))
  );
  return [primera, ...resto].flatMap((p) => p?.data ?? []);
};

export const urlDe = (pieza) => {
  const seccion = SECCION_DE[pieza?.format];
  return seccion && pieza?.slug ? `${SITIO}/${seccion}/${pieza.slug}` : null;
};

/** La misma página fija en inglés: `/` → `/en`, `/informes` → `/en/informes`. */
export const enIngles = (ruta) => {
  const [camino, consulta = ""] = ruta.split(/(?=\?)/);
  return (camino === "/" ? "/en" : `/en${camino}`) + consulta;
};

/**
 * Una página fija, con sus dos idiomas enlazados (`xhtml:link hreflang`): así Google sabe
 * que `/en/informes` es la versión en inglés de `/informes` y no una página duplicada.
 * Las piezas no llevan versión en inglés todavía, así que van sin alternativas.
 */
const filaBilingue = (ruta) => {
  const es = `${SITIO}${ruta}`;
  const en = `${SITIO}${enIngles(ruta)}`;
  const alternativas =
    `<xhtml:link rel="alternate" hreflang="es" href="${xml(es)}"/>` +
    `<xhtml:link rel="alternate" hreflang="en" href="${xml(en)}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${xml(es)}"/>`;
  return [
    `  <url><loc>${xml(es)}</loc>${alternativas}</url>`,
    `  <url><loc>${xml(en)}</loc>${alternativas}</url>`,
  ];
};

/** El mapa completo: páginas fijas en los dos idiomas y cada pieza con su última edición. */
export const mapaCompleto = (piezas) => {
  const filas = PAGINAS_FIJAS.flatMap(filaBilingue);
  for (const p of piezas) {
    const loc = urlDe(p);
    if (!loc) continue;
    const fecha = p.updated_at || p.published_at;
    filas.push(
      `  <url><loc>${xml(loc)}</loc>${fecha ? `<lastmod>${xml(new Date(fecha).toISOString())}</lastmod>` : ""}</url>`
    );
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...filas,
    "</urlset>",
  ].join("\n");
};

/** El mapa de Google Noticias: solo lo de las últimas 48 horas. */
export const mapaDeNoticias = (piezas, ahora = Date.now()) => {
  const recientes = piezas.filter((p) => {
    const t = Date.parse(p.published_at);
    return urlDe(p) && Number.isFinite(t) && ahora - t <= VENTANA_NOTICIAS_MS && t <= ahora;
  });
  const filas = recientes.slice(0, 1000).map(
    (p) => `  <url>
    <loc>${xml(urlDe(p))}</loc>
    <news:news>
      <news:publication><news:name>SurEconomics</news:name><news:language>es</news:language></news:publication>
      <news:publication_date>${xml(new Date(p.published_at).toISOString())}</news:publication_date>
      <news:title>${xml(p.title)}</news:title>
    </news:news>
  </url>`
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
    ...filas,
    "</urlset>",
  ].join("\n");
};

export default async function handler(req, res) {
  const noticias = (req.query?.tipo ?? "") === "noticias";
  let piezas;
  try {
    piezas = await todasLasPiezas();
  } catch {
    // Mejor «inténtalo luego» que un mapa a medias: uno incompleto le diría al buscador
    // que las piezas que faltan ya no existen.
    res.setHeader("Retry-After", "600");
    res.setHeader("Cache-Control", "no-store");
    res.status(503).send("Mapa del sitio no disponible: inténtelo en unos minutos.");
    return;
  }
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  // El de noticias cambia con cada publicación; el completo puede esperar un poco más.
  res.setHeader(
    "Cache-Control",
    noticias
      ? "public, s-maxage=300, stale-while-revalidate=3600"
      : "public, s-maxage=1800, stale-while-revalidate=86400"
  );
  res.status(200).send(noticias ? mapaDeNoticias(piezas) : mapaCompleto(piezas));
}
