/**
 * La portada (`/` y `/en`) servida como las piezas: con su título, su canónica, sus
 * `hreflang`, su ficha para Google, los titulares que la página enseña al cargar dentro de
 * `#root` y la foto de la apertura pedida desde la `<head>` (auditoría 17-nov-2026, B-01
 * fase 2 y B-10).
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
 * - El shell (`dist/app.html`) viaja empaquetado con la función y se lee del disco
 *   (`leerShell`, en `_comun.js`). Los titulares salen del quiosco (`/datos/posts`), que el
 *   borde ya guarda: la misma dirección que pide la portada en el navegador, así que una
 *   calienta la caché de la otra.
 * - **Solo lo que la página pinta al cargar**, de la página 1 del listado: la apertura y sus
 *   secundarias, la editorial del día y los análisis de la columna de opinión, y la entrada
 *   de cada sección con los topes de la página (`PREVIEW`, `AL_PUNTO` y
 *   `ANALISIS_EN_PLANA`, compartidos con `pages/Home.jsx` en `src/lib/apertura.js`).
 *   Ni una más: lo que el robot ve es lo que ve el lector.
 * - La apertura se elige con el mismo código que la página (`elegirApertura`) y su foto se
 *   precarga con el mismo `srcset` y `sizes` que pinta `CardMedia`: el navegador la pide al
 *   leer el HTML, en paralelo con el JavaScript, y la `<img>` la encuentra ya.
 * - React no hidrata este HTML: lo reemplaza al montar (`createRoot`), igual que en las piezas.
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
 * Si React no llega a montar (el JavaScript no carga), a los nueve segundos el recorte se
 * quita solo (una animación CSS, sin JavaScript) y el lector ve al menos los titulares
 * con sus enlaces, en vez de una página en blanco.
 *
 * ## La apertura, a la vista (plan del 23-nov-2026, A-0)
 *
 * Lo que sí se copia es lo de arriba: la foto de la apertura, su titular y su entradilla
 * (`aperturaEnHtml`), con las clases de la página y en sus cajas, guardando el sitio de lo
 * que va encima (cinta, cabecera, fecha y Última hora). Es lo que Google mide como LCP en el
 * teléfono, y antes no se veía hasta que el JavaScript llegaba y React pintaba (FCP de 4,4 s
 * en el laboratorio del plan). Al montar, React la reemplaza por la misma: la foto ya está
 * bajada y mide lo mismo, y `PrimeraPlana` no la vuelve a barrer.
 *
 * ## Si algo falla
 *
 * Falla abierta, como las piezas. Sin datos de la API sale el shell con el título, la
 * canónica y los `hreflang` de la portada, sin titulares. Sin shell (no debería pasar: va
 * en el paquete) se manda al archivo estático (`?_s=1`). Nunca un error.
 *
 * ## Cómo llega aquí
 *
 * Por `vercel.json`: `/` y `/en` (con `?_s=1`, a `/app.html`). Para eso el shell se llama
 * `app.html` y no `index.html` (`scripts/shell-como-app.mjs`, después de `vite build`):
 * Vercel sirve los archivos antes de mirar las reescrituras, y con un `index.html` en
 * `dist/` la regla de `/` no se aplicaría nunca.
 *
 * ## Los datos, dentro (plan del 23-nov-2026, B8)
 *
 * La respuesta del quiosco viaja entera detrás de `#root`, en un
 * `<script type="application/json" id="se-portada">` (`bloqueDeDatos`), y `usePieces` la usa
 * en vez de volver a pedirla, como hace `Pieza.jsx` con `#se-pieza`. Así React pinta la
 * portada en cuanto llega el JavaScript, sin un viaje más de 33 KB detrás. Si el bloque no
 * está (sin datos, o con `PORTADA_HTML=no`) o no se puede leer, la página pide como siempre.
 *
 * ## Pendiente
 *
 * - `/?fbclid=…`, `/en?utm_…`: Vercel pasa la consulta de la dirección a la función, y
 *   cada consulta distinta puede ser otra copia en el borde (y otra llamada a la función).
 *   Igual que en las piezas; se deja así. Se ve en la vista previa: `/?a=1` y `/?a=2`, ¿el
 *   segundo da `x-vercel-cache: HIT`?
 */

