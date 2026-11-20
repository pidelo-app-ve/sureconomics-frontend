/**
 * **La puerta del panel** de las monedas: lo que usan las páginas de `/admin`.
 *
 * Va aparte de `../index.js` (la puerta del sitio) a propósito. Vite mete en el paquete
 * de una página todo lo que cuelga de lo que importa, con sus efectos: si el panel
 * saliera por la misma puerta que la tabla de la portada, cada lector se descargaría el
 * panel entero (su guía, sus avisos, sus diálogos) para leer una noticia. Se comprobó al
 * hacer el piloto: +17 kB en el paquete principal.
 *
 * El panel va solo en español: la comprobación de textos (`npm run i18n`) se salta esta
 * carpeta `panel/`, igual que las `admin/` del resto del sitio.
 */
export { MonedasDelPanel } from "./componentes/MonedasDelPanel";
