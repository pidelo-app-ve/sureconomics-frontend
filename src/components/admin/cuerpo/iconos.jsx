import PropTypes from "prop-types";

/**
 * Los iconos de las fotos del cuerpo: trazo de 1,75 sobre 24, del color del texto. Un
 * solo dibujo para todos, que es lo que hace que se lean como de la misma familia.
 */

const Icono = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

Icono.propTypes = { children: PropTypes.node.isRequired };

export const IconoMas = () => (
  <Icono>
    <path d="M12 5v14M5 12h14" />
  </Icono>
);

export const IconoImagen = () => (
  <Icono>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m20.5 16-4.6-4.6a1.2 1.2 0 0 0-1.7 0L6 19.5" />
  </Icono>
);

export const IconoCambiar = () => (
  <Icono>
    <path d="M4 9a8 8 0 0 1 14.3-3.7L20 7" />
    <path d="M20 3.5V7h-3.5" />
    <path d="M20 15a8 8 0 0 1-14.3 3.7L4 17" />
    <path d="M4 20.5V17h3.5" />
  </Icono>
);

export const IconoTexto = () => (
  <Icono>
    <path d="M5 6h14M5 11h14M5 16h9" />
  </Icono>
);

export const IconoBasura = () => (
  <Icono>
    <path d="M4.5 7h15M9.5 7V5h5v2M7 7l.8 12.2a1 1 0 0 0 1 .8h6.4a1 1 0 0 0 1-.8L17 7" />
  </Icono>
);

export const IconoSubir = () => (
  <Icono>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15" />
  </Icono>
);

export const IconoOjo = () => (
  <Icono>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Icono>
);
