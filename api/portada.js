/**
 * La portada (`/` y `/en`) servida como las piezas: con su título, su canónica, sus
 * `hreflang`, su ficha para Google, los titulares del día dentro de `#root` y la foto de la
 * apertura pedida desde la `<head>` (auditoría 17-nov-2026, B-01 fase 2 y B-10).
 *
 * ## Por qué
 *
 * La portada llegaba como el cascarón de la aplicación: 4 KB, el título genérico y ni un
 * enlace. Bing, las redes y los rastreadores de IA, que no ejecutan JavaScript o lo hacen
 * poco, veían vacía la página con más autoridad del sitio, y `/en` les parecía un duplicado
 * en español. Y en el teléfono la foto de la apertura no empezaba a bajar hasta que llegaba
 * el JavaScript, se pedían los datos y React pintaba: era el LCP de 4,5 s.
 *
 * ## Cómo
 *
 * - El shell sale del dominio público y se guarda unos minutos en memoria (`leerShell`), y
 *   los titulares, del quiosco (`/datos/posts`), que el borde ya guarda: la misma dirección
 *   que pide la portada en el navegador, así que una calienta la caché de la otra.
 * - La apertura se elige con el mismo código que la página (`src/lib/apertura.js`) y su
 *   foto se precarga con el mismo `srcset` y `sizes` que pinta `CardMedia`: el navegador
 *   la pide al leer el HTML, en paralelo con el JavaScript, y la `<img>` la encuentra ya.
 * - Los titulares van dentro de `#root` en HTML sencillo. React no los hidrata: los
 *   reemplaza al montar (`createRoot`), igual que en las piezas.
 *
 * ## Oculto a la vista, no a los buscadores
 *
 * La pieza (`api/pieza.js`) pinta su HTML previo con las mismas clases que la página, así
 * que el relevo no se nota. La portada no se puede copiar así: es una rejilla de tres
 * columnas, cintas, monedas y publicidad, y una lista de titulares en su lugar daría un
 * salto de página entera al llegar React. Por eso la lista va recortada a un píxel, con
 * el mismo recorte que `.se-sr-only` (lo que solo oye un lector de pantalla), sin
 * `display: none` ni `visibility: hidden`: está en el documento, la leen los buscadores y
 * los lectores de pantalla, y es el mismo texto que React pinta después. Así no cuenta
 * para el LCP, no alarga la página (ni saca una barra de desplazamiento que luego se va)
 * y no mueve nada (CLS) cuando React la reemplaza.
 *
 * Si React no llega a montar (el JavaScript no carga), a los seis segundos el recorte se
 * quita solo (una animación CSS, sin JavaScript) y el lector ve al menos los titulares
 * con sus enlaces, en vez de una página en blanco.
 *
 * ## Si algo falla
 *
 * Falla abierta, como las piezas. Sin datos de la API sale el shell con el título, la
 * canónica y los `hreflang` de la portada, sin titulares. Sin shell no hay nada que servir:
 * se manda al archivo estático (`?_s=1`), como hace `api/pieza.js`. Nunca un error.
 *
 * ## Cómo llega aquí
 *
 * `/en` por `vercel.json`. `/` no puede: Vercel sirve el `index.html` de `dist/` antes de
 * mirar las reescrituras, así que una regla para `/` nunca se aplicaría. Lo manda aquí
 * `middleware.js`, que corre antes que los archivos.
 */

import { elegirApertura, paraLaApertura, precargaDeLaApertura } from "../src/lib/apertura.js";
import {
  FORMAT_NAME,
  IMAGEN_DE_MARCA,
  LIMITE_MS,
  NOMBRE_DE_FORMATO,
  SECCION_DE_FORMATO,
  SIN_META,
  SITIO,
  conDeadline,
  escapar,
  esNuestroShell,
  fechaLarga,
  inyectar,
  leerShell,
  textoLlano,
} from "./_comun.js";

/**
 * De dónde salen los titulares: el quiosco del dominio público, que el borde guarda. Con
 * `page` y `limit` en este orden, el mismo que arma la portada en el navegador
 * (`getPieces`): es la misma clave de caché.
 */
export const DATOS_URL = process.env.PORTADA_DATOS_URL || `${SITIO}/datos/posts?page=1&limit=100`;

/** Cuántos titulares van en el HTML, además de la apertura. */
export const CUANTOS = 30;

