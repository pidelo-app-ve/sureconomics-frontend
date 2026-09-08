import { useRef, useState } from "react";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";
import { subscribeToNewsletter } from "../../services/newsletterService";

/**
 * El bloque del boletín en la portada: «Entorno en Viñetas».
 *
 * Antes anunciaba "nuestro análisis" en abstracto y no hacía nada -- `handleSubmit`
 * llamaba a `preventDefault` y ahí acababa. Ahora anuncia el producto que la redacción
 * va a publicar los lunes por la mañana, y guarda la suscripción de verdad.
 *
 * Tres decisiones de diseño, todas dentro de lo que ya existe en el sistema:
 *
 *   - **la tira de viñetas de la derecha.** La tarjeta medía 64 px de relleno y el texto
 *     acababa a media anchura: la mitad derecha estaba vacía. Se llena con una tira de
 *     recuadros dibujada en CSS, que es lo que "viñeta" significa. Dibujada y no una
 *     ilustración de archivo a propósito: no hay ninguna, y poner una inventada
 *     prometería un contenido que todavía no existe;
 *   - **la etiqueta del campo se ve.** Estaba sólo en el `placeholder`, que desaparece al
 *     escribir y deja al lector sin saber qué escribió -- y a un lector de pantalla sin
 *     nada estable que anunciar;
 *   - **el tratamiento del error va pegado al campo** con `aria-describedby`, no suelto
 *     debajo del formulario.
 *
 * Sobre el trato: este bloque hablaba de "tú" -- "Recibe", "Suscríbete", "Puedes darte
 * de baja" -- y era el único del sitio que lo hacía. Contadas las cadenas de la interfaz
 * salen veintiocho formas de usted contra cuatro de tú, y las cuatro estaban aquí. Se
 * alinea con el resto.
 *
 * El acierto no distingue si el correo ya estaba en la lista: el servidor contesta lo
 * mismo en los dos casos para que nadie pueda averiguar quién está suscrito escribiendo
 * direcciones, y decirlo aquí anularía esa protección desde el navegador.
 */

/** Seis recuadros: dos filas de tres, con uno entintado para que la tira no sea plana. */
const VINETAS = [false, true, false, false, false, true];

export const NewsletterBlock = () => {
  const sectionRef = useRef(null);
  useRevealOnScroll(sectionRef);

  const [email, setEmail] = useState("");
  // El campo trampa. Una persona no lo ve; los rastreadores rellenan todo lo que
  // encuentran, así que si llega con algo, el servidor lo descarta.
  const [trampa, setTrampa] = useState("");
  const [estado, setEstado] = useState({ status: "idle", mensaje: "" });

  const enviando = estado.status === "loading";
  const hayError = estado.status === "error";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const correo = email.trim();
    if (!correo) return;

    setEstado({ status: "loading", mensaje: "" });
    try {
      await subscribeToNewsletter(correo, { source: "home", honeypot: trampa });
      setEmail("");
      setEstado({
        status: "success",
        mensaje: "Listo. El próximo lunes le llega a ese correo.",
      });
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
    <section
      ref={sectionRef}
      className="se-newsletter se-section se-reveal"
      aria-labelledby="newsletter-title"
    >
      <div className="se-container">
        <div className="se-newsletter__card">
          <div className="se-newsletter__grid">
            <div className="se-newsletter__copy">
              <span className="se-newsletter__kicker">
                Boletín semanal · los lunes por la mañana
              </span>

              <h2 id="newsletter-title" className="se-newsletter__title">
                Entorno en Viñetas
              </h2>

              <p className="se-newsletter__text">
                El entorno económico de la semana, contado en viñetas: lo que movió los
                mercados, lo que viene y lo que conviene mirar. Le llega al correo cada
                lunes por la mañana, antes de que la semana empiece a moverse.
              </p>

              <form
                className="se-newsletter__form"
                onSubmit={handleSubmit}
                aria-busy={enviando}
                noValidate
              >
                <label htmlFor="newsletter-email" className="se-newsletter__label">
                  Su correo
                </label>

                <div className="se-newsletter__field">
                  <input
                    id="newsletter-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="se-newsletter__input"
                    placeholder="nombre@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={enviando}
                    required
                    aria-invalid={hayError || undefined}
                    /* La nota siempre; el error sólo cuando existe en el DOM, porque una
                       referencia a un id que no está no se anuncia. */
                    aria-describedby={
                      hayError ? "newsletter-error newsletter-nota" : "newsletter-nota"
                    }
                  />

                  {/* Fuera del tabulador y de los lectores de pantalla: si una persona la
                      rellenara sin querer, su suscripción se descartaría. */}
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

                  <button type="submit" className="se-newsletter__btn" disabled={enviando}>
                    {enviando ? "Enviando…" : "Únase al boletín"}
                  </button>
                </div>

                {/* El error va aquí, dentro del formulario y debajo del campo al que se
                    refiere. `role="alert"` para que se anuncie al aparecer. */}
                {hayError ? (
                  <p id="newsletter-error" className="se-newsletter__error" role="alert">
                    {estado.mensaje}
                  </p>
                ) : null}
              </form>

              {/* El acierto, aparte del formulario porque el formulario ya cumplió.
                  `aria-live` y no `role="alert"`: es una confirmación, no una urgencia. */}
              <div className="se-newsletter__status" aria-live="polite">
                {estado.status === "success" ? (
                  <p className="se-newsletter__ok">{estado.mensaje}</p>
                ) : null}
              </div>

              <p id="newsletter-nota" className="se-newsletter__note">
                Una al lunes y nada más. Puede darse de baja desde cualquier envío.
              </p>
            </div>

            {/* Decoración: la tira de viñetas. Fuera del árbol de accesibilidad porque no
                dice nada que el texto no diga ya. */}
            <div className="se-newsletter__tira" aria-hidden="true">
              {VINETAS.map((entintada, i) => (
                <span
                  key={i}
                  className={
                    entintada
                      ? "se-newsletter__vineta se-newsletter__vineta--tinta"
                      : "se-newsletter__vineta"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
