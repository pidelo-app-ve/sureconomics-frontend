/**
 * Lo que comparten las funciones que sirven la aplicación con HTML de verdad dentro:
 * `api/pieza.js` (las piezas), `api/portada.js` (la portada) y `api/no-encontrada.js` (la 404).
 *
 * Antes vivía todo en `api/pieza.js`, y la 404 lo importaba de allí. Con la portada eran
 * ya tres funciones leyendo el mismo shell y escribiendo la misma `<head>`: se sacó aquí
 * para que haya una sola manera de escapar un texto, de comprobar que el shell es nuestro
 * y de poner las etiquetas (auditoría 17-nov-2026, tanda 3).
 *
 * El guion bajo del nombre no es estética: Vercel convierte en función cada archivo de
 * `api/`, salvo los que empiezan por `_`. Esto es una biblioteca, no una dirección.
 *
 * Solo importa módulos de Node (`node:fs`, …): lo carga Node tal cual, sin Vite.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const SITIO = "https://www.sureconomics.com";

export const API =
  process.env.VITE_API_URL ||
  process.env.API_BASE_URL ||
  "https://sureconomics-backend.onrender.com";

/** A slow API must not become a blank page, and the function's own ceiling is ten
 *  seconds. Past this, the page goes out with the site's generic card instead. */
export const LIMITE_MS = 3500;

/**
 * El shell de la aplicación (`dist/app.html`) viaja empaquetado con cada función:
 * `vercel.json` -> `functions` -> `includeFiles`. Se lee del disco, del mismo despliegue
 * que sirve la función, así que sus `/assets/` son siempre los de ese despliegue: ni una
 * petición a la red por visita, ni un shell de otro despliegue (el de producción en una
 * vista previa, o el anterior durante el cambio de uno a otro).
 *
 * Antes se pedía al dominio público, y eso traía tres problemas: un viaje más en cada
 * visita sin caché, el desfase entre despliegues y que en una vista previa la página
 * pedía los `/assets/` de producción, que allí no existen.
 *
 * En Vercel el archivo queda en `process.cwd()/dist/app.html`; en local y en las pruebas,
 * junto a este archivo (`../dist/app.html`). `SHELL_ARCHIVO` manda sobre los dos (las
 * pruebas lo usan; vacío = no hay archivo).
 *
 * **Respaldo**, por si un día el archivo no viajara (otro `includeFiles`, otra
 * estructura): el dominio público, `SHELL_URL`. Solo `/app.html` y sin seguir
 * redirecciones: `/index.html` ya redirige a `/`, que es la portada, que es esta función.
 *
 * **Cómo se comprueba en la vista previa:** cada respuesta dice de dónde sacó el shell en
 * la cabecera `X-Shell` (`archivo` o `red`). Tiene que decir `archivo`:
 * `curl -sI https://<vista-previa>/ | grep -i x-shell`.
 */
const archivosDelShell = () => {
  const elegido = process.env.SHELL_ARCHIVO;
  if (elegido !== undefined) return elegido ? [elegido] : [];
  return [join(process.cwd(), "dist", "app.html"), fileURLToPath(new URL("../dist/app.html", import.meta.url))];
};

/** El respaldo: el dominio público, nunca la dirección de un despliegue (puede tener la
 *  protección de Vercel delante, y lo que devuelve entonces es su página de acceso). */
export const SHELL_URL = process.env.SHELL_URL || `${SITIO}/app.html`;

/** Query flag that routes straight to the static file, so a function has
 *  somewhere to send a request it cannot serve honestly. */
export const SIN_META = "_s";

/**
 * La consulta (`?utm_source=…`) con la que llegó el lector, sin lo que `vercel.json` le
 * añade a la función al reescribir (`seccion`, `slug`, `lang`, …) ni el `_s` del respaldo.
 *
 * Vercel junta en `req.query` las dos cosas: lo que puso la regla y lo que traía la
 * dirección. Al redirigir hay que devolver solo lo segundo, para que el enlace que alguien
 * compartió por WhatsApp con su `?utm_source=whatsapp` llegue con él a la dirección buena.
 * Un valor repetido (`?a=1&a=2`) llega como lista y sale repetido, en su orden.
 */
