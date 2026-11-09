import { useState } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { RichTextEditor } from "../editor/RichTextEditor";
import { ImageField } from "../editor/ImageField";
import { CampoDeTexto } from "../cuenta/CampoDeTexto";
import { BotonGuia, RecorridoVista } from "../recorrido/RecorridoVista";
import { recorridoPropuesta } from "../../lib/guias/guiaPropuesta";

/**
 * What an outside contributor may send.
 *
 * Entrevistas, informes and the editorial are the house's own voice — the
 * editorial in particular runs unsigned, so a guest byline on one would misstate
 * who is speaking. The backend enforces the same pair with a CHECK constraint, so
 * this list cannot drift into offering something the API refuses.
 */
const contributorFormats = (t) => [
  {
    value: "articulo",
    label: t("cuenta.formularioEnvio.articulo"),
    hint: t("cuenta.formularioEnvio.articuloPista"),
  },
  {
    value: "noticia",
    label: t("cuenta.formularioEnvio.noticia"),
    hint: t("cuenta.formularioEnvio.noticiaPista"),
  },
];

const ancla = (clave) => ({ [recorridoPropuesta.atributo]: clave });

/** El texto de un HTML del editor, para saber si de verdad se escribió algo. */
const textoDe = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();

/**
 * Para comparar con el borrador: el editor devuelve `<p></p>` cuando está vacío, y eso
 * no es texto (contaba como cambio y guardaba un borrador de un formulario sin tocar).
 * Solo para comparar: el valor del editor no se toca, o una lista recién empezada en
 * un editor vacío se borraría sola.
 */
export const normalizarPropuesta = (v) =>
  v && {
    ...v,
    excerpt: textoDe(v.excerpt) ? v.excerpt : "",
    content: textoDe(v.content) ? v.content : "",
  };

/**
 * Lo que falta, campo por campo. Se comprueba aquí y no solo en el servidor para
 * poder decirlo junto al campo, con palabras, y no arriba del todo con el mensaje de
 * la API.
 */
const faltas = (values, t) => {
  const errores = {};
  if (!values.title.trim()) errores.title = t("cuenta.formularioEnvio.faltaTitulo");
  if (!textoDe(values.excerpt)) errores.excerpt = t("cuenta.formularioEnvio.faltaResumen");
  if (!textoDe(values.content)) errores.content = t("cuenta.formularioEnvio.faltaContenido");
  return errores;
};

/** Lleva al primer campo con falta y lo deja listo para escribir. */
const irAlPrimero = (errores) => {
  const primero = ["title", "excerpt", "content"].find((campo) => errores[campo]);
  if (!primero) return;
  const caja = document.querySelector(`[data-campo-propuesta="${primero}"]`);
  if (!caja) return;
  caja.scrollIntoView({ block: "center" });
  const objetivo = caja.querySelector("input, .ProseMirror");
  objetivo?.focus({ preventScroll: true });
};

