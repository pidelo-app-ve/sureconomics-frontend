import { Link } from "react-router-dom";
import { useEffect } from "react";
import { applyPageMeta } from "../lib/seo";
import { BRAND } from "../data/surEconomicsMock";

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
    </main>
  );
};

