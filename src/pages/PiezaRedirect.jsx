import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { LoadingState } from "../components/content";
import { rutaDePieza } from "../lib/pieza";
import { useDelayedFlag } from "../hooks/useDelayedFlag";
import { getPiece } from "../services/publicContentService";

/**
 * Old article addresses, sent to where the piece lives now.
 *
 * Every article published before the redesign sits at `/articulo/<slug>`. Those
 * URLs are indexed, they have been shared, and some of them are linked from
 * elsewhere — so the route cannot simply disappear when the reading page moves to
 * `/noticias/<slug>`, `/articulos/<slug>` and the rest. The format is not in the
 * old URL, so the only way to know where a slug belongs is to ask.
 *
 * It also quietly fixes every place inside the app that still builds an
 * `/articulo/<slug>` link from a slug alone — a bookmark, a comment, an approved
 * submission — none of which knows the piece's format either.
 */
export const PiezaRedirect = () => {
  const { slug } = useParams();
  const [state, setState] = useState({ status: "loading", destino: null });
  const cargando = useDelayedFlag(state.status === "loading");

  useEffect(() => {
    let alive = true;
    getPiece(slug)
      .then((pieza) => {
        if (!alive) return;
        setState({
          status: pieza ? "found" : "missing",
          destino: pieza ? rutaDePieza(pieza) : null,
        });
      })
      .catch(() => {
        if (alive) setState({ status: "missing", destino: null });
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (state.status === "loading") {
    return (
      <main className="se-blog se-articles" role="main">
        <section className="se-section">
          <div className="se-container">
            {cargando ? <LoadingState title="Buscando la pieza…" /> : null}
          </div>
        </section>
      </main>
    );
  }

  // `replace` so the old address does not sit in the reader's history behind the
  // new one, where the back button would bounce them straight through it again.
  if (state.destino) return <Navigate to={state.destino} replace />;

  return (
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
};
