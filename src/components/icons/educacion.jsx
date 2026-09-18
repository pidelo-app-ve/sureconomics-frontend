import PropTypes from "prop-types";

/**
 * Los iconos de Educación.
 *
 * Existen por una razón concreta: el temario usaba 🔒 como candado. Un emoji no es un
 * icono — lo dibuja la fuente del sistema, así que cambia de forma y de color entre
 * Windows, macOS y Android, no hereda `currentColor` y no se puede alinear con el
 * texto. Estos trazados sí.
 *
 * Todos van marcados `aria-hidden`: acompañan a una etiqueta escrita al lado, nunca la
 * sustituyen. Un icono que fuera la única forma de saber que una lección está cerrada
 * dejaría fuera a quien navega con lector de pantalla.
 */

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

/** El candado de una lección que viene con el módulo. */
export const IconCandado = (props) => (
  <svg {...base} {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

/** Reloj: cuánto dura. */
export const IconReloj = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

/** Play: una lección en video. */
export const IconVideo = (props) => (
  <svg {...base} {...props}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M10 9.3l4.8 2.7-4.8 2.7z" fill="currentColor" stroke="none" />
  </svg>
);

/** Líneas de texto: una lección de lectura. */
export const IconTexto = (props) => (
  <svg {...base} {...props}>
    <path d="M4.5 4.5h15v15h-15z" />
    <path d="M8 9h8M8 12.5h8M8 16h5" />
  </svg>
);

/** Onda: una lección en audio. */
export const IconAudio = (props) => (
  <svg {...base} {...props}>
    <path d="M4 10v4M8 7v10M12 4.5v15M16 8v8M20 10.5v3" />
  </svg>
);

/** Documento con esquina doblada: el PDF. */
export const IconDocumento = (props) => (
  <svg {...base} {...props}>
    <path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z" />
    <path d="M14 3.5V8h4.5" />
  </svg>
);

/** Visto: lo que ya está abierto o comprado. */
export const IconVisto = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.2l2.4 2.4 4.6-4.9" />
  </svg>
);

/** Llave: el acceso libre de la primera lección. */
export const IconLlave = (props) => (
  <svg {...base} {...props}>
    <circle cx="8" cy="12" r="3.5" />
    <path d="M11.5 12h8.5M17.5 12v3M14.5 12v2" />
  </svg>
);

/** Escudo: la garantía de que no se cobra nada escondido. */
export const IconEscudo = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3.2l7 2.6v5.4c0 4.3-2.9 7.6-7 9.6-4.1-2-7-5.3-7-9.6V5.8z" />
    <path d="M9 12.2l2 2 4-4.3" />
  </svg>
);

/**
 * El icono que le toca a un tipo de lección.
 *
 * Con un respaldo explícito: un tipo nuevo en el servidor no puede dejar la fila del
 * temario sin su marca visual mientras la interfaz se pone al día.
 */
export const IconoDeTipo = ({ tipo, ...props }) => {
  const Icono =
    { video: IconVideo, texto: IconTexto, audio: IconAudio, pdf: IconDocumento }[tipo] ??
    IconTexto;
  return <Icono {...props} />;
};

IconoDeTipo.propTypes = {
  /** "video" | "texto" | "audio" | "pdf". Cualquier otro cae en el respaldo. */
  tipo: PropTypes.string,
};
