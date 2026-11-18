/**
 * Las reglas de dependencia del ADR-001 en el sitio (`docs/planes/ADR-001-…` en el repo
 * de la carpeta de arriba): corre con `npm test` (o `node --test src/arquitectura.test.mjs`).
 *
 * Una feature (`src/features/<tema>/`) guarda todo lo de su tema: componentes, hooks,
 * llamadas al servidor, guías y estilos. Su `index.js` es **la puerta**: lo único que el
 * resto del sitio puede importar de ella. Así lo de dentro cambia de sitio sin tocar a
 * nadie. Si la feature tiene panel, lleva una segunda puerta, `admin/index.js`, para que
 * el sitio público no cargue el código del panel (ver `features/monedas/admin/index.js`).
 *
 * Las reglas:
 *
 * 1. Una feature solo importa de otra sus puertas (`index.js` o `admin/index.js`).
 * 2. `src/ui/` (lo compartido: botones, tablas, diálogos) no importa ninguna feature.
 * 3. El resto del sitio también entra por la puerta, con tres salvedades, cada una por
 *    una razón que no es de gusto:
 *    - `import()` de una página de una feature (`features/<tema>/paginas/…`) desde
 *      `routes.jsx`: es la línea por la que Vite parte el código; por la puerta, la
 *      página viajaría con todo lo demás;
 *    - los pasos de las guías (`features/<tema>/guias/*.js`): son datos sin JSX, y las
 *      guías de `lib/guias/` los leen desde una prueba que corre en node, que no entiende
 *      el JSX que trae `index.js`;
 *    - las fachadas de la mudanza (`FACHADAS`), que se borran cuando nadie las use.
 *
 * Las importaciones se leen del árbol del código (espree, el analizador de ESLint), no del
 * texto: los comentarios no cuentan, y `import()` sí.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as espree from "espree";

const RAIZ = fileURLToPath(new URL("../", import.meta.url));
const SRC = path.join(RAIZ, "src");
const FEATURES = path.join(SRC, "features");
const UI = path.join(SRC, "ui");

/** Las fachadas de la mudanza: pueden importar las tripas de una feature. */
const FACHADAS = new Set(["src/lib/monedas.js"]);

const relativa = (ruta) => path.relative(RAIZ, ruta).split(path.sep).join("/");
const OPCIONES = { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true }, loc: true };
const EXTENSIONES = ["", ".js", ".jsx", ".mjs", "/index.js", "/index.jsx"];

/** Adónde lleva un `from "./x"`: el archivo de verdad, o null si es un paquete de npm. */
const resolver = (desde, especificador) => {
  if (!especificador.startsWith(".")) return null;
  const base = path.resolve(path.dirname(desde), especificador);
  for (const ext of EXTENSIONES) {
    const ruta = path.normalize(base + ext);
    if (existsSync(ruta) && statSync(ruta).isFile()) return ruta;
  }
  return base; // no existe: la regla se juzga igual por la ruta
};

/** Todo lo que importa un código: `{ especificador, linea, dinamico }`. */
export const importaciones = (fuente) => {
  const salida = [];
  const visitar = (n) => {
    if (!n || typeof n.type !== "string") return;
    const fuenteDe = n.type === "ImportDeclaration" || n.type === "ExportAllDeclaration" || n.type === "ExportNamedDeclaration"
      ? n.source
      : n.type === "ImportExpression" ? n.source : null;
    if (fuenteDe?.type === "Literal" && typeof fuenteDe.value === "string") {
      salida.push({ especificador: fuenteDe.value, linea: n.loc.start.line, dinamico: n.type === "ImportExpression" });
    }
    for (const clave of espree.VisitorKeys[n.type] ?? []) {
      const hijo = n[clave];
      for (const h of Array.isArray(hijo) ? hijo : [hijo]) visitar(h);
    }
  };
  visitar(espree.parse(fuente, OPCIONES));
  return salida;
};

