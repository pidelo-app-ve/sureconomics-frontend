import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Enlace } from "../../components/Enlace";
import { BRAND } from "../../data/surEconomicsMock";
import { NO_PARECE_PERSONA, useVerificacionHumana } from "../../hooks/useVerificacionHumana";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import * as userAuthService from "../../services/userAuthService";
import "../../styles/cuenta.css";

export const CuentaSolicitarCodigo = () => {
  const { t } = useIdioma();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Las mismas defensas que el registro: este botón manda un correo a quien se diga,
  // y sin ellas servía para bombardear una dirección ajena (auditoría, oct-2026).
  const [trampa, setTrampa] = useState("");
  const humano = useVerificacionHumana();

  useMetaPagina({
    title: t("cuenta.solicitarCodigo.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.solicitarCodigo.meta.descripcion"),
    noindex: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    try {
      const turnstile = await humano.pedirToken();
      if (turnstile === null) throw Object.assign(new Error("turnstile"), { code: NO_PARECE_PERSONA });
      await userAuthService.resendVerificationCode({ email, website: trampa, turnstile });
      setSuccessMessage(t("cuenta.solicitarCodigo.enviado"));
    } catch (err) {
      if (err?.code === NO_PARECE_PERSONA) {
        setErrorMessage(t("comun.antiBots.noPaso"));
      } else if (err?.status === 429) {
        setErrorMessage(t("cuenta.comun.demasiadasSolicitudes"));
      } else {
        setErrorMessage(err instanceof Error ? err.message : t("cuenta.solicitarCodigo.fallo"));
      }
    } finally {
      humano.reiniciar();
      setIsSubmitting(false);
    }
  };

  return (
    <main className="se-blog se-admin-login" role="main">
      <div className="se-admin-login__shell">
        <div className="se-container se-container--narrow">
          <header className="se-admin-login__header">
            <h1 className="se-heading-section">{t("cuenta.solicitarCodigo.titulo")}</h1>
            <p className="se-text-small se-admin-login__subtitle">
              {t("cuenta.solicitarCodigo.subtitulo")}
            </p>
          </header>

          <p className="se-text-body">
            <Enlace to="/cuenta/entrar" className="se-link">
              {t("cuenta.solicitarCodigo.entrar")}
            </Enlace>
          </p>

          <form className="se-contact-form" onSubmit={handleSubmit} onFocus={humano.activar} noValidate>
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
              <span className="se-form-label">{t("cuenta.comun.correo")}</span>
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

            {/* La trampa: fuera de la vista, del tabulador y de los lectores de pantalla. */}
            <input
              type="text"
              name="website"
              className="se-sr-only"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              value={trampa}
              onChange={(e) => setTrampa(e.target.value)}
            />
            {humano.control}

            <button type="submit" className="se-btn" disabled={isSubmitting}>
              {isSubmitting ? t("cuenta.comun.enviando") : t("cuenta.solicitarCodigo.enviarCodigo")}
            </button>
          </form>

          <p className="se-text-body" style={{ marginTop: "1.25rem" }}>
            <Enlace to="/cuenta/verificar-email" className="se-link" state={{ email }}>
              {t("cuenta.solicitarCodigo.volverAVerificacion")}
            </Enlace>
          </p>
        </div>
      </div>
    </main>
  );
};
