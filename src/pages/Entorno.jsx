import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { applyPageMeta } from "../lib/seo";
import { subscribeToNewsletter } from "../services/newsletterService";

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

  useEffect(() => {
    applyPageMeta({
      title: "Entorno en Viñetas — SurEconomics",
      description:
        "El boletín semanal de SurEconomics: el entorno económico de la semana, contado en viñetas. Gratis, cada lunes.",
    });
  }, []);

  const enviando = estado.status === "loading";
  const hayError = estado.status === "error";
  const listo = estado.status === "success";

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const correo = email.trim();
    if (!correo) {
      setEstado({ status: "error", mensaje: "Escriba su correo para suscribirse." });
      return;
    }
    setEstado({ status: "loading", mensaje: "" });
    try {
      await subscribeToNewsletter(correo, { source: "instagram", honeypot: trampa });
      setEmail("");
      setEstado({ status: "success", mensaje: "" });
    } catch (err) {
      setEstado({
        status: "error",
        mensaje:
          err?.status === 422
            ? "Ese correo no parece completo. Revíselo y vuelva a probar."
            : err?.status === 429
              ? "Demasiados intentos seguidos. Espere un momento."
              : "No se pudo completar la suscripción. Inténtelo de nuevo.",
      });
    }
  };

  return (
    <main className="se-entorno" role="main">
      <div className="se-entorno__caja">
        <Link to="/" className="se-entorno__marca" aria-label="SurEconomics, ir al sitio">
          <img src="/brand/v2/lockup-verde.png" alt="SurEconomics" width="900" height="117" />
        </Link>

        <p className="se-entorno__kicker">Boletín semanal · los lunes a las 9:00</p>
        <h1 className="se-entorno__titulo">Entorno en Viñetas</h1>
        <p className="se-entorno__texto">
          El entorno económico de la semana, contado en viñetas: lo que movió los mercados,
          lo que viene y lo que conviene mirar. Gratis, en su correo.
        </p>

        {listo ? (
          <div className="se-entorno__listo" role="status">
            <p className="se-entorno__listo-titulo">Listo, ya está suscrito.</p>
            <p className="se-entorno__listo-texto">El próximo lunes le llega a su correo.</p>
            <Link to="/" className="se-entorno__boton se-entorno__boton--secundario">
              Ver SurEconomics
            </Link>
          </div>
        ) : (
          <form className="se-entorno__form" onSubmit={enviar} aria-busy={enviando} noValidate>
            <label htmlFor="entorno-email" className="se-entorno__label">
              Su correo
            </label>
            <input
              id="entorno-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              className="se-entorno__input"
              placeholder="nombre@correo.com"
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
              {enviando ? "Enviando…" : "Suscribirme"}
            </button>
          </form>
        )}

        {!listo ? (
          <Link to="/" className="se-entorno__no">
            No, gracias — ir a SurEconomics <span aria-hidden="true">›</span>
          </Link>
        ) : null}

        <p className="se-entorno__letra">
          Sin spam. Se da de baja con un clic desde cualquier boletín.
        </p>
      </div>
    </main>
  );
};

export default Entorno;
