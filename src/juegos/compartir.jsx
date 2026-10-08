import PropTypes from "prop-types";

/**
 * Lo que comparten los juegos para invitar y presumir: el botón grande de WhatsApp
 * (por donde entra casi todo el mundo) y la fila de las demás redes.
 */

/** El logo de WhatsApp: el globo y el teléfono, en el color del texto del botón. */
export const IconoWhatsApp = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L2.9 21.1l4.5-1.2A9.2 9.2 0 1 0 12 2.8z"
    />
    <path
      fill="currentColor"
      d="M8.6 7.2c.2-.4.5-.4.8-.4h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.6l-.6.7c-.1.2-.2.4 0 .6.6 1.1 1.5 2 2.6 2.6.2.1.4.1.6 0l.7-.6c.2-.2.4-.2.6-.1l1.9.8c.3.1.4.3.4.5v.6c0 .3 0 .6-.4.8-.6.4-1.4.6-2.2.4-2.6-.6-4.9-2.9-5.5-5.5-.2-.8 0-1.6.4-2.2z"
    />
  </svg>
);
IconoWhatsApp.propTypes = { className: PropTypes.string };
IconoWhatsApp.defaultProps = { className: "se-guaca__icono-whatsapp" };

/** Las redes de la fila de compartir, además de WhatsApp (que va en su botón grande). */
export const REDES_DEL_JUEGO = ["facebook", "x", "telegram", "instagram"];

/** Un enlace que abre WhatsApp con el mensaje ya escrito (en el teléfono, la app). */
export const enlaceWhatsApp = (texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`;
