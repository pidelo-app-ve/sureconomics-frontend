import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { useAuth } from "../../context/AuthContext";
import { applyPageMeta } from "../../lib/seo";
import { loginUnified } from "../../lib/unifiedAuth";
import { persistAuth } from "../../lib/authStorage";
import { dispatchAdminAuthSync } from "../../lib/api";
import { persistUserAuth } from "../../lib/userAuthStorage";
import { dispatchUserAuthSync } from "../../lib/userApi";

export const CuentaEntrar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isEmailVerified, loadProfile, profile } = useUserAuth();
  const { isAuthenticated: isAdminAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    applyPageMeta({
      title: "Entrar — SurEconomics",
      description: "Acceso para lectores y equipo editorial.",
      noindex: true,
    });
  }, []);

  if (isAdminAuthenticated) {
    return <Navigate to="/admin/posts" replace />;
  }

  if (isAuthenticated && !isEmailVerified) {
    return <Navigate to="/cuenta/verificar-email" replace state={{ email: profile?.email }} />;
  }

  if (isAuthenticated && isEmailVerified) {
    const to = location.state?.from && typeof location.state.from === "string" ? location.state.from : "/";
    return <Navigate to={to} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const result = await loginUnified(email, password);

      if (result.actor === "admin") {
        persistAuth({ ...result.tokens, role: result.role });
        dispatchAdminAuthSync();
        navigate("/admin/posts", { replace: true });
        return;
      }

      persistUserAuth(result.tokens);
      dispatchUserAuthSync();
      let freshProfile = null;
      try {
        freshProfile = await loadProfile();
      } catch {
        /* handled by the isEmailVerified redirect above on next render */
      }
      if (freshProfile?.isEmailVerified) {
        const to = location.state?.from && typeof location.state.from === "string" ? location.state.from : "/";
        navigate(to, { replace: true });
      } else {
        navigate("/cuenta/verificar-email", { replace: true, state: { email } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="se-blog se-admin-login" role="main">
      <div className="se-admin-login__shell">
        <div className="se-container se-container--narrow">
          <header className="se-admin-login__header">
            <h1 className="se-heading-section">Entrar</h1>
            <p className="se-text-small se-admin-login__subtitle">Acceda con su cuenta de lector.</p>
          </header>

          <form className="se-contact-form" onSubmit={handleSubmit} noValidate>
            {errorMessage ? (
              <p className="se-admin-login__error" role="alert" id="cuenta-entrar-error">
                {errorMessage}
              </p>
            ) : null}

            <label className="se-form-field" htmlFor="cuenta-email">
              <span className="se-form-label">Correo electrónico</span>
              <input
                id="cuenta-email"
                type="email"
                name="email"
                autoComplete="username"
                className="se-form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "cuenta-entrar-error" : undefined}
              />
            </label>

            <label className="se-form-field" htmlFor="cuenta-password">
              <span className="se-form-label">Contraseña</span>
              <input
                id="cuenta-password"
                type="password"
                name="password"
                autoComplete="current-password"
                className="se-form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "cuenta-entrar-error" : undefined}
              />
            </label>

            <button type="submit" className="se-btn" disabled={isSubmitting}>
              {isSubmitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="se-text-body" style={{ marginTop: "1.5rem" }}>
            ¿No tiene cuenta?{" "}
            <Link to="/cuenta/registro" className="se-link">
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
