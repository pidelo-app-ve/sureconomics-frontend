/**
 * Los ganchos del cargador de pruebas (los registra `cargador-jsx.mjs`; ver allí el porqué).
 *
 * Node, por sí solo, no sabe cargar lo que Vite sí:
 * - `.jsx`: se traduce a JavaScript con esbuild (el que ya trae Vite), con el JSX
 *   automático de React 17+, como `@vitejs/plugin-react`;
 * - `import "./x"` sin extensión: se prueba `.js`, `.jsx`, `/index.js` y `/index.jsx`,
 *   en el orden en que los busca Vite; y una carpeta de un paquete, su `index.js`;
 * - `import.meta.env`: en `src/` se sustituye por un objeto fijo (`ENTORNO`), con una API
 *   que no existe (`.invalid` no resuelve nunca), para que ninguna prueba llame a la red
 *   de verdad por descuido;
 * - `import "./x.css"`: un módulo vacío (las pruebas no miran estilos);
 * - `import x from "./x.json"` sin `with { type: "json" }`: el JSON como `default`.
 *
 * Fuera de eso no toca nada: lo que Node ya carga (los `.js` con extensión sin
 * `import.meta.env`, los paquetes) pasa tal cual, así que las pruebas que ya había corren
 * igual que antes.
 */
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";

/** Lo que el código del sitio lee de `import.meta.env` durante las pruebas. */
export const ENTORNO = {
  BASE_URL: "/",
  MODE: "test",
  DEV: false,
  PROD: false,
  SSR: true,
  VITE_API_URL: "https://api.prueba.invalid",
};

const SRC = new URL("../../src/", import.meta.url).href;
const SUFIJOS = [".js", ".jsx", "/index.js", "/index.jsx"];

const esArchivo = (url) => {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
};

export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    // Una carpeta de un paquete (`react-router-dom/dist`): su `index.js`, como en Vite.
    if (error?.code === "ERR_UNSUPPORTED_DIR_IMPORT" && error.url && esArchivo(`${error.url}/index.js`)) {
      return { url: `${error.url}/index.js`, shortCircuit: true };
    }
    const relativo = especificador.startsWith("./") || especificador.startsWith("../");
    if (!relativo || error?.code !== "ERR_MODULE_NOT_FOUND" || !contexto.parentURL) throw error;
    for (const sufijo of SUFIJOS) {
      const url = new URL(especificador + sufijo, contexto.parentURL);
      if (esArchivo(url)) return { url: url.href, shortCircuit: true };
    }
    throw error;
  }
}

export async function load(url, contexto, siguiente) {
  if (!url.startsWith("file:")) return siguiente(url, contexto);
  if (url.endsWith(".css")) return { format: "module", source: "export default {};", shortCircuit: true };
  if (url.endsWith(".json") && !contexto.importAttributes?.type) {
    const json = readFileSync(fileURLToPath(url), "utf8");
    return { format: "module", source: `export default ${json};`, shortCircuit: true };
  }
  const esJsx = url.endsWith(".jsx");
  const delSitio = url.startsWith(SRC) && /\.(js|jsx)$/.test(url);
  if (!esJsx && !delSitio) return siguiente(url, contexto);

  const ruta = fileURLToPath(url);
  const fuente = readFileSync(ruta, "utf8");
  if (!esJsx && !fuente.includes("import.meta.env")) return siguiente(url, contexto);
  const { code } = transformSync(fuente, {
    loader: esJsx ? "jsx" : "js",
    jsx: "automatic",
    format: "esm",
    target: "node20",
    sourcefile: ruta,
    sourcemap: "inline",
    define: { "import.meta.env": JSON.stringify(ENTORNO) },
  });
  return { format: "module", source: code, shortCircuit: true };
}
