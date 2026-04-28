import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { applyPageMeta } from "../../lib/seo";

const MODES = {
  login: "login",
  register: "register",
};

export const Backoffice = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuth();
  const [mode, setMode] = useState(MODES.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useMemo(() => {
    applyPageMeta({
      title: "Backoffice — Sur Economics",
      description: "Acceso a la administración.",
      noindex: true,
    });
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/admin/posts" replace />;
  }

  const isRegister = mode === MODES.register;
  const title = isRegister ? "Backoffice" : "Backoffice";
  const subtitle = isRegister
    ? "Cree una cuenta de administrador para acceder al panel."
    : "Inicie sesión para acceder al panel de administración.";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Introduzca un correo válido.");
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register(trimmedEmail, password);
      } else {
        await login(trimmedEmail, password);
      }
      navigate("/admin/posts", { replace: true });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "No se pudo completar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="se-blog se-backoffice-auth" role="main">
      <div className="se-backoffice-auth__shell">
        <div className="se-container se-container--narrow">
          <header className="se-backoffice-auth__header">
            <p className="se-backoffice-auth__kicker">Sur Economics</p>
            <h1 className="se-heading-section">{title}</h1>
            <p className="se-text-small se-backoffice-auth__subtitle">{subtitle}</p>
          </header>

          <div className="se-backoffice-auth__tabs" role="tablist" aria-label="Acceso backoffice">
            <button
              type="button"
              role="tab"
              className={`se-backoffice-auth__tab${!isRegister ? " se-backoffice-auth__tab--active" : ""}`}
              aria-selected={!isRegister}
              onClick={() => setMode(MODES.login)}
              disabled={isSubmitting}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              className={`se-backoffice-auth__tab${isRegister ? " se-backoffice-auth__tab--active" : ""}`}
              aria-selected={isRegister}
              onClick={() => setMode(MODES.register)}
              disabled={isSubmitting}
            >
              Registrar
            </button>
          </div>

          <form className="se-contact-form" onSubmit={handleSubmit} noValidate>
            {errorMessage ? (
              <p className="se-backoffice-auth__error" role="alert" id="backoffice-auth-error">
                {errorMessage}
              </p>
            ) : null}

            <label className="se-form-field" htmlFor="backoffice-email">
              <span className="se-form-label">Correo</span>
              <input
                id="backoffice-email"
                type="email"
                name="email"
                autoComplete={isRegister ? "email" : "username"}
                className="se-form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "backoffice-auth-error" : undefined}
              />
            </label>

            <label className="se-form-field" htmlFor="backoffice-password">
              <span className="se-form-label">Contraseña</span>
              <input
                id="backoffice-password"
                type="password"
                name="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="se-form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "backoffice-auth-error" : undefined}
              />
            </label>

            <button type="submit" className="se-btn" disabled={isSubmitting}>
              {isSubmitting ? "Procesando…" : isRegister ? "Crear cuenta" : "Entrar"}
            </button>
          </form>

          <p className="se-text-body se-backoffice-auth__footer">
            <Link to="/" className="se-link">
              Volver al sitio
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

