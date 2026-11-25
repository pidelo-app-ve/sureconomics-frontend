/**
 * El boletín «Entorno en Viñetas»: apuntarse (en la portada, el pie, la invitación y
 * `/entorno`), darse de baja o volver con el enlace de cada correo, y el panel donde la
 * redacción monta cada número y consulta la lista (`app/domains/boletin` en el backend).
 *
 * **Esta es la puerta del sitio.** Lo que el resto del sitio usa del boletín se importa de
 * aquí (`import { NewsletterBlock } from "../features/boletin"`), nunca de los archivos de
 * dentro: así lo de dentro puede cambiar de sitio sin tocar a nadie. Lo vigila
 * `src/arquitectura.test.mjs`. Sale solo lo que alguien usa: el bloque de la portada, la
 * invitación (la monta `pages/Layout.jsx`) y lo que necesita el formulario del pie.
 *
 * Lo que hay dentro:
 * - `api.js`: lo que el sitio le pide al servidor, sin sesión (apuntarse, darse de baja y
 *   volver con el token del enlace).
 * - `utils.js`: cuándo se invita y cuándo no, y la marca de «ya suscrito» (reglas sin
 *   React ni DOM).
 * - `NewsletterBlock.jsx`: el bloque «Entorno en Viñetas» de la portada.
 * - `InvitacionAlBoletin.jsx`: la invitación que sale a quien ya está leyendo; su ventana
 *   (`InvitacionAlBoletinAbierta.jsx`) se descarga solo cuando toca abrirla.
 * - Las páginas `/suscribirse` (`Subscribe.jsx`), `/boletin/baja` (`BoletinBaja.jsx`) y
 *   `/entorno` (`Entorno.jsx`, la puerta desde Instagram): las carga `routes.jsx` con
 *   `import()`, no salen por aquí.
 * - `admin/`: el panel. Los números del boletín (`/admin/boletin/numeros`,
 *   `admin/AdminBoletin.jsx`) y la lista de suscriptores (`/admin/boletin`,
 *   `admin/AdminNewsletterList.jsx`), con sus piezas (`admin/components/`), sus llamadas al
 *   servidor (`admin/api.js`: los números, la lista y su CSV) y las fechas y estados de un
 *   número (`admin/utils.js`). No tiene puerta (`admin/index.js`): `routes.jsx` carga sus
 *   páginas con `import()` y ninguna otra página del panel usa nada de él. Si alguna llega
 *   a necesitarlo, se abre como en `features/monedas/admin/index.js`, nunca por esta (el
 *   panel viajaría en el paquete de cada lector).
 * - `guia.js`: los pasos de las dos guías del panel (números y suscriptores; se arman en
 *   `lib/guias/guiaBoletin.js` y `lib/guias/guiaSuscriptores.js`).
 *
 * Lo que **no** está aquí, a propósito: los estilos (`.se-newsletter…` y `.se-entorno…`,
 * en `styles/blog.css`; los de `.se-invitacion…` sí, en `invitacionAlBoletin.css`, que
 * baja con la ventana abierta; `/suscribirse` y `/entorno` importan además
 * `styles/institucional.css`, que comparten con otras páginas: moverlos cambiaría el
 * orden del CSS construido) y los textos (`i18n/<idioma>/boletin.json`: los diccionarios
 * van por zonas). La medición del alta va por la fachada `lib/analitica.js` (ver
 * `FACHADAS` en `src/arquitectura.test.mjs`).
 */

export { NewsletterBlock } from "./NewsletterBlock";
export { InvitacionAlBoletin } from "./InvitacionAlBoletin";
export { subscribeToNewsletter } from "./api";
export { marcarSuscrito } from "./utils";
