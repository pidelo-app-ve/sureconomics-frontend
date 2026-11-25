/**
 * `src/ui/`: los componentes que comparten tres temas o más, sin lógica de ningún tema.
 * No importan ninguna feature ni ninguna página (lo vigila `src/arquitectura.test.mjs`):
 * son ellas las que usan `ui/`.
 *
 * Aquí sale lo de siempre de una lista o una página: cargando, error, vacío y la
 * paginación (`import { LoadingState } from "../ui"`). `TituloDePieza.jsx` (el título de
 * una pieza, con su enlace) se importa por su archivo, como antes.
 *
 * Lo que solo usa el panel va en `ui/admin/` (la confirmación, `useAdminConfirm.jsx` con
 * `AdminConfirmDialog.jsx`, y las páginas de una lista, `PaginasDeLaLista.jsx`): es una
 * carpeta del panel, así que nada del sitio la puede importar y no viaja en el paquete del
 * lector. Se importa por su archivo; no sale por aquí.
 */
export { LoadingState } from "./LoadingState";
export { ErrorState } from "./ErrorState";
export { EmptyState } from "./EmptyState";
export { Pagination } from "./Pagination";

