import PropTypes from "prop-types";
import { CampoMovil } from "../CampoMovil";

/**
 * Slug and SEO are real needs and belong to the machine, not to the story. Folded away
 * so the form reads as editorial work first. En el teléfono va en su tarjeta, como las
 * demás filas.
 */
export const CampoSeo = ({ esMovil, form, handleChange }) => (
    <div className={esMovil ? "se-editor-group" : undefined}>
    <CampoMovil
        movil={esMovil}
        plegable
        titulo="Dirección y SEO"
        resumen={form.slug.trim() ? `/${form.slug.trim()}` : "Automáticas"}
    >
        <div className="se-editor-advanced__body">
            <label className="se-form-field" htmlFor="post-slug">
                <span className="se-form-label">
                    Dirección (slug). Si la deja vacía, sale sola del título, corta
                </span>
                <input
                    id="post-slug"
                    className="se-form-control"
                    value={form.slug}
                    onChange={handleChange("slug")}
                />
            </label>
            <p className="se-admin-meta-hint" style={{ margin: "0 0 0.5rem" }}>
                {form.seo_automatico
                    ? "El meta título y la meta descripción los puso el sistema. Si cambia el titular o el texto, se rehacen solos; si escribe aquí los suyos, se quedan como los deje."
                    : "Es lo que enseña Google. Si los deja vacíos, se rellenan solos a los pocos minutos de publicar."}
            </p>
            <label className="se-form-field" htmlFor="post-meta-title">
                <span className="se-form-label">Meta título</span>
                <input
                    id="post-meta-title"
                    className="se-form-control"
                    value={form.meta_title}
                    onChange={handleChange("meta_title")}
                    maxLength={70}
                />
            </label>
            <label className="se-form-field" htmlFor="post-meta-desc">
                <span className="se-form-label">Meta descripción</span>
                <textarea
                    id="post-meta-desc"
                    className="se-form-control se-form-control--textarea"
                    rows={2}
                    value={form.meta_description}
                    onChange={handleChange("meta_description")}
                    maxLength={320}
                />
            </label>
            <label className="se-form-field" htmlFor="post-canonical">
                <span className="se-form-label">URL canónica</span>
                <input
                    id="post-canonical"
                    className="se-form-control"
                    value={form.canonical_url}
                    onChange={handleChange("canonical_url")}
                    placeholder="Solo si esta pieza se publicó primero en otro sitio"
                />
            </label>
            <p className="se-admin-meta-hint">
                Si deja el meta título y la meta descripción vacíos, los
                buscadores usan el título y el resumen de la pieza, que suele ser
                lo correcto.
            </p>
        </div>
    </CampoMovil>
    </div>
);

CampoSeo.propTypes = {
    esMovil: PropTypes.bool,
    form: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
};
