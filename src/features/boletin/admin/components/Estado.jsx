import PropTypes from "prop-types";
import { ESTADOS } from "../utils";

export const Estado = ({ status }) => {
  const e = ESTADOS[status] ?? { texto: status, tono: "borrador" };
  return <span className={`se-bol__estado se-bol__estado--${e.tono}`}>{e.texto}</span>;
};

Estado.propTypes = { status: PropTypes.string };
