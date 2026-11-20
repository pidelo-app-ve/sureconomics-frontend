/**
 * **Fachada.** Las monedas viven ahora en `features/monedas` (ADR-001, piloto de
 * nov-2026). Esto reexporta lo de siempre para quien aún lo importa de aquí (el editor
 * de piezas). Código nuevo: `import { porDolar } from "../features/monedas"`. Se borra
 * cuando nadie la use.
 */
export { CODIGOS_MONEDA, porDolar } from "../features/monedas/utils/formato.js";
