/**
 * Las reglas de dependencia del ADR-001 en el sitio (`docs/planes/ADR-001-…` en el repo
 * de la carpeta de arriba): corre con `npm test` (o `node --test src/arquitectura.test.mjs`).
 *
 * Un dominio (`src/dominios/<tema>/`) guarda todo lo de su tema: componentes, páginas,
 * ganchos, llamadas al servidor (`servicios/`), lógica pura (`logica/`), guías y estilos.
 * Su `index.js` es **la puerta**: lo único que el resto del sitio puede importar de él. Así
 * lo de dentro cambia de sitio sin tocar a nadie. Si el dominio tiene panel, va en su
 * carpeta `panel/`, con una segunda puerta, `panel/index.js`, para que el sitio público no
 * cargue el código del panel (ver `dominios/monedas/panel/index.js`).
 *
 * «Carpeta del panel» es cualquier carpeta `admin/` de `src/` (`src/pages/admin`,
 * `src/components/admin`) y el `panel/` de cada dominio, con todo lo que cuelga de ellas.
 *
 * Las reglas, en el orden en que se miran:
 *
 * 1. `src/ui/` (lo compartido: botones, tablas, diálogos) no importa **ningún** dominio,
 *    ni siquiera por su puerta: es el dominio el que usa `ui/`, no al revés.
 * 2. Nada que viva en una carpeta del panel se importa desde fuera de una carpeta del
 *    panel: ni el `panel/` de un dominio, ni un componente del panel que a su vez lo
 *    importe (la fuga indirecta). Tampoco desde el propio dominio: si `index.js` o un
 *    componente del sitio importaran su `panel/`, el panel viajaría en el paquete de cada
 *    lector. La única salvedad es el `import()` de `routes.jsx` a una página del panel
 *    (`src/pages/admin/…` o `dominios/<tema>/panel/paginas/…`): así es como el panel se
 *    carga aparte.
 * 3. Un dominio solo importa de otro sus puertas (`index.js` o `panel/index.js`).
 * 4. El resto del sitio también entra por la puerta, con tres salvedades, cada una por
 *    una razón que no es de gusto:
 *    - `import()` de una página de un dominio (`dominios/<tema>/paginas/…`) desde
 *      `routes.jsx`: es la línea por la que Vite parte el código; por la puerta, la
 *      página viajaría con todo lo demás;
 *    - los pasos de las guías (`dominios/<tema>/guias/*.js`): son datos sin JSX, y las
 *      guías de `lib/guias/` los leen desde una prueba que corre en node, que no entiende
 *      el JSX que trae `index.js`;
 *    - las fachadas de la mudanza (`FACHADAS`, con quién las quita).
 * 5. Los pasos de las guías de un dominio (`dominios/<tema>/guias/`) son datos: solo
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

/** Las fachadas de la mudanza: pueden importar las tripas de un dominio. Ruta → quién la quita. */
const FACHADAS = {
  "src/lib/monedas.js": "monedas, cuando el editor de piezas importe de dominios/monedas",
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
  const DOMINIOS = path.join(SRC, "dominios");
  const UI = path.join(SRC, "ui");
  const relativa = (ruta) => path.relative(raiz, ruta).split(path.sep).join("/");
  /** De qué dominio es una ruta (`monedas`), o null si no es de ninguno. */
  const dominioDe = (ruta) => (dentroDe(ruta, DOMINIOS) ? path.relative(DOMINIOS, ruta).split(path.sep)[0] : null);
  const esLaPuerta = (ruta, dominio) =>
    ruta === path.join(DOMINIOS, dominio, "index.js") || ruta === path.join(DOMINIOS, dominio, "panel", "index.js");
  /** Si una ruta está en una carpeta del panel: alguna `admin/` de `src/`, o el `panel/` de un dominio. */
  const enPanel = (ruta) => {
    if (path.relative(SRC, path.dirname(ruta)).split(path.sep).includes("admin")) return true;
    const d = dominioDe(ruta);
    return Boolean(d) && dentroDe(ruta, path.join(DOMINIOS, d, "panel"));
  };
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
      (dominioDe(destino) && dentroDe(destino, path.join(DOMINIOS, dominioDe(destino), "panel", "paginas"))));
  const enGuiasDeDominio = (r) => {
    const d = dominioDe(r);
    return Boolean(d) && dentroDe(r, path.join(DOMINIOS, d, "guias"));
  };

  const salida = [];
  for (const ruta of archivos) {
    const rel = relativa(ruta);
    const suyo = dominioDe(ruta);
    for (const { especificador, linea, dinamico } of importaciones(readFileSync(ruta, "utf8"))) {
      if (especificador === null) {
        if (ruta !== RUTAS) salida.push(`${rel}:${linea}: importa (ruta calculada); un import() con plantilla solo en routes.jsx`);
        continue;
      }
      const destino = resolver(ruta, especificador);
      if (!destino) continue;
      const donde = `${rel}:${linea}: importa ${relativa(destino)}`;
      if (enGuiasDeDominio(ruta) && !(/\.(js|json)$/.test(destino) && path.basename(path.dirname(destino)) === "guias")) {
        salida.push(`${donde}; los pasos de una guía son datos: solo importan otros datos de guias/`);
        continue;
      }
      const otro = dominioDe(destino);
      if (otro && dentroDe(ruta, UI)) {
        salida.push(`${donde}; ui/ no conoce los dominios, ni por su puerta (son ellos los que usan ui/)`);
      } else if (enPanel(destino) && !enPanel(ruta) && !lazyDelPanel(ruta, destino, dinamico) &&
        !(`${rel} → ${relativa(destino)}` in fugas)) {
        salida.push(`${donde}; lo del panel solo se importa desde una carpeta del panel (admin/ o el panel/ de un dominio)`);
      } else if (!otro || otro === suyo || esLaPuerta(destino, otro) || rel in fachadas) {
        continue;
      } else if (suyo) {
        salida.push(`${donde}; de otro dominio, solo sus puertas (dominios/${otro}/index.js o panel/index.js)`);
      } else if (dinamico && ruta === RUTAS && (dentroDe(destino, path.join(DOMINIOS, otro, "paginas")) ||
        dentroDe(destino, path.join(DOMINIOS, otro, "panel", "paginas")))) {
        continue;
      } else if (dentroDe(destino, path.join(DOMINIOS, otro, "guias")) && destino.endsWith(".js")) {
        continue;
      } else {
        salida.push(`${donde}; desde fuera, solo sus puertas (dominios/${otro}/index.js o panel/index.js)`);
      }
    }
  }
  return salida;
};

