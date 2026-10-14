import { userPublicRequest } from "../lib/userApi";

/**
 * La LVBP, lo público: los juegos de ayer, hoy y mañana, la tabla y los equipos. Sin
 * sesión. El servidor lo cachea un minuto; en vivo, el marcador vuelve a pedirlo solo.
 */
export const getLvbp = async () => userPublicRequest("/lvbp/hoy");
