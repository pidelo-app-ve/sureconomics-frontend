/**
 * La portada (`/`) hacia su función, `api/portada.js`.
 *
 * Esto no puede ir en `vercel.json` como `/en` y las piezas: Vercel mira primero los
 * archivos y después las reescrituras, y para `/` el archivo existe (`dist/index.html`).
 * Una regla de `/` en `vercel.json` no se aplicaría nunca (el simulador de rutas lo da
 * como archivo, y Vercel lo confirma en vercel/vercel#5723). El «middleware» de Vercel
 * corre antes que los archivos, y solo en `/` (ver `config`).
 *
 * Mínimo a propósito: si fallara aquí, fallaría la portada entera. Nada de pedir datos ni
 * de leer cabeceras; solo decide a dónde va la petición.
 *  - Con `?_s=1` (la función no pudo leer el shell y manda al estático) sigue al archivo.
 *  - Lo demás, a la función. Sin la consulta: `?utm_…` o `?fbclid=…` son la misma portada,
 *    y así comparten una sola copia en el borde.
 *
 * Sin la librería de Vercel (`@vercel/functions`): su `rewrite()` es exactamente esta
 * respuesta vacía con la cabecera `x-middleware-rewrite`, y una dependencia para eso no
 * vale la pena. No devolver nada es «sigue como si no hubiera middleware».
 */

export const config = { matcher: "/" };

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname !== "/" || url.searchParams.has("_s")) return undefined;
  return new Response(null, {
    headers: { "x-middleware-rewrite": new URL("/api/portada", url.origin).toString() },
  });
}
