import { Link } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { applyPageMeta } from "../lib/seo";
import { BRAND } from "../data/surEconomicsMock";

// La 404 no es una página que se visite a propósito: el juego se descarga solo si
// alguien llega aquí, y convierte un enlace roto en un minuto agradable.
const Guacamaya = lazy(() => import("../juegos/guacamaya/Guacamaya"));

export const NotFound = () => {
  useEffect(() => {
    applyPageMeta({
      title: `Página no encontrada — ${BRAND.name}`,
      description: "La página que buscás no existe o fue movida.",
    });
  }, []);

  return (
    <main className="se-blog" role="main">
      <section className="se-section">
        <div className="se-container se-container--narrow">
          <h1 className="se-heading-section">Página no encontrada</h1>
          <p className="se-text-body">
            La URL puede estar mal escrita o el contenido ya no está disponible.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/" className="se-btn">
              Volver al inicio
            </Link>
            <Link to="/articulos" className="se-btn se-btn--secondary">
              Explorar artículos
            </Link>
          </div>
        </div>
      </section>
      <section className="se-section" aria-label="Un minuto de pausa">
        <div className="se-container" style={{ maxWidth: 560 }}>
          <p className="se-text-body" style={{ marginBottom: "1rem" }}>
            Ya que está aquí, un minuto de pausa:
          </p>
          <Suspense fallback={null}>
            <Guacamaya />
          </Suspense>
        </div>
      </section>
    </main>
  );
};

