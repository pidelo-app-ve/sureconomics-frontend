import { useId } from "react";
import PropTypes from "prop-types";

/**
 * Banderas redondas, pequeñas, dibujadas aquí mismo en SVG.
 *
 * No son emoji porque Windows no dibuja los emoji de bandera: en vez de la bandera
 * enseña las letras («VE», «ES»). Y no son imágenes de otro servidor porque la política
 * de seguridad del sitio no las deja cargar. A este tamaño se simplifican: sin escudos,
 * y las estrellas y el sol como puntos.
 *
 * Decorativas (`aria-hidden`): al lado siempre va el nombre de la ciudad.
 */

// Las ocho estrellas de Venezuela, en arco sobre la franja azul.
const ESTRELLAS_VE = Array.from({ length: 8 }, (_, i) => {
  const angulo = ((200 + (i * 140) / 7) * Math.PI) / 180;
  return [12 + 4.6 * Math.cos(angulo), 14.2 + 4.6 * Math.sin(angulo)];
});

const FRANJAS_US = Array.from({ length: 13 }, (_, i) => i);

const DIBUJOS = {
  ve: (
    <>
      <rect width="24" height="8" fill="#FFCC00" />
      <rect y="8" width="24" height="8" fill="#00247D" />
      <rect y="16" width="24" height="8" fill="#CF142B" />
      {ESTRELLAS_VE.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.75" fill="#fff" />
      ))}
    </>
  ),
  es: (
    <>
      <rect width="24" height="24" fill="#AA151B" />
      <rect y="6" width="24" height="12" fill="#F1BF00" />
    </>
  ),
  ar: (
    <>
      <rect width="24" height="24" fill="#74ACDF" />
      <rect y="8" width="24" height="8" fill="#fff" />
      <circle cx="12" cy="12" r="2.3" fill="#F6B40E" />
    </>
  ),
  us: (
    <>
      {FRANJAS_US.map((i) => (
        <rect key={i} y={(i * 24) / 13} width="24" height={24 / 13 + 0.05} fill={i % 2 ? "#fff" : "#B22234"} />
      ))}
      <rect width="11" height={(7 * 24) / 13} fill="#3C3B6E" />
      {[2.2, 5.5, 8.8].flatMap((x) => [2.6, 6.4, 10.2].map((y) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.6" fill="#fff" />
      )))}
    </>
  ),
};

export const Bandera = ({ pais, size = 18, className = "" }) => {
  const recorte = useId();
  const dibujo = DIBUJOS[pais];
  if (!dibujo) return null;
  return (
    <svg className={`se-bandera ${className}`.trim()} viewBox="0 0 24 24" width={size} height={size}
      aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={recorte}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${recorte})`}>{dibujo}</g>
      {/* Un filo claro: sobre el verde de la cabecera el rojo y el azul se pierden sin él. */}
      <circle cx="12" cy="12" r="11.4" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
    </svg>
  );
};

Bandera.propTypes = {
  pais: PropTypes.oneOf(["ve", "es", "ar", "us"]).isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
};
