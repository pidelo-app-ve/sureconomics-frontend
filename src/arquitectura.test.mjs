/**
 * Las reglas de dependencia del ADR-001 en el sitio (`docs/planes/ADR-001-…` en el repo
 * de la carpeta de arriba): corre con `npm test` (o `node --test src/arquitectura.test.mjs`).
 *
 * Un dominio (`src/features/<tema>/`) guarda todo lo de su tema, en pocos archivos: en la
 * raíz, `api.js` (lo que se le pide al servidor), `utils.js` (lógica pura), un `useX.js`
 * si tiene un gancho, `guia.js` (los pasos de su guía) y las páginas o componentes
 * sueltos; en carpetas, solo cuando hay varios de código, `components/`, `pages/` y
 * `admin/`. Las
 * carpetas van con los nombres de siempre de React; los archivos y el código, en español.
 * La forma entera está en `ESTRUCTURA.md`, en la raíz del repo.
 * Su `index.js` es **la puerta**: lo único que el resto del sitio puede importar de él. Así
 * lo de dentro cambia de sitio sin tocar a nadie. Si el dominio tiene panel, va en su
 * carpeta `admin/`, con una segunda puerta, `admin/index.js`, para que el sitio público no
 * cargue el código del panel (ver `features/monedas/admin/index.js`).
 *
 * «Carpeta del panel» es cualquier carpeta `admin/` de `src/` (`src/pages/admin`,
 * `src/components/admin` y el `admin/` de cada dominio), con todo lo que cuelga de ellas.
 *
 * «Página de un dominio» es un `.jsx` de su raíz, de `pages/`, de `admin/` o de
 * `admin/pages/` **que su puerta no exporta**: lo que sale por la puerta es un componente
 * que usa el resto del sitio, y ese se importa por la puerta.
 *
 * Las reglas, en el orden en que se miran:
 *
 * 1. `src/ui/` (lo compartido: botones, tablas, diálogos) no importa **ningún** dominio,
 *    ni siquiera por su puerta: es el dominio el que usa `ui/`, no al revés.
 * 2. Nada que viva en una carpeta del panel se importa desde fuera de una carpeta del
 *    panel: ni el `admin/` de un dominio, ni un componente del panel que a su vez lo
 *    importe (la fuga indirecta). Tampoco desde el propio dominio: si `index.js` o un
 *    componente del sitio importaran su `admin/`, el panel viajaría en el paquete de cada
 *    lector. La única salvedad es el `import()` de `routes.jsx` a una página del panel
 *    (`src/pages/admin/…` o la página del `admin/` de un dominio): así es como el panel se
 *    carga aparte.
 * 3. Un dominio solo importa de otro sus puertas (`index.js` o `admin/index.js`).
 * 4. El resto del sitio también entra por la puerta, con tres salvedades, cada una por
 *    una razón que no es de gusto:
 *    - `import()` de una página de un dominio desde `routes.jsx`: es la línea por la que
 *      Vite parte el código; por la puerta, la página viajaría con todo lo demás;
 *    - los pasos de las guías (`features/<tema>/guia.js`, o lo que haya en una carpeta
 *      `guides/` si un dominio llega a tener varias): son datos sin JSX, y las guías de
 *      `lib/guias/` los leen desde una prueba que corre en node, que no entiende el JSX
 *      que trae `index.js`;
 *    - las fachadas de la mudanza (`FACHADAS`, con quién las quita). Cada fachada dice
 *      también quién la importa, y nadie más puede: el código nuevo entra por la puerta.
 * 5. Los pasos de las guías de un dominio son datos: solo importan otros pasos de guía
 *    (`guia.js` o `guides/*.js`) o un `.json`. Nada de componentes ni JSX (los lee node).
 * 6. Un `import()` con una ruta calculada (una plantilla, una variable) no se puede
 *    comprobar: solo se admite en `routes.jsx`.
 *
 * 7. `src/api/` (el cliente HTTP: núcleo, sesión y quiosco) es lo de abajo: solo importa
 *    de `src/api/` y de `src/i18n/` (los textos de los errores). Nada del sitio, del panel
 *    ni de un dominio: son ellos los que lo usan. Igual `src/config/` (los datos fijos del
 *    sitio: marca, menú, equipo…), que solo importa de `src/config/`.
 *
 * Y dos sobre la forma, no sobre las importaciones («la forma de los dominios»):
 *
 * 8. Ninguna carpeta dentro de un dominio guarda un solo archivo de código (`.js` o
 *    `.jsx`, contando lo que cuelga de ella; las hojas `.css` y las pruebas no cuentan:
 *    una página con su hoja sigue siendo una página). Una carpeta así es un nombre de
 *    más: el archivo va un nivel arriba, con su hoja.
 * 9. Ningún archivo de un dominio pasa de 1.000 líneas: más largo ya no se lee de una
 *    sentada, y se parte por lo que hace (lógica de negocio), no por tipo de archivo.
 *
 * Y una sobre la red:
 *
 * 10. Nadie fuera de `src/api/` llama a la red por su cuenta (`fetch`, `sendBeacon`,
 *     `XMLHttpRequest`): todo va por el cliente, que es donde se arreglan una vez los
 *     errores, la sesión y el quiosco. Los que tienen un motivo están en
 *     `RED_FUERA_DEL_CLIENTE`, con cuántas llamadas cada uno; el número solo puede bajar.
 *
 * Cada regla tiene su trampa en «la prueba ve las trampas» (y la de la red, en la suya):
 * un sitio de mentira en una carpeta temporal donde cada falta está puesta a propósito.
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

/**
 * Las fachadas de la mudanza: pueden importar las tripas de un dominio. Ruta → quién la
 * quita (`quita`) y los únicos archivos que la pueden importar (`importadores`).
 */
