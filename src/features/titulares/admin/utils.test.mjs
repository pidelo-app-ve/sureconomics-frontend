/**
 * Los filtros y las páginas del panel «Titulares». `npm run test:titulares-panel`.
 */
import {
  FILTROS_INICIALES,
  consultaDeTitulares,
  filtrarFuentes,
  hayFiltros,
  lineaDePaginas,
  nombreDeCategoria,
  trozoDeLista,
} from "./utils.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log("lo que se pide al servidor");
let c = consultaDeTitulares({ vista: "publicados" });
check("sin filtros: vista, página 1, 20 por página y 24 horas", igual(c, { vista: "publicados", pagina: 1, por_pagina: 20, horas: 24 }), c);
c = consultaDeTitulares({
  vista: "borrados",
  pagina: 3,
  filtros: { ...FILTROS_INICIALES, buscar: "  selic  ", pais: "VE", categoria: "economia", horas: 72, solo: "editados", nivel: "4" },
});
check(
  "con filtros: viajan los puestos, el texto sin espacios de más",
  igual(c, { vista: "borrados", pagina: 3, por_pagina: 20, horas: 72, buscar: "selic", pais: "VE", categoria: "economia", solo: "editados", nivel: "4" }),
  c,
);
c = consultaDeTitulares({ vista: "publicados", filtros: { ...FILTROS_INICIALES, buscar: "    " } });
check("un buscador con solo espacios no viaja", !("buscar" in c), c);
c = consultaDeTitulares({ vista: "publicados", filtros: { ...FILTROS_INICIALES, horas: "x" } });
check("unas horas raras vuelven a 24", c.horas === 24, c);

console.log("si hay filtros puestos");
check("los iniciales no son filtros", hayFiltros(FILTROS_INICIALES) === false);
check("espacios en el buscador no cuentan", hayFiltros({ ...FILTROS_INICIALES, buscar: "   " }) === false);
check("un país sí", hayFiltros({ ...FILTROS_INICIALES, pais: "VE" }) === true);
check("48 horas sí", hayFiltros({ ...FILTROS_INICIALES, horas: 48 }) === true);
check("nada es no", hayFiltros(undefined) === false);

console.log("la línea de las páginas");
check("como en Contenido", lineaDePaginas({ pagina: 2, paginas: 5, total: 87 }) === "Página 2 de 5 — 87 en total", lineaDePaginas({ pagina: 2, paginas: 5, total: 87 }));
check("sin nada no dice «de 0»", lineaDePaginas({ pagina: 1, paginas: 0, total: 0 }) === "Página 1 de 1 — 0 en total");

console.log("nombres");
check("una categoría con tilde", nombreDeCategoria("economia") === "Economía");
check("una nueva, tal cual", nombreDeCategoria("deportes") === "deportes");
check("ninguna, un guion", nombreDeCategoria(null) === "—");

console.log("los medios");
const fuentes = [
  { id: "efe", nombre: "EFE", nivel: 2, silenciada: false },
  { id: "un", nombre: "Últimas Noticias", nivel: 3, silenciada: false },
  { id: "x", nombre: "Medio X", nivel: 4, silenciada: true, nueva: true },
  { id: "y", nombre: "Medio Y", nivel: 4, silenciada: true },
];
const ids = (l) => l.map((f) => f.id).join();
check("sin filtros: todos, los nuevos arriba", ids(filtrarFuentes(fuentes)) === "x,efe,un,y", ids(filtrarFuentes(fuentes)));
check("buscar sin tildes ni mayúsculas", ids(filtrarFuentes(fuentes, { buscar: "  ULTIMAS " })) === "un");
check("buscar con espacios de más", ids(filtrarFuentes(fuentes, { buscar: "ultimas   noticias" })) === "un");
check("por estado: silenciados (no los nuevos)", ids(filtrarFuentes(fuentes, { estado: "silenciadas" })) === "y");
check("por estado: los que cuentan", ids(filtrarFuentes(fuentes, { estado: "cuentan" })) === "efe,un");
check("por nivel", ids(filtrarFuentes(fuentes, { nivel: "4" })) === "x,y");
check("un estado desconocido es todos", filtrarFuentes(fuentes, { estado: "raro" }).length === 4);
check("sin lista, vacío", igual(filtrarFuentes(null), []));

console.log("el trozo de una lista");
const sesenta = Array.from({ length: 60 }, (_, i) => i);
let t = trozoDeLista(sesenta, 2, 25);
check("la página 2 de 25 en 25", t.pagina === 2 && t.paginas === 3 && t.filas[0] === 25 && t.filas.length === 25, t.filas.length);
t = trozoDeLista(sesenta, 99, 25);
check("una página que ya no existe da la última", t.pagina === 3 && t.filas.length === 10, t.pagina);
t = trozoDeLista([], 4, 25);
check("vacía: página 1 de 1", t.pagina === 1 && t.paginas === 1 && t.filas.length === 0);

if (fallos) {
  console.error(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
