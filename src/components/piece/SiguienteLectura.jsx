import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { rutaDePieza } from "../../lib/pieza";
import { piezaShape } from "../home/piezaShape";
import { TituloDePieza } from "../content/TituloDePieza";
import { Recorte, Recortes } from "../comun/Recorte";

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
          {pieza.imagenUrl ? (
            <img className="se-siguiente__foto" src={pieza.imagenUrl} alt="" loading="lazy" decoding="async" />
          ) : null}
        </Enlace>
      </Recorte>
    </Recortes>
  );
};

SiguienteLectura.propTypes = { pieza: piezaShape() };

export default SiguienteLectura;
