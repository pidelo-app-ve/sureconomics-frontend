/**
 * Cuál pieza abre la portada y qué foto suya hay que pedir primero.
 *
 * Vivía en `components/home/PrimeraPlana.jsx`. Salió aquí (auditoría 17-nov-2026, tanda 3)
 * porque ahora lo usan dos sitios que tienen que decir exactamente lo mismo:
 *  - la portada en el navegador (`PrimeraPlana`, `Home`, `usePieces`);
 *  - `api/portada.js`, que sirve el HTML de `/` y `/en` y pone en su `<head>` la precarga
 *    de esa foto, para que el teléfono la empiece a bajar antes que el JavaScript.
 * Si los dos eligieran distinto, el navegador bajaría una foto que nadie pinta.
 *
 * Solo importaciones con extensión y sin dependencias de React ni de Vite: Node lo carga
 * tal cual (`npm test` lo nota si no, porque carga `api/portada.js`).
 */
import { enlaceWeb } from "./enlaces.js";
import { ANCHOS_DE_TARJETA, imagenAncho, imagenSrcSet } from "./fotoDePieza.js";
import { esShort } from "./youtube.js";

/** Cuántas noticias acompañan a la principal bajo ella. */
export const EN_LA_COLUMNA = 3;

/** El `sizes` de la foto de la apertura: todo el ancho en el teléfono, media página en escritorio. */
export const SIZES_PRINCIPAL = "(max-width: 959px) 100vw, 50vw";

/** El ancho que se pide sin `srcset` (y el `src` de la `<img>`, ver `CardMedia`). */
const ANCHO_PRINCIPAL = 1200;

/**
 * Si una pieza está fijada **ahora**. La fecha se vuelve a mirar aquí porque una lista
 * servida desde caché puede traer un «sí» de hace horas.
 */
const fijadaAhora = (p, ahora) =>
  Boolean(p?.enPortada) && p.destacadaHasta instanceof Date && p.destacadaHasta.getTime() > ahora;

const msDe = (p) => Date.parse(p?.fechaIso ?? "") || 0;

/**
 * La principal y las que van bajo ella. `piezas` es la lista entera, de todos los
 * formatos y ordenada por fecha: ahí se busca la fijada.
 *
 * **Cuál manda.** La redacción puede fijarla desde el editor («Abrir la portada con
 * esta pieza»), de cualquier formato, mientras no venza `destacada_hasta`. Sin nada
 * fijado se elige entre las noticias: la más reciente, salvo que entre las tres
 * últimas haya una con foto y ella no; una apertura con imagen se lee como apertura.
 */
export const elegirApertura = (piezas, noticias = null, ahora = Date.now()) => {
  const todas = piezas ?? [];
  const delDia = noticias ?? todas.filter((p) => p.formatoApi === "noticia");

  // Con más de una fijada (restos de una lista cosida de varias páginas) manda la más reciente.
  const fijada = todas
    .filter((p) => fijadaAhora(p, ahora))
    .sort((a, b) => msDe(b) - msDe(a))[0];

  if (fijada) {
    const secundarias = delDia.filter((n) => n.id !== fijada.id).slice(0, EN_LA_COLUMNA);
    return { principal: fijada, secundarias, fijada: true };
  }

  if (!delDia.length) return { principal: null, secundarias: [], fijada: false };
  const conFoto = delDia.slice(0, 3).find((n) => n.imagenUrl);
  const principal = delDia[0].imagenUrl ? delDia[0] : conFoto ?? delDia[0];
  const secundarias = delDia.filter((n) => n.id !== principal.id).slice(0, EN_LA_COLUMNA);
  return { principal, secundarias, fijada: false };
};

/** Un ISO de la API -> `Date`, o nulo si no hay nada o no se puede leer. */
const fechaValida = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Una fila de la API con solo lo que `elegirApertura` y `precargaDeLaApertura` leen, con
 * los mismos nombres y la misma conversión que `piezaFromApi` (`lib/pieza.js`). Para
 * `api/portada.js`, que no puede cargar aquella: arrastra el motor de idiomas.
 */
export const paraLaApertura = (row) => ({
  id: String(row?.id ?? ""),
  formatoApi: row?.format ?? "",
  fechaIso: row?.published_at ?? null,
  imagenUrl: enlaceWeb(row?.image_asset?.url) || enlaceWeb(row?.featured_image_url),
  imagenAnchoOriginal: row?.image_asset?.width ?? null,
  videoUrl: enlaceWeb(row?.video_asset?.url),
  destacadaHasta: fechaValida(row?.destacada_hasta),
  enPortada: Boolean(row?.en_portada),
});

/**
 * La precarga de la foto de la apertura: los atributos del `<link rel="preload" as="image">`,
 * o nulo si no hay foto que pedir (sin foto, o abre con un short: ante la duda, nada).
 *
 * Con el mismo `srcset` y `sizes` que pinta `CardMedia` en la apertura, así que el
 * navegador elige la misma talla y la `<img>` la encuentra ya pedida.
 *
 * Sin `href` cuando hay `srcset`, a propósito: un navegador que no entiende
 * `imagesrcset` se salta la precarga entera, en vez de bajar la talla grande y luego otra
 * para la `<img>`.
 */
export const precargaDeLaApertura = (principal) => {
  if (!principal?.imagenUrl || esShort(principal.videoUrl)) return null;
  const href = imagenAncho(principal.imagenUrl, ANCHO_PRINCIPAL);
  const srcset = imagenSrcSet(principal.imagenUrl, ANCHOS_DE_TARJETA, principal.imagenAnchoOriginal);
  return srcset ? { clave: href, imagesrcset: srcset, imagesizes: SIZES_PRINCIPAL } : { clave: href, href };
};
