/**
 * Para que las pruebas de Node carguen el código del sitio tal como lo escribe Vite.
 *
 * Se registra antes que nada con `--import` (es lo que hace `npm test`):
 *
 *     node --import ./scripts/pruebas/cargador-jsx.mjs --test
 *
 * y desde ahí una prueba puede importar un `.jsx` y pintarlo con `react-dom/server`
 * (`renderToString`), sin navegador ni librerías de más: React, React Router y esbuild
 * ya vienen con el sitio. Qué traduce y por qué: `ganchos-jsx.mjs`.
 *
 * Una prueba que necesite cambiar un módulo por un doble (los datos que trae un hook,
 * por ejemplo) usa `sustituir()` de `dobles.mjs`.
 */
import { register } from "node:module";

register("./ganchos-jsx.mjs", import.meta.url);
