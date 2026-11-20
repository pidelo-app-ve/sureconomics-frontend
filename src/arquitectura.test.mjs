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
 * 2. Nada que viva en una carpeta `admin/` (`src/pages/admin`, `src/components/admin`, el
 *    `admin/` de una feature) se importa desde fuera de una carpeta `admin/`: ni el panel
 *    de una feature, ni un componente del panel que a su vez lo importe (la fuga
 *    indirecta). Tampoco desde la propia feature: si `index.js` o un componente del sitio
 *    importaran su `admin/`, el panel viajaría en el paquete de cada lector. La única
 *    salvedad es el `import()` de `routes.jsx` a una página del panel (`src/pages/admin/…`
 *    o `features/<tema>/admin/paginas/…`): así es como el panel se carga aparte.
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
 * 5. Los pasos de las guías de una feature (`features/<tema>/guias/`) son datos: solo
 *    importan otros archivos `.js` o `.json` de una carpeta `guias/`. Nada de componentes
 *    ni JSX (los lee node).
 * 6. Un `import()` con una ruta calculada (una plantilla, una variable) no se puede
 *    comprobar: solo se admite en `routes.jsx`.
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
  "src/hooks/useHeadlines.js":
    "titulares, cuando haceCuanto se mude a un sitio compartido (LugarYFecha, por la puerta, cambiaría el orden del CSS)",
};

/**
 * Lo que hoy sale del panel hacia el sitio y no es del piloto (18-nov-2026): se anotan
 * para que no crezcan. Lo compartido con el panel va a `src/ui/` (ADR-001); al moverlo,
 * se borra su línea. `importador → importado` → por qué sigue y quién lo quita.
 */
