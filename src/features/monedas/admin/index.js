/**
 * **La puerta del panel** de las monedas: lo que usan las páginas de `/admin`.
 *
 * Va aparte de `../index.js` (la puerta del sitio) a propósito. Vite mete en el paquete
 * de una página todo lo que cuelga de lo que importa, con sus efectos: si el panel
 * saliera por la misma puerta que la tabla de la portada, cada lector se descargaría el
 * panel entero (su guía, sus avisos, sus diálogos) para leer una noticia. Se comprobó al
 * hacer el piloto: +17 kB en el paquete principal.
 *
 * La carpeta se llama `admin/`, como las del panel en el resto del sitio: el panel va solo
 * en español, y la comprobación de textos (`npm run i18n`) se salta las carpetas `admin`.
 */
export { MonedasDelPanel } from "./MonedasDelPanel";
