/**
 * Todas las guías de `lib/guias/` contra el código de las páginas. Corre con
 * `npm run test:recorrido` (y con `npm test`).
 *
 * Una guía es cada exportación de `lib/guias/` hecha con `crearRecorrido`, y cada
 * función exportada `recorrido…` es una guía que se arma según el rol (la bienvenida
 * del panel): se prueba con cada rol.
 *
 * Por cada guía comprueba que:
 * - ninguna otra usa su nombre (de él salen la clave del almacén y el atributo de
 *   anclaje: dos guías con el mismo se pisarían);
 * - el primer paso no lleva clave, y el último va al botón que la abre («Guía», o el
 *   «?» de las bienvenidas del panel y de la cuenta);
 * - cada clave de paso está marcada en alguna página, y ninguna página marca una clave
 *   que la guía no tenga (anclas huérfanas);
 * - lo que un paso le pide a la página (`abrirMenu`, `abrirModulo`…) lo lee alguna
 *   página de esa guía.
 *
 * Las marcas se buscan en el árbol del código (espree, el analizador que trae ESLint),
 * no en el texto: los comentarios no cuentan y de cada `ancla` se sabe de qué guía es.
 * Cuentan `ancla("clave")` (de `const { ancla } = recorridoX`), `recorridoX.ancla("clave")`,
 * `data-tour-<nombre>="clave"` y el botón «Guía» (`<BotonGuia recorrido={…}>` o
 * `<CabeceraDePagina guia={…}>`). `ancla(cond && "clave")` cuenta como "clave".
 *
 * Una clave calculada (`ancla(red)`) no se lee del código: va en `ANCLAS_DINAMICAS`, con
 * de dónde salen sus valores. Una que no esté ahí hace fallar la prueba.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as espree from "espree";
import { menuPara, NOMBRE_DE_ROL } from "./menuDelPanel.js";

const RAIZ = fileURLToPath(new URL("../../", import.meta.url));
const relativa = (ruta) => path.relative(RAIZ, ruta).split(path.sep).join("/");
const ROLES = Object.keys(NOMBRE_DE_ROL);

/** Las claves calculadas, por `archivo|argumento de ancla`, y cómo sacar sus valores. */
const ANCLAS_DINAMICAS = {
  // Un paso por grupo del menú: los mismos grupos que pinta el menú de cada rol.
  "src/pages/admin/AdminLayout.jsx|`grupo-${grupo.clave}`": () =>
    ROLES.flatMap((rol) => menuPara(rol).map((g) => `grupo-${g.clave}`)),
  // La lista a mano de cada red: `bloque("instagram")`, `bloque("x")`…
  "src/pages/admin/AdminRedes.jsx|red": ({ argumentos }) => argumentos("src/pages/admin/AdminRedes.jsx", "bloque"),
  // Cada enlace del menú de la cuenta trae su paso en `guia: "…"` (RAIL_NAV).
  "src/pages/cuenta/CuentaDashboardLayout.jsx|guia": ({ propiedades }) =>
    propiedades("src/pages/cuenta/CuentaDashboardLayout.jsx", "guia"),
  // Cada bloque de Audiencia dice su paso en `parada="…"`.
  "src/components/admin/audiencia/Piezas.jsx|parada": ({ atributos }) => atributos("parada"),
};

const problemas = new Map(); // guía (o archivo) → lo que falla
const mal = (quien, texto) => problemas.set(quien, new Set([...(problemas.get(quien) ?? []), texto]));

/* ─── 1. Las guías: lo que exporta cada archivo de `lib/guias/` ─────────────────── */

const DIR_GUIAS = path.join(RAIZ, "src/lib/guias");
const esGuia = (v) =>
  Boolean(v) && typeof v === "object" && Array.isArray(v.pasos) && typeof v.atributo === "string" && typeof v.iniciar === "function";