const FUGAS_CONOCIDAS = {
  "src/routes.jsx → src/components/admin/RequireAdmin.jsx":
    "la guarda de /admin, que va en la ruta y no en una página; la quita quien mude el panel (o la pase a src/app/)",
  "src/hooks/useAdminConfirm.jsx → src/components/admin/AdminConfirmDialog.jsx":
    "el diálogo de confirmar lo usan el panel y la cuenta; la quita quien cree src/ui/ (diálogos)",
  "src/components/cuenta/RetratoDelLector.jsx → src/components/admin/RecorteDeAvatar.jsx":
    "el recorte del retrato lo usan el panel y la cuenta del lector; la quita quien lo mude a src/ui/",
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
    } else if (n.type === "ImportExpression") {
      // `import(`./x/${y}`)` o `import(ruta)`: adónde va no se sabe sin ejecutarlo.
      salida.push({ especificador: null, linea: n.loc.start.line, dinamico: true });
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
export const faltas = (raiz = RAIZ, fachadas = FACHADAS, fugas = FUGAS_CONOCIDAS) => {
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

  const RUTAS = path.join(SRC, "routes.jsx");
  /** El `import()` de `routes.jsx` a una página del panel: así se carga aparte. */
  const lazyDelPanel = (ruta, destino, dinamico) =>
    dinamico && ruta === RUTAS &&
    (dentroDe(destino, path.join(SRC, "pages", "admin")) ||
      (featureDe(destino) && dentroDe(destino, path.join(FEATURES, featureDe(destino), "admin", "paginas"))));
  const enGuiasDeFeature = (r) => {
    const f = featureDe(r);
    return Boolean(f) && dentroDe(r, path.join(FEATURES, f, "guias"));
  };

  const salida = [];
  for (const ruta of archivos) {
    const rel = relativa(ruta);
    const suya = featureDe(ruta);
    for (const { especificador, linea, dinamico } of importaciones(readFileSync(ruta, "utf8"))) {
      if (especificador === null) {
        if (ruta !== RUTAS) salida.push(`${rel}:${linea}: importa (ruta calculada); un import() con plantilla solo en routes.jsx`);
        continue;
      }
      const destino = resolver(ruta, especificador);
      if (!destino) continue;
      const donde = `${rel}:${linea}: importa ${relativa(destino)}`;
      if (enGuiasDeFeature(ruta) && !(/\.(js|json)$/.test(destino) && path.basename(path.dirname(destino)) === "guias")) {
        salida.push(`${donde}; los pasos de una guía son datos: solo importan otros datos de guias/`);
        continue;
      }
      const otra = featureDe(destino);
      if (otra && dentroDe(ruta, UI)) {
        salida.push(`${donde}; ui/ no conoce las features, ni por su puerta (son ellas las que usan ui/)`);
      } else if (enAdmin(destino) && !enAdmin(ruta) && !lazyDelPanel(ruta, destino, dinamico) &&
        !(`${rel} → ${relativa(destino)}` in fugas)) {
        salida.push(`${donde}; lo del panel solo se importa desde una carpeta admin/`);
      } else if (!otra || otra === suya || esLaPuerta(destino, otra) || rel in fachadas) {
        continue;
      } else if (suya) {
        salida.push(`${donde}; de otra feature, solo sus puertas (features/${otra}/index.js o admin/index.js)`);
      } else if (dinamico && ruta === RUTAS && (dentroDe(destino, path.join(FEATURES, otra, "paginas")) ||
        dentroDe(destino, path.join(FEATURES, otra, "admin", "paginas")))) {
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

test("cada fuga conocida del panel sigue ahí (una arreglada se quita de FUGAS_CONOCIDAS)", () => {
  const vistas = new Set(faltas(RAIZ, FACHADAS, {}).map((f) => f.split(";")[0].replace(/:\d+: importa /, " → ")));
  assert.deepEqual(Object.keys(FUGAS_CONOCIDAS).filter((f) => !vistas.has(f)), []);
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
    "src/features/b/admin/paginas/Panel.jsx": [],
    "src/features/b/guias/pasos.js": [
      'import { MAS } from "./mas.js";', //             bien: datos de otra guía
      'import { Y } from "../componentes/Y";', //       ✗ 5: una guía no importa componentes
    ],
    "src/features/b/guias/mas.js": [],
    "src/components/admin/X.jsx": [
      'import { Q } from "../../features/b/admin";', // bien: panel con panel
    ],
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
      'import { X } from "../components/admin/X";', // ✗ 2: la fuga indirecta (X importa el panel)
      "const M = (n) => import(`./mapas/${n}.js`);", // ✗ 6: una ruta calculada
    ],
    "src/routes.jsx": [
      'const P = () => import("./features/b/paginas/Pag");', // bien: el lazy de una página
      'import { Y } from "./features/b/componentes/Y";', //     ✗ 4: lo demás, por la puerta
      'const A = () => import("./features/b/admin/paginas/Panel");', // bien: el lazy del panel
      'const C = () => import("./pages/admin/Cinta");', //               bien: también
      'import { Cinta } from "./pages/admin/Cinta";', //                ✗ 2: sin lazy, no
      "const I = (n) => import(`./pages/${n}`);", //                     bien: en routes.jsx sí
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
    const claves = faltas(raiz, { "src/lib/fachada.js": "prueba" }, {}).map((f) => f.split(";")[0].replace(": importa ", " "));
    assert.deepEqual(claves.sort(), [
      "src/features/a/componentes/X.jsx:2 src/features/b/componentes/Y.jsx",
      "src/features/a/componentes/X.jsx:3 src/features/b/admin/index.js",
      "src/features/a/componentes/X.jsx:4 src/features/a/admin/Panel.jsx",
      "src/features/a/index.js:2 src/features/a/admin/Panel.jsx",
      "src/features/b/guias/pasos.js:2 src/features/b/componentes/Y.jsx",
      "src/pages/Home.jsx:2 src/features/b/admin/index.js",
      "src/pages/Home.jsx:3 src/features/b/componentes/Y.jsx",
      "src/pages/Home.jsx:4 src/components/admin/X.jsx",
      "src/pages/Home.jsx:5 (ruta calculada)",
      "src/routes.jsx:2 src/features/b/componentes/Y.jsx",
      "src/routes.jsx:5 src/pages/admin/Cinta.jsx",
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
    "const Q = (n) => import(`./e/${n}`);",
  ].join("\n");
  assert.deepEqual(importaciones(codigo).map((i) => [i.especificador, i.linea, i.dinamico]), [
    ["./a", 2, false],
    ["../b", 3, false],
    ["./c", 4, false],
    ["./d", 5, true],
    ["./estilos.css", 6, false],
    [null, 7, true],
  ]);
});
