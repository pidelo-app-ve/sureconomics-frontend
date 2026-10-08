import PropTypes from "prop-types";
import { useId } from "react";

/**
 * Los paisajes de La Clave: la franja de arriba de la tarjeta, en SVG, como la escena
 * de la guacamaya. Cuatro postales de Venezuela, dibujadas con pocas formas y colores
 * apagados para que el tablero mande: los tepuyes de Canaima, el Ávila sobre Caracas, los
 * Médanos de Coro y Los Roques. Cada categoría tiene la suya.
 */

const ESCENA_DE_CATEGORIA = {
  economia: "avila",
  empresas: "avila",
  venezuela: "tepuy",
  mundo: "roques",
  deportes: "medanos",
  entretenimiento: "roques",
  tecnologia: "avila",
  sabor: "medanos",
};

export const escenaDe = (categoria) => ESCENA_DE_CATEGORIA[categoria] ?? "tepuy";

const Tepuy = ({ cielo }) => (
  <>
    <defs>
      <linearGradient id={cielo} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9dfee" />
        <stop offset="1" stopColor="#eef1e4" />
      </linearGradient>
    </defs>
    <rect width="600" height="160" fill={`url(#${cielo})`} />
    <circle cx="470" cy="46" r="18" fill="#f6e3b4" />
    {/* Tepuy del fondo, con su cima plana y la bruma */}
    <path d="M330 160V78l24-26h150l20 24v84z" fill="#8aa08f" />
    <path d="M0 160V96l38-20h94l20 18 34-10 40 12v64z" fill="#9db09a" />
    {/* El tepuy grande, de frente, con el salto */}
    <path d="M150 160V66l30-22h190l28 24v92z" fill="#4f6b5c" />
    <path d="M150 66l30-22h190l28 24-18 6H176z" fill="#5e7c6a" />
    <path d="M300 70c-2 20 1 40 0 60 1 10-1 20-2 30" stroke="#e8f1f3" strokeWidth="2.5" fill="none" opacity="0.9" />
    <path d="M0 160v-14c90-14 160-10 240 2s150 6 200-4 110-8 160 4v12z" fill="#dfe8dc" opacity="0.8" />
    <path d="M0 160v-6c120-10 230-6 330 2s170 2 270-6v10z" fill="#2f4a3b" />
  </>
);
Tepuy.propTypes = { cielo: PropTypes.string.isRequired };

const Avila = ({ cielo }) => (
  <>
    <defs>
      <linearGradient id={cielo} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3c9a4" />
        <stop offset="1" stopColor="#f9ecd9" />
      </linearGradient>
    </defs>
    <rect width="600" height="160" fill={`url(#${cielo})`} />
    <circle cx="150" cy="58" r="20" fill="#f7cf7a" />
    {/* La silueta del Ávila: la Silla, el Pico Naiguatá */}
    <path d="M0 160V104c40-14 70-36 110-40s70 18 110 10 70-34 120-30 80 32 130 26 90-20 130-10v100z" fill="#5f7d63" />
    <path d="M0 160v-34c50-8 90-22 140-18s80 24 130 20 90-30 140-26 90 20 190 14v44z" fill="#3f5e47" />
    {/* La ciudad, abajo, en bloques */}
    <g fill="#728473">
      <rect x="20" y="132" width="16" height="28" />
      <rect x="44" y="124" width="12" height="36" />
      <rect x="70" y="136" width="22" height="24" />
      <rect x="110" y="120" width="14" height="40" />
      <rect x="136" y="130" width="20" height="30" />
      <rect x="180" y="126" width="12" height="34" />
      <rect x="230" y="134" width="18" height="26" />
      <rect x="300" y="122" width="14" height="38" />
      <rect x="330" y="132" width="24" height="28" />
      <rect x="400" y="128" width="16" height="32" />
      <rect x="440" y="136" width="20" height="24" />
      <rect x="500" y="124" width="12" height="36" />
      <rect x="540" y="134" width="22" height="26" />
    </g>
    <path d="M0 160v-6h600v6z" fill="#2f4a3b" />
  </>
);
Avila.propTypes = { cielo: PropTypes.string.isRequired };

const Medanos = ({ cielo }) => (
  <>
    <defs>
      <linearGradient id={cielo} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#bfe0f0" />
        <stop offset="1" stopColor="#fbefd6" />
      </linearGradient>
    </defs>
    <rect width="600" height="160" fill={`url(#${cielo})`} />
    <circle cx="500" cy="44" r="22" fill="#f9d87c" />
    {/* Las dunas, una detrás de otra */}
    <path d="M0 160V110c90-30 170-28 260-4s180 14 340-20v74z" fill="#e3c27e" />
    <path d="M0 160v-28c110-26 220-8 320 6s190-14 280-6v28z" fill="#d4a95c" />
    <path d="M0 160v-10c100-16 230 0 330 4s180-12 270-8v14z" fill="#c4954a" />
    {/* Un cardón */}
    <path d="M94 158v-50M94 124c-10 0-16-6-16-18M94 116c10 0 16-8 16-22" stroke="#4e6b4a" strokeWidth="6" strokeLinecap="round" fill="none" />
  </>
);
Medanos.propTypes = { cielo: PropTypes.string.isRequired };

const Roques = ({ cielo }) => (
  <>
    <defs>
      <linearGradient id={cielo} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c6e4f4" />
        <stop offset="1" stopColor="#eaf4f7" />
      </linearGradient>
    </defs>
    <rect width="600" height="160" fill={`url(#${cielo})`} />
    <circle cx="110" cy="48" r="18" fill="#fbe39c" />
    {/* El mar, en dos azules, y el cayo */}
    <path d="M0 160V92h600v68z" fill="#6fb3cc" />
    <path d="M0 160v-50c100 6 200 6 300 0s200-6 300 2v48z" fill="#4f9dbb" />
    <path d="M200 160v-14c60-18 160-20 250-8s100 14 150 10v12z" fill="#f2e3bd" />
    {/* Una palmera chiquita */}
    <path d="M470 154c2-18 2-34 6-48" stroke="#5a4a2e" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="M476 106c-10-10-20-12-30-8 10 0 18 6 24 12zM476 106c10-10 22-12 32-6-10-2-20 2-28 10zM476 106c-2-12 2-22 10-28-4 8-6 16-6 26zM476 106c-8-8-20-8-28 0 10-2 18 0 24 4z" fill="#3f7a52" />
    <path d="M0 160v-8c80 4 160 2 240-2s240-6 360 4v6z" fill="#3a8aa8" opacity="0.5" />
  </>
);
Roques.propTypes = { cielo: PropTypes.string.isRequired };

const ESCENAS = { tepuy: Tepuy, avila: Avila, medanos: Medanos, roques: Roques };

export const PaisajeClave = ({ escena }) => {
  const cielo = `clave-cielo-${useId().replace(/:/g, "")}`;
  const Escena = ESCENAS[escena] ?? Tepuy;
  return (
    <svg className="se-clave__paisaje-svg" viewBox="0 0 600 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <Escena cielo={cielo} />
    </svg>
  );
};
PaisajeClave.propTypes = { escena: PropTypes.oneOf(Object.keys(ESCENAS)).isRequired };

export default PaisajeClave;
