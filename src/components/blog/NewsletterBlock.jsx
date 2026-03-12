export const NewsletterBlock = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo: no backend. Could show a toast or message.
  };

  return (
    <section className="se-newsletter se-section" aria-labelledby="newsletter-title">
      <div className="se-container">
        <div className="se-newsletter__card">
          <h2 id="newsletter-title" className="se-newsletter__title">
            Recibe nuestro análisis en tu correo
          </h2>
          <p className="se-newsletter__text">
            Suscríbete para recibir resúmenes y artículos destacados de Sur Economics.
          </p>
          <form
            className="se-newsletter__form"
            onSubmit={handleSubmit}
            noValidate
          >
            <label htmlFor="newsletter-email" className="se-sr-only">
              Correo electrónico
            </label>
            <input
              id="newsletter-email"
              type="email"
              className="se-newsletter__input"
              placeholder="tu@correo.com"
              aria-label="Correo electrónico"
            />
            <button type="submit" className="se-btn se-newsletter__btn">
              Suscribirse
            </button>
          </form>
          <p className="se-newsletter__note">
            Sin spam. Solo contenido relevante. Puedes darte de baja cuando quieras.
          </p>
        </div>
      </div>
    </section>
  );
};
