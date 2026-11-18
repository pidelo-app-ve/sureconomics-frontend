import PropTypes from "prop-types";
import { hora } from "./datosDelResumen";

/** Las negritas y cursivas de WhatsApp (*así* y _así_), como las pinta el teléfono. */
const conFormatoDeWhatsApp = (linea) =>
  linea.split(/(\*[^*\n]+\*|_[^_\n]+_)/g).map((trozo, i) => {
    if (trozo.length > 2 && trozo.startsWith("*") && trozo.endsWith("*")) return <strong key={i}>{trozo.slice(1, -1)}</strong>;
    if (trozo.length > 2 && trozo.startsWith("_") && trozo.endsWith("_")) return <em key={i}>{trozo.slice(1, -1)}</em>;
    return trozo;
  });

/**
 * El mensaje como lo ve quien abre el canal: primero la foto, en su proporción (Sur la
 * manda en JPG de hasta 1600 px, sin recortarla), y enseguida el texto, que WhatsApp
 * remata con la **tarjeta del enlace**: la arma él solo con la foto (recortada a lo
 * ancho) y el título de la página del resumen, que `api/pieza.js` le da. Es una maqueta
 * fiel con los colores del chat de WhatsApp, no una captura.
 */
export const VistaPreviaWhatsApp = ({ texto, foto, nombre, cuando }) => {
  const marca = cuando ? hora(cuando) : "";
  return (
    <div className="se-res-adm-wa" aria-label="Así se ve en el canal de WhatsApp">
      {foto?.url ? (
        <figure className="se-res-adm-wa__burbuja se-res-adm-wa__burbuja--foto">
          <img src={foto.url} alt="" style={foto.ancho && foto.alto ? { aspectRatio: `${foto.ancho} / ${foto.alto}` } : undefined} />
          <figcaption className="se-res-adm-wa__hora">{marca}</figcaption>
        </figure>
      ) : null}
      <div className="se-res-adm-wa__burbuja">
        <div className="se-res-adm-wa__tarjeta" aria-label="Tarjeta del enlace">
          {foto?.url ? <img src={foto.url} alt="" /> : <img src="/brand/og-default.jpg" alt="" />}
          <div className="se-res-adm-wa__tarjeta-texto">
            <strong>{nombre}</strong>
            <span>sureconomics.com</span>
          </div>
        </div>
        <p className="se-res-adm-wa__texto">
          {texto.split("\n").map((linea, i) => <span key={i}>{conFormatoDeWhatsApp(linea)}{"\n"}</span>)}
        </p>
        <span className="se-res-adm-wa__hora">{marca}</span>
      </div>
    </div>
  );
};

VistaPreviaWhatsApp.propTypes = {
  texto: PropTypes.string.isRequired,
  foto: PropTypes.shape({ url: PropTypes.string, ancho: PropTypes.number, alto: PropTypes.number }),
  nombre: PropTypes.string.isRequired,
  cuando: PropTypes.string,
};