const DOMINIOS = path.join(RAIZ, "src", "dominios");

test("hay dominios que vigilar (que lo de abajo no pase en vacío)", () => {
  assert.ok(existsSync(path.join(DOMINIOS, "monedas", "index.js")));
  assert.ok(readdirSync(path.join(DOMINIOS, "monedas"), { recursive: true }).length >= 10);
});

test("cada dominio, ui/ y el resto del sitio entran a un dominio por sus puertas", () => {
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

test("cada dominio tiene su index.js", () => {
  const sin = existsSync(DOMINIOS)
    ? readdirSync(DOMINIOS).filter((d) => statSync(path.join(DOMINIOS, d)).isDirectory() && !existsSync(path.join(DOMINIOS, d, "index.js")))
    : [];
  assert.deepEqual(sin, []);
});

test("los nombres de antes no vuelven: ni src/features ni admin/ o hooks/ dentro de un dominio", () => {
  // El panel de un dominio se llama `panel/` y sus ganchos `ganchos/` (estructura del
  // 20-nov-2026). Un `admin/` dentro de un dominio seguiría vigilado como panel, pero su
  // `admin/index.js` ya no sería una puerta.
  assert.equal(existsSync(path.join(RAIZ, "src", "features")), false);
  const viejas = existsSync(DOMINIOS)
    ? readdirSync(DOMINIOS).flatMap((d) => ["admin", "hooks"].filter((c) => existsSync(path.join(DOMINIOS, d, c))).map((c) => `${d}/${c}`))
    : [];
  assert.deepEqual(viejas, []);
});

test("la prueba ve las trampas", () => {
  // Un sitio de mentira: cada línea marcada con ✗ es una falta puesta a propósito.
  const raiz = mkdtempSync(path.join(os.tmpdir(), "arquitectura-"));
  const sitio = {
    "src/dominios/a/index.js": [
      'export { X } from "./componentes/X";', //       bien
      'export { Panel } from "./panel/Panel";', //     ✗ 2: la puerta del sitio no carga el panel
    ],
    "src/dominios/a/componentes/X.jsx": [
      'import { B } from "../../b";', //               bien: la puerta de otro
      'import { Y } from "../../b/componentes/Y";', // ✗ 3: las tripas de otro
      'import { Q } from "../../b/panel";', //         ✗ 2: el panel de otro, desde el sitio
      'import { P } from "../panel/Panel";', //        ✗ 2: su propio panel, desde el sitio
      'import { api } from "../panel/servicios/api";', // ✗ 2: también lo de las subcarpetas del panel
    ],
    "src/dominios/a/panel/Panel.jsx": [
      'import { Q } from "../../b/panel";', //         bien: panel con panel
      'import { api } from "./servicios/api";', //     bien
      'import { X } from "../componentes/X";', //      bien: el panel usa lo del sitio de su dominio
    ],
    "src/dominios/a/panel/servicios/api.js": [],
    "src/dominios/b/index.js": [],
    "src/dominios/b/componentes/Y.jsx": [],
    "src/dominios/b/panel/index.js": [],
    "src/dominios/b/panel/componentes/Z.jsx": [
      'import { B } from "../../index.js";', //        bien: su propia puerta
    ],
    "src/dominios/b/paginas/Pag.jsx": [],
    "src/dominios/b/panel/paginas/Panel.jsx": [],
    "src/dominios/b/guias/pasos.js": [
      'import { MAS } from "./mas.js";', //             bien: datos de otra guía
      'import { Y } from "../componentes/Y";', //       ✗ 5: una guía no importa componentes
    ],
    "src/dominios/b/guias/mas.js": [],
    "src/components/admin/X.jsx": [
      'import { Q } from "../../dominios/b/panel";', // bien: panel con panel
    ],
    "src/ui/Boton.jsx": [
      'import { B } from "../dominios/b";', //         ✗ 1: ui no usa dominios, ni por la puerta
    ],
    "src/pages/admin/Cinta.jsx": [
      'import { Q } from "../../dominios/b/panel";', // bien
      'import { Z } from "../../dominios/b/panel/componentes/Z";', // ✗ 4: panel con panel, pero por la puerta
    ],
    "src/pages/Home.jsx": [
      'import { B } from "../dominios/b";', //         bien
      'import { Q } from "../dominios/b/panel";', //   ✗ 2
      'import { Y } from "../dominios/b/componentes/Y";', // ✗ 4
      'import { X } from "../components/admin/X";', // ✗ 2: la fuga indirecta (X importa el panel)
      "const M = (n) => import(`./mapas/${n}.js`);", // ✗ 6: una ruta calculada
    ],
    "src/routes.jsx": [
      'const P = () => import("./dominios/b/paginas/Pag");', // bien: el lazy de una página
      'import { Y } from "./dominios/b/componentes/Y";', //     ✗ 4: lo demás, por la puerta
      'const A = () => import("./dominios/b/panel/paginas/Panel");', // bien: el lazy del panel
      'const C = () => import("./pages/admin/Cinta");', //               bien: también
      'import { Cinta } from "./pages/admin/Cinta";', //                ✗ 2: sin lazy, no
      "const I = (n) => import(`./pages/${n}`);", //                     bien: en routes.jsx sí
    ],
    "src/lib/guias/g.js": [
      'import { pasos } from "../../dominios/b/guias/pasos.js";', // bien: datos de una guía
    ],
    "src/lib/fachada.js": [
      'export { Y } from "../dominios/b/componentes/Y";', // bien: es una fachada
    ],
  };
  try {
    for (const [ruta, lineas] of Object.entries(sitio)) {
      mkdirSync(path.dirname(path.join(raiz, ruta)), { recursive: true });
      writeFileSync(path.join(raiz, ruta), lineas.join("\n"));
    }
    const claves = faltas(raiz, { "src/lib/fachada.js": "prueba" }, {}).map((f) => f.split(";")[0].replace(": importa ", " "));
    assert.deepEqual(claves.sort(), [
      "src/dominios/a/componentes/X.jsx:2 src/dominios/b/componentes/Y.jsx",
      "src/dominios/a/componentes/X.jsx:3 src/dominios/b/panel/index.js",
      "src/dominios/a/componentes/X.jsx:4 src/dominios/a/panel/Panel.jsx",
      "src/dominios/a/componentes/X.jsx:5 src/dominios/a/panel/servicios/api.js",
      "src/dominios/a/index.js:2 src/dominios/a/panel/Panel.jsx",
      "src/dominios/b/guias/pasos.js:2 src/dominios/b/componentes/Y.jsx",
      "src/pages/Home.jsx:2 src/dominios/b/panel/index.js",
      "src/pages/Home.jsx:3 src/dominios/b/componentes/Y.jsx",
      "src/pages/Home.jsx:4 src/components/admin/X.jsx",
      "src/pages/Home.jsx:5 (ruta calculada)",
      "src/pages/admin/Cinta.jsx:2 src/dominios/b/panel/componentes/Z.jsx",
      "src/routes.jsx:2 src/dominios/b/componentes/Y.jsx",
      "src/routes.jsx:5 src/pages/admin/Cinta.jsx",
      "src/ui/Boton.jsx:1 src/dominios/b/index.js",
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
