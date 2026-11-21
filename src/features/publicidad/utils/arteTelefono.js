/**
 * Los artes de teléfono que armó el panel solo, desde la tira (2-nov-2026, retirado el
 * mismo día).
 *
 * Se probaron dos formas -- recomponer logo, frase y botón, y partir la tira en dos
 * pisos -- y ninguna sale bien siempre: cada anunciante compone su banner distinto
 * (fotos de fondo, collages, botones pegados a la decoración). El arte de teléfono lo
 * hace el anunciante; ver `marca/banners/telefono/LEEME.md` para las medidas.
 *
 * Los que se llegaron a subir se reconocen por el nombre que les puso el panel
 * (`<anunciante>-telefono-1200x600…` y `<anunciante>-telefono-pisos-1200x600…`): el
 * sitio no los usa y el panel ofrece quitarlos.
 */
const AUTOMATICO = /-telefono-(?:pisos-)?1200x600[-.]/;

/** Si una dirección o nombre de archivo es de un arte de teléfono hecho solo. */
export const esArteTelefonoAutomatico = (nombre) => AUTOMATICO.test(String(nombre ?? ""));
