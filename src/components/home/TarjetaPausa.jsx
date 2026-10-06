import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Enlace } from "../Enlace";
import { formatearNumero } from "../../i18n/motor";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { resumen } from "../../juegos/guacamaya/registro";
import "./tarjetaPausa.css";

/**
 * «Un minuto de pausa» en la portada y al final de las piezas.
 *
 * Solo una ilustración y un enlace a `/pausa`: el juego no se descarga hasta que
 * alguien lo abre. La ilustración es la misma escena del juego -- el Ávila, el sol que
 * baja, la ciudad -- en SVG, con la guacamaya batiendo las alas por CSS (quieta si el
 * sistema pide menos movimiento).
 *
 * Va entre Noticias y Artículos, no arriba del todo: la portada abre con el filtro y
 * las noticias, que es lo que el socio fijó, y un juego delante haría que el sitio
 * pareciera de juegos antes que de prensa.
 */

/** La guacamaya en SVG, mirando a la derecha. El ala tiene su propia clase para batir. */
export const GuacamayaSvg = ({ className }) => (
  <svg className={className} viewBox="-44 -22 76 44" aria-hidden="true" focusable="false">
    <path d="M-12 2 Q-30 4 -40 14 Q-28 8 -12 7 Z" fill="#1a58ad" />
    <path d="M-12 0 Q-28 -1 -38 6 Q-26 4 -12 5 Z" fill="#2f7fe0" />
    <ellipse cx="0" cy="0" rx="17" ry="12" fill="#1f6fd1" />
    <ellipse cx="4" cy="5" rx="11" ry="7" transform="rotate(-11 4 5)" fill="#ffc928" />
    <circle cx="13" cy="-5" r="9" fill="#1f6fd1" />
    <path d="M7.5 -11 A4.5 4.5 0 0 1 16.5 -11 Z" fill="#3aa66b" />
    <ellipse cx="16" cy="-4" rx="5" ry="4" fill="#f4efe6" />
    <circle cx="16.5" cy="-6" r="1.7" fill="#111" />
    <path d="M20 -7 Q29 -6 27 1 Q24 -2 20 -1 Z" fill="#1d1d22" />
    <g className="se-pausa-ave__ala">
      <ellipse cx="-8" cy="-4" rx="14" ry="6" transform="rotate(-23 -8 -4)" fill="#e0a91f" />
      <ellipse cx="-9" cy="-6" rx="14" ry="6" transform="rotate(-23 -9 -6)" fill="#1556a8" />
    </g>
  </svg>
);
GuacamayaSvg.propTypes = { className: PropTypes.string };
GuacamayaSvg.defaultProps = { className: undefined };

/**
 * El atardecer del juego en pequeño: cielo, sol, el Ávila, la ciudad y la Cota Mil.
 * Lo comparten la tarjeta de la portada y el banner del final de las piezas. `idCielo`
 * tiene que ser distinto en cada uso: dos degradados con el mismo id en una página se
 * pisan.
 */
