/**
 * Una dirección que no es del sitio: la aplicación de siempre, pero con un 404 de verdad.
 *
 * El sitio se arma en el navegador, así que cualquier dirección inventada
 * (`/esta-pagina-no-existe`, `/noticias`) recibía el mismo `index.html` con un 200, y
 * la página «no encontrada» solo decía `noindex` después de ejecutar el JavaScript. Para
 * un buscador eran miles de páginas iguales: Search Console las marca como «404 suave» y
 * gastan el presupuesto de rastreo (auditoría 17-nov-2026, B-11).
 *
 * Ahora `vercel.json` manda a la aplicación solo las rutas que existen (las de
 * `src/routes.jsx`) y lo demás llega aquí. Se sirve la misma aplicación, que pinta su
 * página 404 con el juego, pero con estado 404, `noindex` y el título de esa página. El
 * lector no nota nada; el buscador, sí.
 *
 * El shell se lee del dominio público y se comprueba, igual que en `api/pieza.js` (allí
 * está la historia de por qué). Si no se puede, sale una página mínima, también con 404:
 * aquí no hay nada que salvar con un 200.
 */

import { esNuestroShell } from "./pieza.js";

const SITIO = "https://www.sureconomics.com";

/** Igual que en `api/pieza.js`: el dominio público, nunca la dirección de un despliegue. */
const SHELL_URL = process.env.SHELL_URL || `${SITIO}/index.html`;

/** Un shell que no llega no puede dejar al lector esperando: lo mismo que `api/pieza.js`. */
const LIMITE_MS = 3500;

/**
 * Los textos, copiados de `src/i18n/` porque esta función corre en Node sin el motor
 * de la página; la prueba (`no-encontrada.test.mjs`) vigila que digan lo mismo.
 * - `pestana`: `piezas.paginaNoEncontrada.meta.titulo`, el que pone la página al cargar.
 * - `titulo` y `texto`: los de esa página. `volver`: `piezas.noEncontrada.volver`.
 * Los tres últimos, solo en la página mínima de cuando el shell no llega.
 */
export const TEXTOS = {
  es: {
    pestana: "Página no encontrada — SurEconomics",
    titulo: "Página no encontrada",
    texto: "La URL puede estar mal escrita o el contenido ya no está disponible.",
    volver: "Volver a la portada",
    inicio: "/",
  },
  en: {
    pestana: "Page not found — SurEconomics",
    titulo: "Page not found",
    texto: "The URL may be misspelled, or the content is no longer available.",
    volver: "Back to the front page",
    inicio: "/en",
  },
};

const NOINDEX = '<meta name="robots" content="noindex, follow" />';

/** El shell de la aplicación con el título de la 404, `noindex` y el idioma. */
export const shellNoEncontrada = (shell, idioma = "es") => {
  const tal = (texto) => () => texto;
  let html = shell.replace(/<title>[\s\S]*?<\/title>/i, tal(`<title>${TEXTOS[idioma].pestana}</title>`));
  // El shell dice «indexar» para todo el sitio: aquí se cambia por «no indexar», en vez
  // de dejar las dos y que cada buscador elija.
  html = /<meta name="robots"[^>]*>/i.test(html)
    ? html.replace(/<meta name="robots"[^>]*>/i, tal(NOINDEX))
    : html.replace(/<\/head>/i, tal(`  ${NOINDEX}\n  </head>`));
  return idioma === "es" ? html : html.replace(/<html lang="[^"]*">/i, tal(`<html lang="${idioma}">`));
};

/** La página mínima: sin la aplicación, pero con su 404 y una salida. */
export const paginaMinima = (idioma = "es") => {
  const t = TEXTOS[idioma];
  return `<!doctype html>
<html lang="${idioma}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${NOINDEX}
    <title>${t.pestana}</title>
  </head>
  <body>
    <main>
      <h1>${t.titulo}</h1>
      <p>${t.texto}</p>
      <p><a href="${t.inicio}">${t.volver}</a></p>
    </main>
  </body>
</html>`;
};

const conDeadline = async (url, ms) => {
  const corta = new AbortController();
  const reloj = setTimeout(() => corta.abort(), ms);
  try {
    return await fetch(url, { signal: corta.signal });
  } finally {
    clearTimeout(reloj);
  }
};

export default async function handler(req, res) {
  // `/en/...` llega con `lang=en` (ver `vercel.json`).
  const idioma = req.query?.lang === "en" ? "en" : "es";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex");

  let shell = "";
  try {
    const respuesta = await conDeadline(SHELL_URL, LIMITE_MS);
    shell = await respuesta.text();
  } catch {
    shell = "";
  }

  if (!esNuestroShell(shell)) {
    // Sin la aplicación: la página mínima, guardada poco para que la próxima pruebe otra vez.
    res.setHeader("Cache-Control", "public, s-maxage=30");
    res.setHeader("X-Pieza-Meta", "no-encontrada-sin-shell");
    res.status(404).send(paginaMinima(idioma));
    return;
  }

  // Guardada en el borde como la 404 de una pieza: el shell solo cambia al desplegar.
  res.setHeader("Cache-Control", "public, s-maxage=300");
  res.setHeader("X-Pieza-Meta", "no-encontrada");
  res.status(404).send(shellNoEncontrada(shell, idioma));
}