const FACHADAS = {
  "src/hooks/useHeadlines.js": {
    quita: "titulares, cuando haceCuanto se mude a un sitio compartido (LugarYFecha, por la puerta, cambiaría el orden del CSS)",
    importadores: ["src/components/home/LugarYFecha.jsx"],
  },
  "src/lib/analitica.js": {
    quita: "analitica, cuando la barra de la publicidad, useVistaPrevia y la api del boletín importen de " +
      "features/analitica (por la puerta se reordena index-*.js)",
    importadores: [
      "src/features/publicidad/components/BarraPublicitaria.jsx",
      "src/hooks/useVistaPrevia.js",
      "src/features/boletin/api.js",
    ],
  },
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
  "src/features/cuenta/components/RetratoDelLector.jsx → src/components/admin/RecorteDeAvatar.jsx":
    "el recorte del retrato lo usan el panel y la cuenta del lector; la quita quien lo mude a src/ui/",
};

/**
 * Quién llama a la red por su cuenta fuera de `src/api/`, cuántas veces (`fetch`,
 * `navigator.sendBeacon` y `new XMLHttpRequest`, contadas en el código) y por qué. Es un
 * trinquete: el número solo puede bajar. Si una llamada pasa al cliente, se baja aquí (y
 * se quita la línea al llegar a cero); una nueva fuera del cliente no pasa la prueba.
 */
const RED_FUERA_DEL_CLIENTE = {
  "src/features/analitica/medicion.js": {
    llamadas: 3,
    porque: "la medición sale por sendBeacon (o fetch con keepalive) como text/plain, sin pregunta previa de CORS " +
      "y sin credenciales, y no espera respuesta: el cliente manda JSON y lee la respuesta",
  },
  "src/features/publicidad/api.js": {
    llamadas: 2,
    porque: "las impresiones, igual que la medición: sendBeacon o fetch con keepalive, text/plain y sin credenciales",
  },
  "src/lib/deteccionDeCaras.js": {
    llamadas: 1,
    porque: "pide un archivo del propio sitio (el clasificador de caras), no la API",
  },
  "src/services/adminMediaService.js": {
    llamadas: 1,
    porque: "la subida de video a Cloudflare Stream: XMLHttpRequest por la barra de progreso, y sin nuestro token (es un tercero)",
  },
};

/**
 * Los nombres en español de las carpetas de un dominio (estructura del 20-nov-2026, 9e9850a):
 * ya no se usan, y la prueba de abajo impide que vuelvan.
 */