export const consultaDelLector = (query = {}, internos = []) => {
  const fuera = new Set([...internos, SIN_META]);
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(query ?? {})) {
    if (fuera.has(clave) || valor === undefined || valor === null) continue;
    for (const uno of [].concat(valor)) params.append(clave, String(uno));
  }
  const texto = params.toString();
  return texto ? `?${texto}` : "";
};

/** URL section -> the format slug the API knows, and the shape of the piece. */
export const SECCIONES = {
  noticias: "noticia",
  articulos: "articulo",
  editorial: "editorial",
  entrevistas: "entrevista",
  informes: "informe",
  podcast: "podcast",
};

/** Al revés: el formato de una pieza -> la sección de su dirección (`/noticias/<slug>`). */
export const SECCION_DE_FORMATO = Object.fromEntries(
  Object.entries(SECCIONES).map(([seccion, formato]) => [formato, seccion])
);

/** El nombre del formato tal como lo ve el lector, para el kicker del HTML previo. */
export const NOMBRE_DE_FORMATO = {
  noticia: "Noticias",
  articulo: "Artículos",
  editorial: "Editorial",
  entrevista: "Entrevistas",
  informe: "Informes y reportes",
  podcast: "Podcast",
};

/** La versión inglesa del kicker del HTML previo. */
export const FORMAT_NAME = {
  noticia: "News",
  articulo: "Articles",
  editorial: "Editorial",
  entrevista: "Interviews",
  informe: "Reports & research",
  podcast: "Podcast",
};

export const LOGO = `${SITIO}/brand/v2/lockup-verde.png`;

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
export const GENERICO = {
  titulo: "SurEconomics — Economía, mercados e inversión",
  descripcion: "Economía, mercados e inversión con inteligencia regional.",
};

export const escapar = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Las entidades con nombre que deja el editor; el resto se queda como llegó. */
const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/**
 * Una entidad de HTML, deshecha: `&amp;` -> `&`, `&#8364;` -> `€`. Una que no se conoce, o
 * un número que no es un carácter que se pueda escribir, se queda tal cual.
 */
const sinEntidad = (todo, cuerpo) => {
  if (cuerpo[0] !== "#") return ENTIDADES[cuerpo.toLowerCase()] ?? todo;
  const codigo = /^#x/i.test(cuerpo) ? parseInt(cuerpo.slice(2), 16) : parseInt(cuerpo.slice(1), 10);
  const valido =
    Number.isInteger(codigo) &&
    codigo <= 0x10ffff &&
    !(codigo >= 0xd800 && codigo <= 0xdfff) &&
    (codigo >= 0x20 || codigo === 0x09 || codigo === 0x0a || codigo === 0x0d) &&
    codigo !== 0x7f;
  return valido ? String.fromCodePoint(codigo) : todo;
};

/**
 * Rich text in, plain sentence out: a description full of tags is not a
 * description, and `<p></p>` is not a summary.
 *
 * Las entidades se deshacen (18-nov-2026): el texto llano se vuelve a escapar al
 * escribirlo (`escapar`, `jsonEnScript`), y sin esto «P&amp;G» salía como «P&amp;amp;G» en
 * la descripción. Primero se quitan las etiquetas y después se deshacen las entidades, en
 * una sola pasada: un `&lt;script&gt;` queda como texto «<script>», que `escapar` vuelve a
 * convertir en `&lt;script&gt;` al escribirlo. Por eso lo que sale de aquí **siempre** se
 * escapa antes de ir al HTML; nunca se pega tal cual.
 */
export const textoLlano = (html, maximo = 200) => {
  const limpio = String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z]{2,8});/gi, sinEntidad)
    .replace(/\s+/g, " ")
    .trim();
  if (limpio.length <= maximo) return limpio;
  return `${limpio.slice(0, maximo - 1).trimEnd()}…`;
};

/** Para meter datos en un `<script>`: un `</script>` dentro del texto lo cortaría. */
export const jsonEnScript = (valor) =>
  JSON.stringify(valor)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export const fechaLarga = (iso, idioma = "es") => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(idioma === "en" ? "en-US" : "es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Caracas",
  });
};

