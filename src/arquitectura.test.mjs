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
 * Las reglas, en el orden en que se miran:
 *
 * 1. `src/ui/` (lo compartido: botones, tablas, diálogos) no importa **ninguna** feature,
 *    ni siquiera por su puerta: es la feature la que usa `ui/`, no al revés.
 * 2. Lo del panel (`features/<tema>/admin/**`) solo se importa desde una carpeta `admin/`
 *    (`src/pages/admin`, `src/components/admin`, el `admin/` de una feature). Tampoco
 *    desde la propia feature: si `index.js` o un componente del sitio importaran su
 *    `admin/`, el panel viajaría en el paquete de cada lector.
 * 3. Una feature solo importa de otra sus puertas (`index.js` o `admin/index.js`).
 * 4. El resto del sitio también entra por la puerta, con tres salvedades, cada una por
 *    una razón que no es de gusto:
 *    - `import()` de una página de una feature (`features/<tema>/paginas/…`) desde
 *      `routes.jsx`: es la línea por la que Vite parte el código; por la puerta, la
 *      página viajaría con todo lo demás;
 *    - los pasos de las guías (`features/<tema>/guias/*.js`): son datos sin JSX, y las
 *      guías de `lib/guias/` los leen desde una prueba que corre en node, que no entiende
 *      el JSX que trae `index.js`;
 *    - las fachadas de la mudanza (`FACHADAS`, con quién las quita).
 *
 * Cada regla tiene su trampa en «la prueba ve las trampas»: un sitio de mentira en una
 * carpeta temporal donde cada falta está puesta a propósito.
 *
 * Las importaciones se leen del árbol del código (espree, el analizador de ESLint), no del
 * texto: los comentarios no cuentan, y `import()` sí.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as espree from "espree";

const RAIZ = fileURLToPath(new URL("../", import.meta.url));

/** Las fachadas de la mudanza: pueden importar las tripas de una feature. Ruta → quién la quita. */
const FACHADAS = {
  "src/lib/monedas.js": "monedas, cuando el editor de piezas importe de features/monedas",
};

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

const dentroDe = (ruta, carpeta) => {
  const rel = path.relative(carpeta, ruta);
  return !rel.startsWith("..") && !path.isAbsolute(rel);
};