/** De qué feature es una ruta (`monedas`), o null si no es de ninguna. */
const featureDe = (ruta) => {
  const rel = path.relative(FEATURES, ruta);
  return rel.startsWith("..") || path.isAbsolute(rel) ? null : rel.split(path.sep)[0];
};
const dentroDe = (ruta, carpeta) => {
  const rel = path.relative(carpeta, ruta);
  return !rel.startsWith("..") && !path.isAbsolute(rel);
};
const esLaPuerta = (ruta, feature) =>
  ruta === path.join(FEATURES, feature, "index.js") || ruta === path.join(FEATURES, feature, "admin", "index.js");

/** Los archivos de código de una carpeta, sin pruebas ni El Analista (se trae tal cual). */
const archivos = (carpeta) =>
  existsSync(carpeta)
    ? readdirSync(carpeta, { recursive: true })
        .map((n) => path.join(carpeta, n))
        .filter((r) => /\.(jsx?|mjs)$/.test(r) && !/\.test\./.test(r) && !relativa(r).startsWith("src/juegos/el-analista/"))
    : [];

/** Lo que rompe cada archivo de `src/`, en palabras. */
const faltas = () => {
  const salida = [];
  for (const ruta of archivos(SRC)) {
    const rel = relativa(ruta);
    const suya = featureDe(ruta);
    for (const { especificador, linea, dinamico } of importaciones(readFileSync(ruta, "utf8"))) {
      const destino = resolver(ruta, especificador);
      const otra = destino && featureDe(destino);
      if (!otra || otra === suya || esLaPuerta(destino, otra)) continue;
      const donde = `${rel}:${linea}: importa ${relativa(destino)}`;
      if (dentroDe(ruta, UI)) {
        salida.push(`${donde}; ui/ no conoce las features (son ellas las que usan ui/)`);
      } else if (suya) {
        salida.push(`${donde}; de otra feature, solo sus puertas (features/${otra}/index.js o admin/index.js)`);
      } else if (FACHADAS.has(rel)) {
        continue;
      } else if (dinamico && rel === "src/routes.jsx" && dentroDe(destino, path.join(FEATURES, otra, "paginas"))) {
        continue;
      } else if (dentroDe(destino, path.join(FEATURES, otra, "guias")) && destino.endsWith(".js")) {
        continue;
      } else {
        salida.push(`${donde}; desde fuera, solo sus puertas (features/${otra}/index.js o admin/index.js)`);
      }
    }
  }
  return salida;
};

test("hay features que vigilar (que lo de abajo no pase en vacío)", () => {
  assert.ok(existsSync(path.join(FEATURES, "monedas", "index.js")));
  assert.ok(archivos(FEATURES).length >= 10);
});

test("cada feature, ui/ y el resto del sitio entran a una feature por sus puertas", () => {
  const lista = faltas();
  assert.deepEqual(lista, [], `\n${lista.join("\n")}`);
});

test("cada fachada de la lista existe (una borrada se quita también de FACHADAS)", () => {
  assert.deepEqual([...FACHADAS].filter((f) => !existsSync(path.join(RAIZ, f))), []);
});

test("cada feature tiene su index.js", () => {
  const sin = existsSync(FEATURES)
    ? readdirSync(FEATURES).filter((f) => statSync(path.join(FEATURES, f)).isDirectory() && !existsSync(path.join(FEATURES, f, "index.js")))
    : [];
  assert.deepEqual(sin, []);
});

test("el lector de importaciones ve las trampas", () => {
  const codigo = [
    "// import { x } from './comentario';",
    'import { A } from "./a";',
    'export { B } from "../b";',
    'export * from "./c";',
    "const P = lazy(() => import('./d'));",
    'import "./estilos.css";',
  ].join("\n");
  assert.deepEqual(importaciones(codigo).map((i) => [i.especificador, i.linea, i.dinamico]), [
    ["./a", 2, false],
    ["../b", 3, false],
    ["./c", 4, false],
    ["./d", 5, true],
    ["./estilos.css", 6, false],
  ]);
});
