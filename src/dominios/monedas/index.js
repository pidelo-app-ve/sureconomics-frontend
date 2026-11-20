/**
 * Las monedas de la región: cuánto vale un dólar en cada una, según su banco central
 * (`app/dominios/monedas` en el backend).
 *
 * **Esta es la puerta del sitio.** Lo que el resto del sitio usa de las monedas se
 * importa de aquí (`import { TablaDeMonedas } from "../dominios/monedas"`), nunca de los
 * archivos de dentro: así lo de dentro puede cambiar de sitio sin tocar a nadie. Lo
 * del panel tiene su propia puerta, `panel/index.js` (allí se explica por qué). Lo vigila
 * `src/arquitectura.test.mjs`.
 *
 * Lo que hay dentro:
 * - `servicios/api.js`: lo que el sitio le pide al servidor.
 * - `logica/formato.js`: cómo se escribe una cotización («886,23», «0,8333»).
 * - `ganchos/useMonedas.js`: las cotizaciones, pedidas una vez por visita y compartidas.
 * - `componentes/`: la ficha junto al titular, la tabla de la portada y del lateral, la
 *   apertura con su gráfica, y la gráfica. Cada uno con su hoja de estilos al lado.
 * - `paginas/Monedas.jsx` (y `monedas.css`): la página `/monedas`.
 * - `panel/`: las monedas dentro de «Cinta de mercado» en el panel (`panel/componentes/`),
 *   con sus llamadas al servidor (`panel/servicios/api.js`) y su propia puerta.
 * - `guias/pasosDelPanel.js`: los pasos de la guía que explican ese panel.
 *
 * Lo que **no** sale por aquí, a propósito: la página y la gráfica se cargan aparte, cuando
 * hacen falta (`routes.jsx` y `AperturaMoneda` las piden con `import()`), y si esta puerta
 * las exportara viajarían en el paquete de todas las páginas. Los pasos de la guía los
 * lee la cinta directamente, porque su prueba corre en node y aquí hay JSX.
 */

// Los componentes, en el orden en que entraban sus hojas de estilo (ficha, tabla,
// gráfica): el orden de las hojas en el CSS final no cambia con la mudanza.
export { FichaDeMoneda } from "./componentes/FichaDeMoneda";
export { TablaDeMonedas } from "./componentes/TablaDeMonedas";
export { AperturaMoneda } from "./componentes/AperturaMoneda";
export { pedirCotizaciones, useMonedas } from "./ganchos/useMonedas";
export { CODIGOS_MONEDA, porDolar } from "./logica/formato";
