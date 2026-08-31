import { useState } from "react";
import { CONTACT } from "../data/surEconomicsMock";
import { Link, useSearchParams } from "react-router-dom";
import { contactService } from "../services/contactService";
import { useClaveIdempotente } from "../hooks/useClaveIdempotente";

export const Contacto = () => {
  const [searchParams] = useSearchParams();
  const prefilledSubject = searchParams.get("asunto") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: prefilledSubject,
    message: "",
  });
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });
  // La misma clave mientras el envío no cuaje: si la respuesta se pierde y la persona
  // vuelve a pulsar, el servidor devuelve la de la primera vez en lugar de guardar el
  // mensaje dos veces. Ver `lib/idempotencia.js`.
  const { clave, renovar } = useClaveIdempotente();

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitState.status === "loading") return;
    setSubmitState({ status: "loading", message: "" });
    try {
      await contactService.submitContactMessage(form, { idempotencyKey: clave() });
      setSubmitState({ status: "success", message: "Gracias por escribirnos. Le responderemos a la brevedad." });
      setForm({ name: "", email: "", subject: "", message: "" });
      // Cuajó: lo que venga después es un mensaje nuevo, no un reintento.
      renovar();
    } catch (err) {
      const tooMany = err?.status === 429;
      setSubmitState({
        status: "error",
        message: tooMany
          ? "Demasiadas solicitudes. Intente de nuevo en unos minutos."
          : "No se pudo enviar el mensaje. Intente de nuevo o escríbanos directamente por email.",
      });
    }
  };

  return (
    <main className="se-blog se-contact" role="main">
      <section className="se-hero se-hero--institutional se-contact__hero">
        <div className="se-container">
          <div className="se-institutional-hero">
            <h1 className="se-heading-hero">Contacto</h1>
            <p className="se-text-lead se-hero__claim">
              Contacto institucional para consultas, alianzas y proyectos de investigación/asesoría.
            </p>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <div className="se-contact__grid">
            <div className="se-contact__panel">
              <h2 className="se-heading-section">Formulario</h2>
              <form className="se-contact-form se-contact__form" onSubmit={handleSubmit} aria-describedby="contact-submit-status">
                <div id="contact-submit-status" className="se-contact__status" aria-live="polite">
                  {submitState.status === "success" ? (
                    <div className="se-contact__banner" role="status">
                      <strong>Enviado.</strong> {submitState.message}
                    </div>
                  ) : submitState.status === "loading" ? (
                    <div className="se-contact__banner se-contact__banner--loading" role="status">
                      Enviando…
                    </div>
                  ) : submitState.status === "error" ? (
                    <div className="se-contact__banner se-contact__banner--error" role="alert">
                      {submitState.message}
                    </div>
                  ) : null}
                </div>
                <div className="se-form-grid">
                  <label className="se-form-field">
                    <span className="se-form-label">Nombre</span>
                    <input
                      className="se-form-control"
                      value={form.name}
                      onChange={handleChange("name")}
                      required
                      disabled={submitState.status === "loading"}
                    />
                  </label>
                  <label className="se-form-field">
                    <span className="se-form-label">Correo electrónico</span>
                    <input
                      type="email"
                      className="se-form-control"
                      value={form.email}
                      onChange={handleChange("email")}
                      required
                      disabled={submitState.status === "loading"}
                    />
                  </label>
                </div>
                <label className="se-form-field">
                  <span className="se-form-label">Asunto</span>
                  <input
                    className="se-form-control"
                    value={form.subject}
                    onChange={handleChange("subject")}
                    required
                    disabled={submitState.status === "loading"}
                  />
                </label>
                <label className="se-form-field">
                  <span className="se-form-label">Mensaje</span>
                  <textarea
                    className="se-form-control se-form-control--textarea"
                    rows={6}
                    value={form.message}
                    onChange={handleChange("message")}
                    required
                    disabled={submitState.status === "loading"}
                  />
                </label>
                <button type="submit" className="se-btn" aria-label="Enviar formulario" disabled={submitState.status === "loading"}>
                  {submitState.status === "loading" ? "Enviando…" : "Enviar"}
                </button>
              </form>

              <div className="se-contact__footer-links">
                <Link to="/consultoria" className="se-link">
                  Consultoría
                </Link>
              </div>
            </div>

            <div className="se-contact__aside">
              <section className="se-contact__module" aria-label="Emails corporativos">
                <h2 className="se-heading-section">Emails corporativos</h2>
                <div className="se-contact-info">
                  <div className="se-contact-info__row">
                    <span className="se-contact-info__label">Principal:</span>
                    <a href={`mailto:${CONTACT.primaryEmail}`} className="se-link">
                      {CONTACT.primaryEmail}
                    </a>
                  </div>
                  {CONTACT.leadershipEmails.map((e) => (
                    <div key={e.email} className="se-contact-info__row">
                      <span className="se-contact-info__label">{e.name}:</span>
                      <a href={`mailto:${e.email}`} className="se-link">
                        {e.email}
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              <section className="se-contact__module" aria-label="Oficinas">
                <h2 className="se-heading-section">Oficinas</h2>
                <div className="se-contact-offices">
                  {CONTACT.offices.map((o) => (
                    <div key={o.city} className="se-contact-office">
                      <div className="se-contact-office__city">{o.city}</div>
                      <div className="se-contact-office__address">{o.address}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

