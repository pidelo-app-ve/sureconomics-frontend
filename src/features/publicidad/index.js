/**
 * La publicidad del sitio: los huecos de anuncios de cada página, la barra fija de abajo,
 * el «Patrocinado por» de los juegos y la LVBP, y el envío de lo que se vio (lo que se
 * factura). Quién sale en cada hueco lo decide el servidor (`app/domains/publicidad` en el
 * backend); aquí solo se pide, se pinta, se rota y se avisa.
 *
 * **Esta es la puerta del sitio.** Lo que el resto del sitio usa de la publicidad se
 * importa de aquí (`import { EspacioPublicitario } from "../features/publicidad"`), nunca
 * de los archivos de dentro: así lo de dentro puede cambiar de sitio sin tocar a nadie. Lo
 * vigila `src/arquitectura.test.mjs`.
 *
 * Lo que hay dentro:
 * - `api.js`: lo que el sitio le pide al servidor (los anuncios de una página,
 *   el enlace del clic y el aviso de «visto») y las claves de los huecos (`ESPACIOS`).
 * - `components/ProveedorDePublicidad.jsx`: pide los huecos de la página una vez y los
 *   reparte (`useEspacios`, `useHueco`).
 * - `components/EspacioPublicitario.jsx`: el hueco que pinta las piezas (tarjeta, banner,
 *   tira, rail…), la fila entre tandas y si una página tiene anuncio (`useHayAnuncio`).
 * - `components/BarraPublicitaria.jsx` y `components/PatrocinioCompacto.jsx`: la barra
 *   fija de abajo y el «Patrocinado por» de una línea.
 * - `useRotacion.js`: el carrusel de cada hueco y el aviso de cada pieza vista.
 * - Lógica sin React ni red, con sus pruebas al lado: cómo salen las vistas en lotes
 *   (`envioDeVistos.js`, `npm run test:lotes`); el contador de recargas y los filtros en
 *   la dirección, por slug (`utils.js`, `npm run test:publicidad`); y cómo reconocer los artes de
 *   teléfono que armaba el panel, ya retirados (`arteTelefono.js`).
 * - `admin/`: el panel «Publicidad» (`/admin/publicidad`): su página (`admin/AdminPublicidad.jsx`), las
 *   tarjetas de anunciantes y campañas, el asistente, el mural, las plazas fijas y el mapa
 *   del sitio (`admin/components/`), sus llamadas (`admin/api.js`), los
 *   formatos y el tope de peso del arte (`admin/utils.js`), el arte que pesa de más aligerado antes de subirlo (`admin/aligerarArte.js`, con el convertidor de todo el panel, `components/admin/aligerarImagen.js`) y los artes hechos solos (`admin/arteAutomatico.js`). No tiene puerta (`admin/index.js`): `routes.jsx` carga su
 *   página con `import()` y ninguna otra página del panel usa nada de él. Si alguna llega
 *   a necesitarlo, se abre como en `features/monedas/admin/index.js`, nunca por esta (el
 *   panel viajaría en el paquete de cada lector).
 * - `guia.js`: los pasos de la guía del panel (la guía se arma en
 *   `lib/guias/guiaPublicidad.js`).
 *
 * Lo que **no** está aquí, a propósito: `lib/lotesDeEnvio.js` (lo usan también las
 * medidas de audiencia), los estilos de los huecos (`.se-ad…`, en `styles/blog.css` y
 * `components/barraInferior.css`: moverlos cambiaría el orden del CSS construido) y los
 * textos (`i18n/<idioma>/publicidad.json`: los diccionarios van por zonas).
 */

export { BarraPublicitaria } from "./components/BarraPublicitaria";
export {
  AnuncioEntreTandas,
  EspacioPublicitario,
  FilaDeAnuncio,
  useHayAnuncio,
} from "./components/EspacioPublicitario";
export { PatrocinioCompacto } from "./components/PatrocinioCompacto";
export {
  ESPACIOS_DE_SITIO,
  ProveedorDePublicidad,
  useEspacios,
  useHueco,
} from "./components/ProveedorDePublicidad";
export { ESPACIOS } from "./api";
export { contextoDeLaSeleccion } from "./utils";
