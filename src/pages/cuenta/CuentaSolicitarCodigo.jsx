import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as userAuthService from "../../services/userAuthService";
import { applyPageMeta } from "../../lib/seo";

export const CuentaSolicitarCodigo = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    applyPageMeta({
      title: "Solicitar código — SurEconomics",
      description: "Reenvío del código de verificación.",
      noindex: true,
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    try {
      await userAuthService.resendVerificationCode({ email });
      setSuccessMessage("Si el correo es válido, le enviaremos un nuevo código.");
    } catch (err) {
      if (err?.status === 429) {
        setErrorMessage("Demasiadas solicitudes. Espere unos minutos e inténtelo de nuevo.");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "No se pudo enviar el código.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="se-blog se-admin-login" role="main">
      <div className="se-admin-login__shell">
        <div className="se-container se-container--narrow">
          <header className="se-admin-login__header">
            <h1 className="se-heading-section">Solicitar código</h1>
            <p className="se-text-small se-admin-login__subtitle">
              Reenviamos un código de verificación. No confirmamos si el correo existe (privacidad).
            </p>
          </header>

          <p className="se-text-body">
            <Link to="/cuenta/entrar" className="se-link">
              Iniciar sesión
            </Link>
          </p>

          <form className="se-contact-form" onSubmit={handleSubmit} noValidate>
            {errorMessage ? (
              <p className="se-admin-login__error" role="alert" id="resend-error">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="se-text-body" role="status" id="resend-ok">
                {successMessage}
              </p>
            ) : null}

            <label className="se-form-field" htmlFor="resend-email">
              <span className="se-form-label">Correo electrónico</span>
              <input
                id="resend-email"
                type="email"
                name="email"
                autoComplete="email"
                className="se-form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                aria-describedby={
                  [errorMessage && "resend-error", successMessage && "resend-ok"].filter(Boolean).join(" ") || undefined
                }
              />
            </label>

            <button type="submit" className="se-btn" disabled={isSubmitting}>
              {isSubmitting ? "Enviando…" : "Enviar código"}
            </button>
          </form>

          <p className="se-text-body" style={{ marginTop: "1.25rem" }}>
            <Link to="/cuenta/verificar-email" className="se-link" state={{ email }}>
              Volver a verificación
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
