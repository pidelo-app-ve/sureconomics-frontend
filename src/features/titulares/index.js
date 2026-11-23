/**
 * Los titulares en caliente: los que redacta el backend cada 10 minutos a partir de lo
 * que publican otros medios («Última hora»; `app/domains/titulares` en el backend).
 *
 * **Esta es la puerta del sitio.** Lo que el resto del sitio usa de los titulares se
 * importa de aquí (`import { UltimaHoraColumna } from "../features/titulares"`), nunca de
 * los archivos de dentro: así lo de dentro puede cambiar de sitio sin tocar a nadie. Lo
 * vigila `src/arquitectura.test.mjs`. Sale solo lo que alguien usa: la tarjeta (portada,
 * pieza y «no encontrada») y la precarga de la lista (la portada la adelanta).
 *
 * Lo que hay dentro:
 * - `api.js`: lo que el sitio le pide al servidor (la lista y su versión), sin sesión.
 * - `useHeadlines.js`: la lista, al día sin recargar y compartida por la tarjeta y
 *   la sección; `haceCuanto` («Hace 4 min»).
 * - `UltimaHoraColumna.jsx`: la tarjeta «Última hora» de la portada, que
 *   también sale al lado de cada pieza y en la página de «no encontrada».
 * - `UltimaHora.jsx`: la sección `/ultima-hora`.
 * - `utils.js`: cuándo entra en la sección lo nuevo (lógica pura, sin
 *   React ni red, con su prueba al lado).
 * - `titulares.css`: la hoja de la sección y de la nota al pie de la tarjeta. El resto
 *   de la tarjeta (`se-plana__uh-…`) se pinta con la hoja de la portada,
 *   `components/home/primeraPlana.css`.
 * - `admin/`: el panel «Titulares en caliente» (`/admin/titulares`): su página
 *   (`admin/AdminTitulares.jsx`), sus componentes (`admin/components/`), sus llamadas
 *   al servidor (`admin/api.js`) y los nombres del juez (`admin/utils.js`). Hoy no
 *   tiene puerta (`admin/index.js`): su página la carga `routes.jsx` con `import()` y
 *   ninguna otra página del panel usa nada de él. Si alguna llega a necesitarlo, se abre
 *   la puerta como en `features/monedas/admin/index.js`, nunca por esta (el panel
 *   viajaría en el paquete de cada lector).
 * - `guia.js`: los pasos de la guía de ese panel (la guía se arma en
 *   `lib/guias/guiaTitulares.js`).
 *
 * Lo que **no** sale por aquí, a propósito: la sección se carga aparte, cuando hace falta
 * (`routes.jsx` la pide con `import()`); si esta puerta la exportara, viajaría en el
 * paquete de todas las páginas. Los textos siguen en `i18n/<idioma>/titulares.json` (y
 * `titulares.hace…` en `siempre.json`): los diccionarios van por zonas, no por dominio.
 */

export { UltimaHoraColumna } from "./UltimaHoraColumna";
export { precargarTitulares } from "./useHeadlines";
