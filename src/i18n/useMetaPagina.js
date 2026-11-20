import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITIO, applyPageMeta } from "../lib/seo";
import { consultaCanonica, esPaginaDeFiltro } from "../lib/canonica";
import { rutaEnIdioma, sinPrefijo } from "./motor";
import { useIdioma } from "./ProveedorIdioma";

/**
 * El título, la descripción y las señales para Google de una página, en su idioma.
 *
 * Sustituye al `applyPageMeta` dentro de un `useEffect` que tenía cada página, y suma
 * lo que el bilingüe exige:
 * - `<html lang>` y `og:locale` del idioma de la página;
 * - el `canonical` de esta versión y los `hreflang` de las dos (más `x-default`, que
 *   apunta al español, la casa);
 * - `soloEspanol`: para lo que todavía no existe en inglés (las piezas). En `/en` sale
 *   con `noindex` y el canonical apuntando al español, así Google no ve 500 páginas
 *   duplicadas con la interfaz traducida y el texto sin traducir.
 *
 * - `noEncontrada`: la página es una 404 (o un 410). Lleva `noindex` y **ni canónica ni
 *   `hreflang`**: una dirección que no existe no puede decir cuál es «la buena».
 * - Un filtro (`/explorar?tema=…`; la lista está en `esPaginaDeFiltro`, `lib/canonica`)
 *   sale con `noindex, follow` solo, sin que la página lo pida, y también sin canónica ni
 *   `hreflang`: `noindex` junto a una canónica hacia otra dirección son dos señales que
 *   Google desaconseja mezclar. La versión limpia (`/explorar`) se indexa.
 *
 * Las claves `title`/`description` se llaman como en `applyPageMeta` para que el cambio
 * en cada página sea mover la llamada, no reescribirla.
 *
 * Lo que se pone sale de `senalesDeLaPagina` (abajo), sin React, para poder probarlo.
 */
export const useMetaPagina = ({
  title,
  description,
  noindex = false,
  noEncontrada = false,
  soloEspanol = false,
  tipo = "website",
  autor = null,
} = {}) => {
  const { lang } = useIdioma();
  const { pathname, search } = useLocation();
  // Solo la consulta que cambia de página (ver `lib/canonica`): sin el `?v=` de compartir.
  const base = sinPrefijo(pathname) + consultaCanonica(search);
  const filtro = esPaginaDeFiltro(pathname, search);

  useEffect(() => {
    applyPageMeta(
      senalesDeLaPagina({ base, filtro, lang, title, description, noindex, noEncontrada, soloEspanol, tipo, autor })
    );
  }, [title, description, noindex, noEncontrada, filtro, soloEspanol, tipo, autor, lang, base]);
};

/**
 * Lo que `useMetaPagina` le pasa a `applyPageMeta`. `base` es la dirección sin prefijo de
 * idioma y con solo la consulta que cuenta (`consultaCanonica`); `filtro`, si es una
 * página de filtro (`esPaginaDeFiltro`). Lo demás, lo que pidió la página.
 */
export const senalesDeLaPagina = ({
  base,
  filtro,
  lang,
  title,
  description,
  noindex = false,
  noEncontrada = false,
  soloEspanol = false,
  tipo = "website",
  autor = null,
}) => {
  const enEspanol = `${SITIO}${rutaEnIdioma(base, "es")}`;
  const enIngles = `${SITIO}${rutaEnIdioma(base, "en")}`;
  const propia = lang === "en" ? enIngles : enEspanol;
  const sinVersionPropia = soloEspanol && lang === "en";
  const sinIndice = noindex || noEncontrada || filtro;
  return {
    title,
    description,
    lang,
    noindex: sinIndice || sinVersionPropia,
    canonicalUrl: noEncontrada || filtro ? null : sinVersionPropia ? enEspanol : propia,
    alternates: sinIndice || soloEspanol ? null : { es: enEspanol, en: enIngles, "x-default": enEspanol },
    tipo,
    autor,
  };
};
