import { useState } from "react";
import { CONTACT } from "../data/surEconomicsMock";
import { Link } from "react-router-dom";

export const Contacto = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo-only: no backend integration yet.
    // eslint-disable-next-line no-alert
    alert("Mensaje enviado (demo). En la próxima fase se conectará a backend.");
  };

  return (
    <main className="se-blog" role="main">
      <section className="se-hero se-hero--institutional">
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
          <div className="se-two-col se-two-col--align-start">
            <div>
              <h2 className="se-heading-section">Formulario</h2>
              <form className="se-contact-form" onSubmit={handleSubmit}>
                <div className="se-form-grid">
                  <label className="se-form-field">
                    <span className="se-form-label">Nombre</span>
                    <input
                      className="se-form-control"
                      value={form.name}
                      onChange={handleChange("name")}
                      required
                    />
                  </label>
                  <label className="se-form-field">
                    <span className="se-form-label">Email</span>
                    <input
                      type="email"
                      className="se-form-control"
                      value={form.email}
                      onChange={handleChange("email")}
                      required
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
                  />
                </label>
                <button type="submit" className="se-btn" aria-label="Enviar formulario">
                  Enviar
                </button>
              </form>

              <div style={{ marginTop: "1rem" }}>
                <Link to="/consultoria" className="se-link">
                  Consultoría
                </Link>
              </div>
            </div>

            <div>
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

              <h2 className="se-heading-section" style={{ marginTop: "2.25rem" }}>
                Oficinas
              </h2>
              <div className="se-contact-offices">
                {CONTACT.offices.map((o) => (
                  <div key={o.city} className="se-contact-office">
                    <div className="se-contact-office__city">{o.city}</div>
                    <div className="se-contact-office__address">{o.address}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

