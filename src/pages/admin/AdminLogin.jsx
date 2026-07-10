import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const AdminLogin = () => {
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/admin/posts" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);
        try {
            await login(email, password);
            navigate("/admin/posts", { replace: true });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "No se pudo iniciar sesión.";
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
                        <h1 className="se-heading-section">Administración</h1>
                        <p className="se-text-small se-admin-login__subtitle">
                            Inicie sesión para acceder al panel.
                        </p>
                    </header>

                    <form className="se-contact-form" onSubmit={handleSubmit}>
                        {errorMessage ? (
                            <p
                                className="se-admin-login__error"
                                role="alert"
                                id="admin-login-error"
                            >
                                {errorMessage}
                            </p>
                        ) : null}

                        <label className="se-form-field" htmlFor="admin-email">
                            <span className="se-form-label">Correo electrónico</span>
                            <input
                                id="admin-email"
                                type="email"
                                name="email"
                                autoComplete="username"
                                className="se-form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isSubmitting}
                                aria-invalid={Boolean(errorMessage)}
                                aria-describedby={
                                    errorMessage ? "admin-login-error" : undefined
                                }
                            />
                        </label>

                        <label className="se-form-field" htmlFor="admin-password">
                            <span className="se-form-label">Contraseña</span>
                            <input
                                id="admin-password"
                                type="password"
                                name="password"
                                autoComplete="current-password"
                                className="se-form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isSubmitting}
                                aria-invalid={Boolean(errorMessage)}
                                aria-describedby={
                                    errorMessage ? "admin-login-error" : undefined
                                }
                            />
                        </label>

                        <button
                            type="submit"
                            className="se-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Entrando…" : "Entrar"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};
