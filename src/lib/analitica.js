/**
 * **Fachada.** La medición de audiencia vive ahora en `features/analitica` (ADR-001,
 * nov-2026): el envío y el consentimiento, en `features/analitica/services/medicion.js`,
 * con la explicación entera. Esto reexporta lo de siempre para quien aún lo importa de
 * aquí, por dos motivos:
 * - la barra de la publicidad (`components/publicidad/BarraPublicitaria.jsx`), que otra
 *   rama está mudando y aquí no se toca;
 * - la invitación al boletín, la vista previa (`hooks/useVistaPrevia.js`) y el servicio del
 *   boletín: entrar por la puerta los pone antes que el aviso en el paquete principal, y
 *   Vite reordena sus módulos (`index-*.js`: mismo tamaño y mismo CSS, otro orden y otros
 *   nombres cortos). Por la fachada, el `dist/` sale idéntico byte a byte a antes de la
 *   mudanza.
 * Código nuevo: `import { consentimiento } from "../features/analitica"`. Se borra cuando
 * nadie la use.
 */
export * from "../features/analitica/services/medicion.js";