const guias = []; // { nombre, origen, fuente, rol?, pasos }: `fuente`, la guía o la función que la arma
const exportadas = new Map(); // ruta del módulo → Map(exportación → { tipo, nombre })
for (const archivo of readdirSync(DIR_GUIAS).filter((a) => a.endsWith(".js")).sort()) {
  const ruta = path.join(DIR_GUIAS, archivo);
  const modulo = await import(pathToFileURL(ruta).href);
  const suyas = new Map();
  for (const [exportacion, valor] of Object.entries(modulo)) {
    if (esGuia(valor)) {
      guias.push({ nombre: valor.nombre, origen: `${archivo} → ${exportacion}`, fuente: valor, pasos: valor.pasos });
      suyas.set(exportacion, { tipo: "guia", nombre: valor.nombre });
    } else if (typeof valor === "function" && exportacion.startsWith("recorrido")) {
      // Una guía que se arma según el rol (la bienvenida del panel): una por rol.
      for (const rol of ROLES) {
        const r = valor(rol);
        if (!esGuia(r)) {
          mal(archivo, `${exportacion}("${rol}") no devuelve una guía`);
          continue;
        }
        guias.push({ nombre: r.nombre, origen: `${archivo} → ${exportacion}`, fuente: valor, rol, pasos: r.pasos });
        suyas.set(exportacion, { tipo: "fabrica", nombre: r.nombre });
      }
    }
  }
  // `export const ancla` (Audiencia): el ayudante de la única guía del archivo.
  if (typeof modulo.ancla === "function") {
    const nombres = new Set([...suyas.values()].map((e) => e.nombre));
    if (nombres.size === 1) suyas.set("ancla", { tipo: "ancla", nombre: [...nombres][0] });
    else mal(archivo, "exporta `ancla` sin tener una sola guía");
  }
  exportadas.set(ruta, suyas);
}

/* ─── 2. El código: todo `src/` menos las pruebas y El Analista (no se edita aquí) ─ */

const OPCIONES = { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true }, range: true, loc: true };
const leidos = [];
for (const nombre of readdirSync(path.join(RAIZ, "src"), { recursive: true })) {
  const ruta = path.join(RAIZ, "src", nombre);
  const rel = relativa(ruta);
  if (!/\.(jsx?|mjs)$/.test(rel) || rel.includes(".test.") || rel.startsWith("src/juegos/el-analista/")) continue;
  const fuente = readFileSync(ruta, "utf8");
  try {
    leidos.push({ ruta, rel, fuente, ast: espree.parse(fuente, OPCIONES) });
  } catch (err) {
    mal(rel, `no se pudo leer: ${err.message}`);
  }
}

const hijos = (n) =>
  (espree.VisitorKeys[n.type] ?? Object.keys(n).filter((k) => !["parent", "loc", "range"].includes(k)))
    .flatMap((k) => n[k] ?? [])
    .filter((h) => h && typeof h.type === "string");
/** Recorre el árbol; si `fn` devuelve `false`, no baja por ese nodo. */
const visitar = (n, fn) => {
  if (fn(n) === false) return;
  for (const h of hijos(n)) visitar(h, fn);
};
const textoDe = (n) => (n?.type === "Literal" && typeof n.value === "string" ? n.value : null);

// Para `ANCLAS_DINAMICAS`.
const enArchivo = (rel) => leidos.find((a) => a.rel === rel) ?? { ast: { type: "Program", body: [] } };
const recoger = (raices, fn) => {
  const vistos = [];
  for (const raiz of raices) visitar(raiz, (n) => { const v = fn(n); if (v) vistos.push(v); });
  return vistos;
};
const AYUDAS = {
  argumentos: (rel, funcion) =>
    recoger([enArchivo(rel).ast], (n) =>
      n.type === "CallExpression" && n.callee.name === funcion ? textoDe(n.arguments[0]) : null),
  propiedades: (rel, clave) =>
    recoger([enArchivo(rel).ast], (n) => (n.type === "Property" && n.key.name === clave ? textoDe(n.value) : null)),
  atributos: (nombre) =>
    recoger(leidos.map((a) => a.ast), (n) => (n.type === "JSXAttribute" && n.name.name === nombre ? textoDe(n.value) : null)),
};
const dinamicasUsadas = new Set();

/* ─── 3. Las marcas de cada archivo ───────────────────────────────────────────── */

const marcas = []; // { nombre, clave, donde }
const botones = []; // { nombre, clave }: marcas de lo que abre una guía
const lectores = new Map(); // guía → Set de nombres que leen las páginas que la usan

