import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { IconLlave, IconReloj, IconTexto } from "../icons/educacion";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import {
  duracionLegible,
  mezclaLegible,
  nivelLegible,
  precioLegible,
} from "../../services/educacionService";

/**
 * La tarjeta de un módulo en el catálogo.
 *
 * ## Por qué ya no manda la portada
 *
 * La versión anterior daba el 40 % de la tarjeta a una imagen de 16/9 y, como ningún
 * módulo tiene portada cargada, pintaba un degradado verde de relleno. Tres tarjetas
 * idénticas, con el elemento más grande de cada una diciendo exactamente nada, y el
 * título empezando por debajo de la primera pantalla.
 *
 * Aquí la imagen es una franja estrecha y **opcional de verdad**: sin portada no hay
 * hueco que rellenar, la tarjeta sencillamente empieza por el título. Lo que ocupa el
 * espacio es lo que decide una compra — qué es, cuánto dura, en qué formato y qué se
 * puede ver antes de pagar.
 *
 * ## El precio arriba y en texto, no en una píldora sobre la foto
 *
 * Flotando sobre la portada se leía como una marca de agua. Arriba a la derecha, en la
 * misma línea que el nivel, es donde se busca — y sobre todo, se puede comparar de un
 * vistazo entre tarjetas porque todas lo tienen a la misma altura.
 */
export const TarjetaDeModulo = ({ modulo }) => {
  const { t } = useIdioma();
  const duracion = duracionLegible(modulo.duracion_minutos);
  const mezcla = mezclaLegible(modulo.tipos);
  const nivel = nivelLegible(modulo.nivel);
  const libres = modulo.lecciones_libres || 0;

  return (
    <Enlace
      to={`/educacion/${modulo.slug}`}
      className={`se-modulo${modulo.gratuito ? " se-modulo--cortesia" : ""}`}
    >
      {modulo.portada ? (
        <span className="se-modulo__foto">
          <img src={modulo.portada} alt="" loading="lazy" decoding="async" />
        </span>
      ) : null}

      <span className="se-modulo__cabeza">
        <span className="se-modulo__etiqueta">
          {modulo.gratuito ? t("educacion.tarjeta.cortesia") : nivel || t("educacion.comun.modulo")}
        </span>
        <span className="se-modulo__precio">
          {modulo.gratuito
            ? t("educacion.comun.gratis")
            : precioLegible(modulo.precio_centavos, modulo.moneda)}
        </span>
      </span>

      <span className="se-modulo__titulo">{modulo.titulo}</span>

      {modulo.resumen ? (
        <span className="se-modulo__resumen">{modulo.resumen}</span>
      ) : null}

      {/* Los datos duros, separados del texto por un filete: son lo que se compara
          entre dos tarjetas, y comparar exige que estén siempre en el mismo sitio.
          Cada uno se calla solo si no lo hay -- la duración es nula mientras falte
          medir alguna lección, y escribir ahí un "por determinar" sería ruido. */}
      <span className="se-modulo__datos">
        <span className="se-modulo__dato">
          {t("educacion.comun.lecciones", { n: modulo.lecciones ?? 0 })}
        </span>
        {duracion ? (
          <span className="se-modulo__dato">
            <IconReloj className="se-modulo__icono" />
            {duracion}
          </span>
        ) : null}
        {/* La mezcla de formatos solo aparece cuando no hay duración: son dos formas
            de contestar lo mismo -- "qué me llevo" -- y poner las dos llena la línea
            sin añadir nada. Lleva icono como los demás datos, porque sin él las dos
            cifras quedaban una al lado de la otra sin nada que las separase. */}
        {mezcla && !duracion ? (
          <span className="se-modulo__dato">
            <IconTexto className="se-modulo__icono" />
            {mezcla}
          </span>
        ) : null}
      </span>

      {/* El gancho, en su propia línea y con el color de acento. Antes vivía en gris
          de 0,72 rem al pie de la tarjeta: era el argumento que más convierte escrito
          con el tamaño de una nota al pie. */}
      {modulo.gratuito ? (
        <span className="se-modulo__gancho">
          <IconLlave className="se-modulo__icono" />
          {t("educacion.tarjeta.soloCuentaVerificada")}
        </span>
      ) : libres > 0 ? (
        <span className="se-modulo__gancho">
          <IconLlave className="se-modulo__icono" />
          {t("educacion.tarjeta.clasesGratis", { n: libres })}
        </span>
      ) : null}
    </Enlace>
  );
};

TarjetaDeModulo.propTypes = {
  /** Una tarjeta del catálogo, tal como la sirve `/education/modules`. */
  modulo: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    titulo: PropTypes.string.isRequired,
    resumen: PropTypes.string,
    portada: PropTypes.string,
    nivel: PropTypes.string,
    precio_centavos: PropTypes.number,
    moneda: PropTypes.string,
    gratuito: PropTypes.bool,
    lecciones: PropTypes.number,
    lecciones_libres: PropTypes.number,
    duracion_minutos: PropTypes.number,
    tipos: PropTypes.object,
  }).isRequired,
};

export default TarjetaDeModulo;
