import PropTypes from "prop-types";

/** El botón de pausa de lo que rota solo: dos barras en marcha, un triángulo en pausa. */
export const IconoPausa = ({ pausado }) =>
  pausado ? (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  );

IconoPausa.propTypes = { pausado: PropTypes.bool };

export default IconoPausa;
