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
 * A two-stop gradient for the card's media area.
 *
 * Lightness is kept low on both stops: these sit on a near-black page beside real
 * photographs, and a panel brighter than the photographs would pull the eye to
 * exactly the pieces that have nothing to show.
 *
 * @param {string | null | undefined} tema
 * @returns {string} a CSS `background` value
 */
export const fondoDeTema = (tema) => {
  const h = matiz(tema || "SurEconomics");
  return `linear-gradient(135deg, hsl(${h} 44% 26%), hsl(${(h + 32) % 360} 50% 13%))`;
};
