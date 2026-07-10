import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { applyPageMeta } from "../../lib/seo";

export const CuentaVerificarEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, verifyEmail } = useUserAuth();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    applyPageMeta({
      title: "Verificar correo — SurEconomics",
      description: "Verificación de correo electrónico.",
      noindex: true,
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    setIsSubmitting(true);
    try {
      const result = await verifyEmail({ email, code });
      if (result.authenticated) {
        setInfoMessage("Correo verificado. Redirigiendo…");
        navigate("/cuenta", { replace: true });
        return;
      }
      setInfoMessage("Correo verificado.");
      navigate("/cuenta/entrar", { replace: true, state: { email, verified: true } });
    } catch (err) {
      if (err?.status === 429) {
        setErrorMessage("Demasiados intentos. Espere unos minutos e inténtelo de nuevo.");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Código inválido o expirado.");
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
            <h1 className="se-heading-section">Verificar correo</h1>
            <p className="se-text-small se-admin-login__subtitle">
              Introduzca el código que enviamos a su correo. Si no ve el mensaje, revise la carpeta de spam.
            </p>
          </header>

          {!isAuthenticated ? (
            <p className="se-text-body">
              Tras verificar, puede{" "}
              <Link to="/cuenta/entrar" className="se-link">
                iniciar sesión
              </Link>
              .
            </p>
          ) : null}

          <form className="se-contact-form" onSubmit={handleSubmit} noValidate>
            {errorMessage ? (
              <p className="se-admin-login__error" role="alert" id="verify-error">
                {errorMessage}
              </p>
            ) : null}
            {infoMessage ? (
              <p className="se-text-body" role="status" id="verify-info">
                {infoMessage}
              </p>
            ) : null}

            <label className="se-form-field" htmlFor="verify-email">
              <span className="se-form-label">Correo electrónico</span>
              <input
                id="verify-email"
                type="email"
                name="email"
                autoComplete="email"
                className="se-form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={
                  [errorMessage && "verify-error", infoMessage && "verify-info"].filter(Boolean).join(" ") || undefined
                }
              />
            </label>

            <label className="se-form-field" htmlFor="verify-code">
              <span className="se-form-label">Código de verificación</span>
              <input
                id="verify-code"
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="se-form-control"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "verify-error" : undefined}
              />
            </label>

            <button type="submit" className="se-btn" disabled={isSubmitting}>
              {isSubmitting ? "Verificando…" : "Verificar"}
            </button>
          </form>

          <p className="se-text-body" style={{ marginTop: "1.25rem" }}>
            <Link to="/cuenta/solicitar-codigo" className="se-link" state={{ email }}>
              Solicitar un nuevo código
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