/** Cuándo se quita el recorte si React no ha montado (ver arriba). */
const REVELAR_TRAS = "6s";

/**
 * Los textos, copiados de `src/i18n/` porque esta función corre en Node sin el motor de la
 * página; la prueba (`portada.test.mjs`) vigila que digan lo mismo.
 * - `titulo`: `portada.meta.titulo`, el que pone la portada al cargar.
 * - `descripcion`: `marca.descripcion`, la que pone la portada al cargar.
 * - `encabezado`: `portada.inicio.encabezado`, el `<h1>` de la portada.
 * - `apertura` y `recientes`: `portada.apertura.apertura` y `portada.apertura.loMasReciente`.
 */
export const TEXTOS = {
  es: {
    titulo: "SurEconomics — Economía, mercados e inversión",
    descripcion:
      "Plataforma editorial de economía, mercados e inversión en América Latina. Grupo intergeneracional de profesionales con presencia en Miami, Caracas, Bogotá, Asunción y Buenos Aires.",
    encabezado: "SurEconomics — análisis y perspectiva sobre economía, mercados e inversión en América Latina",
    apertura: "Apertura",
    recientes: "Lo más reciente",
  },
  en: {
    titulo: "SurEconomics — Economics, markets and investing",
    descripcion:
      "An editorial platform on economics, markets and investing in Latin America. An intergenerational group of professionals based in Miami, Caracas, Bogotá, Asunción and Buenos Aires.",
    encabezado: "SurEconomics — analysis and perspective on economics, markets and investing in Latin America",
    apertura: "Lead story",
    recientes: "Latest",
  },
};

/** Las dos direcciones de la portada, como las escribe `useMetaPagina` al cargar. */
const URL_ES = `${SITIO}/`;
const URL_EN = `${SITIO}/en`;

/**
 * Dónde vive el listado de un formato. Copia de `rutaDeFormato` (`src/lib/pieza.js`, que
 * aquí no se puede cargar: arrastra el motor de idiomas).
 */
export const rutaDeFormato = (formato) => {
  if (formato === "entrevista") return "/audiovisual?ver=entrevistas";
  if (formato === "podcast") return "/audiovisual?ver=podcast";
  const seccion = SECCION_DE_FORMATO[formato];
  return seccion ? `/articulos?formato=${seccion}` : "/articulos";
};

/**
 * Una fila de la API como la lee la portada en el idioma pedido: en `/en`, el título y la
 * entradilla en inglés si la pieza los tiene (`en_ingles`, la regla del servidor); si no,
 * en español, igual que hace la página (`piezaFromApi`). Nula si no se puede enlazar.
 */
export const titularDe = (row, idioma = "es") => {
  const seccion = SECCION_DE_FORMATO[row?.format];
  const titulo = idioma === "en" && row?.en_ingles ? row.title_en : row?.title;
  if (!seccion || !row?.slug || !String(titulo ?? "").trim()) return null;
  const prefijo = idioma === "en" ? "/en" : "";
  const entradilla = idioma === "en" && row.en_ingles ? row.excerpt_en : row.excerpt;
  return {
    id: String(row.id ?? ""),
    titulo: String(titulo).trim(),
    resumen: textoLlano(entradilla, 300),
    ruta: `${prefijo}/${seccion}/${encodeURIComponent(row.slug)}`,
    seccion: (idioma === "en" ? FORMAT_NAME : NOMBRE_DE_FORMATO)[row.format],
    rutaSeccion: `${prefijo}${rutaDeFormato(row.format)}`,
    fechaIso: row.published_at || null,
    fecha: row.published_at ? fechaLarga(row.published_at, idioma) : "",
  };
};

/** Lo que va debajo del titular: la sección (enlazada) y la fecha. */
const pie = (t) =>
  `<p><a href="${escapar(t.rutaSeccion)}">${escapar(t.seccion)}</a>` +
  (t.fecha ? ` · <time datetime="${escapar(t.fechaIso)}">${escapar(t.fecha)}</time>` : "") +
  `</p>`;

/**
 * Los titulares en HTML semántico ligero, para el `<div id="root">`. Sin las clases de la
 * página: va recortado a la vista (ver arriba) y React lo sustituye al montar.
 */
