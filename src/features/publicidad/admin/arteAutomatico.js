/**
 * Qué piezas llevan todavía un arte de teléfono hecho solo por el panel, para ofrecer
 * quitarlo. Va en su archivo y no en `utils.js`: junto a los formatos, su código cambiaría
 * de sitio en el JS construido del panel.
 */
import { esArteTelefonoAutomatico } from "../arteTelefono";

/** Si el arte de teléfono de una pieza lo armó el panel solo (2-nov, retirado). */
export const conArteAutomatico = (pieza) =>
  Boolean(pieza.cinta_movil_id) &&
  esArteTelefonoAutomatico(pieza.cinta_movil_asset?.original_filename || pieza.cinta_movil_asset?.url);

/** Las piezas con un arte de teléfono hecho solo, para quitárselo. */
export const piezasConArteAutomatico = (anunciantes) =>
  (anunciantes ?? []).flatMap((a) =>
    (a.campanas ?? []).flatMap((c) => (c.creatividades ?? []).filter(conArteAutomatico)),
  );
