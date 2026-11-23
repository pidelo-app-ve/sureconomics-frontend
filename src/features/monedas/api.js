/**
 * Lo que el sitio le pide al servidor de las monedas, sin sesión
 * (`app/domains/monedas` en el backend). Lo del panel va en `admin/api.js`: un
 * módulo que usan el sitio y el panel viaja entero en el paquete del sitio.
 */
import { userPublicRequest } from "../../lib/userApi";

/**
 * Las monedas de la región: la última cotización de cada una (unidades por un dólar),
 * su fuente y su fecha. El servidor guarda una foto por hora.
 */
export const getMonedas = async () => userPublicRequest("/monedas");

/** Un punto por día de una moneda, para una gráfica. */
export const getHistoriaMoneda = async (codigo, dias = 30) =>
  userPublicRequest(`/monedas/${encodeURIComponent(codigo)}/historia`, { query: { dias } });