const CARPETAS_EN_ESPANOL = ["componentes", "paginas", "ganchos", "servicios", "logica", "panel", "guias"];

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
  const DOMINIOS = path.join(SRC, "features");
  const UI = path.join(SRC, "ui");
  const API = path.join(SRC, "api");
  const I18N = path.join(SRC, "i18n");
  const CONFIG = path.join(SRC, "config");
  const relativa = (ruta) => path.relative(raiz, ruta).split(path.sep).join("/");
  /** De qué dominio es una ruta (`monedas`), o null si no es de ninguno. */
  const dominioDe = (ruta) => (dentroDe(ruta, DOMINIOS) ? path.relative(DOMINIOS, ruta).split(path.sep)[0] : null);
  const esLaPuerta = (ruta, dominio) =>
    ruta === path.join(DOMINIOS, dominio, "index.js") || ruta === path.join(DOMINIOS, dominio, "admin", "index.js");
  /** Si una ruta está en una carpeta del panel: alguna `admin/` de `src/` (también la de un dominio). */
  const enPanel = (ruta) => path.relative(SRC, path.dirname(ruta)).split(path.sep).includes("admin");
  /** Los archivos de código, sin pruebas ni El Analista (se trae tal cual). */
  const archivos = existsSync(SRC)
    ? readdirSync(SRC, { recursive: true })
        .map((n) => path.join(SRC, n))
        .filter((r) => /\.(jsx?|mjs)$/.test(r) && !/\.test\./.test(r) && !relativa(r).startsWith("src/juegos/el-analista/"))
    : [];

  const RUTAS = path.join(SRC, "routes.jsx");
  /** Si la puerta de su dominio (`index.js` o `admin/index.js`) exporta este archivo. */
  const loExportaLaPuerta = (destino) => {
    const d = dominioDe(destino);
    return [path.join(DOMINIOS, d, "index.js"), path.join(DOMINIOS, d, "admin", "index.js")].some(
      (puerta) => existsSync(puerta) &&
        importaciones(readFileSync(puerta, "utf8")).some((i) => i.especificador && resolver(puerta, i.especificador) === destino),
    );
  };
  /** Una página de un dominio: un `.jsx` de su raíz, `pages/`, `admin/` o `admin/pages/` que la puerta no exporta. */
  const esPagina = (destino) => {
    const d = dominioDe(destino);
    if (!d || !destino.endsWith(".jsx")) return false;
    const base = path.join(DOMINIOS, d);
    const carpetas = [base, path.join(base, "pages"), path.join(base, "admin"), path.join(base, "admin", "pages")];
    return carpetas.includes(path.dirname(destino)) && !loExportaLaPuerta(destino);
  };
  /** El `import()` de `routes.jsx` a una página del panel: así se carga aparte. */
  const lazyDelPanel = (ruta, destino, dinamico) =>
    dinamico && ruta === RUTAS && (dentroDe(destino, path.join(SRC, "pages", "admin")) || esPagina(destino));
  /** Los pasos de una guía: `features/<tema>/guia.js` o lo que cuelgue de `features/<tema>/guides/`. */
  const esGuia = (r) => {
    const d = dominioDe(r);
    return Boolean(d) && (r === path.join(DOMINIOS, d, "guia.js") || dentroDe(r, path.join(DOMINIOS, d, "guides")));
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
      if (dentroDe(ruta, API) && !dentroDe(destino, API) && !dentroDe(destino, I18N)) {
        salida.push(`${donde}; src/api/ es lo de abajo: solo importa de src/api/ y src/i18n/`);
        continue;
      }
      if (dentroDe(ruta, CONFIG) && !dentroDe(destino, CONFIG)) {
        salida.push(`${donde}; src/config/ son datos: solo importa de src/config/`);
        continue;
      }
      if (esGuia(ruta) && !((esGuia(destino) && destino.endsWith(".js")) ||
        (destino.endsWith(".json") && path.basename(path.dirname(destino)) === "guides"))) {
        salida.push(`${donde}; los pasos de una guía son datos: solo importan otros pasos de guía (guia.js, guides/)`);
        continue;
      }
      const fachada = fachadas[relativa(destino)];
      if (fachada && !fachada.importadores.includes(rel)) {
        salida.push(`${donde}; una fachada solo la importan los de su lista (FACHADAS): lo nuevo entra por la puerta`);
        continue;
      }
      const otro = dominioDe(destino);
      if (otro && dentroDe(ruta, UI)) {
        salida.push(`${donde}; ui/ no conoce los dominios, ni por su puerta (son ellos los que usan ui/)`);
      } else if (enPanel(destino) && !enPanel(ruta) && !lazyDelPanel(ruta, destino, dinamico) &&
        !(`${rel} → ${relativa(destino)}` in fugas)) {
        salida.push(`${donde}; lo del panel solo se importa desde una carpeta del panel (una admin/, también la de un dominio)`);
      } else if (!otro || otro === suyo || esLaPuerta(destino, otro) || rel in fachadas) {
        continue;
      } else if (suyo) {
        salida.push(`${donde}; de otro dominio, solo sus puertas (features/${otro}/index.js o admin/index.js)`);
      } else if (dinamico && ruta === RUTAS && esPagina(destino)) {
        continue;
      } else if (esGuia(destino) && destino.endsWith(".js")) {
        continue;
      } else {
        salida.push(`${donde}; desde fuera, solo sus puertas (features/${otro}/index.js o admin/index.js)`);
      }
    }
  }
  return salida;
};