export const portadaEnHtml = ({ apertura, titulares, idioma = "es" }) => {
  const t = TEXTOS[idioma];
  const partes = [
    `<div class="se-portada-previa"><main>`,
    `<h1>${escapar(t.encabezado)}</h1>`,
    `<p>${escapar(t.descripcion)}</p>`,
  ];
  if (apertura) {
    partes.push(
      `<section><h2>${escapar(t.apertura)}</h2><article>`,
      `<h3><a href="${escapar(apertura.ruta)}">${escapar(apertura.titulo)}</a></h3>`,
      apertura.resumen ? `<p>${escapar(apertura.resumen)}</p>` : "",
      pie(apertura),
      `</article></section>`
    );
  }
  if (titulares.length) {
    partes.push(`<section><h2>${escapar(t.recientes)}</h2><ol>`);
    for (const titular of titulares) {
      partes.push(
        `<li><article><h3><a href="${escapar(titular.ruta)}">${escapar(titular.titulo)}</a></h3>${pie(titular)}</article></li>`
      );
    }
    partes.push(`</ol></section>`);
  }
  partes.push(`</main></div>`);
  return partes.filter(Boolean).join("");
};

/**
 * El recorte del HTML previo y su salida de emergencia. En `<style>` porque una animación
 * no cabe en un atributo `style`; la política de seguridad (CSP) ya permite estilos en línea.
 *
 * Fuera del flujo y de un píxel, como `.se-sr-only`: en el documento, pero sin ocupar nada.
 * A los `REVELAR_TRAS` la animación le devuelve su tamaño (un salto, no una transición:
 * `auto` no se interpola): solo se ve si para entonces React no ha reemplazado el
 * contenido de `#root`, que es cuando hace falta. Un navegador que no anime algo de esto
 * se queda con la página como era antes, en blanco hasta que llega React.
 */
export const ESTILO_PREVIO =
  `<style>.se-portada-previa{position:absolute;top:0;left:0;width:1px;height:1px;margin:-1px;` +
  `overflow:hidden;clip-path:inset(50%);white-space:nowrap;` +
  `animation:se-portada-previa 0s linear ${REVELAR_TRAS} forwards}` +
  `.se-portada-previa main{max-width:44rem;margin:0 auto;padding:1.5rem 1rem}` +
  `@keyframes se-portada-previa{to{width:auto;height:auto;margin:0;right:0;` +
  `overflow:visible;clip-path:none;white-space:normal}}</style>`;

/** El `<link rel="preload">` de la foto de la apertura (o nada, si no hay que pedirla). */
export const enlaceDePrecarga = (precarga) => {
  if (!precarga) return "";
  const destino = precarga.imagesrcset
    ? ` imagesrcset="${escapar(precarga.imagesrcset)}" imagesizes="${escapar(precarga.imagesizes)}"`
    : ` href="${escapar(precarga.href)}"`;
  return `<link rel="preload" as="image"${destino} fetchpriority="high" />`;
};

/**
 * La ficha para Google: la página y su lista de titulares (`ItemList`), atadas al medio y
 * al sitio que el shell ya declara en todas las páginas (`#medio`, `#sitio`, en `index.html`:
 * `NewsMediaOrganization` y `WebSite`). Se enlazan por `@id` en vez de repetirlos.
 */
