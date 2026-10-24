import { Enlace } from "../Enlace";
import { geoPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "../home/piezaShape";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { TituloDePieza } from "../content/TituloDePieza";

/**
 * "También te puede interesar": pieces sharing a topic or a place.
 *
 * Rendered as headline rows whatever the format of each item — the module is a
 * list of places to go next, not a showcase, so five different card shapes here
 * would fight the piece the reader is already in.
 */
export const RelatedPieces = ({ items }) => {
  const { t } = useIdioma();
  if (!items.length) return null;

  return (
    <section className="se-piece__related" aria-labelledby="related-title">
      <h2 id="related-title" className="se-piece__related-title">
        {t("piezas.relacionadas.titulo")}
      </h2>
      <ul className="se-newslist">
        {items.map((p) => (
          <li key={p.slug} className="se-newslist__row">
            {/* El titular primero; el lugar y la fecha debajo, como en la portada. */}
            <Enlace to={rutaDePieza(p)} className="se-newslist__title">
              <TituloDePieza pieza={p} />
            </Enlace>
            <span className="se-newslist__meta">
              <span className="se-newslist__geo">{geoPrincipal(p)}</span>
              <span aria-hidden="true"> · </span>
              <time className="se-newslist__date">{p.fecha}</time>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

RelatedPieces.propTypes = { items: listaDePiezas() };
