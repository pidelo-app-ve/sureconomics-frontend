import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Enlace, useNavegar } from "../../components/Enlace";
import { useUserAuth } from "../../context/UserAuthContext";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import { conVolver, leerVolver } from "../../lib/volver";

export const CuentaVerificarEmail = () => {
  const { t } = useIdioma();
  const navigate = useNavegar();
  const location = useLocation();
  const { isAuthenticated, verifyEmail } = useUserAuth();
  const [email, setEmail] = useState(location.state?.email ?? "");
  // Quien venía de algo concreto (anotar su carrera en El Analista) vuelve ahí.
  const volver = leerVolver(location);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useMetaPagina({
    title: t("cuenta.verificar.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.verificar.meta.descripcion"),
    noindex: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    setIsSubmitting(true);
    try {
      const result = await verifyEmail({ email, code });
      if (result.authenticated) {
        setInfoMessage(t("cuenta.verificar.verificadoRedirigiendo"));
        navigate(volver ?? "/cuenta", { replace: true });
        return;
      }
      setInfoMessage(t("cuenta.verificar.verificado"));
      navigate(conVolver("/cuenta/entrar", volver), { replace: true, state: { email, verified: true } });
    } catch (err) {
      if (err?.status === 429) {
        setErrorMessage(t("cuenta.comun.demasiadasSolicitudes"));
      } else {
        setErrorMessage(err instanceof Error ? err.message : t("cuenta.verificar.codigoInvalido"));
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
            <h1 className="se-heading-section">{t("cuenta.verificar.titulo")}</h1>
            <p className="se-text-small se-admin-login__subtitle">
              {t("cuenta.verificar.subtitulo")}
            </p>
          </header>

          {!isAuthenticated ? (
            <p className="se-text-body">
              {t("cuenta.verificar.trasVerificar", {
                enlace: (
                  <Enlace to="/cuenta/entrar" className="se-link">
                    {t("cuenta.verificar.entrar")}
                  </Enlace>
                ),
              })}
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
              <span className="se-form-label">{t("cuenta.comun.correo")}</span>
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
              <span className="se-form-label">{t("cuenta.verificar.codigo")}</span>
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
              {isSubmitting ? t("cuenta.verificar.verificando") : t("cuenta.verificar.verificar")}
            </button>
          </form>

          <p className="se-text-body" style={{ marginTop: "1.25rem" }}>
            <Enlace to="/cuenta/solicitar-codigo" className="se-link" state={{ email }}>
              {t("cuenta.verificar.solicitarNuevo")}
            </Enlace>
          </p>
        </div>
      </div>
    </main>
  );
};
