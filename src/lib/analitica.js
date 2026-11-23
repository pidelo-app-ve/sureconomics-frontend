/**
 * **Fachada** de la medición de audiencia, que vive en `features/analitica` (el envío y
 * el consentimiento, en `features/analitica/medicion.js`, con la explicación entera).
 *
 * La usan tres que no pueden entrar por la puerta sin cambiar el JS construido: la vista
 * previa (`hooks/useVistaPrevia.js`), el servicio del boletín
 * (`services/newsletterService.js`) y la barra de la publicidad
 * (`features/publicidad/components/BarraPublicitaria.jsx`). Los tres se cargan antes que
 * el aviso de cookies; por la puerta, la medición y el aviso entrarían antes en el
 * paquete principal y Vite reordenaría sus módulos (`index-*.js`: mismo CSS, otro orden
 * y otros nombres cortos). Comprobado uno a uno.
 *
 * Código nuevo: `import { consentimiento } from "../features/analitica"`. Se borra cuando
 * se acepte ese cambio de orden (es inofensivo: mismo código) o nadie la use.
 */
export { EVENTO_CONSENTIMIENTO, avisoPendiente, consentimiento, registrarAlta } from "../features/analitica/medicion.js";