export const fichaDePortada = ({ url, idioma, titulares }) => {
  const t = TEXTOS[idioma];
  const pagina = {
    "@type": "WebPage",
    "@id": `${url}#pagina`,
    url,
    name: t.titulo,
    description: t.descripcion,
    inLanguage: idioma,
    isPartOf: { "@id": `${SITIO}/#sitio` },
    about: { "@id": `${SITIO}/#medio` },
    publisher: { "@id": `${SITIO}/#medio` },
  };
  if (!titulares.length) return { "@context": "https://schema.org", "@graph": [pagina] };
  pagina.mainEntity = { "@id": `${url}#titulares` };
  const lista = {
    "@type": "ItemList",
    "@id": `${url}#titulares`,
    name: t.recientes,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: titulares.length,
    itemListElement: titulares.map((titular, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITIO}${titular.ruta}`,
      name: titular.titulo.slice(0, 110),
    })),
  };
  return { "@context": "https://schema.org", "@graph": [pagina, lista] };
};

/** Las filas de la primera página del listado, o un motivo si no llegaron. */
const leerTitulares = async () => {
  try {
    const respuesta = await conDeadline(DATOS_URL, LIMITE_MS);
    if (!respuesta.ok) return { motivo: `api-${respuesta.status}` };
    const cuerpo = await respuesta.json();
    const filas = Array.isArray(cuerpo) ? cuerpo : cuerpo?.data;
    if (!Array.isArray(filas)) return { motivo: "api-sin-lista" };
    return { filas };
  } catch {
    return { motivo: "api-sin-respuesta" };
  }
};

/**
 * La página entera a partir del shell y las filas (o sin filas). Separada del `handler`
 * para las pruebas.
 */
export const armarPortada = (shell, { filas = [], idioma = "es", ahora = Date.now() } = {}) => {
  const t = TEXTOS[idioma];
  const url = idioma === "en" ? URL_EN : URL_ES;

  // La apertura, elegida como la elige la página, entre todas las filas recibidas.
  const { principal } = elegirApertura(filas.map(paraLaApertura), null, ahora);
  const filaPrincipal = principal ? filas.find((f) => String(f?.id ?? "") === principal.id) : null;
  const apertura = filaPrincipal ? titularDe(filaPrincipal, idioma) : null;

  const titulares = [];
  for (const fila of filas) {
    if (titulares.length >= CUANTOS) break;
    if (fila === filaPrincipal) continue;
    const titular = titularDe(fila, idioma);
    if (titular) titulares.push(titular);
  }
  const todos = apertura ? [apertura, ...titulares] : titulares;
  // La precarga va con la apertura aunque no se haya podido enlazar (un formato que esta
  // función no conoce): la foto la pinta React igual. El estilo, solo si hay HTML previo.
  const cabecera = [enlaceDePrecarga(precargaDeLaApertura(principal)), todos.length ? ESTILO_PREVIO : ""]
    .filter(Boolean)
    .join("\n    ");

  return inyectar(shell, {
    titulo: t.titulo,
    descripcion: t.descripcion,
    imagen: IMAGEN_DE_MARCA,
    url,
    tipo: "website",
    idioma,
    locale: idioma === "en" ? "en_US" : "es_LA",
    alternativas: { es: URL_ES, en: URL_EN },
    ficha: fichaDePortada({ url, idioma, titulares: todos }),
    cabecera,
    html: todos.length ? portadaEnHtml({ apertura, titulares, idioma }) : null,
  });
};

export default async function handler(req, res) {
  // `/en` llega con `lang=en` (`vercel.json`); `/`, sin nada (`middleware.js`).
  const idioma = req.query?.lang === "en" ? "en" : "es";
  const rutaPropia = idioma === "en" ? "/en" : "/";

  const [shell, datos] = await Promise.all([leerShell(), leerTitulares()]);

  if (!esNuestroShell(shell)) {
    // Sin la aplicación no hay nada que servir con honradez: al archivo estático, que
    // `middleware.js` y `vercel.json` dejan pasar con `?_s=1`. Guardado muy poco: la
    // portada no puede quedarse en esa dirección más de lo justo.
    res.setHeader("X-Pieza-Meta", "portada-shell-no-reconocido");
    res.setHeader("Cache-Control", "public, s-maxage=10");
    res.redirect(307, `${rutaPropia}?${SIN_META}=1`);
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  // Interruptor: `PORTADA_HTML=no` en Vercel (y volver a desplegar) sirve el shell tal
  // cual, como antes de esta función, sin tocar código.
  if (process.env.PORTADA_HTML === "no") {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.setHeader("X-Pieza-Meta", "portada-apagada");
    res.status(200).send(shell);
    return;
  }

  if (!datos.filas) {
    // Sin titulares: la portada con su título, su canónica y sus `hreflang`, y React pinta
    // como siempre. Guardada poco, para que la próxima pruebe otra vez.
    res.setHeader("Cache-Control", "public, s-maxage=30");
    res.setHeader("X-Pieza-Meta", `portada-sin-datos-${datos.motivo}`);
    res.status(200).send(armarPortada(shell, { idioma }));
    return;
  }

  // Un minuto guardada en el borde, y cinco más sirviendo la anterior mientras se renueva:
  // una noticia nueva tarda como mucho eso en salir aquí, lo mismo que en el quiosco.
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  res.setHeader("X-Pieza-Meta", "portada");
  res.status(200).send(armarPortada(shell, { filas: datos.filas, idioma }));
}
