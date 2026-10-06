import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITIO, applyPageMeta } from "../lib/seo";
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
 * Las claves `title`/`description` se llaman como en `applyPageMeta` para que el cambio
 * en cada página sea mover la llamada, no reescribirla.
 */
export const useMetaPagina = ({ title, description, noindex = false, soloEspanol = false } = {}) => {
  const { lang } = useIdioma();
  const { pathname, search } = useLocation();
  const base = sinPrefijo(pathname) + search;

  useEffect(() => {
    const enEspanol = `${SITIO}${rutaEnIdioma(base, "es")}`;
    const enIngles = `${SITIO}${rutaEnIdioma(base, "en")}`;
    const propia = lang === "en" ? enIngles : enEspanol;
    const sinVersionPropia = soloEspanol && lang === "en";
    applyPageMeta({
      title,
      description,
      lang,
      noindex: noindex || sinVersionPropia,
      canonicalUrl: sinVersionPropia ? enEspanol : propia,
      alternates: noindex || soloEspanol ? null : { es: enEspanol, en: enIngles, "x-default": enEspanol },
    });
  }, [title, description, noindex, soloEspanol, lang, base]);
};
