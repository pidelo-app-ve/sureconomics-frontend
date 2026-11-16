/**
 * La consulta que entra en la canónica. `npm test`.
 */
import { consultaCanonica } from "./canonica.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

check("sin consulta, nada", consultaCanonica("") === "" && consultaCanonica(undefined) === "");
check("el ?v= de compartir no entra", consultaCanonica("?v=tn9n4o") === "");
check("ni el asunto del contacto", consultaCanonica("?asunto=Advertising — formato B") === "");
check("ni las etiquetas de campaña", consultaCanonica("?utm_source=whatsapp&utm_medium=resumen") === "");
check("ni los filtros", consultaCanonica("?ver=podcast") === "");
let r = consultaCanonica("?formato=noticias");
check("el formato sí, porque es otra sección", r === "?formato=noticias", r);
r = consultaCanonica("?v=abc&formato=articulos&utm_source=x");
check("el formato solo, aunque venga mezclado", r === "?formato=articulos", r);
check("un formato vacío no entra", consultaCanonica("?formato=") === "");

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
