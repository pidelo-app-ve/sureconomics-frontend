import { useState } from "react";
import { BRAND } from "../data/surEconomicsMock";
import { Enlace } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { marcarSuscrito } from "../lib/invitacionBoletin";
import { subscribeToNewsletter } from "../services/newsletterService";
import { NO_PARECE_PERSONA, useVerificacionHumana } from "../hooks/useVerificacionHumana";

/**
 * `/entorno`: la puerta de entrada al boletín desde el perfil de Instagram.
 *
 * Va **fuera del marco del sitio** -- sin cabecera, sin menú, sin pie -- y a propósito:
 * se abre dentro del navegador de Instagram, en un teléfono, y tiene una sola cosa que
 * hacer. Cada enlace de más es una salida antes de suscribirse. Es el mismo patrón que la
 * página de suscripción de un Substack: marca, qué es, el campo y un «no, gracias».
 *
 * La suscripción es la misma que la del bloque de la portada -- mismo endpoint, misma
 * trampa para bots --, con `source: "instagram"` para que el panel pueda contar cuántas
 * llegan por aquí.
 */
export const Entorno = () => {
  const [email, setEmail] = useState("");
  const [trampa, setTrampa] = useState("");
  const [estado, setEstado] = useState({ status: "idle", mensaje: "" });
  const { t } = useIdioma();
  // Cloudflare Turnstile: ver `hooks/useVerificacionHumana`.
  const humano = useVerificacionHumana();

  useMetaPagina({
    title: t("boletin.entorno.meta.titulo", { marca: BRAND.name }),
    description: t("boletin.entorno.meta.descripcion"),
  });

  const enviando = estado.status === "loading";
  const hayError = estado.status === "error";
  const listo = estado.status === "success";

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const correo = email.trim();
    if (!correo) {
      setEstado({ status: "error", mensaje: t("boletin.entorno.escribaCorreo") });
      return;
    }
    setEstado({ status: "loading", mensaje: "" });
    try {
      const turnstile = await humano.pedirToken();
      if (turnstile === null) throw Object.assign(new Error("turnstile"), { code: NO_PARECE_PERSONA });
      await subscribeToNewsletter(correo, { turnstile, source: "instagram", honeypot: trampa });
      humano.reiniciar();
      // Quien ya está en la lista no tiene que ver la invitación flotante del sitio.
      marcarSuscrito();
      setEmail("");
      setEstado({ status: "success", mensaje: "" });
    } catch (err) {
      humano.reiniciar();
      setEstado({
        status: "error",
        mensaje:
          err?.code === NO_PARECE_PERSONA
            ? t("comun.antiBots.noPaso")
            : err?.status === 422
            ? t("boletin.errores.correoIncompleto")
            : err?.status === 429
              ? t("boletin.errores.demasiados")
              : t("boletin.errores.fallo"),
      });
    }
  };

  return (
    <main className="se-entorno" role="main">
      <div className="se-entorno__caja">
        <Enlace to="/" className="se-entorno__marca" aria-label={t("boletin.entorno.irAlSitio")}>
          <img src="/brand/v2/lockup-verde.png" alt="SurEconomics" width="900" height="117" />
        </Enlace>

        <p className="se-entorno__kicker">{t("boletin.entorno.kicker")}</p>
        <h1 className="se-entorno__titulo">{t("boletin.nombre")}</h1>
        <p className="se-entorno__texto">{t("boletin.entorno.texto")}</p>

        {listo ? (
          <div className="se-entorno__listo" role="status">
            <p className="se-entorno__listo-titulo">{t("boletin.entorno.listoTitulo")}</p>
            <p className="se-entorno__listo-texto">{t("boletin.entorno.listoTexto")}</p>
            <Enlace to="/" className="se-entorno__boton se-entorno__boton--secundario">
              {t("boletin.entorno.verSitio")}
            </Enlace>
          </div>
        ) : (
          <form onFocus={humano.activar} className="se-entorno__form" onSubmit={enviar} aria-busy={enviando} noValidate>
            <label htmlFor="entorno-email" className="se-entorno__label">
              {t("boletin.entorno.suCorreo")}
            </label>
            <input
              id="entorno-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              className="se-entorno__input"
              placeholder={t("boletin.entorno.placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={enviando}
              required
              aria-invalid={hayError || undefined}
              aria-describedby={hayError ? "entorno-error" : undefined}
            />
            {/* Trampa para bots: fuera del tabulador y de los lectores de pantalla. */}
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
            {hayError ? (
              <p id="entorno-error" className="se-entorno__error" role="alert">
                {estado.mensaje}
              </p>
            ) : null}
            <button type="submit" className="se-entorno__boton" disabled={enviando}>
              {enviando ? t("boletin.entorno.enviando") : t("boletin.entorno.suscribirme")}
            </button>
            {humano.control}
          </form>
        )}

        {!listo ? (
          <Enlace to="/" className="se-entorno__no">
            {t("boletin.entorno.noGracias")} <span aria-hidden="true">›</span>
          </Enlace>
        ) : null}

        <p className="se-entorno__letra">{t("boletin.entorno.letra")}</p>
      </div>
    </main>
  );
};

export default Entorno;