/** Si un nodo es una llamada a la red: `fetch(…)`, `window.fetch(…)`, `x.sendBeacon(…)` o `new XMLHttpRequest()`. */
const esLlamadaDeRed = (n) => {
  if (n.type === "NewExpression") return n.callee.type === "Identifier" && n.callee.name === "XMLHttpRequest";
  if (n.type !== "CallExpression") return false;
  const c = n.callee;
  if (c.type === "Identifier") return c.name === "fetch";
  if (c.type !== "MemberExpression" || c.computed || c.property.type !== "Identifier") return false;
  if (c.property.name === "sendBeacon") return true;
  return c.property.name === "fetch" && c.object.type === "Identifier" && ["window", "globalThis", "self"].includes(c.object.name);
};

/**
 * Las llamadas a la red fuera de `src/api/` (sin pruebas ni El Analista), por archivo:
 * `{ "src/x.js": [línea, …] }`. Se leen del árbol del código: un comentario o un texto
 * que diga `fetch(` no cuentan.
 */
export const llamadasDeRed = (raiz = RAIZ) => {
  const SRC = path.join(raiz, "src");
  const relativa = (ruta) => path.relative(raiz, ruta).split(path.sep).join("/");
  if (!existsSync(SRC)) return {};
  const salida = {};
  for (const n of readdirSync(SRC, { recursive: true })) {
    const ruta = path.join(SRC, n);
    const rel = relativa(ruta);
    if (!/\.(jsx?|mjs)$/.test(rel) || /\.test\./.test(rel) || rel.startsWith("src/api/") || rel.startsWith("src/juegos/el-analista/")) continue;
    const lineas = [];
    const visitar = (nodo) => {
      if (!nodo || typeof nodo.type !== "string") return;
      if (esLlamadaDeRed(nodo)) lineas.push(nodo.loc.start.line);
      for (const clave of espree.VisitorKeys[nodo.type] ?? []) {
        const hijo = nodo[clave];
        for (const h of Array.isArray(hijo) ? hijo : [hijo]) visitar(h);
      }
    };
    visitar(espree.parse(readFileSync(ruta, "utf8"), OPCIONES));
    if (lineas.length) salida[rel] = lineas;
  }
  return salida;
};

/** Lo que no cuadra con `excepciones`: llamadas de más, o una lista que ya puede bajar. */
export const faltasDeRed = (raiz = RAIZ, excepciones = RED_FUERA_DEL_CLIENTE) => {
  const vistas = llamadasDeRed(raiz);
  const salida = [];
  for (const [rel, lineas] of Object.entries(vistas)) {
    const permitidas = excepciones[rel]?.llamadas ?? 0;
    if (lineas.length > permitidas) {
      salida.push(`${rel}: ${lineas.length} llamadas a la red por su cuenta (líneas ${lineas.join(", ")}), ` +
        `la lista deja ${permitidas}; van por el cliente de src/api/`);
    }
  }
  for (const [rel, { llamadas }] of Object.entries(excepciones)) {
    const hay = vistas[rel]?.length ?? 0;
    if (hay < llamadas) {
      salida.push(`${rel}: ahora ${hay} llamadas a la red y la lista dice ${llamadas}; baja el número en ` +
        "RED_FUERA_DEL_CLIENTE (o quita la línea si es cero)");
    }
  }
  return salida.sort();
};

/** Las carpetas con nombre en español que han vuelto: `src/dominios` o una de las de antes dentro de un dominio. */
export const carpetasEnEspanol = (raiz = RAIZ) => {
  const dominios = path.join(raiz, "src", "features");
  const viejas = existsSync(path.join(raiz, "src", "dominios")) ? ["src/dominios"] : [];
  if (!existsSync(dominios)) return viejas;
  // A cualquier profundidad: tampoco vale un `admin/componentes/`.
  const dentro = readdirSync(dominios, { recursive: true })
    .filter((r) => CARPETAS_EN_ESPANOL.includes(path.basename(r)) && statSync(path.join(dominios, r)).isDirectory())
    .map((r) => `src/features/${r.split(path.sep).join("/")}`);
  return [...viejas, ...dentro.sort()];
};

/** Más líneas que esto, y un archivo de un dominio se parte (regla 9). */
const MAX_LINEAS = 1000;

/**
 * La forma de los dominios (reglas 8 y 9): las carpetas de un dominio con un solo archivo
 * de código (`.js`/`.jsx` sin pruebas, contando lo que cuelga de ellas) y los archivos de
 * más de `maxLineas` líneas.
 */
