import { userPublicRequest } from "../lib/userApi";

/**
 * El resumen diario en tres ediciones (mañana, tarde y noche): lo arma el backend una hora
 * antes de cada salida, lo aprueba el editor y sale a las 7:00, 13:00 y 19:00 (ver
 * `services/resumen_service.py`). Sin sesión.
 *
 * - `getResumen()`: la última edición publicada.
 * - `getResumen("2026-10-26")`: las de ese día que salieron, en `ediciones`.
 * - `getResumen("2026-10-26", "tarde")`: una edición.
 */
export const getResumen = (fecha, edicion) =>
  userPublicRequest(fecha ? (edicion ? `/resumen/${fecha}/${edicion}` : `/resumen/${fecha}`) : "/resumen/ultimo");
