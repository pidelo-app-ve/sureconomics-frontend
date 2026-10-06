import PropTypes from "prop-types";
import { useState } from "react";
import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";

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
  const { t } = useIdioma();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <section className="se-gate" aria-labelledby="comment-gate-title">
        <h3 id="comment-gate-title" className="se-gate__title">
          {t("piezas.comentarios.participe")}
        </h3>
        <p className="se-gate__lead">{t("piezas.comentarios.participeTexto")}</p>
        <div className="se-gate__actions">
          <Enlace to="/cuenta/registro" className="se-gate__submit" state={{ from: volverA }}>
            {t("piezas.acceso.crearCuenta")}
          </Enlace>
          <Enlace to="/cuenta/entrar" className="se-link" state={{ from: volverA }}>
            {t("piezas.acceso.yaTengoCuenta")}
          </Enlace>
        </div>
      </section>
    );
  }

  if (!isEmailVerified) {
    return (
      <section className="se-gate" aria-labelledby="comment-gate-title">
        <h3 id="comment-gate-title" className="se-gate__title">
          {t("piezas.comentarios.faltaConfirmar")}
        </h3>
        <p className="se-gate__lead">{t("piezas.comentarios.faltaConfirmarTexto")}</p>
        <div className="se-gate__actions">
          <Enlace to="/cuenta/verificar-email" className="se-gate__submit">
            {t("piezas.acceso.verificarCorreo")}
          </Enlace>
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
      setError(t("piezas.comentarios.escribaUno"));
      return;
    }
    setPending(true);
    try {
      await onSubmitComment(trimmed);
      setText("");
      setMessage(t("piezas.comentarios.enviado"));
    } catch (err) {
      if (err?.status === 429) {
        setError(t("piezas.comentarios.muyRapido"));
      } else if (err?.status === 404) {
        // La sección se cerró desde el panel mientras esta página estaba abierta.
        setError(t("piezas.comentarios.seccionCerrada"));
      } else {
        setError(err instanceof Error ? err.message : t("piezas.comentarios.noEnviado"));
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
        <span className="se-form-label">{t("piezas.comentarios.suComentario")}</span>
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
        {pending ? t("piezas.comentarios.enviando") : t("piezas.comentarios.publicar")}
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
