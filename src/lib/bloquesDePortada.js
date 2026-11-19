/**
 * Qué pieza va en cada sitio de la portada (`pages/Home.jsx`), sin pintar nada: la
 * primera plana (la que manda, los análisis y la editorial del día) y los bloques de
 * debajo, sección por sección, con lo que trae cada «Cargar más». Sin React, para poder
 * probarlo (`bloquesDePortada.test.mjs`).
 *
 * Cuántas piezas enseña cada sección al cargar (`PREVIEW`, `AL_PUNTO`,
 * `ANALISIS_EN_PLANA`) vive en `lib/apertura.js`, porque `api/portada.js` mete en el HTML
 * exactamente esas, y no otra cuenta copiada.
 */
import { AL_PUNTO, ANALISIS_EN_PLANA, PREVIEW, elegirApertura } from "./apertura";
import { FORMATO_META } from "./pieza";
import { enTandas } from "./tandas";

/**
 * Cuántas trae cada «Cargar más», por sección: una fila más de la rejilla de cada una
 * (diez noticias son cinco por columna).
 */
export const PASO = {
  noticia: 10,
  articulo: 4,
  editorial: 4,
  entrevista: 3,
  informe: 4,
  podcast: 3,
  alpunto: 4,
};

/**
 * La primera plana.
 *
 * La apertura: la pieza que manda y su columna. Sale de la lista sin filtrar; pero con
 * un filtro puesto se retira, porque entonces el lector está buscando y lo que pide es
 * lo que coincide, no la portada del día. Se le pasa la lista entera y no sólo las
 * noticias: la redacción puede fijar como apertura una pieza de cualquier formato
 * (`enPortada`), y `elegirApertura` la busca entre todas.
 *
 * Los análisis de la columna de opinión: los artículos más recientes que no están ya
 * arriba. Solo sin filtro, como la primera plana entera.
 *
 * La editorial más reciente, para la columna de opinión. Si es la que está fijada como
 * principal, pasa a la siguiente: la misma pieza dos veces en la primera pantalla no es
 * énfasis, es un error.
 */
export const primeraPlanaDe = (pieces, isFiltered) => {
  const apertura = isFiltered
    ? { principal: null, secundarias: [], fijada: false }
    : elegirApertura(pieces);
  const enApertura = new Set(
    [apertura.principal, ...apertura.secundarias].filter(Boolean).map((p) => p.id)
  );
  const analisis = isFiltered
    ? []
    : pieces.filter((p) => p.formatoApi === "articulo" && !enApertura.has(p.id)).slice(0, ANALISIS_EN_PLANA);
  const enOpinion = new Set(analisis.map((p) => p.id));
  const editorialDelDia =
    pieces.find((p) => p.formatoApi === "editorial" && !enApertura.has(p.id)) ?? null;
  return { apertura, enApertura, analisis, enOpinion, editorialDelDia };
};

/**
 * Los bloques de debajo de la primera plana, en el orden de `FORMATO_META`, con «Al
 * punto» (entrevistas y podcast juntos) en el sitio de la primera de las dos.
 *
 * `results` es la lista ya filtrada (sin filtro, todas); `cargadas`, lo que el lector
 * pidió de más en cada sección con «Cargar más». Cada bloque trae `items` (lo que se
 * ve), `tandas` (la entrada y cada «Cargar más», que se pintan aparte), `todos` (lo que
 * se puede ir cargando), `total` (la cifra de «Ver los N») y `expandido`.
 */
export const bloquesDePortada = ({ results, enApertura, enOpinion, editorialDelDia, isFiltered, cargadas }) =>
  Object.keys(FORMATO_META)
    .map((formatoApi) => {
      const all = results.filter((p) => p.formatoApi === formatoApi);

      // La editorial del dia ya esta puesta arriba, a lo ancho y con su propio
      // encabezado. Sin quitarla de aqui salia otra vez en la primera tarjeta del
      // bloque -- las dos son "la mas reciente", asi que la repeticion era segura, no
      // casual. Se quita tambien cuando hay filtro, porque el bloque de arriba se pinta
      // igual: esta en pantalla de las dos maneras.
      // Lo mismo con lo que está en la apertura: ya está arriba, en grande. Se mira en
      // todos los formatos y no sólo en noticias, porque la pieza fijada puede ser una
      // entrevista o un informe, y sin esto abriría también su propio bloque.
      // Y los análisis de la columna de opinión de arriba, por lo mismo.
      const sinApertura = all.filter((p) => !enApertura.has(p.id) && !enOpinion.has(p.id));
      const visibles =
        formatoApi === "editorial" && editorialDelDia && !isFiltered
          ? sinApertura.filter((p) => p.id !== editorialDelDia.id)
          : sinApertura;

      // `total` cuenta `all` y no `visibles`: es la cifra del enlace "Ver los N", y la
      // editorial de arriba tambien esta en esa lista. Restarla ahi seria mentir sobre
      // cuantas hay. `todos` son las que se pueden ir cargando; el recorte, abajo.
      return { formatoApi, todos: visibles, total: all.length };
    })
    .filter((b) => b.todos.length > 0)
    .reduce((acc, b) => {
      if (isFiltered || !AL_PUNTO.formatos.includes(b.formatoApi)) return [...acc, b];
      const previo = acc.find((x) => x.formatoApi === "alpunto");
      if (previo) {
        // Intercaladas y no por fecha: por fecha salían tres episodios de podcast y
        // ninguna entrevista, y la sección se llama «Al punto» por las dos.
        const [x, y] = [previo.todos, b.todos];
        const mezcla = [];
        for (let k = 0; k < Math.max(x.length, y.length); k += 1) {
          if (x[k]) mezcla.push(x[k]);
          if (y[k]) mezcla.push(y[k]);
        }
        previo.todos = mezcla;
        previo.total += b.total;
        return acc;
      }
      return [...acc, { formatoApi: "alpunto", todos: b.todos, total: b.total }];
    }, [])
    // Lo que se ve: con filtro, todo (son resultados); sin él, la entrada de cada sección
    // y lo que el lector haya pedido con «Cargar más».
    .map((b) => {
      const entrada = b.formatoApi === "alpunto" ? AL_PUNTO.cuantas : PREVIEW[b.formatoApi];
      const cuantas = isFiltered ? b.todos.length : entrada + (cargadas[b.formatoApi] ?? 0);
      const items = b.todos.slice(0, cuantas);
      // Con filtro es una sola tanda (son resultados); sin él, la entrada y lo cargado.
      const tandas = isFiltered ? [items] : enTandas(items, entrada, PASO[b.formatoApi]);
      return { ...b, items, tandas, expandido: Boolean(cargadas[b.formatoApi]) };
    });

/**
 * Qué pieza de su ciclo lleva el anuncio de cada tanda nueva. Por hueco y en el orden
 * de la página: la 0 la enseña el hueco de siempre, y dos secciones que comparten
 * hueco no repiten pieza entre ellas. `espacioDe(formatoApi)` dice de qué hueco salen
 * los anuncios de cada sección.
 */
export const anunciosDeTanda = (blocks, espacioDe) => {
  const siguienteDe = {};
  return Object.fromEntries(
    blocks.map((b) => {
      const espacio = espacioDe(b.formatoApi);
      const desdes = b.tandas.slice(1).map(() => {
        siguienteDe[espacio] = (siguienteDe[espacio] ?? 0) + 1;
        return siguienteDe[espacio];
      });
      return [b.formatoApi, { espacio, desdes }];
    })
  );
};
