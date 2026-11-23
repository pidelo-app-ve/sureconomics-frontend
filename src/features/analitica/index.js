/**
 * La medición de audiencia propia: el aviso de cookies, el envío de lo que se mide y el
 * panel «Audiencia» (`app/domains/analitica` en el backend).
 *
 * Solo cuenta a quien acepta el aviso, y sin nada que identifique fuera de este sitio:
 * dos identificadores que se inventa el navegador, la ruta, los segundos visibles y, una
 * vez por visita, por dónde llegó (una palabra, no una dirección). Antes de contestar, y
 * a quien dice que no, solo se le suma una página a un contador sin identificador. Ver
 * `medicion.js`.
 *
 * **Esta es la puerta del sitio.** Lo que el resto del sitio usa de la medición se importa
 * de aquí (`import { AvisoDeCookies } from "../features/analitica"`), nunca de los archivos
 * de dentro. Lo vigila `src/arquitectura.test.mjs`.
 *
 * Lo que hay dentro:
 * - `medicion.js`: las cookies, el consentimiento y el envío de eventos al servidor.
 * - `utils.js`: de dónde se llegó y con qué aparato, en cuentas puras (con prueba).
 * - `AvisoDeCookies.jsx`: la barra del aviso, que además enciende la medición.
 * - `Cookies.jsx`: la página `/cookies`, con el interruptor de verdad.
 * - `admin/`: el panel «Audiencia» (`admin/AdminAnalitica.jsx`, con sus bloques en
 *   `admin/components/`, sus llamadas en `admin/api.js` y sus cuentas en
 *   `admin/utils.js`). Entra por el `lazy` de `routes.jsx`: no necesita puerta.
 * - `guia.js`: los pasos de la guía de ese panel (la guía se arma en
 *   `lib/guias/guiaAudiencia.js`).
 *
 * Lo que **no** sale por aquí, a propósito: la página `/cookies` y el panel se cargan aparte
 * (`routes.jsx` los pide con `import()`); por esta puerta viajarían en el paquete de todas
 * las páginas.
 *
 * Fuera, y compartido con la publicidad: `lib/lotesDeEnvio.js` (cómo se trocean los envíos y
 * cuándo sobra el latido), que usan tanto `medicion.js` como `features/publicidad/envioDeVistos.js`.
 */

export { AvisoDeCookies } from "./AvisoDeCookies";
export { EVENTO_CONSENTIMIENTO, avisoPendiente, consentimiento, registrarAlta } from "./medicion";