const PaisajeSvg = ({ className, idCielo }) => (
    <svg className={className} viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" focusable="false">
      <defs>
        <linearGradient id={idCielo} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9655b" />
          <stop offset="0.65" stopColor="#f6a15f" />
          <stop offset="1" stopColor="#ffd89a" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${idCielo})`} />
      <circle cx="285" cy="74" r="26" fill="#ffd36b" />
      <path d="M0 150 C60 105 110 120 160 112 C210 104 250 80 300 98 C340 112 370 100 400 108 L400 220 L0 220Z" fill="#7b5aa6" />
      <path d="M0 172 C50 150 90 158 140 150 C200 140 240 156 290 146 C340 138 370 150 400 146 L400 220 L0 220Z" fill="#3c7347" />
      <g fill="#56466f">
        <rect x="10" y="168" width="26" height="40" />
        <rect x="40" y="158" width="20" height="50" />
        <rect x="66" y="172" width="34" height="36" />
        <rect x="108" y="150" width="22" height="58" />
        <rect x="138" y="166" width="30" height="42" />
        <rect x="176" y="160" width="18" height="48" />
        <rect x="232" y="164" width="28" height="44" />
        <rect x="266" y="152" width="22" height="56" />
        <rect x="296" y="170" width="36" height="38" />
        <rect x="340" y="160" width="24" height="48" />
        <rect x="370" y="168" width="30" height="40" />
      </g>
      <rect y="206" width="400" height="14" fill="#2d2838" />
      <rect y="204" width="400" height="2" fill="#f2b632" />
    </svg>
);
PaisajeSvg.propTypes = { className: PropTypes.string.isRequired, idCielo: PropTypes.string.isRequired };

/** Lo que el juego recuerda de quien ya jugó, dicho en una línea (en el idioma de la página). */
const lineaDeMemoria = (t, m) => {
  if (!m) return null;
  if (m.mejorHoy) {
    return m.racha > 1
      ? t("juegos.tarjetaPausa.memoria.mejorHoyConRacha", { n: formatearNumero(m.mejorHoy), racha: m.racha })
      : t("juegos.tarjetaPausa.memoria.mejorHoy", { n: formatearNumero(m.mejorHoy) });
  }
  if (m.racha > 0) return t("juegos.tarjetaPausa.memoria.noRompa", { n: m.racha });
  return null;
};

export const TarjetaPausa = () => {
  const { t } = useIdioma();
  // La memoria vive en el navegador: se lee después de montar.
  const [memoria, setMemoria] = useState(null);
  useEffect(() => setMemoria(resumen()), []);
  const linea = lineaDeMemoria(t, memoria);

  return (
    <section className="se-section se-pausa-tarjeta" aria-labelledby="pausa-tarjeta-titulo">
      <div className="se-container">
        <Enlace to="/pausa" className="se-pausa-tarjeta__enlace">
          <div className="se-pausa-tarjeta__escena" aria-hidden="true">
            <PaisajeSvg className="se-pausa-tarjeta__paisaje" idCielo="pausa-cielo-tarjeta" />
            <span className="se-pausa-tarjeta__vuelo">
              <GuacamayaSvg className="se-pausa-ave" />
            </span>
          </div>
          <div className="se-pausa-tarjeta__cuerpo">
            <p className="se-pausa-tarjeta__kicker">{t("juegos.tarjetaPausa.kicker")}</p>
            <h2 id="pausa-tarjeta-titulo" className="se-pausa-tarjeta__titulo">
              {t("juegos.tarjetaPausa.titulo")}
            </h2>
            <p className="se-pausa-tarjeta__texto">{t("juegos.tarjetaPausa.texto")}</p>
            <span className="se-pausa-tarjeta__boton">{t("juegos.tarjetaPausa.jugar")}</span>
            {linea ? <p className="se-pausa-tarjeta__memoria">{linea}</p> : null}
          </div>
        </Enlace>
      </div>
    </section>
  );
};

/**
 * El banner del final de las piezas (premia a quien leyó entero) y, con `enPortada`, la
 * franja bajo el buscador de la portada.
 *
 * La misma escena que la tarjeta de la portada, en horizontal y más baja: el paisaje a
 * la izquierda con la guacamaya batiendo las alas, y a la derecha la invitación y un
 * botón. Todo el banner es el enlace, así que en el teléfono se toca en cualquier sitio.
 */
export const InvitacionPausa = ({ enPortada }) => {
  const { t } = useIdioma();
  return (
    <Enlace to="/pausa" className="se-pausa-banner">
      <span className="se-pausa-banner__escena" aria-hidden="true">
        <PaisajeSvg className="se-pausa-banner__paisaje" idCielo={enPortada ? "pausa-cielo-franja" : "pausa-cielo-banner"} />
        <span className="se-pausa-banner__vuelo">
          <GuacamayaSvg className="se-pausa-ave" />
        </span>
      </span>
      <span className="se-pausa-banner__cuerpo">
        {/* En la portada nadie ha leído todavía: el rótulo de «¿terminó de leer?» no cabe. */}
        <span className="se-pausa-banner__kicker">
          {enPortada ? t("juegos.tarjetaPausa.kicker") : t("juegos.tarjetaPausa.banner.kicker")}
        </span>
        <span className="se-pausa-banner__titulo">{t("juegos.tarjetaPausa.banner.titulo")}</span>
        <span className="se-pausa-banner__boton">{t("juegos.tarjetaPausa.jugar")}</span>
      </span>
    </Enlace>
  );
};
InvitacionPausa.propTypes = { enPortada: PropTypes.bool };
InvitacionPausa.defaultProps = { enPortada: false };

export default TarjetaPausa;
