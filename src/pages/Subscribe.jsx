import { Link } from "react-router-dom";

export const Subscribe = () => {
  return (
    <main className="se-blog" role="main">
      <section className="se-section">
        <div className="se-container se-container--narrow">
          <h1 className="se-heading-section">Suscribirse</h1>
          <p className="se-text-body">
            La suscripción al newsletter estará disponible en la siguiente fase del producto.
            Mientras tanto, puedes explorar nuestro contenido en la{" "}
            <Link to="/" className="se-link">
              página principal
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
};
