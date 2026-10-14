import { userPublicRequest } from "../lib/userApi";

/**
 * Las monedas de la región: la última cotización de cada una (unidades por un dólar),
 * su fuente y su fecha. Sin sesión. El servidor guarda una foto por hora.
 */
export const getMonedas = async () => userPublicRequest("/monedas");

/** Un punto por día de una moneda, para una gráfica. */
export const getHistoriaMoneda = async (codigo, dias = 30) =>
  userPublicRequest(`/monedas/${encodeURIComponent(codigo)}/historia`, { query: { dias } });
