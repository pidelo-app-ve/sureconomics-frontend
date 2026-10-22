import { userPublicRequest } from "../lib/userApi";

/**
 * El resumen diario, «Lo importante de hoy»: lo arma el backend a las 6:00, lo aprueba
 * el editor y sale a las 7:00 (ver `services/resumen_service.py`). Sin sesión.
 *
 * - `getResumen()`: el último publicado.
 * - `getResumen("2026-10-22")`: el de ese día, si salió.
 */
export const getResumen = (fecha) => userPublicRequest(fecha ? `/resumen/${fecha}` : "/resumen/ultimo");
