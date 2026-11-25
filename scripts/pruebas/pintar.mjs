/**
 * Pintar una página del sitio en una dirección, como la montan `main.jsx`, `routes.jsx` y
 * `Layout.jsx`: dentro de sus proveedores de verdad (sesiones, marcadores, temas
 * seguidos, publicidad), de un router de datos como el del sitio (`createMemoryRouter`
 * en vez de `createBrowserRouter`: lo pide `useBlocker`) y del idioma
 * (`ProveedorIdioma` en `/` y en `/en`). Devuelve el HTML. Sin la cabecera ni el pie del
 * `Layout`: solo la página. `patron` es la ruta de la página bajo `/` (`""` para la
 * portada).
 *
 *     const html = await pintarEn("/noticias/mi-pieza", "noticias/:slug", createElement(Pieza));
 *
 * Es `renderToString`: lo del primer pintado. Los `useEffect` no corren -- ni las
 * peticiones que hacen, ni lo que cambian después --, así que se ve lo que el lector ve
 * antes de que llegue nada (o lo que ya venía, como la pieza metida en el HTML).
 *
 * Si React se queja al pintar (un `propTypes` que no cuadra, una lista sin `key`…), la
 * prueba **falla** con su aviso: en el navegador sería un error en la consola que nadie
 * ve. Solo se calla el de `useLayoutEffect` en el servidor, que es del router y no dice
 * nada de la página. Ojo: React avisa de cada `propTypes` **una vez por proceso**, así
 * que solo falla la primera prueba del archivo que lo provoque.
 */
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
/** Las mismas opciones `future` que el router del sitio (`routes.jsx`). */
const FUTURO = { v7_relativeSplatPath: true, v7_fetcherPersist: true };
import "../../src/i18n/diccionarios.js";
import { cargarIdioma, fijarIdioma, idiomaDeRuta } from "../../src/i18n/motor.js";
import { ProveedorIdioma } from "../../src/i18n/ProveedorIdioma.jsx";
import { AuthProvider } from "../../src/context/AuthContext.jsx";
import { UserAuthProvider } from "../../src/features/cuenta/index.js";
import { ProveedorDeMarcadores } from "../../src/context/MarcadoresContext.jsx";
import { ProveedorDeTemasSeguidos } from "../../src/context/TemasSeguidosContext.jsx";
import { ProveedorDePublicidad } from "../../src/features/publicidad/index.js";

/** Los proveedores de `main.jsx`, de fuera adentro, y el de `Layout.jsx`. */
const PROVEEDORES = [AuthProvider, UserAuthProvider, ProveedorDeMarcadores, ProveedorDeTemasSeguidos];

export const pintarEn = async (direccion, patron, elemento) => {
  const lang = idiomaDeRuta(new URL(direccion, "https://x.invalid").pathname);
  if (lang === "en") await cargarIdioma("en");
  const pagina = createElement(ProveedorDePublicidad, null, elemento);
  const hija = patron ? { path: patron, element: pagina } : { index: true, element: pagina };
  const rama = (raiz, idioma) => ({ path: raiz, element: createElement(ProveedorIdioma, { lang: idioma }), children: [hija] });
  const avisos = [];
  const consolaError = console.error;
  console.error = (...args) => {
    const texto = args.map(String).join(" ");
    if (!texto.includes("useLayoutEffect does nothing on the server")) avisos.push(texto);
  };
  try {
    const router = createElement(RouterProvider, {
      router: createMemoryRouter([rama("/", "es"), rama("/en", "en")], { initialEntries: [direccion], future: FUTURO }),
      future: { v7_startTransition: true },
    });
    const html = renderToString(PROVEEDORES.reduceRight((dentro, Proveedor) => createElement(Proveedor, null, dentro), router));
    if (avisos.length) throw new Error(`React se quejó al pintar ${direccion}: ${avisos.join(" | ")}`);
    return html;
  } finally {
    console.error = consolaError;
    // El idioma del motor es global (lo fija `ProveedorIdioma` al pintar): que no pase a
    // la prueba siguiente.
    fijarIdioma("es");
  }
};

/** El texto visible de un trozo de HTML, sin etiquetas y con los espacios juntos. */
export const textoDe = (html) =>
  String(html)
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
