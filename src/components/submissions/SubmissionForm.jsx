import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { RichTextEditor } from "../editor/RichTextEditor";
import { ImageUrlField } from "../editor/ImageUrlField";

export const SubmissionForm = ({
  values,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
  errorMessage,
  title,
  backHref,
  backLabel,
}) => {
  const errorId = "submission-form-error";

  const handleFieldChange = (field) => (e) => {
    onChange({ ...values, [field]: e.target.value });
  };

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-page-head">
        <h1 className="se-reader-page-title">{title}</h1>
        <p className="se-reader-page-lead">
          <Link to={backHref} className="se-link se-reader-backlink">
            ← {backLabel}
          </Link>
        </p>
      </header>

      <div className="se-reader-card se-reader-card--form">
        <form className="se-contact-form se-contact-form--reader" onSubmit={onSubmit} noValidate>
          {errorMessage ? (
            <p className="se-admin-login__error" role="alert" id={errorId}>
              {errorMessage}
            </p>
          ) : null}

          <label className="se-form-field" htmlFor="submission-title">
            <span className="se-form-label">Título</span>
            <input
              id="submission-title"
              name="title"
              className="se-form-control"
              value={values.title}
              onChange={handleFieldChange("title")}
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? errorId : undefined}
            />
          </label>

          <label className="se-form-field" htmlFor="submission-excerpt">
            <span className="se-form-label">Resumen</span>
            <textarea
              id="submission-excerpt"
              name="excerpt"
              className="se-form-control"
              rows={3}
              value={values.excerpt}
              onChange={handleFieldChange("excerpt")}
              required
              disabled={isSubmitting}
            />
          </label>

          <div className="se-form-field">
            <span className="se-form-label">Contenido</span>
            <RichTextEditor
              value={values.content}
              onChange={(html) => onChange({ ...values, content: html })}
              disabled={isSubmitting}
            />
          </div>

          <ImageUrlField
            id="submission-image"
            label="URL de imagen destacada"
            value={values.featuredImageUrl}
            onChange={(v) => onChange({ ...values, featuredImageUrl: v })}
            required
            disabled={isSubmitting}
          />

          <button type="submit" className="se-btn" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

SubmissionForm.propTypes = {
  values: PropTypes.shape({
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    featuredImageUrl: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  errorMessage: PropTypes.string,
  title: PropTypes.string.isRequired,
  backHref: PropTypes.string.isRequired,
  backLabel: PropTypes.string.isRequired,
};

SubmissionForm.defaultProps = {
  errorMessage: "",
};