/** Las reglas sobre el sitio que cuelga de `raiz`: una lista de faltas, en palabras. */
export const faltas = (raiz = RAIZ, fachadas = FACHADAS) => {
  const SRC = path.join(raiz, "src");
  const FEATURES = path.join(SRC, "features");
  const UI = path.join(SRC, "ui");
  const relativa = (ruta) => path.relative(raiz, ruta).split(path.sep).join("/");
  /** De qué feature es una ruta (`monedas`), o null si no es de ninguna. */
  const featureDe = (ruta) => (dentroDe(ruta, FEATURES) ? path.relative(FEATURES, ruta).split(path.sep)[0] : null);
  const esLaPuerta = (ruta, feature) =>
    ruta === path.join(FEATURES, feature, "index.js") || ruta === path.join(FEATURES, feature, "admin", "index.js");
  /** Si una ruta está dentro de alguna carpeta `admin/` de `src/`. */
  const enAdmin = (ruta) => path.relative(SRC, path.dirname(ruta)).split(path.sep).includes("admin");
  /** Los archivos de código, sin pruebas ni El Analista (se trae tal cual). */
  const archivos = existsSync(SRC)
    ? readdirSync(SRC, { recursive: true })
        .map((n) => path.join(SRC, n))
        .filter((r) => /\.(jsx?|mjs)$/.test(r) && !/\.test\./.test(r) && !relativa(r).startsWith("src/juegos/el-analista/"))
    : [];

  const salida = [];
  for (const ruta of archivos) {
    const rel = relativa(ruta);
    const suya = featureDe(ruta);
    for (const { especificador, linea, dinamico } of importaciones(readFileSync(ruta, "utf8"))) {
      const destino = resolver(ruta, especificador);
      const otra = destino && featureDe(destino);
      if (!otra) continue;
      const donde = `${rel}:${linea}: importa ${relativa(destino)}`;
      if (dentroDe(ruta, UI)) {
        salida.push(`${donde}; ui/ no conoce las features, ni por su puerta (son ellas las que usan ui/)`);
      } else if (dentroDe(destino, path.join(FEATURES, otra, "admin")) && !enAdmin(ruta)) {
        salida.push(`${donde}; lo del panel solo se importa desde una carpeta admin/`);
      } else if (otra === suya || esLaPuerta(destino, otra) || rel in fachadas) {
        continue;
      } else if (suya) {
        salida.push(`${donde}; de otra feature, solo sus puertas (features/${otra}/index.js o admin/index.js)`);
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

const FEATURES = path.join(RAIZ, "src", "features");

test("hay features que vigilar (que lo de abajo no pase en vacío)", () => {
  assert.ok(existsSync(path.join(FEATURES, "monedas", "index.js")));
  assert.ok(readdirSync(path.join(FEATURES, "monedas"), { recursive: true }).length >= 10);
});

test("cada feature, ui/ y el resto del sitio entran a una feature por sus puertas", () => {
  const lista = faltas();
  assert.deepEqual(lista, [], `\n${lista.join("\n")}`);
});

test("cada fachada de la lista existe (una borrada se quita también de FACHADAS)", () => {
  assert.deepEqual(Object.keys(FACHADAS).filter((f) => !existsSync(path.join(RAIZ, f))), []);
});

test("cada feature tiene su index.js", () => {
  const sin = existsSync(FEATURES)
    ? readdirSync(FEATURES).filter((f) => statSync(path.join(FEATURES, f)).isDirectory() && !existsSync(path.join(FEATURES, f, "index.js")))
    : [];
  assert.deepEqual(sin, []);
});

test("la prueba ve las trampas", () => {
  // Un sitio de mentira: cada línea marcada con ✗ es una falta puesta a propósito.
  const raiz = mkdtempSync(path.join(os.tmpdir(), "arquitectura-"));
  const sitio = {
    "src/features/a/index.js": [
      'export { X } from "./componentes/X";', //       bien
      'export { Panel } from "./admin/Panel";', //     ✗ 2: la puerta del sitio no carga el panel
    ],
    "src/features/a/componentes/X.jsx": [
      'import { B } from "../../b";', //               bien: la puerta de otra
      'import { Y } from "../../b/componentes/Y";', // ✗ 3: las tripas de otra
      'import { Q } from "../../b/admin";', //         ✗ 2: el panel de otra, desde el sitio
      'import { P } from "../admin/Panel";', //        ✗ 2: su propio panel, desde el sitio
    ],
    "src/features/a/admin/Panel.jsx": [
      'import { Q } from "../../b/admin";', //         bien: panel con panel
      'import { api } from "./api";', //               bien
    ],
    "src/features/a/admin/api.js": [],
    "src/features/b/index.js": [],
    "src/features/b/componentes/Y.jsx": [],
    "src/features/b/admin/index.js": [],
    "src/features/b/paginas/Pag.jsx": [],
    "src/features/b/guias/pasos.js": [],
    "src/ui/Boton.jsx": [
      'import { B } from "../features/b";', //         ✗ 1: ui no usa features, ni por la puerta
    ],
    "src/pages/admin/Cinta.jsx": [
      'import { Q } from "../../features/b/admin";', // bien
    ],
    "src/pages/Home.jsx": [
      'import { B } from "../features/b";', //         bien
      'import { Q } from "../features/b/admin";', //   ✗ 2
      'import { Y } from "../features/b/componentes/Y";', // ✗ 4
    ],
    "src/routes.jsx": [
      'const P = () => import("./features/b/paginas/Pag");', // bien: el lazy de una página
      'import { Y } from "./features/b/componentes/Y";', //     ✗ 4: lo demás, por la puerta
    ],
    "src/lib/guias/g.js": [
      'import { pasos } from "../../features/b/guias/pasos.js";', // bien: datos de una guía
    ],
    "src/lib/fachada.js": [
      'export { Y } from "../features/b/componentes/Y";', // bien: es una fachada
    ],
  };
  try {
    for (const [ruta, lineas] of Object.entries(sitio)) {
      mkdirSync(path.dirname(path.join(raiz, ruta)), { recursive: true });
      writeFileSync(path.join(raiz, ruta), lineas.join("\n"));
    }
    const claves = faltas(raiz, { "src/lib/fachada.js": "prueba" }).map((f) => f.split(";")[0].replace(": importa ", " "));
    assert.deepEqual(claves.sort(), [
      "src/features/a/componentes/X.jsx:2 src/features/b/componentes/Y.jsx",
      "src/features/a/componentes/X.jsx:3 src/features/b/admin/index.js",
      "src/features/a/componentes/X.jsx:4 src/features/a/admin/Panel.jsx",
      "src/features/a/index.js:2 src/features/a/admin/Panel.jsx",
      "src/pages/Home.jsx:2 src/features/b/admin/index.js",
      "src/pages/Home.jsx:3 src/features/b/componentes/Y.jsx",
      "src/routes.jsx:2 src/features/b/componentes/Y.jsx",
      "src/ui/Boton.jsx:1 src/features/b/index.js",
    ]);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
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
