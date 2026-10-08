import PropTypes from "prop-types";
import { useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

import { Media, PieceBody, PieceByline } from "../piece";
import { piezaFromApi } from "../../lib/pieza";

/**
 * La pieza tal como la verá el lector, antes de guardarla.
 *
 * ## Con los componentes del sitio, no con una maqueta
 *
 * La cabecera, la firma y el cuerpo son los mismos componentes que pinta `/noticias/…`
 * (`Media`, `PieceByline`, `PieceBody`) y la pieza pasa por el mismo `piezaFromApi`.
 * Una vista previa dibujada aparte deja de previsualizar el primer día que el sitio
 * cambie, y lo hace en silencio. Así, lo que se ve aquí es lo que sale: las fotos del
 * cuerpo con su pie, la medida de la columna y la letra de lectura.
 *
 * Lo que no está (la columna lateral, los comentarios, la publicidad) no depende de la
 * pieza y no ayuda a decidir si queda bien.
 *
 * ## Lo que se ve es el borrador
 *
 * Sale del formulario de ahora mismo, sin guardar: el sentido es mirar antes.
 */
export const VistaPreviaDePieza = ({ abierta, onCerrar, form, assets, topics, formato }) => {
  const idTitulo = useId();
  const cerrarRef = useRef(null);

  const pieza = useMemo(() => {
    if (!abierta) return null;
    const temas = (form.topic_ids ?? [])
      .map((id) => topics.find((t) => String(t.id) === String(id)))
      .filter(Boolean);
    return piezaFromApi({
      id: "vista-previa",
      slug: form.slug || "vista-previa",
      format: form.format,
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      byline: form.byline,
      featured_image_url: form.featured_image_url || null,
      image_asset: assets.image ?? null,
      byline_photo: assets.bylinePhoto ?? null,
      video_asset: assets.video ?? null,
      audio_asset: assets.audio ?? null,
      sources: form.sources ?? [],
      interviewee: form.interviewee,
      interviewee_role: form.interviewee_role,
      unit: form.unit,
      topics: temas,
      places: [],
      published_at: form.published_at || new Date().toISOString(),
      content_format: formato ?? undefined,
    });
  }, [abierta, form, assets, topics, formato]);

  useEffect(() => {
    if (!abierta) return undefined;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const alPulsar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPulsar);
    cerrarRef.current?.focus();
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", alPulsar);
    };
  }, [abierta, onCerrar]);

  if (!abierta || !pieza) return null;

  const conPortada = pieza.formatoApi !== "entrevista" && Boolean(pieza.imagenUrl);
  const entradilla = pieza.resumenHtml || pieza.entradaHtml || "";

  return createPortal(
    <div className="se-previa" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
      <div className="se-previa__barra">
        <p className="se-previa__titulo" id={idTitulo}>
          Vista previa <span>· así la verá el lector, sin guardar</span>
        </p>
        <button ref={cerrarRef} type="button" className="se-previa__cerrar" onClick={onCerrar}>
          Volver a editar
        </button>
      </div>

      <div className="se-previa__hoja">
        <main className="se-blog se-articles">
          <section className="se-section">
            <div className="se-container">
              <article className="se-piece">
                <header className={`se-piece__head${conPortada ? " se-piece__head--media" : ""}`}>
                  <div className="se-piece__head-text">
                    <p className="se-piece__kicker">
                      {pieza.formatoNombre}
                      {pieza.temas[0] ? ` · ${pieza.temas[0]}` : ""}
                    </p>
                    <h1 className="se-piece__title">{pieza.titulo || "Sin título todavía"}</h1>
                    {entradilla ? (
                      <div
                        className="se-piece__lead se-piece__lead--head"
                        dangerouslySetInnerHTML={{ __html: entradilla }}
                      />
                    ) : null}
                  </div>
                  {conPortada ? (
                    <div className="se-piece__head-media">
                      <Media pieza={pieza} />
                    </div>
                  ) : null}
                </header>

                <div className="se-piece__meta">
                  <PieceByline
                    autor={pieza.autor}
                    autorFoto={pieza.autorFoto}
                    fecha={pieza.fecha}
                    unidad={pieza.unidad}
                    esEditorial={pieza.formatoApi === "editorial"}
                  />
                </div>

                <div className="se-piece__cols">
                  <div className="se-piece__main">
                    {pieza.cuerpo ? (
                      <PieceBody pieza={pieza} enCabecera={conPortada} />
                    ) : (
                      <p className="se-previa__vacio">El cuerpo todavía está vacío.</p>
                    )}
                  </div>
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>,
    document.body
  );
};

VistaPreviaDePieza.propTypes = {
  abierta: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  form: PropTypes.object.isRequired,
  assets: PropTypes.object.isRequired,
  topics: PropTypes.array,
  /** La ficha del formato (`shows_author`…), para que la firma salga o no como en el sitio. */
  formato: PropTypes.object,
};

VistaPreviaDePieza.defaultProps = { topics: [], formato: null };

export default VistaPreviaDePieza;