import {
  AL_PUNTO,
  ANALISIS_EN_PLANA,
  PREVIEW,
  SIZES_PRINCIPAL,
  elegirApertura,
  paraLaApertura,
  precargaDeLaApertura,
} from "../src/lib/apertura.js";
import { ANCHOS_DE_TARJETA, imagenAncho, imagenSrcSet, posicionDeFoco } from "../src/lib/fotoDePieza.js";
import { textoLlano as resumenDeTarjeta } from "../src/lib/textoLlano.js";
import {
  ID_DE_LA_PORTADA,
  ID_DE_ULTIMA_HORA,
  LISTADO_DE_LA_PORTADA,
  RUTA_DEL_QUIOSCO,
  ultimaHoraDeLaPortada,
} from "../src/api/quiosco.js";
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
  jsonEnScript,
  leerShell,
  textoLlano,
} from "./_comun.js";

/**
 * De dónde salen los titulares: el quiosco del dominio público, que el borde guarda. La
 * lectura es la misma que hace la portada en el navegador (`LISTADO_DE_LA_PORTADA`,
 * escrita como la arma `getPieces`): es la misma clave de caché.
 */
export const DATOS_URL = process.env.PORTADA_DATOS_URL || `${SITIO}${RUTA_DEL_QUIOSCO}${LISTADO_DE_LA_PORTADA}`;

/** Y los de Última hora, en el idioma de la página, también del quiosco (ver `leerUltimaHora`). */
export const ultimaHoraUrl = (idioma) => `${SITIO}${RUTA_DEL_QUIOSCO}${ultimaHoraDeLaPortada(idioma)}`;

/**
 * Lo más que puede durar la petición de Última hora; pasado esto se corta, para no dejarla
 * colgada (la página no la espera tanto: ver `MARGEN_ULTIMA_HORA_MS`).
 */
const LIMITE_ULTIMA_HORA_MS = 1500;

/**
 * Lo que se espera a Última hora cuando la portada ya llegó. Sin titulares, el HTML pinta
 * la columna con las noticias; al llegar los titulares a la página, la columna cambia de
 * alto y, en el teléfono, la foto salta al montar (la revisión midió 62 px a 360 y un CLS
 * de 0,012 en `/en` con Última hora 800 ms más lenta). Y esa portada la guarda el borde 30 s
 * (y 60 más mientras la renueva). Las dos lecturas salen a la vez del mismo quiosco y suelen
 * llegar juntas (en producción, sin caché: 462 ms la portada y 503 ms Última hora inglesa):
 * un cuarto de segundo cubre esa diferencia sin retrasar de verdad el primer byte.
 */
const MARGEN_ULTIMA_HORA_MS = 250;

/** Lo que dé `promesa` si llega en `ms`; si no, nulo (y sin dejar el reloj vivo). */
const comoMucho = (promesa, ms) => {
  let reloj;
  const tope = new Promise((ok) => {
    reloj = setTimeout(() => ok(null), ms);
  });
  return Promise.race([promesa, tope]).finally(() => clearTimeout(reloj));
};

/**
 * El orden de las secciones bajo la primera plana: el de `FORMATO_META` en
 * `src/lib/pieza.js` (que aquí no se puede cargar: arrastra el motor de idiomas). La prueba
 * vigila que sea el mismo.
 */
export const ORDEN_DE_SECCIONES = ["noticia", "articulo", "editorial", "entrevista", "informe", "podcast"];

/** Cuándo se quita el recorte si React no ha montado (ver arriba). */
const REVELAR_TRAS = "9s";

/**
 * Los textos, copiados de `src/i18n/` porque esta función corre en Node sin el motor de la
 * página; la prueba (`portada.test.mjs`) vigila que digan lo mismo.
 * - `titulo`: `portada.meta.titulo`, el que pone la portada al cargar.
 * - `descripcion`: `marca.descripcion`, la de la portada al cargar y la del pie de página.
 * - `encabezado`: `portada.inicio.encabezado`, el `<h1>` de la portada.
 * - `apertura` y `recientes`: `portada.apertura.apertura` y `portada.apertura.loMasReciente`,
 *   el `<h2>` de la primera plana (con pieza fijada o sin ella).
 * - `alPunto`: `nav.alPunto`, la sección de entrevistas y podcast.
 * - De Última hora (`UltimaHoraColumna`): `ultimaHora` (`titulares.tarjeta.etiqueta`),
 *   `todo` y `misTemas` (`titulares.pestanas.*`), `todaLaUltimaHora`
 *   (`portada.plana.todaLaUltimaHora`), `notaIa` (`titulares.tarjeta.notaIa`) y la hora:
 *   `ahoraMismo`, `minutos` y `haceMinutos` (`titulares.hace.ahora`, `.corto`, `.minutos`).
 * - Solo en inglés, `marcaEspanol` y `marcaEspanolTitulo`: `idioma.marcaEspanol` y
 *   `idioma.marcaEspanolTitulo`, la marca «ES» que lleva en `/en` el titular de una pieza
 *   sin versión inglesa (`TituloDePieza`).
 */
