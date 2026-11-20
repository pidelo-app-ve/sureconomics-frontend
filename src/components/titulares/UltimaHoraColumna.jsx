/**
 * **Fachada.** La tarjeta «Última hora» vive ahora en `features/titulares` (ADR-001,
 * nov-2026). Esto reexporta lo de siempre para quien aún la importa de aquí (la pieza,
 * `pages/Pieza.jsx`, que otra rama está probando y no se toca en la mudanza). Código
 * nuevo: `import { UltimaHoraColumna } from "../features/titulares"`. Se borra cuando
 * nadie la use.
 */
export { UltimaHoraColumna } from "../../features/titulares/componentes/UltimaHoraColumna.jsx";
