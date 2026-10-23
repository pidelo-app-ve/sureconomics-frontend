/**
 * Cómo viajan los filtros de tema y país al pedir los anuncios. `npm run test:publicidad`.
 */
import { listaDeQuery } from "../lib/listaDeQuery.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

console.log("la selección del lector (un Set, como la deja useContentFilter)");
check("dos temas elegidos", listaDeQuery(new Set(["mercados", "energia"])) === "mercados,energia");
check("un país", listaDeQuery(new Set(["venezuela"])) === "venezuela");
check("nada elegido: no se manda el filtro", listaDeQuery(new Set()) === null);

console.log("lo que ya aceptaba");
check("una lista", listaDeQuery(["a", "b"]) === "a,b");
check("un texto suelto", listaDeQuery("a") === "a");
check("vacíos fuera", listaDeQuery(["", " ", "x"]) === "x");
check("nulo", listaDeQuery(null) === null);

console.log("lo que fallaba");
check("ningún valor se escribe como [object Object]", !String(listaDeQuery(new Set(["x"]))).includes("object"));

console.log(fallos ? `\n${fallos} fallo(s)` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