export const TEXTOS = {
  es: {
    titulo: "SurEconomics — Economía, mercados e inversión",
    descripcion:
      "Plataforma editorial de economía, mercados e inversión en América Latina. Grupo intergeneracional de profesionales con presencia en Miami, Caracas, Bogotá, Asunción y Buenos Aires.",
    encabezado: "SurEconomics — análisis y perspectiva sobre economía, mercados e inversión en América Latina",
    apertura: "Apertura",
    recientes: "Lo más reciente",
    alPunto: "Al punto",
    ultimaHora: "Última hora",
    todo: "Todo",
    misTemas: "Mis temas",
    todaLaUltimaHora: "Toda la última hora",
    notaIa: "Redactado automáticamente con IA a partir de fuentes de otros medios.",
    ahoraMismo: "Ahora",
    minutos: "{n} min",
    haceMinutos: "Hace {n} min",
  },
  en: {
    titulo: "SurEconomics — Economics, markets and investing",
    descripcion:
      "An editorial platform on economics, markets and investing in Latin America. An intergenerational group of professionals based in Miami, Caracas, Bogotá, Asunción and Buenos Aires.",
    encabezado: "SurEconomics — analysis and perspective on economics, markets and investing in Latin America",
    apertura: "Lead story",
    recientes: "Latest",
    alPunto: "Al punto",
    ultimaHora: "Breaking",
    todo: "All",
    misTemas: "My topics",
    todaLaUltimaHora: "All breaking news",
    notaIa: "Written automatically with AI from other outlets' reporting.",
    ahoraMismo: "Just now",
    minutos: "{n} min",
    haceMinutos: "{n} min ago",
    marcaEspanol: "ES",
    marcaEspanolTitulo: "In Spanish only",
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
  if (formato === "alpunto") return "/audiovisual";
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

/** Dos listas intercaladas, como «Al punto» en la página: una de cada, por turnos. */
const intercaladas = (x, y) => {
  const mezcla = [];
  for (let k = 0; k < Math.max(x.length, y.length); k += 1) {
    if (x[k]) mezcla.push(x[k]);
    if (y[k]) mezcla.push(y[k]);
  }
  return mezcla;
};

/**
 * Qué piezas enseña la portada al cargar, sin filtros, y en qué orden: lo mismo que arma
 * `pages/Home.jsx` (la primera plana y la entrada de cada sección), con sus mismos topes.
 * Devuelve piezas de `paraLaApertura` (con `id`); quien llama busca la fila por él.
 */
export const loQuePintaLaPortada = (piezas, ahora = Date.now()) => {
  const { principal, secundarias, fijada } = elegirApertura(piezas, null, ahora);
  const enApertura = new Set([principal, ...secundarias].filter(Boolean).map((p) => p.id));
  // La columna de opinión: los análisis más recientes que no están arriba y la editorial
  // del día. Las secciones de abajo no los repiten.
  const analisis = piezas
    .filter((p) => p.formatoApi === "articulo" && !enApertura.has(p.id))
    .slice(0, ANALISIS_EN_PLANA);
  const enOpinion = new Set(analisis.map((p) => p.id));
  const editorialDelDia = piezas.find((p) => p.formatoApi === "editorial" && !enApertura.has(p.id)) ?? null;

  const bloques = [];
  for (const formato of ORDEN_DE_SECCIONES) {
    const todos = piezas.filter(
      (p) =>
        p.formatoApi === formato &&
        !enApertura.has(p.id) &&
        !enOpinion.has(p.id) &&
        !(formato === "editorial" && editorialDelDia && p.id === editorialDelDia.id)
    );
    if (!todos.length) continue;
    if (!AL_PUNTO.formatos.includes(formato)) {
      bloques.push({ formato, todos });
      continue;
    }
    // Entrevistas y podcast van juntos en «Al punto», donde estaba el primero de los dos.
    const previo = bloques.find((b) => b.formato === "alpunto");
    if (previo) previo.todos = intercaladas(previo.todos, todos);
    else bloques.push({ formato: "alpunto", todos });
  }

  return {
    // Sin principal, la página no pinta la primera plana (ni su columna de opinión).
    plana: principal ? { principal, secundarias, fijada, editorial: editorialDelDia, analisis } : null,
    secciones: bloques.map((b) => ({
      formato: b.formato,
      piezas: b.todos.slice(0, b.formato === "alpunto" ? AL_PUNTO.cuantas : PREVIEW[b.formato]),
    })),
  };
};

/** Lo que va debajo del titular: la sección (enlazada) y la fecha. */
const pie = (t) =>
  `<p><a href="${escapar(t.rutaSeccion)}">${escapar(t.seccion)}</a>` +
  (t.fecha ? ` · <time datetime="${escapar(t.fechaIso)}">${escapar(t.fecha)}</time>` : "") +
  `</p>`;

const articulo = (t, { resumen = false } = {}) =>
  `<article><h3><a href="${escapar(t.ruta)}">${escapar(t.titulo)}</a></h3>` +
  (resumen && t.resumen ? `<p>${escapar(t.resumen)}</p>` : "") +
  `${pie(t)}</article>`;

/**
 * La portada en HTML semántico ligero, para el `<div id="root">`. Sin las clases de la
 * página: va recortada a la vista (ver arriba) y React la sustituye al montar.
 *
 * `plana`: `{ titulo, principal, otras }` en titulares (`titularDe`), o nula;
 * `secciones`: `[{ titulo, ruta, titulares }]`.
 */
export const portadaEnHtml = ({ plana, secciones, idioma = "es" }) => {
  const t = TEXTOS[idioma];
  const partes = [`<div class="se-portada-previa"><main>`, `<h1>${escapar(t.encabezado)}</h1>`];
  if (plana) {
    partes.push(`<section><h2>${escapar(plana.titulo)}</h2>`, articulo(plana.principal, { resumen: true }));
    if (plana.otras.length) {
      partes.push(`<ul>${plana.otras.map((o) => `<li>${articulo(o)}</li>`).join("")}</ul>`);
    }
    partes.push(`</section>`);
  }
  for (const seccion of secciones) {
    partes.push(
      `<section><h2><a href="${escapar(seccion.ruta)}">${escapar(seccion.titulo)}</a></h2>`,
      `<ol>${seccion.titulares.map((s) => `<li>${articulo(s)}</li>`).join("")}</ol></section>`
    );
  }
  // La descripción del medio va en el pie de todas las páginas (`Footer`): aquí, también al pie.
  partes.push(`</main><footer><p>${escapar(t.descripcion)}</p></footer></div>`);
  return partes.join("");
};

/**
 * El día de la edición, como lo escribe `PrimeraPlana` bajo la cabecera («miércoles, 25 de
 * noviembre de 2026»: la mayúscula la pone el CSS). En la hora de Caracas; la página usa
 * la del lector, que para casi todos es la misma.
 */
export const fechaDeEdicion = (ahora, idioma = "es") =>
  new Intl.DateTimeFormat(idioma === "en" ? "en-US" : "es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
    timeZone: "America/Caracas",
  }).format(ahora);

/** El titular de una pieza como lo pinta `TituloDePieza`: en `/en`, la que solo está en español lo avisa con «ES». */
const tituloDePieza = (fila, idioma) => {
  const enIngles = idioma === "en" && Boolean(fila.en_ingles);
  const titulo = escapar((enIngles ? fila.title_en : fila.title) ?? "");
  if (idioma !== "en" || fila.en_ingles) return titulo;
  const t = TEXTOS.en;
  return `<span lang="es">${titulo}</span> <abbr class="se-marca-idioma" title="${escapar(t.marcaEspanolTitulo)}">${escapar(t.marcaEspanol)}</abbr>`;
};

/* —— Última hora, como `UltimaHoraColumna` (`features/titulares`) ——
   Copia de su regla, porque aquella es un componente de React y esto corre en Node; la
   vigila `src/features/titulares/UltimaHoraColumna.html.test.mjs`, que pinta las dos y
   las compara. */

/** Cuántas enseña la columna (`CUANTOS`); el CSS esconde las que no caben en el teléfono. */
const EN_ULTIMA_HORA = 6;
const UN_DIA_MS = 24 * 3600_000;
const UNA_HORA_MS = 3600_000;
const MEDIA_HORA_MS = 30 * 60_000;

/** El orden de `useHeadlines`: lo fijado arriba y después lo más reciente. */
const cuando = (i) => Date.parse(i?.published_at || "") || 0;
const enSuOrden = (items) =>
  [...items].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || cuando(b) - cuando(a));

