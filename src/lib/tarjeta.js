/**
 * The colour a piece gets when it has no photograph.
 *
 * Derived from the topic rather than picked from a table, so a topic added in the
 * panel tomorrow has a colour today and nobody has to remember to assign one.
 * Deterministic: the same topic is always the same colour, which is what makes a
 * grid of them read as a system instead of as noise.
 *
 * The alternative was the grey line-art placeholder, which is what the front page
 * was showing for a piece with no image — and what got reported as looking broken.
 * A saturated field with the topic set in it reads as a decision.
 */

/** A hue from a string. Small and stable; the exact spread does not matter. */
const matiz = (texto) => {
  let h = 0;
  for (let i = 0; i < texto.length; i += 1) {
    h = (h * 31 + texto.charCodeAt(i)) % 360;
  }
  return h;
};

/**
 * Los rellenos posibles: sólo tonos de la marca. Verde Cardin y sus vecinos, el cobre,
 * la tierra y el grafito. Todos oscuros, para que el nombre del tema se lea en blanco.
 *
 * Antes el tono salía del círculo cromático entero y la portada se llenaba de morados,
 * cianes y azul marino que el brandbook no tiene. El comentario de entonces decía que
 * estos paneles iban «sobre una página casi negra»; la página ya es blanca, y sobre
 * blanco un morado saturado es lo primero que se ve.
 */
const RELLENOS = [
  ["#0f4a2c", "#03210f"], // verde Cardin
  ["#2f4a1f", "#16260d"], // musgo
  ["#14403d", "#07201e"], // petróleo
  ["#7a3519", "#3a170a"], // cobre
  ["#5a3a22", "#2a1a0e"], // tierra
  ["#2c312e", "#121513"], // grafito
];

/**
 * A two-stop gradient for the card's media area. The same topic always gets the same
 * pair, which is what makes a grid of them read as a system instead of as noise.
 *
 * @param {string | null | undefined} tema
 * @returns {string} a CSS `background` value
 */
export const fondoDeTema = (tema) => {
  const [claro, oscuro] = RELLENOS[matiz(tema || "SurEconomics") % RELLENOS.length];
  return `linear-gradient(135deg, ${claro}, ${oscuro})`;
};
