import PropTypes from "prop-types";
import { CampoMovil } from "../CampoMovil";
import { AssetField } from "../AssetField";
import { EncuadreDeFoto } from "../EncuadreDeFoto";
import {
    ACCEPTED_AUDIO_MIME,
    ACCEPTED_DOCUMENT_MIME,
    ACCEPTED_IMAGE_MIME,
    ACCEPTED_VIDEO_MIME,
    uploadAdminMediaAudio,
    uploadAdminMediaDocument,
} from "../../../services/adminMediaService";
import { enlaceWeb } from "../../../lib/enlaces";
import { recorridoEditor } from "../../../lib/guias/guiaEditor";
import { IMAGE_HINT, nombreDeArchivo } from "./formulario";
import { subirFotoDePieza } from "./subirFotoDePieza";

const { ancla } = recorridoEditor;

/** «Foto y archivos»: el video, el documento o el audio que pide el formato, y la imagen. */
export const GrupoArchivos = ({ esMovil, form, setForm, assets, setAsset, requiredMedia, legacyImage, subirVideo }) => (
    <div className="se-editor-group" {...ancla("archivos")}>
        <p className="se-editor-group__title">Foto y archivos</p>

        {requiredMedia === "video" ? (
            <CampoMovil
                movil={esMovil}
                titulo="Video de la entrevista"
                resumen={nombreDeArchivo(assets.video) || "Sin video"}
                estado={form.video_asset_id ? "ok" : "falta"}
            >
            <AssetField
                id="post-video"
                label="Video de la entrevista"
                hint="Suba el archivo y se aloja en nuestro servicio de video, o pegue un enlace de YouTube o Vimeo. Sin video, la entrevista no se puede publicar."
                kind="video"
                value={form.video_asset_id}
                asset={assets.video}
                onChange={setAsset("video_asset_id", "video")}
                onUpload={subirVideo}
                accept={ACCEPTED_VIDEO_MIME}
                required
            />
            </CampoMovil>
        ) : null}

        {requiredMedia === "document" ? (
            <CampoMovil
                movil={esMovil}
                titulo="Documento (PDF)"
                resumen={
                    form.document_asset_id
                        ? `${nombreDeArchivo(assets.document)}${form.document_open_access ? " · abierto" : ""}`
                        : "Sin documento"
                }
                estado={form.document_asset_id ? "ok" : "falta"}
            >
            <AssetField
                id="post-document"
                label="Documento del informe (PDF)"
                hint="Solo los lectores registrados con sesión iniciada pueden descargarlo. Sin documento, el informe no se puede publicar."
                kind="document"
                value={form.document_asset_id}
                asset={assets.document}
                onChange={setAsset("document_asset_id", "document")}
                onUpload={uploadAdminMediaDocument}
                accept={ACCEPTED_DOCUMENT_MIME}
                required
            />

            {/* Quien puede descargarlo. Va aqui, pegado al campo del
                archivo, porque es una decision sobre ese archivo y no
                sobre la pieza en general. */}
            <label className="se-form-field se-acceso" htmlFor="post-open-access">
                <span className="se-acceso__fila">
                    <input
                        id="post-open-access"
                        type="checkbox"
                        checked={Boolean(form.document_open_access)}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                document_open_access: e.target.checked,
                            }))
                        }
                    />
                    <span className="se-form-label se-acceso__titulo">
                        Descarga abierta a todos
                    </span>
                </span>
                <span className="se-admin-meta-hint">
                    Sin marcar, sólo los lectores registrados con el correo
                    confirmado pueden descargarlo. Marcado, cualquiera que
                    entre al sitio lo descarga en un clic, sin cuenta.
                </span>
                <span className="se-admin-meta-hint">
                    Se puede cambiar después: cerrar un informe abierto
                    corta el acceso de inmediato, también para quien ya
                    tenía la dirección.
                </span>
            </label>
            </CampoMovil>
        ) : null}

        {requiredMedia === "audio" ? (
            <CampoMovil
                movil={esMovil}
                titulo="Audio del podcast"
                resumen={nombreDeArchivo(assets.audio) || "Sin audio"}
                estado={form.audio_asset_id ? "ok" : "falta"}
            >
            <AssetField
                id="post-audio"
                label="Audio del podcast (MP3 o M4A)"
                hint="Se escucha sin cuenta, como cualquier pieza. Sin audio, el podcast no se puede publicar."
                kind="audio"
                value={form.audio_asset_id}
                asset={assets.audio}
                onChange={setAsset("audio_asset_id", "audio")}
                onUpload={uploadAdminMediaAudio}
                accept={ACCEPTED_AUDIO_MIME}
                required
            />
            </CampoMovil>
        ) : null}

        {/* Every format, because every format has a card in a listing
            and any piece may arrive with a photo. */}
        <CampoMovil
            movil={esMovil}
            titulo="Imagen"
            resumen={
                form.image_asset_id
                    ? `${nombreDeArchivo(assets.image)}${form.imagen_foco ? " · encuadrada" : ""}`
                    : legacyImage
                      ? "Imagen antigua por dirección"
                      : "Sin imagen"
            }
            miniatura={assets.image?.url || undefined}
            estado={form.image_asset_id || legacyImage ? "ok" : undefined}
        >
                <AssetField
                    id="post-image-asset"
                    label="Imagen"
                    hint={IMAGE_HINT[form.format] ?? IMAGE_HINT.default}
                    kind="image"
                    value={form.image_asset_id}
                    asset={assets.image}
                    onChange={setAsset("image_asset_id", "image")}
                    onUpload={subirFotoDePieza}
                    accept={ACCEPTED_IMAGE_MIME}
                />
                {/* Qué punto de la foto queda a la vista en cada tarjeta. */}
                {enlaceWeb(assets.image?.url) || enlaceWeb(form.featured_image_url) ? (
                    <EncuadreDeFoto
                        url={enlaceWeb(assets.image?.url) || enlaceWeb(form.featured_image_url)}
                        valor={form.imagen_foco}
                        titulo={form.title}
                        onChange={(v) => setForm((prev) => ({ ...prev, imagen_foco: v }))}
                    />
                ) : null}
                {legacyImage ? (
                    <p className="se-asset__legacy">
                        Esta pieza trae una imagen por URL de antes de la
                        biblioteca de archivos:{" "}
                        <a
                            className="se-link"
                            href={enlaceWeb(form.featured_image_url) || undefined}
                            target="_blank"
                            rel="noreferrer"
                        >
                            verla
                        </a>
                        {". "}
                        Se sigue usando mientras no adjunte una nueva.{" "}
                        <button
                            type="button"
                            className="se-link se-header__nav-link--button"
                            onClick={() =>
                                setForm((prev) => ({
                                    ...prev,
                                    featured_image_url: "",
                                }))
                            }
                        >
                            Quitarla
                        </button>
                    </p>
                ) : null}
        </CampoMovil>
    </div>
);

GrupoArchivos.propTypes = {
    esMovil: PropTypes.bool,
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    assets: PropTypes.object.isRequired,
    setAsset: PropTypes.func.isRequired,
    requiredMedia: PropTypes.string.isRequired,
    legacyImage: PropTypes.bool,
    subirVideo: PropTypes.func.isRequired,
};
