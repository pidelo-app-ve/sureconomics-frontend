/**
 * Cómo viajan los filtros de tema y país al pedir los anuncios. `npm run test:publicidad`.
 */
import { claveDeEspacios, listaDeQuery } from "./utils.js";

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

check("un objeto (un Set que se volvió {} por el camino) no se manda", listaDeQuery({}) === null);
check("ni dentro de una lista", listaDeQuery([{}, "x"]) === "x");

console.log("la declaración de huecos (useEspacios) ida y vuelta por su clave");
const vuelta = (contexto) => JSON.parse(claveDeEspacios(["barra-inferior"], contexto)).contexto;
const sinFiltro = vuelta({ seccion: "articulo", tema: new Set(), pais: new Set() });
check("sin filtro: los Set vacíos vuelven como listas vacías", Array.isArray(sinFiltro.tema) && sinFiltro.tema.length === 0, sinFiltro);
check("sin filtro: no se manda tema ni país", listaDeQuery(sinFiltro.tema) === null && listaDeQuery(sinFiltro.pais) === null);
const conFiltro = vuelta({ tema: new Set(["mercados", "energia"]), pais: new Set(["venezuela"]) });
check("con filtro: los temas elegidos", listaDeQuery(conFiltro.tema) === "mercados,energia", conFiltro);
check("con filtro: el país elegido", listaDeQuery(conFiltro.pais) === "venezuela", conFiltro);
check("las listas pasan igual", JSON.stringify(vuelta({ tema: ["a"] })) === JSON.stringify({ tema: ["a"] }));
check(
  "la misma selección da la misma clave (no pide otra vez en cada render)",
  claveDeEspacios(["x"], { tema: new Set(["a"]) }) === claveDeEspacios(["x"], { tema: new Set(["a"]) })
);

console.log(fallos ? `\n${fallos} fallo(s)` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
