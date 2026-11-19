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
 * Las páginas que, con parámetros, son un filtro y no otra página:
 * `/en/explorar?tema=Infraestructura`, `/explorar?donde=Venezuela`. Google las guardaba
 * como «duplicadas» (Search Console, 19-nov-2026). Ahora salen con `noindex, follow` y
 * **sin canónica** (ver `useMetaPagina`): no se guardan, sus enlaces sí se siguen, y no
 * se mezcla «no me guardes» con «la buena es otra», que Google desaconseja. La versión
 * sin parámetros sigue indexable.
 *
 * Hoy solo `/explorar` (y `/en/explorar`), con **cualquier** parámetro: `tema`, `donde` y
 * `q` son sus filtros, y lo demás (`pagina`, `utm_*`) también es la misma página.
 *
 * **Lo que NO entra, a propósito** (se queda con su canónica limpia y se indexa):
 * - `/articulos?formato=…` y `/audiovisual?ver=…`: secciones de verdad (las primeras, en
 *   `api/sitemap.js`), igual que la paginación (`?pagina=`) de un listado;
 * - `/?buscar=1`: la lupa de la cabecera; el servidor entrega la portada con su canónica,
 *   y un `noindex` por JavaScript le llevaría la contraria sobre la portada;
 * - `/contacto?asunto=…` y `/clave?c=…`: la misma página con el formulario o la categoría
 *   puestos; basta la canónica a la versión limpia;
 * - `?q=`, `?v=` o `utm_*` en una pieza.
 *
 * La prueba (`canonica.test.mjs`) pasa cada dirección del sitemap por aquí y exige que
 * ninguna salga como filtro.
 */
const RUTAS_DE_FILTRO = new Set(["/explorar"]);

/** `/en/explorar/` -> `/explorar`; `/en` -> `/`. */
const rutaSinIdioma = (pathname) => {
  const camino = String(pathname || "/").split(/[?#]/)[0] || "/";
  const sinEn = camino === "/en" || camino === "/en/" ? "/" : camino.startsWith("/en/") ? camino.slice(3) : camino;
  return sinEn.length > 1 ? sinEn.replace(/\/+$/, "") || "/" : sinEn;
};

export const esPaginaDeFiltro = (pathname, search) =>
  RUTAS_DE_FILTRO.has(rutaSinIdioma(pathname)) && [...new URLSearchParams(search || "").keys()].length > 0;
