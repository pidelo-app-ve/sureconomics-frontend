/**
 * Cómo viajan los filtros de tema y país al pedir los anuncios. `npm run test:publicidad`.
 */
import { claveDeEspacios, contextoDeLaSeleccion, listaDeQuery } from "./utils.js";

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

// Lo que manda un listado (`contextoDeLaSeleccion`): slugs, como una pieza. Una muestra
// de la taxonomía real de producción (/topics y /places, 25-nov-2026). `name_en` hoy no
// está puesto en ninguno; aquí se pone en uno para probar /en.
const topics = [
  { slug: "macroeconomia", name: "Macroeconomía", name_en: null },
  { slug: "mercados-e-inversion", name: "Mercados e Inversión", name_en: "Markets and Investment" },
  { slug: "empresas-y-negocios", name: "Empresas y Negocios" },
];
// Una parte del árbol real (/places), con `slugPorNombre` y `ancestros` como los arma
// `getPlaces`. «Antártida» es una región sin países, que el árbol real no tiene.
const arbol = (filas) => ({
  slugPorNombre: Object.fromEntries(filas.map(([nombre, slug]) => [nombre, slug])),
  ancestros: Object.fromEntries(filas.map(([nombre, , arriba]) => [nombre, arriba])),
});
const americas = ["Las Américas", "Mundo"];
const andina = ["Andina", ...americas];
const lugaresEs = arbol([
  ["Mundo", "mundo", []],
  ["Las Américas", "las-americas", ["Mundo"]],
  ["Región Norte", "region-norte", americas],
  ["EE. UU.", "estados-unidos", ["Región Norte", ...americas]],
  ["México", "mexico", ["Región Norte", ...americas]],
  ["Andina", "andina", americas],
  ["Bolivia", "bolivia", andina],
  ["Colombia", "colombia", andina],
  ["Ecuador", "ecuador", andina],
  ["Perú", "peru", andina],
  ["Venezuela", "venezuela", andina],
  ["Asia", "asia", ["Mundo"]],
  ["China", "china", ["Asia", "Mundo"]],
  ["Antártida", "antartida", ["Mundo"]],
]);
const taxonomia = { topics, geoTop: "Mundo", ...lugaresEs };
const americasEn = ["The Americas", "World"];
const andinaEn = ["Andean", ...americasEn];
const taxonomiaEn = {
  topics,
  geoTop: "World",
  ...arbol([
    ["World", "mundo", []],
    ["The Americas", "las-americas", ["World"]],
    ["Andean", "andina", americasEn],
    ["Peru", "peru", andinaEn],
    ["Venezuela", "venezuela", andinaEn],
    ["United States", "estados-unidos", ["North", ...americasEn]],
  ]),
};
const ANDINA = ["andina", "bolivia", "colombia", "ecuador", "peru", "venezuela"];
const de = (temas, geos, tx = taxonomia) => contextoDeLaSeleccion({ temas: new Set(temas), geos: new Set(geos) }, tx);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// La dirección que acaba saliendo, por el mismo camino que `useEspacios` y `getEspacios`.
const direccion = (ctx) => {
  const c = JSON.parse(claveDeEspacios(["listado-patrocinio"], ctx)).contexto;
  return { tema: listaDeQuery(c.tema), pais: listaDeQuery(c.pais) };
};

