/**
 * Cambiar un módulo del sitio por un doble, solo en una prueba.
 *
 *     const datos = sustituir({
 *       "src/hooks/usePieces.js": { usePieces: () => ({ status: "loading", items: [] }) },
 *     });
 *     const { Home } = await import("../src/pages/Home.jsx"); // ya con el doble
 *     datos["src/hooks/usePieces.js"].usePieces = () => ({ status: "error", ... });
 *
 * - Las rutas van desde la raíz del repositorio; cada una, a un objeto con lo que
 *   exporta el doble. Quien importe ese archivo (por la ruta que sea) recibe el doble.
 * - Las funciones del doble se buscan en el objeto **cada vez que se llaman**: cambiar
 *   `datos[...].usePieces` entre dos pintados cambia lo que ve el componente.
 * - Se llama una sola vez por archivo de prueba y **antes** de importar (con `import()`)
 *   lo que use esos módulos: lo que ya se cargó no se puede cambiar.
 *
 * Úsese solo para lo que la prueba no puede hacer de verdad -- con `renderToString` los
 * efectos no corren, así que un hook que trae datos en un `useEffect` se queda siempre
 * «cargando». Todo lo demás, de verdad.
 */
import { register } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const ALMACEN = Symbol.for("sureconomics.pruebas.dobles");

let usado = false;

export const sustituir = (mapa) => {
  if (usado) throw new Error("sustituir() se llama una sola vez por archivo de prueba.");
  usado = true;
  globalThis[ALMACEN] = {};
  const exportaciones = {};
  for (const [relativa, doble] of Object.entries(mapa)) {
    const url = pathToFileURL(path.join(RAIZ, relativa)).href;
    globalThis[ALMACEN][url] = doble;
    exportaciones[url] = Object.keys(doble);
  }
  register("./ganchos-dobles.mjs", import.meta.url, { data: { exportaciones, almacen: ALMACEN.description } });
  return mapa;
};
