/**
 * Las páginas fijas en inglés (`/en/informes`, `/en/articulos?formato=noticias`, …) con su
 * idioma, su canónica y sus `hreflang` ya en el HTML.
 *
 * Hasta el 25-nov-2026 iban al archivo estático (`app.html`), el mismo para todas: decía
 * `<html lang="es">`, no tenía canónica ni `hreflang`, y la tarjeta era la española. La
 * página lo arreglaba al cargar (`useMetaPagina`), pero eso solo lo ve quien ejecuta
 * JavaScript, y tarde. Para un buscador, `/en/informes` era una página en español igual a
 * `/informes`: un duplicado, no su versión en inglés. El mapa del sitio ya las declaraba
 * así (`api/sitemap.js`, `filaBilingue`); ahora la página dice lo mismo.
 *
 * Sin datos de la API: solo el shell con la `<head>` de la página. El texto lo pinta React
 * como siempre. Si el shell no se puede leer, al archivo estático (`?_s=1`), como la portada.
 *
 * Las mismas reglas que la página al cargar (`senalesDeLaPagina`, en `useMetaPagina`):
 * - la canónica lleva solo la consulta que cambia de página (`consultaCanonica`: hoy,
 *   `formato`), sin `utm_*`, `pagina` ni `ver`;
 * - un filtro (`/en/explorar?tema=…`, `esPaginaDeFiltro`) sale con `noindex, follow` y sin
 *   canónica ni `hreflang`.
 *
 * El título y la descripción son los genéricos del sitio en inglés (los de la portada): los
 * de cada página viven en los diccionarios de `src/i18n/`, que aquí no se cargan. React pone
 * el de la página al montar.
 */

import { IMAGEN_DE_MARCA, SIN_META, SITIO, consultaDelLector, esNuestroShell, inyectar, leerShell } from "./_comun.js";
import { consultaCanonica, esPaginaDeFiltro } from "../src/lib/canonica.js";
import noEncontrada from "./no-encontrada.js";
import { TEXTOS } from "./portada.js";

/**
 * Las páginas que pasan por aquí: las públicas e indexables de `src/routes.jsx` (todas las
 * del mapa del sitio, más contacto y cookies). Ni la cuenta, ni la baja del boletín, ni
 * «Última hora», que la página marca `noindex`: con canónica desde el servidor serían dos
 * señales opuestas. `vercel.json` manda aquí estas mismas (la prueba lo vigila).
 */
export const PAGINAS = new Set([
  "anunciate",
  "articulos",
  "audiovisual",
  "clave",
  "consultoria",
  "contacto",
  "cookies",
  "educacion",
  "entorno",
  "explorar",
  "informes",
  "juegos",
  "lvbp",
  "monedas",
  "pausa",
  "quienes-somos",
  "resumen",
  "suscribirse",
]);

/** Lo que `vercel.json` añade a la consulta; lo demás es del lector. */
const PARAMETROS_INTERNOS = ["ruta", "lang"];

/**
 * La página entera a partir del shell. `ruta` sin barras (`informes`); `consulta`, la del
 * lector (`?formato=noticias&utm_source=x`). Separada del `handler` para las pruebas.
 */
export const armarPagina = (shell, { ruta, consulta = "", idioma = "en" }) => {
  const canonica = consultaCanonica(consulta);
  const enEspanol = `${SITIO}/${ruta}${canonica}`;
  const enIngles = `${SITIO}/en/${ruta}${canonica}`;
  const filtro = esPaginaDeFiltro(`/${ruta}`, consulta);
  const t = TEXTOS[idioma];
  return inyectar(shell, {
    titulo: t.titulo,
    descripcion: t.descripcion,
    imagen: IMAGEN_DE_MARCA,
    url: idioma === "en" ? enIngles : enEspanol,
    tipo: "website",
    idioma,
    locale: idioma === "en" ? "en_US" : "es_LA",
    alternativas: filtro ? null : { es: enEspanol, en: enIngles },
    noindex: filtro,
    sinCanonica: filtro,
  });
};

export default async function handler(req, res) {
  const query = req.query ?? {};
  // Hoy solo llegan las inglesas (`/en/<ruta>`, `lang=en`); las españolas siguen en el
  // archivo estático. Lo demás funciona igual con `es`, por si un día se mandan aquí.
  const idioma = query.lang === "en" ? "en" : "es";
  const ruta = typeof query.ruta === "string" ? query.ruta : "";
  if (!PAGINAS.has(ruta)) {
    // Alguien llamando a `/api/pagina` a mano con otra cosa: no es una página del sitio.
    await noEncontrada({ query: idioma === "en" ? { lang: "en" } : {} }, res);
    return;
  }
  const consulta = consultaDelLector(query, PARAMETROS_INTERNOS);
  const rutaPropia = `${idioma === "en" ? "/en" : ""}/${ruta}`;

  const { shell, fuente } = await leerShell();
  res.setHeader("X-Shell", fuente);
  if (!esNuestroShell(shell)) {
    // Sin la aplicación no hay nada que servir con honradez: al archivo estático, que
    // `vercel.json` deja pasar con `?_s=1`. Guardado muy poco por si pasa.
    res.setHeader("X-Pieza-Meta", "pagina-shell-no-reconocido");
    res.setHeader("Cache-Control", "public, s-maxage=10");
    res.redirect(307, `${rutaPropia}${consulta ? `${consulta}&` : "?"}${SIN_META}=1`);
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Solo cambia al desplegar (el shell) o con la consulta, que es parte de la clave del borde.
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("X-Pieza-Meta", "pagina");
  res.status(200).send(armarPagina(shell, { ruta, consulta, idioma }));
}
