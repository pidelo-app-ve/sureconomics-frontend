/**
 * La firma de las piezas que salen de una propuesta de un lector.
 *
 * Decisión de Ramón (17-nov-2026): la pieza aceptada es crédito de quien la escribió y
 * sale firmada con su nombre y apellido y su foto. El servidor los copia de su cuenta a
 * la firma de la pieza al aceptarla (`byline`, `byline_photo`) y se quedan ahí: la web
 * los pinta como cualquier firma. Esto es solo para el panel, que lo dice claro:
 * «Firmada por … (colaborador)». La web pública no enseña esa marca.
 */

const limpio = (valor) => String(valor ?? "").trim();

/** «firmada por Ana Pérez (colaborador)», para ir dentro de una frase; vacía sin nombre. */
export const firmadaPorColaborador = (nombre) => {
  const n = limpio(nombre);
  return n ? `firmada por ${n} (colaborador)` : "";
};

/** «Firmada por Ana Pérez (colaborador)», o cadena vacía si no hay nombre. */
export const textoFirmaDeColaborador = (nombre) => {
  const texto = firmadaPorColaborador(nombre);
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
};

/**
 * Con qué firma sale (o saldrá, si se acepta) la pieza de una propuesta.
 *
 * Aceptada, la que tiene la pieza publicada (`firma_publicada`: la copiada de su cuenta
 * al aceptarla, o la que puso después la redacción). Antes, el nombre de quien la mandó
 * (`autor.nombre`), que es lo que se copiará.
 *
 * @param {Record<string, any> | null | undefined} propuesta - la fila del panel
 * @returns {{ nombre: string, publicada: boolean, tieneFoto: boolean }}
 */
export const firmaDePropuesta = (propuesta) => {
  const publicada = limpio(propuesta?.firma_publicada);
  const nombre = publicada || limpio(propuesta?.autor?.nombre);
  return {
    nombre,
    publicada: Boolean(publicada),
    tieneFoto: Boolean(limpio(propuesta?.autor?.foto_url)),
  };
};
