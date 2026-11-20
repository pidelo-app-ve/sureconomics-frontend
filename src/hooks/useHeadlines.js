/**
 * **Fachada.** Los titulares en caliente viven ahora en `features/titulares` (ADR-001,
 * nov-2026). Queda por una sola razón: `components/home/LugarYFecha.jsx` usa
 * `haceCuanto` («Hace 4 min») y no puede tomarlo de la puerta (`features/titulares`)
 * sin cambiar el CSS de la portada. La puerta trae también la tarjeta «Última hora» con
 * su hoja de estilos; LugarYFecha se carga antes que ella en la primera plana, así que
 * la hoja de titulares entraría antes en el CSS del sitio (comprobado al mudarlo: el
 * `index-*.css` construido cambia de orden). Por eso `haceCuanto` tampoco sale por la
 * puerta: nadie lo tomaría de allí.
 *
 * Se borra cuando `haceCuanto` (que no es solo de los titulares: la portada lo usa para
 * la fecha de cada pieza) se mude a un sitio compartido, o cuando la portada pueda
 * importar la puerta sin que cambie el orden de sus hojas.
 */
export { haceCuanto } from "../features/titulares/hooks/useHeadlines.js";
