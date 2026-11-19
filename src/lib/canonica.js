/**
 * La parte de la consulta (`?…`) que cuenta para Google en la canónica y en los
 * `hreflang`: solo lo que cambia de verdad de página. Hoy, `formato`, que el sitemap ya
 * publica como secciones (`/articulos?formato=noticias`).
 *
 * Lo demás es la misma página: el `?v=` que se añade al compartir una pieza (para que X
 * refresque su tarjeta), el `asunto` del formulario de contacto, las etiquetas `utm_*`,
 * los filtros. Con la consulta entera en la canónica, quien llegaba por un enlace
 * compartido le decía a Google «la buena soy yo, con el `?v=`», y Google, que elegía la
 * dirección limpia, lo contaba como duplicado (228 páginas en Search Console, 16-nov-2026).
 */
const PARAMETROS_CANONICOS = ["formato"];

export const consultaCanonica = (search) => {
  const recibida = new URLSearchParams(search || "");
  const canonica = new URLSearchParams();
  for (const clave of PARAMETROS_CANONICOS) {
    const valor = recibida.get(clave);
    if (valor) canonica.set(clave, valor);
  }
  const texto = canonica.toString();
  return texto ? `?${texto}` : "";
};

/**
 * Las páginas que, con ciertos parámetros, son un filtro o un formulario a medio llenar
 * y no otra página: `/en/explorar?tema=Infraestructura`, `/contacto?asunto=…`. La canónica
 * ya apunta a la versión limpia (ver `consultaCanonica`), pero Google las seguía guardando
 * como «duplicadas» (Search Console, 19-nov-2026). Con esto salen con `noindex, follow`:
 * no se guardan, y sus enlaces sí se siguen. La versión sin parámetros sigue indexable.
 *
 * Ruta (sin el `/en`) -> los parámetros que la vuelven filtro; `"*"`, cualquiera.
 * - `/explorar`: `tema`, `donde` y `q` son los filtros del buscador; cualquier otro
 *   parámetro también es la misma página.
 * - `/contacto`: `asunto` solo rellena el formulario.
 * - `/clave`: `?c=` abre el juego en la categoría de un reto compartido; es el mismo juego.
 *
 * Y en cualquier ruta, `buscar` y `q`: en este sitio nunca son contenido (`/?buscar=1`
 * abre el buscador sobre la portada).
 *
 * **Lo que NO entra, a propósito:** `/articulos?formato=…` y `/audiovisual?ver=…` son
 * secciones de verdad (las primeras, en `api/sitemap.js`), igual que la paginación
 * (`?pagina=`) de un listado. La prueba (`canonica.test.mjs`) pasa cada dirección del
 * sitemap por aquí y exige que ninguna salga como filtro.
 */
const FILTROS = {
  "/explorar": "*",
  "/contacto": ["asunto"],
  "/clave": ["c"],
};

/** Parámetros de búsqueda: en cualquier ruta, nunca son una página propia. */
const BUSQUEDA_EN_TODAS = ["buscar", "q"];

/** `/en/explorar/` -> `/explorar`; `/en` -> `/`. */
const rutaSinIdioma = (pathname) => {
  const camino = String(pathname || "/").split(/[?#]/)[0] || "/";
  const sinEn = camino === "/en" || camino === "/en/" ? "/" : camino.startsWith("/en/") ? camino.slice(3) : camino;
  return sinEn.length > 1 ? sinEn.replace(/\/+$/, "") || "/" : sinEn;
};

export const esPaginaDeFiltro = (pathname, search) => {
  const claves = [...new URLSearchParams(search || "").keys()];
  if (!claves.length) return false;
  if (claves.some((c) => BUSQUEDA_EN_TODAS.includes(c))) return true;
  const filtros = FILTROS[rutaSinIdioma(pathname)];
  if (!filtros) return false;
  return filtros === "*" || claves.some((c) => filtros.includes(c));
};