const horaDe = (marca, lang) =>
  new Date(marca).toLocaleTimeString(lang === "en" ? "en-US" : "es", { hour: "2-digit", minute: "2-digit" });

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
  borrador,
}) => {
  const { t, lang } = useIdioma();
  const [errores, setErrores] = useState({});
  const [guardadoAMano, setGuardadoAMano] = useState(false);

  const cambiar = (campo, valor) => {
    onChange({ ...values, [campo]: valor });
    setGuardadoAMano(false);
    if (errores[campo]) setErrores((previos) => ({ ...previos, [campo]: undefined }));
  };

  const alEnviar = (e) => {
    e.preventDefault();
    const encontradas = faltas(values, t);
    setErrores(encontradas);
    if (Object.values(encontradas).some(Boolean)) {
      irAlPrimero(encontradas);
      return;
    }
    onSubmit(e);
  };

  const guardarBorrador = () => {
    if (borrador?.guardarAhora()) setGuardadoAMano(true);
  };

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-page-head se-reader-page-head--row">
        <div>
          <h1 className="se-reader-page-title">{title}</h1>
          <p className="se-reader-page-lead">
            <Enlace to={backHref} className="se-link se-reader-backlink">
              {backLabel}
            </Enlace>
          </p>
        </div>
        <BotonGuia recorrido={recorridoPropuesta} className="se-btn se-btn--secondary se-boton-guia" />
      </header>

      {borrador?.recuperadoEn ? (
        <p className="se-propuesta__recuperado" role="status">
          {t("cuenta.formularioEnvio.recuperado", { hora: horaDe(borrador.recuperadoEn, lang) })}{" "}
          <button type="button" className="se-propuesta__descartar" onClick={borrador.descartar}>
            {t("cuenta.formularioEnvio.descartar")}
          </button>
        </p>
      ) : null}

      <aside className="se-propuesta__aviso" {...ancla("aviso")}>
        <h2 className="se-propuesta__aviso-titulo">{t("cuenta.formularioEnvio.avisoTitulo")}</h2>
        <ul>
          <li>{t("cuenta.formularioEnvio.avisoQue")}</li>
          <li>{t("cuenta.formularioEnvio.avisoDespues")}</li>
          <li>{t("cuenta.formularioEnvio.avisoCorregir")}</li>
        </ul>
      </aside>

      <div className="se-reader-card se-reader-card--form">
        <form className="se-contact-form se-contact-form--reader" onSubmit={alEnviar} noValidate>
          <fieldset className="se-form-field" {...ancla("formato")}>
            <legend className="se-form-label">{t("cuenta.formularioEnvio.queEnvia")}</legend>
            <div className="se-submission-formats">
              {contributorFormats(t).map((format) => (
                <label key={format.value} className="se-submission-format">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={values.format === format.value}
                    onChange={(e) => cambiar("format", e.target.value)}
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

          <div data-campo-propuesta="title" {...ancla("titulo")}>
            <CampoDeTexto
              id="submission-title"
              etiqueta={t("cuenta.formularioEnvio.titulo")}
              valor={values.title}
              onCambio={(v) => cambiar("title", v)}
              error={errores.title || ""}
              ayuda={t("cuenta.formularioEnvio.tituloAyuda")}
              deshabilitado={isSubmitting}
              maxLength={500}
            />
          </div>

          {/* Same editor as the body, for the same reason: a summary is prose. */}
          <div
            className={`se-form-field se-form-field--brief${errores.excerpt ? " se-propuesta__campo--mal" : ""}`}
            data-campo-propuesta="excerpt"
            {...ancla("resumen")}
          >
            <span className="se-form-label">{t("cuenta.formularioEnvio.resumen")}</span>
            <RichTextEditor
              value={values.excerpt}
              onChange={(html) => cambiar("excerpt", html)}
              placeholder={t("cuenta.formularioEnvio.resumenMarcador")}
              disabled={isSubmitting}
            />
            {errores.excerpt ? (
              <p className="se-campo__error" role="alert">
                {errores.excerpt}
              </p>
            ) : null}
          </div>

          <div
            className={`se-form-field${errores.content ? " se-propuesta__campo--mal" : ""}`}
            data-campo-propuesta="content"
            {...ancla("contenido")}
          >
            <span className="se-form-label">{t("cuenta.formularioEnvio.contenido")}</span>
            <RichTextEditor
              value={values.content}
              onChange={(html) => cambiar("content", html)}
              placeholder={t("cuenta.formularioEnvio.contenidoMarcador")}
              disabled={isSubmitting}
            />
            {errores.content ? (
              <p className="se-campo__error" role="alert">
                {errores.content}
              </p>
            ) : (
              <p className="se-campo__ayuda">{t("cuenta.formularioEnvio.contenidoAyuda")}</p>
            )}
          </div>

          <div {...ancla("foto")}>
            <ImageField
              id="submission-image"
              label={t("cuenta.formularioEnvio.imagenDestacada")}
              value={values.featuredImageUrl}
              onChange={(v) => cambiar("featuredImageUrl", v)}
              disabled={isSubmitting}
            />
            <p className="se-campo__ayuda">{t("cuenta.formularioEnvio.imagenAyuda")}</p>
          </div>

          <div className="se-propuesta__acciones" {...ancla("acciones")}>
            {errorMessage ? (
              <p className="se-campo__error se-propuesta__error" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <div className="se-propuesta__botones">
              <button type="submit" className="se-btn" disabled={isSubmitting}>
                {isSubmitting ? t("cuenta.comun.guardando") : submitLabel}
              </button>
              {borrador ? (
                <button
                  type="button"
                  className="se-btn se-btn--secondary"
                  onClick={guardarBorrador}
                  disabled={isSubmitting}
                >
                  {t("cuenta.formularioEnvio.guardarBorrador")}
                </button>
              ) : null}
            </div>
            {borrador ? (
              <p className="se-propuesta__estado" role="status">
                {!borrador.guardadoEn
                  ? t("cuenta.formularioEnvio.borradorExplica")
                  : guardadoAMano
                    ? t("cuenta.formularioEnvio.borradorGuardado", { hora: horaDe(borrador.guardadoEn, lang) })
                    : t("cuenta.formularioEnvio.borradorSolo", { hora: horaDe(borrador.guardadoEn, lang) })}
              </p>
            ) : null}
          </div>
        </form>
      </div>

      <RecorridoVista recorrido={recorridoPropuesta} />
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
  /** Lo que devuelve `useBorradorLocal`: el borrador que se guarda solo en este equipo. */
  borrador: PropTypes.shape({
    guardadoEn: PropTypes.number,
    recuperadoEn: PropTypes.number,
    guardarAhora: PropTypes.func.isRequired,
    descartar: PropTypes.func.isRequired,
  }),
};

SubmissionForm.defaultProps = {
  errorMessage: "",
  borrador: null,
};
