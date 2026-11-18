/**
 * Después de `vite build`: el shell de la aplicación pasa de `dist/index.html` a
 * `dist/app.html` (tanda 3, 18-nov-2026).
 *
 * Por qué: Vercel sirve los archivos antes de mirar las reescrituras de `vercel.json`, y
 * para `/` el archivo existía (`index.html`). Así no había forma de mandar la portada a su
 * función (`api/portada.js`) desde `vercel.json`. Sin `index.html`, `/` deja de ser un
 * archivo y la regla se aplica en la propia CDN. Todas las reescrituras que antes iban a
 * `/index.html` van ahora a `/app.html`, y `/index.html` redirige a `/`.
 *
 * Las funciones leen este archivo del disco: viaja con ellas (`vercel.json` ->
 * `functions` -> `includeFiles`; ver `leerShell` en `api/_comun.js`).
 *
 * Solo el `build`: el servidor de desarrollo (`npm run dev`) sigue con su `index.html` de
 * siempre. `npm run preview` (el `vite preview` de lo construido) ya no encuentra `/`:
 * para ver la portada construida, `/app.html`.
 */
import { existsSync, renameSync } from "node:fs";

const desde = new URL("../dist/index.html", import.meta.url);
const hacia = new URL("../dist/app.html", import.meta.url);

if (!existsSync(desde)) {
  console.error("shell-como-app: no está dist/index.html; ¿corrió vite build?");
  process.exit(1);
}
renameSync(desde, hacia);
console.log("shell-como-app: dist/index.html -> dist/app.html");
