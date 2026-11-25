import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { estiloDeFoto, rutaDePieza } from "../../lib/pieza";
import { tallasHastaLaOriginal } from "../../lib/fotoDePieza";
import { useFotoConRespaldo } from "../../hooks/useFotoConRespaldo";
import { piezaShape } from "../home/piezaShape";
import { TituloDePieza } from "../../ui/TituloDePieza";
import { Recorte, Recortes } from "../comun/Recorte";

/**
 * El `sizes` de la foto: 220 px de columna desde 700 de ancho y, por debajo, el de la
 * columna de lectura (la ventana menos los 24 px de margen a cada lado). Por 4/3 más:
 * la caja es 4:3 y recorta con `cover`, así que una foto 16:9 se pinta un tercio más
 * ancha que la caja para llenar su alto.
 */
const SIZES_DE_LA_FOTO = "(min-width: 700px) 300px, calc(133vw - 64px)";

/** La foto, con las tallas del servidor en vez de la original entera (`tallasHastaLaOriginal`),
 *  y la original de plan B si la talla no carga (`useFotoConRespaldo`). */
const FotoSiguiente = ({ pieza }) => {
  const tallas = tallasHastaLaOriginal(pieza.imagenUrl, pieza.imagenAnchoOriginal);
  const foto = useFotoConRespaldo({
    src: pieza.imagenUrl,
    srcSet: tallas ?? undefined,
    sizes: tallas ? SIZES_DE_LA_FOTO : undefined,
  });
  return (
    <img
      className="se-siguiente__foto"
      {...foto}
      style={estiloDeFoto(pieza)}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
};

FotoSiguiente.propTypes = { pieza: piezaShape().isRequired };

/**
 * «Siguiente lectura»: al terminar el texto, la próxima pieza en grande, recortada como
 * las demás piezas del papel. Es la primera de «También te puede interesar», que el
 * lateral ya no repite. Una sola y no una lista: quien acaba de leer decide mejor
 * entre una cosa que entre cinco.
 */
export const SiguienteLectura = ({ pieza }) => {
  const { t } = useIdioma();
  if (!pieza) return null;
  return (
    <Recortes as="section" className="se-siguiente" aria-label={t("piezas.siguiente.rotulo")}>
      <Recorte>
        <Enlace to={rutaDePieza(pieza)} className="se-siguiente__enlace">
          <span className="se-siguiente__texto">
            <span className="se-siguiente__rotulo">{t("piezas.siguiente.rotulo")}</span>
            <span className="se-siguiente__titulo">
              <TituloDePieza pieza={pieza} />
            </span>
            {pieza.resumen ? <span className="se-siguiente__resumen">{pieza.resumen}</span> : null}
            <span className="se-siguiente__meta">
              {pieza.formatoNombre}
              {pieza.fecha ? <span aria-hidden="true"> · </span> : null}
              {pieza.fecha ? <time dateTime={pieza.fechaIso ?? undefined}>{pieza.fecha}</time> : null}
            </span>
          </span>
          {pieza.imagenUrl ? <FotoSiguiente pieza={pieza} /> : null}
        </Enlace>
      </Recorte>
    </Recortes>
  );
};

SiguienteLectura.propTypes = { pieza: piezaShape() };

export default SiguienteLectura;
