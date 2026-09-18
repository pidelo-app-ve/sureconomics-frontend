import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { useAuth } from "../../context/AuthContext";
import { applyPageMeta } from "../../lib/seo";
import { CampoDeTexto } from "../../components/cuenta/CampoDeTexto";
import { BotonDeGoogle } from "../../components/cuenta/BotonDeGoogle";
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
    <main className="se-blog se-entrada" role="main">
      <div className="se-entrada__caja">
        <p className="se-entrada__kicker">Entrar</p>
        <h1 className="se-entrada__titulo">Su cuenta de SurEconomics</h1>
        <p className="se-entrada__lead">
          Sus artículos guardados, sus envíos y los módulos que haya comprado.
        </p>

        <form className="se-entrada__form" onSubmit={handleSubmit} noValidate>
          <CampoDeTexto
            id="cuenta-email"
            etiqueta="Correo electrónico"
            tipo="email"
            valor={email}
            onCambio={setEmail}
            autoComplete="email"
          />
          <CampoDeTexto
            id="cuenta-password"
            etiqueta="Contraseña"
            tipo="password"
            valor={password}
            onCambio={setPassword}
            autoComplete="current-password"
          />

          {errorMessage ? (
            <p className="se-entrada__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" className="se-btn se-entrada__enviar" disabled={isSubmitting}>
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <BotonDeGoogle
          texto="signin_with"
          onEntrado={() => {
            const to =
              location.state?.from && typeof location.state.from === "string"
                ? location.state.from
                : "/";
            navigate(to, { replace: true });
          }}
        />

        <p className="se-entrada__pie">
          ¿No tiene cuenta? <Link to="/cuenta/registro">Crear una</Link>
        </p>
      </div>
    </main>
  );
};

export default CuentaEntrar;
