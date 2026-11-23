/**
 * Las monedas de la región: cuánto vale un dólar en cada una, según su banco central
 * (`app/domains/monedas` en el backend).
 *
 * **Esta es la puerta del sitio.** Lo que el resto del sitio usa de las monedas se
 * importa de aquí (`import { TablaDeMonedas } from "../features/monedas"`), nunca de los
 * archivos de dentro: así lo de dentro puede cambiar de sitio sin tocar a nadie. Lo
 * del panel tiene su propia puerta, `admin/index.js` (allí se explica por qué). Lo vigila
 * `src/arquitectura.test.mjs`.
 *
 * Lo que hay dentro:
 * - `api.js`: lo que el sitio le pide al servidor.
 * - `utils.js`: cómo se escribe una cotización («886,23», «0,8333») y qué monedas hay.
 * - `useMonedas.js`: las cotizaciones, pedidas una vez por visita y compartidas.
 * - `components/`: la ficha junto al titular, la tabla de la portada y del lateral, la
 *   apertura con su gráfica, y la gráfica. Cada uno con su hoja de estilos al lado.
 * - `pages/Monedas.jsx` (y `monedas.css`): la página `/monedas`.
 * - `admin/`: las monedas dentro de «Cinta de mercado» en el panel
 *   (`admin/MonedasDelPanel.jsx`), con sus llamadas al servidor (`admin/api.js`) y su
 *   propia puerta (`admin/index.js`).
 * - `guia.js`: los pasos de la guía que explican ese panel.
 *
 * Lo que **no** sale por aquí, a propósito: la página y la gráfica se cargan aparte, cuando
 * hacen falta (`routes.jsx` y `AperturaMoneda` las piden con `import()`), y si esta puerta
 * las exportara viajarían en el paquete de todas las páginas. Los pasos de la guía los
 * lee la cinta directamente, porque su prueba corre en node y aquí hay JSX.
 */

// Los componentes, en el orden en que entraban sus hojas de estilo (ficha, tabla,
// gráfica): el orden de las hojas en el CSS final no cambia con la mudanza.
export { FichaDeMoneda } from "./components/FichaDeMoneda";
export { TablaDeMonedas } from "./components/TablaDeMonedas";
export { AperturaMoneda } from "./components/AperturaMoneda";
export { pedirCotizaciones, useMonedas } from "./useMonedas";
export { CODIGOS_MONEDA, porDolar } from "./utils";
