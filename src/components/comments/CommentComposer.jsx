import PropTypes from "prop-types";
import { useState } from "react";
import { Link } from "react-router-dom";

export const CommentComposer = ({
  slug,
  isAuthenticated,
  isEmailVerified,
  onSubmitComment,
}) => {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <p className="se-text-body">
        <Link to="/cuenta/entrar" className="se-link" state={{ from: `/articulo/${slug}` }}>
          Inicie sesión
        </Link>{" "}
        para comentar.
      </p>
    );
  }

  if (!isEmailVerified) {
    return (
      <p className="se-text-body">
        Verifique su correo para comentar.{" "}
        <Link to="/cuenta/verificar-email" className="se-link">
          Verificar
        </Link>
      </p>
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
      setMessage("Comentario enviado. Aparecerá cuando sea aprobado por moderación.");
    } catch (err) {
      if (err?.status === 429) {
        setError("Demasiadas solicitudes. Intente más tarde.");
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
            [error && "comment-composer-error", message && "comment-composer-ok"].filter(Boolean).join(" ") ||
            undefined
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
  slug: PropTypes.string.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  isEmailVerified: PropTypes.bool.isRequired,
  onSubmitComment: PropTypes.func.isRequired,
};
