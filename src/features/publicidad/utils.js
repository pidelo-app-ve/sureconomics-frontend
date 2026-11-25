/**
 * Piezas pequeñas de la publicidad, sin React ni red: cómo viajan los filtros de tema y
 * país en la dirección y el contador de recargas del lector. Prueba al lado:
 * `utils.test.mjs` (`npm run test:publicidad`).
 */

/**
 * Una lista de valores (tema, país) tal como viaja en la dirección: `a,b,c`, o `null`
 * si no hay nada que mandar.
 */
export const listaDeQuery = (valor) => {
  if (!valor) return null;
  // También un `Set`: la selección del lector en los listados viaja así
  // (`useContentFilter`), y con `[valor]` un Set se escribía `[object Object]` en la
  // dirección, así que el patrocinio por tema o país nunca coincidía.
  const lista = valor instanceof Set ? [...valor] : Array.isArray(valor) ? valor : [valor];
  // Solo textos y números: cualquier otra cosa (un objeto, un `Set` que alguien convirtió
  // en `{}` por el camino) se escribiría `[object Object]`. Mejor no mandar el filtro.
  const partes = lista
    .filter((v) => typeof v === "string" || typeof v === "number")
    .map((v) => String(v).trim())
    .filter(Boolean);
  return partes.length ? partes.join(",") : null;
};

/**
 * Lo que el lector eligió en el filtro de un listado, dicho como lo entiende el servidor:
 * por **slug**, igual que una pieza (`pieza.temaSlugs`, `pieza.geoSlugs`).
 *
 * El filtro guarda **nombres** (los que se ven en los botones: «Macroeconomía», y en
 * `/en` el nombre en inglés si la redacción lo puso), y las campañas guardan sus temas y
 * países por slug (el panel, `DondeSale`). El servidor compara texto con texto (solo pasa
 * todo a minúsculas), así que el nombre solo casaba por suerte, cuando en minúsculas es
 * igual al slug («Venezuela»). «Mercados e Inversión», «Perú» o «EE. UU.» no casaban
 * nunca, y en `/en` menos: una campaña de un tema no salía en los listados.
 *
 * - Un tema se busca por su nombre en español y en inglés (`name`, `name_en`): vale el
 *   que esté puesto, aunque el lector cambie de idioma con el filtro elegido.
 * - Un lugar, por `slugPorNombre` (el árbol, en el idioma de la página).
 * - «Todo» (la raíz del árbol, «Mundo») no es un país: en el filtro quiere decir «sin
 *   filtro», así que no se manda. Una campaña sin países ya sale en todas partes, y una
 *   con países solo debe salir a quien eligió uno de ellos.
 * - Un nombre sin slug conocido (el árbol aún no llegó, un tema que ya no existe) no se
 *   manda: un nombre no casa con ninguna campaña, y mandarlo solo ensuciaría la dirección.
 *
 * @param {{temas?: Iterable<string>, geos?: Iterable<string>}} seleccion
 * @param {{topics?: Array<{slug: string, name?: string, name_en?: string}>,
 *   slugPorNombre?: Record<string, string>, geoTop?: string}} taxonomia lo de `useTaxonomy`
 * @returns {{tema: string[], pais: string[]}}
 */
export const contextoDeLaSeleccion = ({ temas, geos } = {}, taxonomia = {}) => {
  const { topics = [], slugPorNombre = {}, geoTop } = taxonomia;

  const slugDeTema = new Map();
  topics.forEach((t) => {
    if (!t?.slug) return;
    [t.name, t.name_en].forEach((nombre) => {
      if (nombre && !slugDeTema.has(nombre)) slugDeTema.set(nombre, t.slug);
    });
  });

  // La raíz se reconoce por su nombre (lo que guarda el filtro) y, por si acaso, por su
  // slug: así «Mundo» no se cuela aunque llegara con otro nombre que también la nombre.
  // Solo las claves propias: el mapa es un objeto, y sin esto un nombre como
  // «constructor» devolvería una función en vez de nada. Con `hasOwnProperty.call` y no
  // `Object.hasOwn`, que no existe en Safari 14 (ver la regla en `eslint.config.js`).
  const lugar = (nombre) =>
    Object.prototype.hasOwnProperty.call(slugPorNombre, nombre) ? slugPorNombre[nombre] : undefined;
  const slugDeLaRaiz = geoTop ? lugar(geoTop) : undefined;

  const aSlugs = (valores, slugDe, descartar = () => false) => {
    const fuera = [];
    for (const nombre of valores ?? []) {
      if (typeof nombre !== "string") continue;
      const slug = slugDe(nombre);
      if (typeof slug === "string" && slug && !descartar(nombre, slug) && !fuera.includes(slug)) {
        fuera.push(slug);
      }
    }
    return fuera;
  };

  return {
    tema: aSlugs(temas, (n) => slugDeTema.get(n)),
    pais: aSlugs(
      geos,
      lugar,
      (n, slug) => n === geoTop || (slugDeLaRaiz !== undefined && slug === slugDeLaRaiz)
    ),
  };
};

/**
 * La declaración de huecos de una vista (`useEspacios`), como texto: la clave con la que
 * el gancho sabe si cambió algo, y lo que se recupera de ella para pedir los anuncios.
 *
 * Un `Set` (la selección del lector en los listados, `useContentFilter`) se escribe como
 * lista. `JSON.stringify` a secas lo deja en `{}`: al recuperarlo ya no era la selección
 * sino un objeto vacío, y la dirección salía con `tema=[object Object]` en /articulos e
 * /informes aunque no hubiera ningún filtro puesto.
 */
export const claveDeEspacios = (espacios, contexto) =>
  JSON.stringify({ espacios, contexto }, (_, v) => (v instanceof Set ? [...v] : v));

/**
 * El contador de recargas de quien mira, para la escalera de publicidad.
 *
 * El servidor reparte los anuncios con una escalera que baja un peldaño por recarga (ver
 * la escalera en `app/domains/publicidad`, en el backend), y la recarga la cuenta el navegador:
 * cada página que se abre suma una. Va en `localStorage` para que siga sumando entre
 * visitas; no identifica a nadie, es un número.
 *
 * Devuelve la recarga **actual** (la primera visita es la 0) y deja preparada la
 * siguiente. Sin almacenamiento (modo privado), siempre 0: el sitio funciona igual, solo
 * que ese lector ve siempre la primera escalera.
 */
const CLAVE = "sureconomics_pub_recarga";

export const siguienteRecarga = () => {
  try {
    const actual = Math.max(0, Number(window.localStorage.getItem(CLAVE)) || 0);
    window.localStorage.setItem(CLAVE, String(actual + 1));
    return actual;
  } catch {
    return 0;
  }
};