export const conDeadline = async (url, ms, opciones = {}) => {
  const corta = new AbortController();
  const reloj = setTimeout(() => corta.abort(), ms);
  try {
    return await fetch(url, { ...opciones, signal: corta.signal });
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

/**
 * Cuánto se reutiliza el shell leído de la red (el respaldo). El del archivo no caduca: es
 * el de este despliegue y no cambia mientras la función viva.
 */
const GUARDA_SHELL_MS = 5 * 60_000;
let guardado = null;

/** Para las pruebas: olvida el shell guardado. */
export const olvidarShell = () => {
  guardado = null;
};

/**
 * El shell: de memoria, del archivo empaquetado o, si no está, de la red. Devuelve
 * `{ shell, fuente }`: `shell` es el texto (o `null` si no se pudo leer de ningún sitio)
 * y `fuente`, de dónde salió (`archivo` o `red`), para la cabecera `X-Shell`.
 *
 * Solo se guarda uno que es nuestro y, de la red, que llegó con 200: la 404 del sitio
 * también es la aplicación (con `noindex`), y servirla como portada le diría a Google que
 * no indexe la portada. Quien llama decide con `esNuestroShell` qué hace si no sirve.
 */
export const leerShell = async () => {
  const vigente =
    guardado && (guardado.fuente === "archivo" || Date.now() - guardado.en < GUARDA_SHELL_MS);
  if (vigente) return { shell: guardado.shell, fuente: guardado.fuente };
  for (const ruta of archivosDelShell()) {
    try {
      const shell = readFileSync(ruta, "utf8");
      if (esNuestroShell(shell)) {
        guardado = { shell, en: Date.now(), fuente: "archivo" };
        return { shell, fuente: "archivo" };
      }
    } catch {
      // No está ahí: el siguiente sitio.
    }
  }
  try {
    const respuesta = await conDeadline(SHELL_URL, LIMITE_MS, { redirect: "manual" });
    if (respuesta.ok === false) return { shell: "", fuente: "red" };
    const shell = await respuesta.text();
    if (esNuestroShell(shell)) guardado = { shell, en: Date.now(), fuente: "red" };
    return { shell, fuente: "red" };
  } catch {
    return { shell: null, fuente: "red" };
  }
};

/**
 * Las etiquetas de la tarjeta para las redes y de la canónica.
 *
 * `sinCanonica`: para una 404 o un 410. Sin `<link rel="canonical">`, sin `og:url` y sin
 * `hreflang`: una dirección que no existe no puede declararse «la buena», y con `noindex`
 * al lado eran dos señales opuestas (Search Console, 19-nov-2026).
 */
export const etiquetas = ({
  titulo,
  descripcion,
  imagen,
  url,
  publicado,
  seccion,
  tipo = "article",
  locale = "es_LA",
  alternativas = null,
  autor = null,
  sinCanonica = false,
}) => {
  const filas = [
    `<meta property="og:type" content="${escapar(tipo)}" />`,
    `<meta property="og:site_name" content="SurEconomics" />`,
    // La cuenta del medio en X. Iba en el bloque genérico del shell, que se quita al poner
    // la tarjeta propia, y con él se perdía en piezas y portada.
    `<meta name="twitter:site" content="@Sur_economics" />`,
    `<meta property="og:locale" content="${escapar(locale)}" />`,
    `<meta property="og:title" content="${escapar(titulo)}" />`,
  ];
  if (!sinCanonica) {
    filas.push(`<meta property="og:url" content="${escapar(url)}" />`);
    filas.push(`<link rel="canonical" href="${escapar(url)}" />`);
  }
  // Una pieza con versión en inglés: las dos páginas se declaran la una a la otra, y
  // `x-default` apunta al español, la casa. Lo mismo que pone `useMetaPagina` al
  // cargar, pero aquí lo lee también quien no ejecuta JavaScript.
  if (alternativas && !sinCanonica) {
    filas.push(`<link rel="alternate" hreflang="es" href="${escapar(alternativas.es)}" />`);
    filas.push(`<link rel="alternate" hreflang="en" href="${escapar(alternativas.en)}" />`);
    filas.push(`<link rel="alternate" hreflang="x-default" href="${escapar(alternativas.es)}" />`);
  }
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
  // La firma, para el modo lectura del navegador: es de donde saca el nombre que pone
  // debajo del titular (la ficha JSON-LD solo la leen algunos).
  if (autor) {
    filas.push(`<meta name="author" content="${escapar(autor)}" />`);
  }
  return filas.join("\n    ");
};

/**
 * Replace the shell's title and add the page's tags.
 *
 * Exported for the tests, which is the only way to check this without deploying:
 * a wrong `<head>` looks fine to a person and is invisible to every crawler.
 *
 * `cabecera`: HTML propio para la `<head>`, ya escapado por quien lo arma (la portada pone
 * ahí la precarga de su foto). Va al final, después de las etiquetas.
 *
 * `cola`: HTML propio para justo detrás de `<div id="root">`, ya escapado (la portada pone
 * ahí sus datos). Detrás y no en la `<head>`: lo que va antes del cuerpo retrasa lo
 * primero que se pinta, y `#root` no lo necesita para pintarse.
 */
export const inyectar = (
  shell,
  { titulo, tituloDePestana = null, html, ficha, datos, noindex = false, idioma = "es", cabecera = "", cola = "", ...resto }
) => {
  // `titulo` va a las tarjetas de las redes; `tituloDePestana`, si viene, al `<title>`.
  const pestana = tituloDePestana || titulo;
  let bloque = etiquetas({ titulo, ...resto });
  if (ficha) {
    bloque += `\n    <script type="application/ld+json">${jsonEnScript(ficha)}</script>`;
  }
  if (datos) {
    // La pieza tal como la da la API, para que la página no la pida otra vez.
    // Como JSON y no como `window.__SE_PIEZA__ = …`: un `<script type="application/json">`
    // no se ejecuta, así que la política de seguridad del navegador (CSP) no tiene que
    // permitir scripts en línea. La página lo lee con `JSON.parse` (ver `Pieza.jsx`).
    bloque += `\n    <script type="application/json" id="se-pieza">${jsonEnScript(datos)}</script>`;
  }
  if (noindex) {
    bloque += `\n    <meta name="robots" content="noindex, follow" />`;
  }
  if (cabecera) {
    bloque += `\n    ${cabecera}`;
  }
  // The shell carries the site's generic card for every other page (`index.html`,
  // between these markers). Left in, a piece would have two `og:image` tags and each
  // crawler would pick whichever it likes.
  let sinGenerico = shell.replace(
    /<!-- og:generico -->[\s\S]*?<!-- \/og:generico -->\s*/i,
    ""
  );
  // El shell dice «indexar» para todo el sitio; una pieza que no existe lo cambia por
  // «no indexar», en vez de dejar las dos y que cada buscador elija.
  if (noindex) sinGenerico = sinGenerico.replace(/\s*<meta name="robots"[^>]*>/i, "");
  // Lo que viene de la pieza (título, cabecera con su JSON, cuerpo) entra como FUNCIÓN
  // de reemplazo, nunca como cadena: en una cadena `replace` interpreta `$&`, `$'`,
  // `` $` `` y `$$`, y «US$&nbsp;36,5» llegaba al lector y a Google como «USnbsp;36,5».
  const tal = (texto) => () => texto;
  const conTitulo = sinGenerico.replace(
    /<title>[\s\S]*?<\/title>/i,
    tal(
      pestana.includes("SurEconomics")
        ? `<title>${escapar(pestana)}</title>`
        : `<title>${escapar(pestana)} — SurEconomics</title>`
    )
  );
  // El shell dice `<html lang="es">`; una página leída en inglés lo dice en inglés.
  const conIdioma =
    idioma === "es" ? conTitulo : conTitulo.replace(/<html lang="[^"]*">/i, `<html lang="${idioma}">`);
  const conCabecera = conIdioma.replace(/<\/head>/i, tal(`  ${bloque}\n  </head>`));
  if (!html && !cola) return conCabecera;
  // El shell trae `<div id="root"></div>` vacío: la página va dentro.
  return conCabecera.replace(/<div id="root"><\/div>/i, tal(`<div id="root">${html ?? ""}</div>${cola}`));
};
