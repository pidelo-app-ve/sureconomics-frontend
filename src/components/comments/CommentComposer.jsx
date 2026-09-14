import PropTypes from "prop-types";
import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * La caja para escribir un comentario, y lo que se pinta cuando todavía no se puede.
 *
 * Los dos estados previos -- sin cuenta y sin correo confirmado -- usan `.se-gate`, el
 * mismo bloque de invitación que ya lleva la descarga de un informe. Antes eran una
 * línea de texto suelta ("Entrar para comentar.") y eso desperdiciaba el momento: quien
 * acaba de leer una pieza y quiere responder es exactamente cuando más razón tiene para
 * crear la cuenta. Reusar el bloque, además, hace que registrarse se vea igual en todo
 * el sitio en vez de dos invitaciones distintas según dónde te la encuentres.
 *
 * `volverA` es la dirección a la que devolver al lector después de entrar. La versión
 * anterior mandaba `/articulo/<slug>`, que es la ruta **vieja** del sitio previo al
 * rediseño -- hoy sólo existe como redirección -- así que quien entrase daba un salto
 * de más para volver a lo que estaba leyendo.
 */
export const CommentComposer = ({
  isAuthenticated,
  isEmailVerified,
  volverA,
  onSubmitComment,
}) => {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <section className="se-gate" aria-labelledby="comment-gate-title">
        <h3 id="comment-gate-title" className="se-gate__title">
          Participe en la conversación
        </h3>
        <p className="se-gate__lead">
          Cree una cuenta gratuita para comentar esta y cualquier otra pieza, guardar lo
          que quiera leer después y descargar los informes.
        </p>
        <div className="se-gate__actions">
          <Link to="/cuenta/registro" className="se-gate__submit" state={{ from: volverA }}>
            Crear una cuenta
          </Link>
          <Link to="/cuenta/entrar" className="se-link" state={{ from: volverA }}>
            Ya tengo cuenta
          </Link>
        </div>
      </section>
    );
  }

  if (!isEmailVerified) {
    return (
      <section className="se-gate" aria-labelledby="comment-gate-title">
        <h3 id="comment-gate-title" className="se-gate__title">
          Falta confirmar su correo
        </h3>
        <p className="se-gate__lead">
          Es el último paso para poder comentar. Le llegó un código al correo con el que
          se registró.
        </p>
        <div className="se-gate__actions">
          <Link to="/cuenta/verificar-email" className="se-gate__submit">
            Verificar mi correo
          </Link>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Escriba un comentario.");
      return;
    }
    setPending(true);
    try {
      await onSubmitComment(trimmed);
      setText("");
      setMessage("Comentario enviado. Aparecerá cuando lo apruebe la moderación.");
    } catch (err) {
      if (err?.status === 429) {
        setError("Está comentando muy rápido. Espere un momento e inténtelo de nuevo.");
      } else if (err?.status === 404) {
        // La sección se cerró desde el panel mientras esta página estaba abierta.
        setError("Esta sección ya no admite comentarios.");
      } else {
        setError(err instanceof Error ? err.message : "No se pudo enviar el comentario.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="se-contact-form" onSubmit={handleSubmit} noValidate>
      {error ? (
        <p className="se-admin-login__error" role="alert" id="comment-composer-error">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="se-text-body" role="status" id="comment-composer-ok">
          {message}
        </p>
      ) : null}
      <label className="se-form-field" htmlFor="comment-body">
        <span className="se-form-label">Su comentario</span>
        <textarea
          id="comment-body"
          name="content"
          className="se-form-control"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={pending}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [error && "comment-composer-error", message && "comment-composer-ok"]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
      </label>
      <button type="submit" className="se-btn se-btn--secondary" disabled={pending}>
        {pending ? "Enviando…" : "Publicar comentario"}
      </button>
    </form>
  );
};

CommentComposer.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  isEmailVerified: PropTypes.bool.isRequired,
  /** A dónde devolver al lector tras entrar o registrarse. */
  volverA: PropTypes.string.isRequired,
  onSubmitComment: PropTypes.func.isRequired,
};
