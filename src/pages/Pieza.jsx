import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { applyPageMeta } from "../lib/seo";
import { LoadingState } from "../components/content";
import { ShareButtons } from "../components/content/ShareButtons";
import { BotonDeMarcador } from "../components/content/BotonDeMarcador";
import {
  Media,
  PieceBody,
  PieceByline,
  PieceComments,
  PieceTags,
  RelatedPieces,
} from "../components/piece";
import { temaPrincipal } from "../lib/contentFilter";
import { FORMATO_META, rutaDePieza } from "../lib/pieza";
import { getPiece, getRelated } from "../services/publicContentService";
import { useTaxonomy } from "../hooks/useTaxonomy";
import { useDelayedFlag } from "../hooks/useDelayedFlag";
import { ESPACIOS } from "../services/publicidadService";
import {
  ESPACIOS_DE_SITIO,
  EspacioPublicitario,
  useEspacios,
} from "../components/publicidad";

/**
 * Detail page for a piece of any format.
 *
 * One shell for all five, with only the body switching — the breadcrumb, kicker,
 * headline, byline, tags and related module do the same job whatever the format,
 * and five near-identical pages would drift apart on the first change.
 */

const NoEncontrada = () => (
  <main className="se-blog se-articles" role="main">
    <section className="se-section">
      <div className="se-container">
        <div className="se-piece">
          <h1 className="se-piece__title">No encontramos esta pieza</h1>
          <p className="se-piece__lead">
            El enlace puede estar roto o el contenido ya no está publicado.
          </p>
          <Link to="/" className="se-piece__back">
            Volver a la portada
          </Link>
        </div>
      </div>
    </section>
  </main>
);

