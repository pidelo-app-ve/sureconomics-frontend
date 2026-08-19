import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { RichTextEditor } from "../editor/RichTextEditor";
import { ImageField } from "../editor/ImageField";

/**
 * What an outside contributor may send.
 *
 * Entrevistas, informes and the editorial are the house's own voice — the
 * editorial in particular runs unsigned, so a guest byline on one would misstate
 * who is speaking. The backend enforces the same pair with a CHECK constraint, so
 * this list cannot drift into offering something the API refuses.
 */
const CONTRIBUTOR_FORMATS = [
  {
    value: "articulo",
    label: "Artículo",
    hint: "Análisis firmado, con su contexto regional.",
  },
  {
    value: "noticia",
    label: "Noticia",
    hint: "Un hecho reciente, con la fuente citada.",
  },
];

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

          <fieldset className="se-form-field">
            <legend className="se-form-label">Qué está enviando</legend>
            <div className="se-submission-formats">
              {CONTRIBUTOR_FORMATS.map((format) => (
                <label key={format.value} className="se-submission-format">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={values.format === format.value}
                    onChange={handleFieldChange("format")}
                    disabled={isSubmitting}
                  />
                  <span>
                    <strong>{format.label}</strong>
                    <em>{format.hint}</em>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

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

          {/* Same editor as the body, for the same reason: a summary is prose. */}
          <div className="se-form-field se-form-field--brief">
            <span className="se-form-label">Resumen</span>
            <RichTextEditor
              value={values.excerpt}
              onChange={(html) => onChange({ ...values, excerpt: html })}
              placeholder="Dos o tres líneas que resuman lo que envía…"
              disabled={isSubmitting}
            />
          </div>

          <div className="se-form-field">
            <span className="se-form-label">Contenido</span>
            <RichTextEditor
              value={values.content}
              onChange={(html) => onChange({ ...values, content: html })}
              disabled={isSubmitting}
            />
          </div>

          <ImageField
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
    format: PropTypes.oneOf(["articulo", "noticia"]).isRequired,
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

