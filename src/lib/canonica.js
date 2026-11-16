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