export const Pieza = () => {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const { geoTop } = useTaxonomy();
  const [state, setState] = useState({ status: "loading", pieza: null });
  const [relacionadas, setRelacionadas] = useState([]);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", pieza: null });
    setRelacionadas([]);
    getPiece(slug)
      .then((pieza) => {
        if (!alive) return;
        setState({ status: pieza ? "success" : "missing", pieza });
        // Related pieces load after the piece and never block it: the article is
        // what the reader came for, and a slow sidebar must not hold it back.
        if (pieza) {
          getRelated(pieza)
            .then((items) => {
              if (alive) setRelacionadas(items);
            })
            .catch(() => {
              if (alive) setRelacionadas([]);
            });
        }
      })
      .catch(() => {
        if (alive) setState({ status: "missing", pieza: null });
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const pieza = state.pieza;
  const cargando = useDelayedFlag(state.status === "loading");

  useEffect(() => {
    if (!pieza) return;
    applyPageMeta({
      title: `${pieza.titulo} — ${BRAND.name}`,
      description: pieza.resumen || pieza.entrada || temaPrincipal(pieza) || BRAND.name,
    });
  }, [pieza]);

  // Los huecos de esta pieza, declarados **antes** de los returns tempranos de abajo:
  // un hook no puede quedarse sin ejecutar en un render y sí en el siguiente.
  //
  // `listo` espera a tener la pieza porque el contexto -- formato, temas, países -- es
  // lo que decide qué campaña encaja, y pedir sin él serviría un anuncio al azar y,
  // peor, contaría esa impresión. Y se apaga entero si la redacción marcó la pieza
  // como «sin publicidad»: no se piden espacios, así que no hay nada que ocultar
  // después.
  useEspacios({
    espacios: [...ESPACIOS_DE_SITIO, ESPACIOS.ARTICULO_NATIVO, ESPACIOS.ARTICULO_RAIL],
    contexto: {
      seccion: pieza?.formatoApi ?? null,
      formato: pieza?.formatoApi ?? null,
      tema: pieza?.temaSlugs ?? [],
      pais: pieza?.geoSlugs ?? [],
    },
    listo: Boolean(pieza) && !pieza.sinPublicidad,
  });

  if (state.status === "loading") {
    // Nothing at all for the first fraction of a second: a piece that loads fast
    // should just appear, without a card flashing in front of it.
    return (
      <main className="se-blog se-articles" role="main">
        <section className="se-section">
          <div className="se-container">{cargando ? <LoadingState title="Cargando…" /> : null}</div>
        </section>
      </main>
    );
  }

  if (!pieza) return <NoEncontrada />;

  // The format lives in the URL, so a hand-edited path can disagree with the
  // piece. Send it to the canonical address rather than serving a lie.
  const canonica = rutaDePieza(pieza);
  if (pathname !== canonica) return <Navigate to={canonica} replace />;

  const meta = FORMATO_META[pieza.formatoApi];
  const lugar = pieza.geos?.[0] ?? geoTop;
  const tema = temaPrincipal(pieza);

  // La entradilla sale del campo que cada formato usa para ella.
  const entradilla = pieza.resumenHtml || pieza.entradaHtml || "";
  // La entrevista no lleva portada en la cabecera: su portada es el video.
  const conPortada = pieza.formato !== "Entrevistas";

  return (
    <main className="se-blog se-articles" role="main">
      <section className="se-section">
        <div className="se-container">
          <article className="se-piece">
            <nav className="se-piece__crumbs" aria-label="Ubicación">
              <Link to="/">Inicio</Link>
              <span aria-hidden="true"> › </span>
              <Link to={`/articulos?formato=${meta?.slug ?? ""}`}>{pieza.formato}</Link>
              {lugar ? (
                <>
                  <span aria-hidden="true"> › </span>
                  <Link to={`/explorar?donde=${encodeURIComponent(lugar)}`}>{lugar}</Link>
                </>
              ) : null}
            </nav>

            {/* La cabecera, a dos columnas: el titular y la entradilla a la
                izquierda, la fotografía a la derecha. Antes la imagen iba debajo del
                titular y empujaba el texto fuera de la primera pantalla.

                La entrevista queda fuera: su portada es el video, que se reproduce
                y por tanto vive en el cuerpo, no en un hueco de cabecera. */}
            <header className={`se-piece__head${conPortada ? " se-piece__head--media" : ""}`}>
              <div className="se-piece__head-text">
                <p className="se-piece__kicker">
                  {pieza.formato}
                  {tema ? ` · ${tema}` : ""}
                </p>
                <h1 className="se-piece__title">{pieza.titulo}</h1>
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
                esEditorial={pieza.formato === "Editorial"}
              />
              <div className="se-piece__acciones">
                {/* Guardar, al lado de compartir: las dos son «qué hago con esto
                    después de leerlo». El botón faltaba por completo -- la sección de
                    marcadores de la cuenta existía con su pantalla y su endpoint, pero
                    nada la alimentaba, así que no podía tener nada dentro. */}
                <BotonDeMarcador postId={pieza.id} />
                <ShareButtons url={canonica} title={pieza.titulo} className="se-piece__share" />
              </div>
            </div>

            {/* El cuerpo y, al lado, lo que se puede leer después. La columna de
                lectura se estrecha a propósito: un párrafo que cruza la pantalla
                entera cansa, y el brandbook lo maqueta así. */}
            <div className="se-piece__cols">
              <div className="se-piece__main">
                <PieceBody pieza={pieza} enCabecera={conPortada} />
                <PieceTags temas={pieza.temas} geos={pieza.geos} />

                {/* La tarjeta nativa del cuerpo, detrás del texto y de las etiquetas.
                    Se probó a mitad del cuerpo, partiendo los párrafos, y el cliente
                    lo descartó: en una pieza corta el corte llega enseguida y la
                    lectura se parte antes de haber dicho nada.

                    Lleva la misma etiqueta de publicidad que en la portada: lo que la
                    separa de una pieza de la redacción no puede depender de dónde
                    esté. */}
                <EspacioPublicitario espacio={ESPACIOS.ARTICULO_NATIVO} variante="cuerpo" />

                {/* Debajo del cuerpo y las etiquetas, en la columna de lectura: la
                    conversación es sobre lo que se acaba de leer.

                    Sólo donde la sección los admite -- hoy artículo, editorial,
                    entrevista y podcast. La decisión viaja en la pieza porque es una
                    política del formato, editable desde el panel, y no una lista de
                    formatos escrita aquí: la página de detalle es una sola para los
                    seis, así que sin esta condición aparecerían en todos. */}
                {pieza.admiteComentarios ? (
                  <PieceComments pieza={{ slug: pieza.slug, rutaCanonica: canonica }} />
                ) : null}
              </div>

              <aside className="se-piece__aside" aria-label="Más contenido">
                {/* El rail va **encima** de «También te puede interesar», como en la
                    maqueta: es la primera cosa que ve quien levanta la vista del texto,
                    y es el sitio que se vende. Si no hay campaña que encaje no pinta
                    nada y la columna arranca directamente en las relacionadas. */}
                <EspacioPublicitario espacio={ESPACIOS.ARTICULO_RAIL} />
                {relacionadas.length ? <RelatedPieces items={relacionadas} /> : null}
              </aside>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
};