for (const archivo of leidos) {
  const enlaces = new Map(); // identificador → { tipo: "guia" | "fabrica" | "ancla", nombre }
  for (const n of archivo.ast.body) {
    if (n.type !== "ImportDeclaration" || !n.source.value.startsWith(".")) continue;
    let destino = path.resolve(path.dirname(archivo.ruta), n.source.value);
    if (!path.extname(destino)) destino += ".js";
    const suyas = exportadas.get(destino);
    for (const e of n.specifiers) {
      if (e.type === "ImportSpecifier" && suyas?.has(e.imported.name)) enlaces.set(e.local.name, suyas.get(e.imported.name));
    }
  }
  if (!enlaces.size && !archivo.fuente.includes("data-tour-")) continue;

  const guiaDe = (n) => (n?.type === "Identifier" && enlaces.get(n.name)?.tipo === "guia" ? enlaces.get(n.name).nombre : null);
  const usaAtributo = (n) =>
    n?.type === "MemberExpression" && !n.computed && n.property.name === "atributo" && guiaDe(n.object);
  const copias = new Set(); // una copia del ayudante: su cuerpo no es una marca

  // Los nombres que llevan a una guía: `const { ancla } = recorridoX`,
  // `const recorrido = useMemo(() => recorridoPanelPara(role))` o una copia del ayudante.
  visitar(archivo.ast, (n) => {
    if (n.type !== "VariableDeclarator" || !n.init) return;
    const nombre = guiaDe(n.init);
    if (n.id.type === "ObjectPattern" && nombre) {
      for (const p of n.id.properties) {
        if (p.type === "Property" && p.key.name === "ancla" && p.value.type === "Identifier") {
          enlaces.set(p.value.name, { tipo: "ancla", nombre });
        }
      }
    }
    if (n.id.type !== "Identifier") return;
    if (nombre) enlaces.set(n.id.name, { tipo: "guia", nombre });
    const esFuncion = /FunctionExpression$/.test(n.init.type);
    visitar(n.init, (m) => {
      const fabrica = m.type === "CallExpression" && enlaces.get(m.callee.name)?.tipo === "fabrica";
      if (fabrica) enlaces.set(n.id.name, { tipo: "guia", nombre: enlaces.get(m.callee.name).nombre });
      if (esFuncion && usaAtributo(m)) {
        enlaces.set(n.id.name, { tipo: "ancla", nombre: guiaDe(m.object) });
        copias.add(n.init);
      }
    });
  });

  /** Las claves que da el argumento de una marca: `"x"`, `cond && "x"`, `c ? "x" : null`… */
  const valoresDe = (n) => {
    if (!n || (n.type === "Literal" && !n.value) || (n.type === "Identifier" && n.name === "undefined")) return [];
    if (textoDe(n)) return [n.value];
    if (n.type === "TemplateLiteral" && !n.expressions.length) return [n.quasis[0].value.cooked];
    if (n.type === "LogicalExpression" && n.operator === "&&") return valoresDe(n.right);
    if (n.type === "ConditionalExpression") return [...valoresDe(n.consequent), ...valoresDe(n.alternate)];
    const clave = `${archivo.rel}|${archivo.fuente.slice(...n.range)}`;
    if (!ANCLAS_DINAMICAS[clave]) {
      mal(archivo.rel, `línea ${n.loc.start.line}: clave calculada sin declarar (${clave}); añádala a ANCLAS_DINAMICAS`);
      return [];
    }
    dinamicasUsadas.add(clave);
    return ANCLAS_DINAMICAS[clave](AYUDAS);
  };

  /** La marca que pone este nodo, si pone una: `{ nombre, valor }`. */
  const marcaDe = (n) => {
    if (n.type === "CallExpression") {
      const c = n.callee;
      if (c.type === "Identifier" && enlaces.get(c.name)?.tipo === "ancla") return { nombre: enlaces.get(c.name).nombre, valor: n.arguments[0] };
      if (c.type === "MemberExpression" && !c.computed && c.property.name === "ancla" && guiaDe(c.object)) {
        return { nombre: guiaDe(c.object), valor: n.arguments[0] };
      }
    }
    if (n.type === "Property" && n.computed && usaAtributo(n.key)) return { nombre: guiaDe(n.key.object), valor: n.value };
    if (n.type === "JSXAttribute" && String(n.name.name).startsWith("data-tour-")) {
      return { nombre: n.name.name.slice("data-tour-".length), valor: n.value?.expression ?? n.value };
    }
    return null;
  };
  const claves = (n) => {
    const m = marcaDe(n);
    return m ? valoresDe(m.valor).map((clave) => ({ nombre: m.nombre, clave })) : [];
  };

  const leen = new Set();
  visitar(archivo.ast, (n) => {
    if (copias.has(n)) return false;
    const donde = `${archivo.rel}:${n.loc.start.line}`;
    for (const m of claves(n)) marcas.push({ ...m, donde });
    if (n.type === "Identifier") leen.add(n.name);
    if (textoDe(n)) leen.add(n.value);
    if (n.type !== "JSXOpeningElement") return undefined;

    const prop = (nombre) => n.attributes.find((a) => a.type === "JSXAttribute" && a.name.name === nombre)?.value?.expression;
    // El botón «Guía»: se marca solo ("guia") y abre la guía.
    const conBoton = guiaDe(prop({ BotonGuia: "recorrido", CabeceraDePagina: "guia" }[n.name.name]));
    if (conBoton) {
      marcas.push({ nombre: conBoton, clave: "guia", donde });
      botones.push({ nombre: conBoton, clave: "guia" });
    }
    // Otro botón que la abre (`onClick={recorrido.iniciar}`): lo que lleva marcado.
    const alPulsar = prop("onClick");
    if (alPulsar?.type === "MemberExpression" && alPulsar.property.name === "iniciar" && guiaDe(alPulsar.object)) {
      for (const a of n.attributes) {
        for (const m of recoger([a], (x) => claves(x)).flat()) if (m.nombre === guiaDe(alPulsar.object)) botones.push(m);
      }
    }
    return undefined;
  });
  for (const { nombre } of enlaces.values()) lectores.set(nombre, new Set([...(lectores.get(nombre) ?? []), ...leen]));
}