/** Un día de calendario en Caracas, para saber si algo es «de hoy». */
const diaEnCaracas = (ms) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Caracas" });

/**
 * La hora de cada titular (`sello`): «12 min» la primera hora, «9:21» el resto del día y
 * «4 nov» si no es de hoy. La página usa la hora del lector; aquí, la de Caracas: solo
 * cambia el texto de la hora, que va en su columna de ancho fijo.
 */
const selloDe = (iso, idioma, ahora) => {
  const ms = Date.parse(iso || "");
  const t = TEXTOS[idioma];
  if (!ms) return { visible: "" };
  const pasado = Math.max(0, ahora - ms);
  if (pasado < UNA_HORA_MS) {
    const n = Math.floor(pasado / 60_000);
    return n < 1
      ? { visible: t.ahoraMismo, fresca: true }
      : { visible: t.minutos.replace("{n}", n), leido: t.haceMinutos.replace("{n}", n), fresca: pasado < MEDIA_HORA_MS };
  }
  const hoy = diaEnCaracas(ahora) === diaEnCaracas(ms);
  const opciones = hoy ? { hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short" };
  const texto = new Intl.DateTimeFormat(idioma === "en" ? "en-US" : "es", { ...opciones, timeZone: "America/Caracas" }).format(ms);
  return { visible: texto.replace(/\bsept\b/, "sep") };
};

/**
 * La columna de Última hora tal como la pinta React al montar (pestaña «Todo», sin sesión):
 * los titulares en caliente si el más reciente es del último día; si no, las noticias más
 * recientes que no están arriba (`recientes`, filas de la API). Pintarla aquí y no solo
 * guardar su sitio es lo que hace que la apertura, que en el teléfono va debajo, caiga
 * donde la pondrá React, sea cual sea el largo de los titulares.
 */
export const ultimaHoraEnHtml = ({ items = [], recientes = [], idioma = "es", ahora = Date.now() }) => {
  const t = TEXTOS[idioma];
  const prefijo = idioma === "en" ? "/en" : "";
  const titulares = enSuOrden(items.filter((i) => i && typeof i === "object")).slice(0, EN_ULTIMA_HORA);
  const masReciente = titulares.reduce((max, i) => Math.max(max, cuando(i)), 0);
  const hayTitulares = titulares.length > 0 && ahora - masReciente < UN_DIA_MS;
  const filas = hayTitulares
    ? titulares.map((i) => ({ iso: i.published_at, titulo: escapar(i.title), ruta: `${prefijo}/ultima-hora#t-${i.id}` }))
    : recientes
        .map((f) => ({ fila: f, titular: titularDe(f, idioma) }))
        .filter((r) => r.titular)
        .slice(0, EN_ULTIMA_HORA)
        .map(({ fila, titular }) => ({ iso: fila.published_at, titulo: tituloDePieza(fila, idioma), ruta: titular.ruta }));
  if (!filas.length) return "";
  const enVivo = ahora - (Date.parse(filas[0].iso || "") || 0) < UNA_HORA_MS;
  const lista = filas.map((f) => {
    const s = selloDe(f.iso, idioma, ahora);
    const hora = s.leido
      ? `<span class="se-sr-only">${escapar(s.leido)}</span><span aria-hidden="true">${escapar(s.visible)}</span>`
      : escapar(s.visible);
    return (
      `<li class="se-plana__uh-item"><time class="se-plana__uh-hora${s.fresca ? " se-plana__uh-hora--fresca" : ""}"` +
      `${f.iso ? ` datetime="${escapar(f.iso)}"` : ""}>${hora}</time>` +
      `<a class="se-plana__uh-titulo" href="${escapar(f.ruta)}" tabindex="-1">${f.titulo}</a></li>`
    );
  });
  return [
    `<div class="se-plana__uh"><h2 class="se-plana__uh-cabeza">`,
    `<a href="${prefijo}/ultima-hora" class="se-plana__uh-pastilla" tabindex="-1">`,
    `<span class="se-plana__uh-punto${enVivo ? " se-plana__uh-punto--vivo" : ""}"></span>${escapar(t.ultimaHora)}</a></h2>`,
    `<div class="se-plana__uh-pestanas">`,
    `<button type="button" class="se-plana__uh-pestana is-activa" tabindex="-1">${escapar(t.todo)}</button>`,
    `<button type="button" class="se-plana__uh-pestana" tabindex="-1">${escapar(t.misTemas)}</button></div>`,
    `<ol class="se-plana__uh-lista">${lista.join("")}</ol>`,
    `<a class="se-plana__mas" href="${prefijo}/ultima-hora" tabindex="-1">${escapar(t.todaLaUltimaHora)}</a>`,
    hayTitulares ? `<p class="se-plana__uh-nota">${escapar(t.notaIa)}</p>` : "",
    `</div>`,
  ].join("");
};

/**
 * La apertura a la vista, antes de que llegue el JavaScript (plan del 23-nov-2026, A-0): la
 * foto, que es lo que Google mide como LCP en el teléfono, el titular y la entradilla, y
 * encima Última hora (que en el teléfono va antes que ella).
 *
 * Con las clases y dentro de las cajas de la página (`Layout`, `Home`, `PrimeraPlana`,
 * `CardMedia`, `UltimaHoraColumna`), para que cada cosa caiga donde la va a pintar React y
 * el relevo no se note: la cinta y la cabecera van vacías, guardando su alto (la cinta, con
 * la misma clase que usa mientras carga); la fecha de la edición y Última hora, escritas.
 * La `<img>` es la de `CardMedia`: la misma dirección, el mismo `srcset` y el mismo `sizes`
 * que la precarga, así que React encuentra la foto ya bajada y del mismo tamaño.
 *
 * Con elementos neutros (`div`) donde la página usa `header`, `main`, `section` o
 * `article`, y fuera de los lectores de pantalla (`aria-hidden`, y sus enlaces y botones
 * fuera del tabulador): la portada que leen ellos, y sus puntos de referencia, es la lista
 * recortada (`portadaEnHtml`). Los títulos sí son `h2`/`h3`: su tamaño y su margen salen de ahí.
 *
 * Nada si la apertura no abre con foto (sin foto, o con un short): ahí React la pinta
 * como antes. `fila` es la de la API; `ultimaHora`, los titulares (`items`) y las filas
 * que no están arriba (`recientes`), para la columna.
 */
export const aperturaEnHtml = (fila, { idioma = "es", ahora = Date.now(), ultimaHora = {} } = {}) => {
  const pieza = paraLaApertura(fila);
  const titular = titularDe(fila, idioma);
  if (!titular || !precargaDeLaApertura(pieza)) return "";
  // Lo que hace `piezaFromApi` (`lib/pieza.js`): en `/en`, la versión inglesa si la tiene.
  const enIngles = idioma === "en" && Boolean(fila.en_ingles);
  const resumen = resumenDeTarjeta(enIngles ? fila.excerpt_en || "" : fila.excerpt);
  const srcset = imagenSrcSet(pieza.imagenUrl, ANCHOS_DE_TARJETA, pieza.imagenAnchoOriginal);
  const foco = posicionDeFoco(fila.imagen_foco);
  // `CardMedia` con lo que le pasa `PrimeraPlana`: `ancho={1200}`, `SIZES_PRINCIPAL` y `prioridad`.
  const img =
    `<img class="se-artcard__img" src="${escapar(imagenAncho(pieza.imagenUrl, 1200))}"` +
    (foco ? ` style="object-position:${escapar(foco)}"` : "") +
    (srcset ? ` srcset="${escapar(srcset)}"` : "") +
    ` sizes="${escapar(SIZES_PRINCIPAL)}" alt="" loading="eager" fetchpriority="high" decoding="async" />`;
  const ruta = escapar(titular.ruta);
  return [
    `<div class="se-publico se-portada-anticipo" aria-hidden="true">`,
    `<div class="se-ticker se-ticker--hueco"></div>`,
    `<div class="se-header"><div class="se-container se-header__inner"></div></div>`,
    `<div class="se-contenido"><div class="se-blog se-portada"><div class="se-plana">`,
    `<div class="se-container"><p class="se-plana__fecha"><time>${escapar(fechaDeEdicion(ahora, idioma))}</time></p></div>`,
    `<div class="se-container se-plana__rejilla">`,
    ultimaHoraEnHtml({ ...ultimaHora, idioma, ahora }),
    `<div class="se-plana__centro"><div class="se-plana__principal">`,
    `<div class="se-plana__foto"><a class="se-plana__media" href="${ruta}" tabindex="-1">${img}</a></div>`,
    `<div class="se-plana__texto"><h3 class="se-plana__titulo${fila.format === "informe" ? " se-plana__titulo--a-fondo" : ""}">`,
    `<a href="${ruta}" tabindex="-1">${tituloDePieza(fila, idioma)}</a></h3>`,
    resumen ? `<p class="se-plana__resumen">${escapar(resumen)}</p>` : "",
    `</div></div></div></div></div></div></div></div>`,
  ].join("");
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
 *
 * Y la apertura a la vista (`aperturaEnHtml`), que solo existe en este HTML (por eso va aquí
 * y no en las hojas del sitio): a los `REVELAR_TRAS`, si React no llegó, se pliega y deja
 * el sitio a la lista.
 */
export const ESTILO_PREVIO =
  `<style>.se-portada-previa{position:absolute;top:0;left:0;width:1px;height:1px;margin:-1px;` +
  `overflow:hidden;clip-path:inset(50%);white-space:nowrap;` +
  `animation:se-portada-previa 0s linear ${REVELAR_TRAS} forwards}` +
  `.se-portada-previa main,.se-portada-previa footer{max-width:44rem;margin:0 auto;padding:1.5rem 1rem}` +
  `@keyframes se-portada-previa{to{width:auto;height:auto;margin:0;right:0;` +
  `overflow:visible;clip-path:none;white-space:normal}}` +
  `.se-portada-anticipo{animation:se-portada-anticipo 0s linear ${REVELAR_TRAS} forwards}` +
  `@keyframes se-portada-anticipo{to{height:0;overflow:hidden}}` +
  `</style>`;

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
    name: t.titulo,
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

/**
 * Las filas de la primera página del listado y la respuesta entera (para el bloque de
 * datos), o un motivo si no llegaron.
 */
const leerTitulares = async () => {
  try {
    const respuesta = await conDeadline(DATOS_URL, LIMITE_MS);
    if (!respuesta.ok) return { motivo: `api-${respuesta.status}` };
    const cuerpo = await respuesta.json();
    const filas = Array.isArray(cuerpo) ? cuerpo : cuerpo?.data;
    if (!Array.isArray(filas)) return { motivo: "api-sin-lista" };
    return { filas, respuesta: cuerpo };
  } catch {
    return { motivo: "api-sin-respuesta" };
  }
};

/**
 * Los titulares de Última hora (la respuesta entera del quiosco), o nulo si no llegaron a
 * tiempo o no traen la lista. Van al HTML para que la columna de Última hora salga con
 * ellos desde el primer pintado: si llegaran después, la columna cambiaría de alto y, en el
 * teléfono, empujaría la apertura (medido: CLS de 0,021 con los datos dentro del HTML y los
 * titulares por detrás). Sin ellos, la página los pide al llegar, como antes.
 */
const leerUltimaHora = async (idioma) => {
  try {
    const respuesta = await conDeadline(ultimaHoraUrl(idioma), LIMITE_ULTIMA_HORA_MS);
    if (!respuesta.ok) return null;
    const cuerpo = await respuesta.json();
    return Array.isArray(cuerpo?.data?.items) ? cuerpo : null;
  } catch {
    return null;
  }
};

/**
 * Una respuesta del quiosco tal cual, para que la página no la vuelva a pedir al cargar
 * (`leerDelHtml`, en `src/api/quiosco.js`). Detrás de `#root`: la apertura se pinta sin
 * esperar a estos datos, que son la mayor parte del HTML (unos 33 KB con brotli).
 * `jsonEnScript` escapa el `<` (un titular con `</script>` no corta el bloque), y el bloque
 * dice qué lectura contesta y cuándo se armó: la página no usa uno viejo.
 */
export const bloqueDeDatos = (id, lectura, respuesta, ahora = Date.now()) =>
  `<script type="application/json" id="${id}">` +
  `${jsonEnScript({ lectura, generada: new Date(ahora).toISOString(), respuesta })}</script>`;

/**
 * Las filas que no están arriba (ni la que manda ni las de debajo), en el orden de la API:
 * las `recientes` que `Home` le pasa a `PrimeraPlana`, de donde Última hora saca sus
 * noticias cuando no hay titulares del día. `plana`, la de `loQuePintaLaPortada`.
 */
export const recientesDeLaPortada = (filas, plana) => {
  const arriba = new Set([plana?.principal, ...(plana?.secundarias ?? [])].filter(Boolean).map((p) => p.id));
  return filas.filter((f) => !arriba.has(String(f.id ?? "")));
};

/**
 * La página entera a partir del shell y las filas (o sin filas). Separada del `handler`
 * para las pruebas. `respuesta`: lo que contestó el quiosco, entero, de donde salen las
 * filas; sin ella (o sin filas) la página no lleva bloques de datos y pide como siempre.
 * `ultimaHora`: la respuesta de los titulares de Última hora (`leerUltimaHora`), o nula.
 */
export const armarPortada = (
  shell,
  { filas = [], respuesta = null, ultimaHora = null, idioma = "es", ahora = Date.now() } = {}
) => {
  const t = TEXTOS[idioma];
  const url = idioma === "en" ? URL_EN : URL_ES;

  const validas = filas.filter((f) => f && typeof f === "object");
  const porId = new Map(validas.map((f) => [String(f.id ?? ""), f]));
  const { plana, secciones } = loQuePintaLaPortada(validas.map(paraLaApertura), ahora);
  const titular = (p) => (p ? titularDe(porId.get(p.id), idioma) : null);

  const principal = plana ? titular(plana.principal) : null;
  const planaHtml = principal
    ? {
        titulo: plana.fijada ? t.apertura : t.recientes,
        principal,
        otras: [...plana.secundarias, plana.editorial, ...plana.analisis].map(titular).filter(Boolean),
      }
    : null;
  const seccionesHtml = secciones
    .map((s) => ({
      titulo:
        s.formato === "alpunto" ? t.alPunto : (idioma === "en" ? FORMAT_NAME : NOMBRE_DE_FORMATO)[s.formato],
      ruta: `${idioma === "en" ? "/en" : ""}${rutaDeFormato(s.formato)}`,
      titulares: s.piezas.map(titular).filter(Boolean),
    }))
    .filter((s) => s.titulares.length);

  // Última hora, como la pinta React al montar: los titulares si vinieron y, si no son del
  // día, las piezas que no están arriba.
  const columna = {
    items: Array.isArray(ultimaHora?.data?.items) ? ultimaHora.data.items : [],
    recientes: recientesDeLaPortada(validas, plana),
  };

  const todos = [
    ...(planaHtml ? [planaHtml.principal, ...planaHtml.otras] : []),
    ...seccionesHtml.flatMap((s) => s.titulares),
  ];
  // La precarga va con la apertura aunque no se haya podido enlazar (un formato que esta
  // función no conoce): la foto la pinta React igual. El estilo, solo si hay HTML previo.
  const cabecera = [
    enlaceDePrecarga(precargaDeLaApertura(plana?.principal)),
    todos.length ? ESTILO_PREVIO : "",
  ]
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
    // La lista recortada (para buscadores y lectores de pantalla) y, a la vista, la apertura.
    html: todos.length
      ? portadaEnHtml({ plana: planaHtml, secciones: seccionesHtml, idioma }) +
        (principal ? aperturaEnHtml(porId.get(plana.principal.id), { idioma, ahora, ultimaHora: columna }) : "")
      : null,
    cola:
      respuesta && validas.length
        ? bloqueDeDatos(ID_DE_LA_PORTADA, LISTADO_DE_LA_PORTADA, respuesta, ahora) +
          (ultimaHora ? bloqueDeDatos(ID_DE_ULTIMA_HORA, ultimaHoraDeLaPortada(idioma), ultimaHora, ahora) : "")
        : "",
  });
};