export const formaDeLosDominios = (raiz = RAIZ, maxLineas = MAX_LINEAS) => {
  const dominios = path.join(raiz, "src", "features");
  if (!existsSync(dominios)) return [];
  const relativa = (ruta) => path.relative(raiz, ruta).split(path.sep).join("/");
  const todo = readdirSync(dominios, { recursive: true }).map((r) => path.join(dominios, r));
  const carpetas = todo.filter((r) => statSync(r).isDirectory());
  const archivos = todo.filter((r) => statSync(r).isFile());
  const esCodigo = (r) => /\.jsx?$/.test(r) && !/\.test\./.test(r);
  const salida = [];
  for (const carpeta of carpetas) {
    if (path.dirname(carpeta) === dominios) continue; // `features/<tema>/` es el dominio, no una carpeta suya
    const suyos = archivos.filter((a) => dentroDe(a, carpeta) && esCodigo(a));
    if (suyos.length === 1) {
      salida.push(`${relativa(carpeta)}/: un solo archivo de código (${relativa(suyos[0])}); va un nivel arriba, sin carpeta`);
    }
  }
  for (const archivo of archivos) {
    const texto = readFileSync(archivo, "utf8");
    const lineas = texto.split("\n").length - (texto.endsWith("\n") ? 1 : 0);
    if (lineas > maxLineas) {
      salida.push(`${relativa(archivo)}: ${lineas} líneas, más de ${maxLineas}; se parte por lo que hace`);
    }
  }
  return salida.sort();
};

const DOMINIOS = path.join(RAIZ, "src", "features");

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

