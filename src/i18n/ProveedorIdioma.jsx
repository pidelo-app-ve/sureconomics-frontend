import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { IDIOMA_BASE, NOMBRE_DEL_IDIOMA, fijarIdioma, rutaEnIdioma, sinPrefijo, traducir } from "./motor";

/**
 * El idioma de una rama de rutas. Se monta dos veces en `routes.jsx`: en `/` con
 * español y en `/en` con inglés, y todo lo que cuelga de cada una habla ese idioma.
 *
 * Lo que da a quien lo use (`useIdioma()`):
 * - `lang`: "es" o "en".
 * - `t(clave, vars)`: el texto en este idioma.
 * - `ruta(destino)`: la misma dirección en este idioma (`/noticias` → `/en/noticias`).
 * - `otroIdioma` y `rutaEnOtroIdioma`: para el conmutador de la cabecera.
 *
 * El valor por defecto del contexto funciona solo, en español: así el panel (que no
 * cuelga de ningún proveedor) y la página de error siguen funcionando.
 */

const crearValor = (lang, pathname = "/", search = "") => {
  const otroIdioma = lang === "es" ? "en" : "es";
  return {
    lang,
    otroIdioma,
    nombreDelIdioma: NOMBRE_DEL_IDIOMA[lang],
    nombreDelOtroIdioma: NOMBRE_DEL_IDIOMA[otroIdioma],
    t: (clave, vars) => traducir(lang, clave, vars),
    ruta: (destino) => rutaEnIdioma(destino, lang),
    rutaEnOtroIdioma: rutaEnIdioma(sinPrefijo(pathname) + search, otroIdioma),
  };
};

export const ContextoIdioma = createContext(crearValor(IDIOMA_BASE));

export const useIdioma = () => useContext(ContextoIdioma);

export const ProveedorIdioma = ({ lang }) => {
  const { pathname, search } = useLocation();
  // Antes de pintar nada: lo que formatea fechas fuera de React lee `idiomaActual()`.
  fijarIdioma(lang);
  const valor = useMemo(() => crearValor(lang, pathname, search), [lang, pathname, search]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <ContextoIdioma.Provider value={valor}>
      <Outlet />
    </ContextoIdioma.Provider>
  );
};

ProveedorIdioma.propTypes = {
  lang: PropTypes.oneOf(["es", "en"]).isRequired,
};