/**
 * Lo mismo que guarda el borde para el listado (`/posts`, en el backend): medio minuto, un
 * minuto más sirviendo la anterior mientras se renueva, y un día si la función fallara. Una
 * noticia nueva sale aquí tan pronto como en el quiosco.
 */
const CACHE_PORTADA = "public, s-maxage=30, stale-while-revalidate=60, stale-if-error=86400";

export default async function handler(req, res) {
  // `/` llega sin nada y `/en` con `lang=en` (los dos por `vercel.json`).
  const idioma = req.query?.lang === "en" ? "en" : "es";
  const rutaPropia = idioma === "en" ? "/en" : "/";

  // Última hora se pide a la vez que la portada, pero no la retrasa más que
  // `MARGEN_ULTIMA_HORA_MS` (ver abajo); si no llega, la página sale sin ella y la pide al llegar.
  const pidiendoUltimaHora = leerUltimaHora(idioma);
  const [{ shell, fuente }, datos] = await Promise.all([leerShell(), leerTitulares()]);
  res.setHeader("X-Shell", fuente);

  if (!esNuestroShell(shell)) {
    // Sin la aplicación no hay nada que servir con honradez: al archivo estático, que
    // `vercel.json` deja pasar con `?_s=1`. No debería pasar (el shell va en el paquete de
    // la función); guardado muy poco por si pasa.
    res.setHeader("X-Pieza-Meta", "portada-shell-no-reconocido");
    res.setHeader("Cache-Control", "public, s-maxage=10");
    res.redirect(307, `${rutaPropia}?${SIN_META}=1`);
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  // Interruptor: `PORTADA_HTML=no` en Vercel (y volver a desplegar) sirve el shell tal
  // cual, como antes de esta función, sin tocar código.
  if (process.env.PORTADA_HTML === "no") {
    res.setHeader("Cache-Control", CACHE_PORTADA);
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

  const ultimaHora = await comoMucho(pidiendoUltimaHora, MARGEN_ULTIMA_HORA_MS);
  res.setHeader("Cache-Control", CACHE_PORTADA);
  res.setHeader("X-Pieza-Meta", "portada");
  res.status(200).send(armarPortada(shell, { filas: datos.filas, respuesta: datos.respuesta, ultimaHora, idioma }));
}