console.log("el filtro de un listado, por slug (contextoDeLaSeleccion)");
let r = de([], []);
check("sin filtro: nada", igual(r, { tema: [], pais: [] }), r);
check("sin filtro: la dirección no lleva tema ni país", igual(direccion(r), { tema: null, pais: null }), direccion(r));
r = de(["Macroeconomía"], []);
check("un tema: su slug", igual(r.tema, ["macroeconomia"]), r);
check("un tema: en la dirección, tema=macroeconomia", direccion(r).tema === "macroeconomia", direccion(r));
r = de(["Mercados e Inversión", "Empresas y Negocios"], ["Venezuela", "EE. UU."]);
check("varios temas, en el orden elegido", igual(r.tema, ["mercados-e-inversion", "empresas-y-negocios"]), r);
check("varios países", igual(r.pais, ["venezuela", "estados-unidos"]), r);
check(
  "igual que una pieza con esos temas (temaSlugs)",
  direccion(r).tema === "mercados-e-inversion,empresas-y-negocios" && direccion(r).pais === "venezuela,estados-unidos",
  direccion(r)
);
r = de(["Markets and Investment"], ["Venezuela"], taxonomiaEn);
check("en /en: el nombre en inglés da el mismo slug", igual(r, { tema: ["mercados-e-inversion"], pais: ["venezuela"] }), r);
r = de(["Mercados e Inversión"], [], taxonomiaEn);
check("cambió de idioma con el tema elegido: el nombre en español sigue valiendo", igual(r.tema, ["mercados-e-inversion"]), r);
r = de(["Macroeconomía"], [], taxonomiaEn);
check("tema sin nombre en inglés: en /en se ve en español y casa igual", igual(r.tema, ["macroeconomia"]), r);
r = de([], ["Mundo"]);
check("«Todo» (Mundo) no se manda: es «sin filtro»", igual(r.pais, []), r);
check("«Todo»: la dirección no lleva país (antes, pais=Mundo)", direccion(r).pais === null, direccion(r));
r = de([], ["World"], taxonomiaEn);
check("«Todo» en /en (World) tampoco", igual(r.pais, []), r);
r = de([], ["Mundo", "Venezuela"]);
check("«Todo» más un país: solo el país", igual(r.pais, ["venezuela"]), r);
r = de([], ["Andina"]);
check("una región sola: ella y sus cinco países", igual(r.pais, ANDINA), r);
check("una región: en la dirección", direccion(r).pais === ANDINA.join(","), direccion(r));
r = de([], ["Andina", "Venezuela"]);
check("región más uno de sus países: sin repetir", igual(r.pais, ANDINA), r);
r = de([], ["Venezuela", "Andina"]);
check("el país antes que su región: el mismo conjunto", igual([...r.pais].sort(), [...ANDINA].sort()), r);
r = de([], ["Andina", "China"]);
check("región más un país de fuera: la unión", igual(r.pais, [...ANDINA, "china"]), r);
r = de([], ["Antártida"]);
check("una región vacía: solo ella", igual(r.pais, ["antartida"]), r);
r = de([], ["Las Américas"]);
check(
  "un continente: sus regiones y los países de dentro",
  igual(r.pais, ["las-americas", "region-norte", "estados-unidos", "mexico", ...ANDINA]),
  r
);
r = de([], ["Andean"], taxonomiaEn);
check("una región en /en (nombre en inglés)", igual(r.pais, ["andina", "peru", "venezuela"]), r);
r = de([], ["Mundo", "Andina"]);
check("«Todo» más una región: «Todo» sigue sin mandarse", igual(r.pais, ANDINA), r);
r = de(["Tema que ya no existe", "Macroeconomía"], ["Atlántida"]);
check("un tema sin slug no se manda (los demás sí)", igual(r.tema, ["macroeconomia"]), r);
check("un lugar sin slug no se manda", igual(r.pais, []), r);
r = de(["constructor"], ["toString"]);
check("un nombre que es una propiedad de los objetos no cuela", igual(r, { tema: [], pais: [] }), r);
r = de(["Tema que ya no existe"], []);
check("solo temas sin slug: la dirección no lleva tema", direccion(r).tema === null, direccion(r));
r = contextoDeLaSeleccion({ temas: new Set(["Macroeconomía"]), geos: new Set(["Venezuela"]) }, {});
check("la taxonomía aún no llegó: no se manda nada", igual(r, { tema: [], pais: [] }), r);
r = contextoDeLaSeleccion({}, taxonomia);
check("sin selección ninguna (undefined)", igual(r, { tema: [], pais: [] }), r);
r = contextoDeLaSeleccion(
  { temas: new Set(["Mercados e Inversión"]) },
  { topics: [{ slug: "x", name: "Mercados e Inversión" }, ...topics] }
);
check("ningún nombre vale dos slugs: gana el primero", igual(r.tema, ["x"]), r);
check(
  "la misma selección da la misma clave (no pide otra vez en cada render)",
  claveDeEspacios(["x"], de(["Macroeconomía"], ["Venezuela"])) === claveDeEspacios(["x"], de(["Macroeconomía"], ["Venezuela"]))
);

console.log(fallos ? `\n${fallos} fallo(s)` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
