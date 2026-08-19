import PropTypes from "prop-types";

/**
 * Fields every piece carries, whatever its format.
 *
 * Shared because the five layout components would otherwise repeat the same six
 * entries, and a shape that exists five times drifts the moment one format gains
 * a field.
 */
export const PIEZA_BASE = {
  id: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  formato: PropTypes.string.isRequired,
  titulo: PropTypes.string.isRequired,
  fecha: PropTypes.string.isRequired,
  // Up to three of each, per the brief; the first is the one a card shows.
  temas: PropTypes.arrayOf(PropTypes.string).isRequired,
  geos: PropTypes.arrayOf(PropTypes.string).isRequired,
};

/** `PIEZA_BASE` plus whatever one format adds. */
export const piezaShape = (extra = {}) => PropTypes.shape({ ...PIEZA_BASE, ...extra });

/** A list of pieces of one format. */
export const listaDePiezas = (extra = {}) => PropTypes.arrayOf(piezaShape(extra)).isRequired;