test("cada importador de una fachada la sigue importando (uno que ya no, se quita de su lista)", () => {
  const sobran = [];
  for (const [fachada, { importadores }] of Object.entries(FACHADAS)) {
    for (const importador of importadores) {
      const ruta = path.join(RAIZ, importador);
      const la = existsSync(ruta) && importaciones(readFileSync(ruta, "utf8"))
        .some((i) => i.especificador && resolver(ruta, i.especificador) === path.join(RAIZ, fachada));
      if (!la) sobran.push(`${importador} → ${fachada}`);
    }
  }
  assert.deepEqual(sobran, []);
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

test("los nombres en español no vuelven: ni src/dominios ni componentes/, paginas/, ganchos/, servicios/, logica/, panel/ o guias/ dentro de un dominio", () => {
  // Las carpetas van en inglés, con los nombres de siempre de React (estructura del
  // 20-nov-2026). Un `panel/` dentro de un dominio, además, ya no se vigilaría como panel.
  assert.deepEqual(carpetasEnEspanol(), []);
});

test("la prueba de los nombres ve las trampas", () => {
  const raiz = mkdtempSync(path.join(os.tmpdir(), "arquitectura-nombres-"));
  try {
    for (const carpeta of [
      "src/dominios/a", //                    ✗ la carpeta de antes
      "src/features/a/components", //         bien
      "src/features/a/admin/pages", //        bien
      ...CARPETAS_EN_ESPANOL.map((c) => `src/features/a/${c}`), // ✗ cada una
      "src/features/b/admin/componentes", //  ✗ también dentro del panel
      "src/components/admin", //              bien: fuera de los dominios no se mira
    ]) {
      mkdirSync(path.join(raiz, carpeta), { recursive: true });
    }
    // Un archivo con un nombre de antes no es una carpeta: no cuenta.
    writeFileSync(path.join(raiz, "src/features/b/logica"), "");
    assert.deepEqual(carpetasEnEspanol(raiz), [
      "src/dominios",
      "src/features/a/componentes",
      "src/features/a/ganchos",
      "src/features/a/guias",
      "src/features/a/logica",
      "src/features/a/paginas",
      "src/features/a/panel",
      "src/features/a/servicios",
      "src/features/b/admin/componentes",
    ]);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test("la prueba ve las trampas", () => {
  // Un sitio de mentira: cada línea marcada con ✗ es una falta puesta a propósito.
  const raiz = mkdtempSync(path.join(os.tmpdir(), "arquitectura-"));
  const sitio = {
    "src/features/a/index.js": [
      'export { X } from "./components/X";', //        bien
      'export { Panel } from "./admin/Panel";', //     ✗ 2: la puerta del sitio no carga el panel
    ],
    "src/features/a/components/X.jsx": [
      'import { B } from "../../b";', //               bien: la puerta de otro
      'import { Y } from "../../b/components/Y";', //  ✗ 3: las tripas de otro
      'import { Q } from "../../b/admin";', //         ✗ 2: el panel de otro, desde el sitio
      'import { P } from "../admin/Panel";', //        ✗ 2: su propio panel, desde el sitio
      'import { api } from "../admin/services/api";', // ✗ 2: también lo de las subcarpetas del panel
    ],
    "src/features/a/admin/Panel.jsx": [
      'import { Q } from "../../b/admin";', //         bien: panel con panel
      'import { api } from "./services/api";', //      bien
      'import { X } from "../components/X";', //       bien: el panel usa lo del sitio de su dominio
    ],
    "src/features/a/admin/services/api.js": [],
    "src/features/b/index.js": [
      'export { Tarjeta } from "./Tarjeta";', //        bien: lo que usa el sitio (no es una página)
    ],
    "src/features/b/Tarjeta.jsx": [],
    "src/features/b/Seccion.jsx": [], //               una página en la raíz (la puerta no la exporta)
    "src/features/b/utils.js": [],
    "src/features/b/datos.json": [],
    "src/features/b/admin/AdminB.jsx": [], //          una página del panel en la raíz de admin/
    "src/features/b/admin/Exportado.jsx": [],
    "src/features/b/guia.js": [
      'import { MAS } from "./guides/mas.js";', //      bien: otros pasos de guía
      'import { T } from "./Tarjeta";', //              ✗ 5: una guía no importa componentes
      'import datos from "./datos.json";', //           ✗ 5: un .json, solo de una carpeta guides/
    ],
    "src/features/b/components/Y.jsx": [],
    "src/features/b/admin/index.js": [
      'export { Exportado } from "./Exportado";',
    ],
    "src/features/b/admin/components/Z.jsx": [
      'import { B } from "../../index.js";', //        bien: su propia puerta
    ],
    "src/features/b/pages/Pag.jsx": [],
    "src/features/b/admin/pages/Panel.jsx": [],
    "src/features/b/guides/pasos.js": [
      'import { MAS } from "./mas.js";', //             bien: datos de otra guía
      'import { Y } from "../components/Y";', //        ✗ 5: una guía no importa componentes
    ],
    "src/features/b/guides/mas.js": [],
    "src/components/admin/X.jsx": [
      'import { Q } from "../../features/b/admin";', // bien: panel con panel
    ],
    "src/ui/Boton.jsx": [
      'import { B } from "../features/b";', //         ✗ 1: ui no usa dominios, ni por la puerta
    ],
    "src/pages/admin/Cinta.jsx": [
      'import { Q } from "../../features/b/admin";', // bien
      'import { Z } from "../../features/b/admin/components/Z";', // ✗ 4: panel con panel, pero por la puerta
    ],
    "src/pages/Home.jsx": [
      'import { B } from "../features/b";', //         bien
      'import { Q } from "../features/b/admin";', //   ✗ 2
      'import { Y } from "../features/b/components/Y";', // ✗ 4
      'import { X } from "../components/admin/X";', // ✗ 2: la fuga indirecta (X importa el panel)
      "const M = (n) => import(`./mapas/${n}.js`);", // ✗ 6: una ruta calculada
      'import { Y as F } from "../lib/fachada";', //    bien: Home.jsx está en la lista de la fachada
      'import { pedir } from "../api/nucleo";', //       bien: todos usan el cliente
    ],
    "src/api/nucleo.js": [
      'import { t } from "../i18n/motor";', //          bien: los textos de los errores
      'import { s } from "./sesion";', //               bien
      'import { x } from "../lib/x";', //               ✗ 7: nada del sitio
      'import { B } from "../features/b";', //          ✗ 7: ni un dominio, por la puerta
      'import { X } from "../components/admin/X";', //  ✗ 7: ni el panel
    ],
    "src/api/sesion.js": [],
    "src/config/sitio.js": [
      'import { TEAM } from "./equipo";', //            bien
      'import { t } from "../i18n/motor";', //          ✗ 7: datos, sin nada más
    ],
    "src/config/equipo.js": [],
    "src/i18n/motor.js": [],
    "src/lib/x.js": [],
    "src/routes.jsx": [
      'const P = () => import("./features/b/pages/Pag");', // bien: el lazy de una página
      'import { Y } from "./features/b/components/Y";', //     ✗ 4: lo demás, por la puerta
      'const A = () => import("./features/b/admin/pages/Panel");', // bien: el lazy del panel
      'const C = () => import("./pages/admin/Cinta");', //               bien: también
      'import { Cinta } from "./pages/admin/Cinta";', //                ✗ 2: sin lazy, no
      "const I = (n) => import(`./pages/${n}`);", //                     bien: en routes.jsx sí
      'const S = () => import("./features/b/Seccion");', //             bien: una página en la raíz
      'const T = () => import("./features/b/Tarjeta");', //             ✗ 4: la puerta la exporta, no es página
      'const AB = () => import("./features/b/admin/AdminB");', //       bien: página del panel en admin/
      'const U = () => import("./features/b/utils");', //               ✗ 4: un .js no es una página
      'const E = () => import("./features/b/admin/Exportado");', //     ✗ 2: la puerta del panel lo exporta
    ],
    "src/lib/guias/g.js": [
      'import { pasos } from "../../features/b/guides/pasos.js";', // bien: datos de una guía
      'import { PASOS } from "../../features/b/guia.js";', //         bien: también guia.js
    ],
    "src/lib/fachada.js": [
      'export { Y } from "../features/b/components/Y";', // bien: es una fachada
    ],
    "src/pages/Otra.jsx": [
      'import { Y } from "../lib/fachada";', //         ✗ 4: no está en la lista de la fachada
    ],
  };
  try {
    for (const [ruta, lineas] of Object.entries(sitio)) {
      mkdirSync(path.dirname(path.join(raiz, ruta)), { recursive: true });
      writeFileSync(path.join(raiz, ruta), lineas.join("\n"));
    }
    const claves = faltas(raiz, { "src/lib/fachada.js": { quita: "prueba", importadores: ["src/pages/Home.jsx"] } }, {}).map((f) => f.split(";")[0].replace(": importa ", " "));
    assert.deepEqual(claves.sort(), [
      "src/api/nucleo.js:3 src/lib/x.js",
      "src/api/nucleo.js:4 src/features/b/index.js",
      "src/api/nucleo.js:5 src/components/admin/X.jsx",
      "src/config/sitio.js:2 src/i18n/motor.js",
      "src/features/a/components/X.jsx:2 src/features/b/components/Y.jsx",
      "src/features/a/components/X.jsx:3 src/features/b/admin/index.js",
      "src/features/a/components/X.jsx:4 src/features/a/admin/Panel.jsx",
      "src/features/a/components/X.jsx:5 src/features/a/admin/services/api.js",
      "src/features/a/index.js:2 src/features/a/admin/Panel.jsx",
      "src/features/b/guia.js:2 src/features/b/Tarjeta.jsx",
      "src/features/b/guia.js:3 src/features/b/datos.json",
      "src/features/b/guides/pasos.js:2 src/features/b/components/Y.jsx",
      "src/pages/Home.jsx:2 src/features/b/admin/index.js",
      "src/pages/Home.jsx:3 src/features/b/components/Y.jsx",
      "src/pages/Home.jsx:4 src/components/admin/X.jsx",
      "src/pages/Home.jsx:5 (ruta calculada)",
      "src/pages/Otra.jsx:1 src/lib/fachada.js",
      "src/pages/admin/Cinta.jsx:2 src/features/b/admin/components/Z.jsx",
      "src/routes.jsx:10 src/features/b/utils.js",
      "src/routes.jsx:11 src/features/b/admin/Exportado.jsx",
      "src/routes.jsx:2 src/features/b/components/Y.jsx",
      "src/routes.jsx:5 src/pages/admin/Cinta.jsx",
      "src/routes.jsx:8 src/features/b/Tarjeta.jsx",
      "src/ui/Boton.jsx:1 src/features/b/index.js",
    ]);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test("nadie fuera de src/api/ llama a la red por su cuenta, salvo la lista (y la lista solo baja)", () => {
  const lista = faltasDeRed();
  assert.deepEqual(lista, [], `\n${lista.join("\n")}`);
});

test("la prueba de la red ve las trampas", () => {
  const raiz = mkdtempSync(path.join(os.tmpdir(), "arquitectura-red-"));
  const sitio = {
    "src/api/nucleo.js": "export const p = () => fetch('/x');", //         bien: es el cliente
    "src/lib/suelta.js": [
      "// fetch('/comentario') no cuenta",
      "const t = 'fetch(\"/un texto\")';", //                                   no cuenta
      "export const a = () => fetch('/a');", //                               ✗ 10
      "export const b = () => window.fetch('/b');", //                        ✗ 10
      "export const c = () => globalThis.fetch('/c');", //                    ✗ 10
      "export const d = () => navigator.sendBeacon('/d', '');", //            ✗ 10
      "export const e = () => new XMLHttpRequest();", //                      ✗ 10
      "export const f = (cliente) => cliente.fetch('/f');", //                no cuenta: no es el del navegador
    ].join("\n"),
    "src/lib/suelta.test.mjs": "fetch('/en una prueba no cuenta');",
    "src/juegos/el-analista/el-analista.jsx": "fetch('/se trae tal cual');",
    "src/lib/con-permiso.js": "fetch('/1'); fetch('/2');", //                bien: la lista deja 2
    "src/lib/ya-baja.js": "fetch('/1');", //                                 ✗ 10: la lista dice 2; ya puede bajar
    "src/lib/se-fue.js": "export const x = 1;", //                           ✗ 10: en la lista y sin llamadas
  };
  const excepciones = {
    "src/lib/con-permiso.js": { llamadas: 2, porque: "prueba" },
    "src/lib/ya-baja.js": { llamadas: 2, porque: "prueba" },
    "src/lib/se-fue.js": { llamadas: 1, porque: "prueba" },
  };
  try {
    for (const [ruta, texto] of Object.entries(sitio)) {
      mkdirSync(path.dirname(path.join(raiz, ruta)), { recursive: true });
      writeFileSync(path.join(raiz, ruta), texto);
    }
    assert.deepEqual(llamadasDeRed(raiz), {
      "src/lib/con-permiso.js": [1, 1],
      "src/lib/suelta.js": [3, 4, 5, 6, 7],
      "src/lib/ya-baja.js": [1],
    });
    assert.deepEqual(faltasDeRed(raiz, excepciones).map((f) => f.split(":")[0]), [
      "src/lib/se-fue.js",
      "src/lib/suelta.js",
      "src/lib/ya-baja.js",
    ]);
    // Sin la lista, también salta la que tenía permiso.
    assert.ok(faltasDeRed(raiz, {}).some((f) => f.startsWith("src/lib/con-permiso.js:")));
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test("la forma de los dominios: ninguna carpeta con un solo archivo de código, ningún archivo de más de 1.000 líneas", () => {
  const lista = formaDeLosDominios();
  assert.deepEqual(lista, [], `\n${lista.join("\n")}`);
});

test("la prueba de la forma ve las trampas", () => {
  const raiz = mkdtempSync(path.join(os.tmpdir(), "arquitectura-forma-"));
  const lineas = (n) => Array.from({ length: n }, (_, i) => `// ${i + 1}`).join("\n") + "\n";
  const sitio = {
    "src/features/a/index.js": "", //                       bien: la carpeta del dominio no cuenta
    "src/features/a/utils.js": lineas(1000), //             bien: justo en el tope
    "src/features/a/largo.js": lineas(1001), //             ✗ 9: una línea de más
    "src/features/a/hooks/useX.js": "", //                  ✗ 8: un solo gancho en su carpeta
    "src/features/a/components/X.jsx": "", //               bien: dos componentes
    "src/features/a/components/Y.jsx": "",
    "src/features/a/components/mapa/M.jsx": "", //         ✗ 8: aunque cuelgue de una carpeta buena
    "src/features/a/admin/pages/AdminA.jsx": "", //         ✗ 8: una página con su hoja sigue siendo una
    "src/features/a/admin/pages/admin.css": "",
    "src/features/a/admin/vistas/Uno.jsx": "", //           bien: dos páginas, aunque una lleve hoja
    "src/features/a/admin/vistas/Dos.jsx": "",
    "src/features/a/admin/vistas/dos.css": "",
    "src/features/a/utils/x.js": "", //                     ✗ 8: su prueba no cuenta
    "src/features/a/utils/x.test.mjs": "",
    "src/features/a/estilos/a.css": "", //                  bien: sin código no es la carpeta de un archivo de código
    "src/features/a/admin/services/api.js": "", //          ✗ 8
    "src/features/b/index.js": "",
    "src/features/b/admin/solo/dentro/z.js": "", //         ✗ 8, tres veces: admin/, solo/ y dentro/
    "src/pages/x/Unica.jsx": "", //                         bien: fuera de los dominios no se mira
  };
  try {
    for (const [ruta, texto] of Object.entries(sitio)) {
      mkdirSync(path.dirname(path.join(raiz, ruta)), { recursive: true });
      writeFileSync(path.join(raiz, ruta), texto);
    }
    assert.deepEqual(formaDeLosDominios(raiz).map((f) => f.split(":")[0]), [
      "src/features/a/admin/pages/",
      "src/features/a/admin/services/",
      "src/features/a/components/mapa/",
      "src/features/a/hooks/",
      "src/features/a/largo.js",
      "src/features/a/utils/",
      "src/features/b/admin/",
      "src/features/b/admin/solo/",
      "src/features/b/admin/solo/dentro/",
    ]);
    // El tope se puede bajar para la prueba: con 999, utils.js también salta.
    assert.ok(formaDeLosDominios(raiz, 999).some((f) => f.startsWith("src/features/a/utils.js:")));
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
