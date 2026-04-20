import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { applyPageMeta } from "../../lib/seo";
import * as userMeService from "../../services/userMeService";

export const CuentaEnviosNuevo = () => {
  const navigate = useNavigate();
  const { isEmailVerified } = useUserAuth();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    applyPageMeta({
      title: "Nuevo envío — Sur Economics",
      description: "Enviar propuesta editorial.",
      noindex: true,
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const created = await userMeService.createSubmission({
        title,
        excerpt,
        content,
        featured_image_url: featuredImageUrl,
      });
      const id =
        created?.id ??
        created?.submission_id ??
        (created && typeof created === "object" && created.data && created.data.id);
      if (id) {
        navigate(`/cuenta/envios/${encodeURIComponent(id)}`, { replace: true });
        return;
      }
      navigate("/cuenta/envios", { replace: true });
    } catch (err) {
      if (err?.status === 429) {
        setErrorMessage("Demasiadas solicitudes. Intente más tarde.");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "No se pudo crear el envío.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">Nuevo envío</h1>
          <p className="se-reader-page-lead">
            Verifique su correo para enviar propuestas.{" "}
            <Link to="/cuenta/verificar-email" className="se-link">
              Verificar
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-page-head">
        <h1 className="se-reader-page-title">Nuevo envío</h1>
        <p className="se-reader-page-lead">
          <Link to="/cuenta/envios" className="se-link se-reader-backlink">
            ← Volver a la lista
          </Link>
        </p>
      </header>

      <div className="se-reader-card se-reader-card--form">
        <form className="se-contact-form se-contact-form--reader" onSubmit={handleSubmit} noValidate>
          {errorMessage ? (
            <p className="se-admin-login__error" role="alert" id="envio-nuevo-error">
              {errorMessage}
            </p>
          ) : null}

          <label className="se-form-field" htmlFor="envio-title">
            <span className="se-form-label">Título</span>
            <input
              id="envio-title"
              name="title"
              className="se-form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "envio-nuevo-error" : undefined}
            />
          </label>

          <label className="se-form-field" htmlFor="envio-excerpt">
            <span className="se-form-label">Resumen</span>
            <textarea
              id="envio-excerpt"
              name="excerpt"
              className="se-form-control"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="se-form-field" htmlFor="envio-content">
            <span className="se-form-label">Contenido</span>
            <textarea
              id="envio-content"
              name="content"
              className="se-form-control"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="se-form-field" htmlFor="envio-image">
            <span className="se-form-label">URL de imagen destacada (opcional)</span>
            <input
              id="envio-image"
              name="featured_image_url"
              type="url"
              className="se-form-control"
              value={featuredImageUrl}
              onChange={(e) => setFeaturedImageUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <button type="submit" className="se-btn" disabled={isSubmitting}>
            {isSubmitting ? "Enviando…" : "Enviar a revisión"}
          </button>
        </form>
      </div>
    </div>
  );
};
