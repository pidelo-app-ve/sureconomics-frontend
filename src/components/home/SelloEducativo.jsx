import PropTypes from "prop-types";

/**
 * El sello de contenido educativo, en la esquina de la tarjeta.
 *
 * Relleno y en el verde de la marca, no la píldora con contorno que ya usan el tema y
 * la geografía: el pedido era que se notara **distinto** de lo que ya había. Una
 * séptima píldora igual a las demás se habría leído como otro tema más, que es justo
 * lo que esto no es -- una pieza educativa sigue teniendo su tema y su país.
 *
 * Arriba a la izquierda porque la esquina de abajo a la derecha ya la ocupa la duración
 * en las tarjetas de entrevista y podcast.
 *
 * Devuelve nulo cuando la pieza no es educativa, para que quien lo pinte no tenga que
 * repetir la condición en cada rejilla.
 */
export const SelloEducativo = ({ pieza }) =>
  pieza?.educativo ? <span className="se-sello-edu">Educativo</span> : null;

SelloEducativo.propTypes = {
  pieza: PropTypes.shape({ educativo: PropTypes.bool }),
};