for (const clave of Object.keys(ANCLAS_DINAMICAS)) {
  if (!dinamicasUsadas.has(clave)) mal("ANCLAS_DINAMICAS", `«${clave}» ya no está en el código: quítela de la lista`);
}

/* ─── 4. Cada guía contra lo encontrado ───────────────────────────────────────── */

const CAMPOS_DEL_PASO = new Set(["clave", "titulo", "texto", "puntos"]);
const porNombre = new Map();
for (const g of guias) porNombre.set(g.nombre, [...(porNombre.get(g.nombre) ?? []), g]);

for (const [nombre, variantes] of porNombre) {
  const quien = `guía «${nombre}»`;
  const origenes = [...new Set(variantes.map((g) => g.origen))];
  const fuentes = new Set(variantes.map((g) => g.fuente));
  if (fuentes.size > 1) mal(quien, `el nombre lo usan ${fuentes.size} guías: ${origenes.join(", ")}`);

  const marcadas = new Map(marcas.filter((m) => m.nombre === nombre).map((m) => [m.clave, m.donde]));
  const abren = new Set(botones.filter((b) => b.nombre === nombre).map((b) => b.clave));
  if (!lectores.has(nombre)) mal(quien, `(${origenes[0]}) ninguna página la usa`);

  for (const { pasos, origen, rol } of variantes) {
    const de = rol ? `${origen}, rol ${rol}` : origen;
    if (pasos[0]?.clave !== undefined) mal(quien, `(${de}) el primer paso explica la página y no lleva clave; lleva "${pasos[0].clave}"`);
    const ultima = pasos.at(-1)?.clave;
    if (!abren.has(ultima)) {
      mal(quien, `(${de}) el último paso va al botón que la abre (${[...abren].map((c) => `"${c}"`).join(" o ") || "ninguno"}), no a "${ultima}"`);
    }
    pasos.forEach((p, i) => {
      const paso = `(${de}) el paso ${i + 1} «${p.titulo}»`;
      if (!p.titulo || !(p.texto || p.puntos?.length)) mal(quien, `${paso} no tiene título y texto`);
      if (p.clave && !marcadas.has(p.clave)) mal(quien, `${paso} ilumina "${p.clave}" y ninguna página lo marca (ancla("${p.clave}"))`);
      for (const campo of Object.keys(p).filter((k) => !CAMPOS_DEL_PASO.has(k))) {
        if (!lectores.get(nombre)?.has(campo)) mal(quien, `${paso} pide "${campo}" y ninguna página de la guía lo lee`);
      }
    });
  }

  const conPaso = new Set(variantes.flatMap((g) => g.pasos.map((p) => p.clave)));
  for (const [clave, donde] of marcadas) {
    if (!conPaso.has(clave)) mal(quien, `${donde} marca "${clave}" y la guía no tiene ese paso (ancla huérfana)`);
  }
}

for (const { nombre, clave, donde } of marcas) {
  if (!porNombre.has(nombre)) mal(donde, `marca data-tour-${nombre}="${clave}" y no hay guía «${nombre}»`);
}

/* ─── Resultado ────────────────────────────────────────────────────────────────── */

for (const [nombre, variantes] of [...porNombre].sort(([a], [b]) => a.localeCompare(b))) {
  if (!problemas.has(`guía «${nombre}»`)) console.log(`  ok  guía «${nombre}» (${variantes[0].pasos.length} pasos)`);
}
for (const [quien, textos] of problemas) for (const texto of textos) console.log(`  X   ${quien}: ${texto}`);

if (problemas.size) {
  console.log(`\nfallan ${[...problemas.values()].reduce((n, t) => n + t.size, 0)} cosa(s); ${porNombre.size} guías`);
  process.exit(1);
}
console.log(`\n${porNombre.size} guías, todas con sus anclas`);
