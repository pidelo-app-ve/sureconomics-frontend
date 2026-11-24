/**
 * Lo que decide la página de una pieza (`pages/Pieza.jsx`) sin pintar nada: de dónde
 * sale la pieza, en qué estado queda tras pedirla, cuántos minutos se tarda en leerla y
 * qué título y qué señales para Google lleva. Sin React, para poder probarlo
 * (`paginaDePieza.test.mjs`).
 */
import { BRAND } from "../config/sitio";
import { temaPrincipal } from "./contentFilter";

/** Formatos que se leen: los demás se ven o se escuchan, y sus minutos son otros. */
export const SE_LEEN = new Set(["noticia", "articulo", "editorial", "informe"]);

/**
 * Minutos de lectura, a 220 palabras por minuto (un lector de prensa en pantalla). Del
 * cuerpo tal como llega, sin etiquetas. Menos de un minuto se dice como uno.
 */
export const minutosDeLectura = (html) => {
  const palabras = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return palabras ? Math.max(1, Math.round(palabras / 220)) : null;
};

/**
 * La pieza que ya vino dentro del HTML, si es esta (tal cual, sin convertir).
 *
 * `api/pieza.js` la mete en `<script type="application/json" id="se-pieza">` al servir la página, para que los
 * buscadores vean el texto. Aprovecharla aquí ahorra pedirla otra vez a la API y, sobre
 * todo, evita que el artículo que ya se veía desaparezca tras un «Cargando…» y vuelva.
 * Se usa una sola vez: al navegar a otra pieza dentro del sitio, se pide como siempre.
 */
export const tomarPiezaDelHtml = (slug) => {
  // Solo lee. Se borra en el efecto, ya usada: React, en modo estricto, llama dos veces
  // a la función que prepara el estado inicial, y borrarla aquí dejaba la segunda
  // llamada sin pieza -- y la página la volvía a pedir a la API.
  try {
    const nodo = document.getElementById("se-pieza");
    const datos = nodo ? JSON.parse(nodo.textContent || "null") : null;
    return datos && datos.slug === slug ? datos : null;
  } catch {
    return null;
  }
};

/** El estado de la página con lo que contestó la API: una pieza, o «no existe». */
export const estadoDeLaRespuesta = (fila) => {
  const valida = fila && typeof fila === "object" && fila.slug ? fila : null;
  return { status: valida ? "success" : "missing", fila: valida };
};

/**
 * El estado de la página cuando pedir la pieza falló. Solo un 404 es «no existe». Lo
 * demás (sin red, 429, 502 mientras Render reinicia) es pasajero: se dice así, con
 * reintento, y sin `noindex`. Es el mismo criterio que api/pieza.js; antes todo caía en
 * «no encontrada».
 */
export const estadoDelFallo = (err) =>
  err?.status === 404 ? { status: "missing", fila: null } : { status: "error", fila: null, error: err };

/**
 * Lo que la página le pide a `useMetaPagina`: el título, la descripción y las señales
 * para Google, en su idioma. Una pieza sin versión en inglés (`soloEspanol`) sale en
 * `/en` con `noindex` y el canónico apuntando al español. Con ella, las dos páginas se
 * declaran la una a la otra (`hreflang`), también la española. Y una dirección que no
 * lleva a ninguna pieza no debe quedar en los buscadores, ni declarar canónica (es una
 * 404).
 *
 * `t` es el del idioma de la página (`useIdioma`).
 */
export const metaDeLaPieza = ({ status, pieza, t }) => {
  const marca = BRAND.name;
  return status === "missing"
    ? { title: t("piezas.noEncontrada.meta.titulo", { marca }), noEncontrada: true }
    : pieza
      ? {
          // El mismo título y la misma descripción que pone la función de Vercel antes
          // de que cargue la página (`api/pieza.js`): si no, la pestaña cambiaba al cargar.
          title: t("piezas.pieza.meta.titulo", { titulo: pieza.metaTitulo || pieza.titulo, marca }),
          description: pieza.metaDescripcion || pieza.resumen || pieza.entrada || temaPrincipal(pieza) || marca,
          soloEspanol: !pieza.tieneIngles,
          tipo: "article",
          autor: pieza.formatoApi === "editorial" ? marca : pieza.autor || marca,
        }
      : { soloEspanol: true };
};
