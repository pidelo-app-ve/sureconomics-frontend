import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    createAdminPost,
    deleteAdminPost,
    getAdminPost,
    patchAdminPost,
    publishAdminPost,
    unpublishAdminPost,
} from "../../services/adminPostsService";
import {
    groupPlaces,
    listAdminFormats,
    listAdminPlaces,
    listAdminTopics,
} from "../../services/adminTaxonomyService";
import {
    ACCEPTED_DOCUMENT_MIME,
    ACCEPTED_IMAGE_MIME,
    uploadAdminMediaDocument,
    uploadAdminMediaImage,
} from "../../services/adminMediaService";
import { EmptyState, ErrorState, LoadingState } from "../../components/content";
import { AdminFormFeedback } from "../../components/admin/AdminFormFeedback";
import { AxisPicker } from "../../components/admin/AxisPicker";
import { AssetField } from "../../components/admin/AssetField";
import { SourcesField } from "../../components/admin/SourcesField";
import { applyPageMeta } from "../../lib/seo";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useFlashMessage } from "../../hooks/useFlashMessage";
import { useAuth } from "../../context/AuthContext";
import { useAdminToast } from "../../context/AdminToastContext";
import { RichTextEditor } from "../../components/editor/RichTextEditor";

/**
 * Which extra fields each format asks for.
 *
 * Kept here rather than read from the API because it is a statement about the
 * *form*, not about the content: the backend already says which file a format
 * needs (`required_media`) and whether it carries a byline (`shows_author`), and
 * those are the two rules the database enforces. This map only decides which
 * inputs are worth showing.
 *
 * ``image`` is on artículo alone, and that is deliberate. Artículos are the only
 * format whose layout prints one -- `ArticleCardGrid` renders it, and the news
 * list, the editorial list, the interview grid and the report grid all do not.
 * Asking a noticia for an image is asking an editor to find a photograph the site
 * will never display.
 */
// Sources are not in here: every format can cite them. Editorial having no source
// field was reported as a bug, and there is no format for which "where did this
// come from" is the wrong question.
// Only the fields that genuinely belong to one format. The image is not among
// them: it used to be listed under `articulo` alone, on the theory that only that
// layout printed one -- which meant the newsroom had nowhere to attach the photo
// they had for a noticia, and every noticia published with a generated placeholder.
// Any piece can carry an image, so it is asked for unconditionally below.
/** What the image actually does, said per format so the promise is accurate. */
const IMAGE_HINT = {
    entrevista:
        "Opcional. Aparece en la tarjeta de la entrevista en los listados; al abrirla, lo primero es el video.",
    articulo:
        "Opcional. Si la deja vacía, el artículo se muestra con un fondo de color.",
    default: "Opcional. Aparece en la tarjeta de la pieza y al abrirla.",
};

const FORMAT_FIELDS = {
    noticia: ["opinion"],
    entrevista: ["interviewee"],
    informe: ["unit"],
};

const emptyForm = () => ({
    format: "",
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    meta_title: "",
    meta_description: "",
    canonical_url: "",
    byline: "",
    featured_image_url: "",
    status: "draft",
    published_at: "",
    topic_ids: [],
    place_ids: [],
    sources: [],
    house_opinion: "",
    interviewee: "",
    interviewee_role: "",
    unit: "",
    image_asset_id: null,
    video_asset_id: null,
    document_asset_id: null,
});

const idsFromRelation = (val) => {
    if (!Array.isArray(val)) return [];
    return val
        .map((x) => (typeof x === "object" && x != null ? x.id : x))
        .filter((x) => x !== undefined && x !== null);
};

const pickStr = (obj, keys, fallback = "") => {
    if (!obj || typeof obj !== "object") return fallback;
    for (const k of keys) {
        const v = obj[k];
        if (v !== undefined && v !== null && String(v) !== "") return String(v);
    }
    return fallback;
};

/** `datetime-local` value in local time (API returns ISO8601). */
const isoToDateTimeLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const postToForm = (post) => {
    if (!post || typeof post !== "object") return emptyForm();
    const publishedAt = post.published_at ?? post.publishedAt;
    return {
        ...emptyForm(),
        format: pickStr(post, ["format"]),
        title: pickStr(post, ["title"]),
        slug: pickStr(post, ["slug"]),
        excerpt: pickStr(post, ["excerpt", "summary"]),
        content: pickStr(post, ["content", "body", "html"]),
        meta_title: pickStr(post, ["meta_title"]),
        meta_description: pickStr(post, ["meta_description"]),
        canonical_url: pickStr(post, ["canonical_url"]),
        byline: pickStr(post, ["byline"]),
        featured_image_url: pickStr(post, ["featured_image_url"]),
        status: pickStr(post, ["status"], "draft"),
        published_at: typeof publishedAt === "string" ? isoToDateTimeLocal(publishedAt) : "",
        // Order is meaning: the first of each is the principal tag, which is the
        // one the public cards print.
        topic_ids: idsFromRelation(post.topics ?? post.topic_ids),
        place_ids: idsFromRelation(post.places ?? post.place_ids),
        sources: (post?.sources ?? []).map((f) => ({ name: f.name ?? "", url: f.url ?? "" })),
        house_opinion: pickStr(post, ["house_opinion"]),
        interviewee: pickStr(post, ["interviewee"]),
        interviewee_role: pickStr(post, ["interviewee_role"]),
        unit: pickStr(post, ["unit"]),
        image_asset_id: post.image_asset_id ?? null,
        video_asset_id: post.video_asset_id ?? null,
        document_asset_id: post.document_asset_id ?? null,
    };
};

const formToPayload = (form) => {
    let publishedAtValue;
    if (form.published_at && String(form.published_at).trim()) {
        const d = new Date(form.published_at);
        publishedAtValue = Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    }

    const payload = {
        format: form.format.trim() || undefined,
        title: form.title.trim() || undefined,
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt.trim() || undefined,
        content: form.content.trim() || undefined,
        meta_title: form.meta_title.trim() || undefined,
        meta_description: form.meta_description.trim() || undefined,
        canonical_url: form.canonical_url.trim() || undefined,
        featured_image_url: form.featured_image_url.trim() || undefined,
        status: form.status.trim() || undefined,
        published_at: publishedAtValue,
        // Sent even when blank so clearing a byline actually clears it.
        byline: form.byline.trim() || null,
        // Sent even when empty: an absent key means "leave them alone", and a piece
        // whose last source was just removed has to say so.
        sources: (form.sources ?? [])
            .map((f) => ({ name: (f.name ?? "").trim(), url: (f.url ?? "").trim() || undefined }))
            .filter((f) => f.name),
        house_opinion: form.house_opinion.trim() || undefined,
        interviewee: form.interviewee.trim() || undefined,
        interviewee_role: form.interviewee_role.trim() || undefined,
        unit: form.unit.trim() || undefined,
    };
    // Sent even when empty: clearing every topic is a real edit, and `undefined`
    // would read as "leave them alone".
    payload.topic_ids = form.topic_ids;
    payload.place_ids = form.place_ids;
    // Same for the three slots — null is how a file gets detached.
    payload.image_asset_id = form.image_asset_id ?? null;
    payload.video_asset_id = form.video_asset_id ?? null;
    payload.document_asset_id = form.document_asset_id ?? null;

    Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
    });
    return payload;
};

export const AdminPostEditor = () => {
    const { role } = useAuth();
    const canPublish = role === "publicador" || role === "admin";
    const canCreate = role === "escritor" || role === "admin";
    const { postId } = useParams();
    const { pathname } = useLocation();
    const isCreate = /\/admin\/posts\/new\/?$/.test(pathname);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [form, setForm] = useState(emptyForm);
    const [formats, setFormats] = useState([]);
    const [topics, setTopics] = useState([]);
    const [placeGroups, setPlaceGroups] = useState([]);
    const [assets, setAssets] = useState({ image: null, video: null, document: null });
    const [loadState, setLoadState] = useState({ status: "idle", error: null });
    const [saveState, setSaveState] = useState({ status: "idle", message: "" });
    const [actionState, setActionState] = useState({ status: "idle", message: "", kind: "" });
    const { confirm, ConfirmDialog } = useAdminConfirm();
    const flash = useFlashMessage();
    const { toastSuccess, toastError } = useAdminToast();

    const numericPostId = useMemo(() => {
        if (!postId) return null;
        const n = Number(postId);
        return Number.isFinite(n) ? n : postId;
    }, [postId]);

    const loadReference = useCallback(async () => {
        const [fmts, tps, pls] = await Promise.all([
            listAdminFormats().catch(() => []),
            listAdminTopics().catch(() => []),
            listAdminPlaces().catch(() => []),
        ]);
        setFormats(fmts.filter((f) => f.is_active !== false));
        setTopics(tps.filter((t) => t.is_active !== false));
        const { groups } = groupPlaces(pls.filter((p) => p.is_active !== false));
        setPlaceGroups(groups);
    }, []);

    const loadPost = useCallback(async () => {
        if (isCreate || !numericPostId) {
            // `?format=noticia` comes from the "create" menu, so the newsroom lands
            // on the right form instead of picking the format twice.
            const requested = searchParams.get("format") || "";
            setForm({ ...emptyForm(), format: requested });
            setAssets({ image: null, video: null, document: null });
            setLoadState({ status: "success", error: null });
            return;
        }
        setLoadState({ status: "loading", error: null });
        try {
            const post = await getAdminPost(numericPostId);
            setForm(postToForm(post));
            setAssets({
                image: post.image_asset ?? null,
                video: post.video_asset ?? null,
                document: post.document_asset ?? null,
            });
            setLoadState({ status: "success", error: null });
        } catch (err) {
            setLoadState({ status: "error", error: err });
        }
    }, [isCreate, numericPostId, searchParams]);

    useEffect(() => {
        loadReference();
    }, [loadReference]);

    useEffect(() => {
        loadPost();
    }, [loadPost]);

    const currentFormat = useMemo(
        () => formats.find((f) => f.slug === form.format) ?? null,
        [formats, form.format]
    );

    useEffect(() => {
        const name = currentFormat?.name ?? "pieza";
        applyPageMeta({
            title: isCreate
                ? `Admin — Crear ${name.toLowerCase()}`
                : `Admin — Editar #${postId ?? ""}`,
            description: "Edición de contenido (SurEconomics).",
        });
    }, [isCreate, postId, currentFormat]);

    useEffect(() => {
        if (flash) toastSuccess(flash);
    }, [flash, toastSuccess]);

    const handleChange = (field) => (e) => {
        const v = e.target.value;
        setForm((prev) => ({ ...prev, [field]: v }));
    };

    const setAsset = (slot, kind) => (assetId, asset) => {
        setForm((prev) => ({ ...prev, [slot]: assetId }));
        setAssets((prev) => ({ ...prev, [kind]: asset }));
    };

    const shows = (field) => (FORMAT_FIELDS[form.format] ?? []).includes(field);
    const requiredMedia = currentFormat?.required_media ?? "none";

    // A URL pasted before the media library existed. Shown so an editor knows why
    // there is an image on a piece with nothing attached, and can clear it.
    const legacyImage = Boolean(form.featured_image_url && !form.image_asset_id);

    const handleSave = async () => {
        setSaveState({ status: "loading", message: "" });
        setActionState({ status: "idle", message: "", kind: "" });
        try {
            const payload = formToPayload(form);
            if (isCreate) {
                const created = await createAdminPost(payload);
                const newId = created?.id ?? null;
                // Same reason: no gendered adjective on a name that comes from data.
                const label = currentFormat?.name ?? "La pieza";
                if (newId != null) {
                    navigate(`/admin/posts/${newId}`, {
                        replace: true,
                        state: { flash: `${label}: creada correctamente.` },
                    });
                } else {
                    navigate("/admin/posts", {
                        replace: true,
                        state: { flash: `${label}: creada correctamente.` },
                    });
                }
                return;
            }
            const updated = await patchAdminPost(numericPostId, payload);
            setForm(postToForm(updated));
            setAssets({
                image: updated.image_asset ?? null,
                video: updated.video_asset ?? null,
                document: updated.document_asset ?? null,
            });
            setSaveState({ status: "success", message: "Cambios guardados correctamente." });
            toastSuccess("Cambios guardados correctamente.", "Contenido guardado");
        } catch (err) {
            const message = adminErrorMessage(
                err,
                isCreate ? "No se pudo crear la pieza." : "No se pudieron guardar los cambios."
            );
            setSaveState({ status: "error", message });
            toastError(message, isCreate ? "No se pudo crear" : "No se pudo guardar");
        }
    };

    const runAction = (kind, fn, successMessage, failureMessage, toastTitle) => async () => {
        if (isCreate) return;
        setSaveState({ status: "idle", message: "" });
        setActionState({ status: "loading", message: "", kind });
        try {
            const updated = await fn(numericPostId);
            setForm(postToForm(updated));
            setActionState({ status: "success", message: successMessage, kind });
            toastSuccess(successMessage, toastTitle);
        } catch (err) {
            const message = adminErrorMessage(err, failureMessage);
            setActionState({ status: "error", message, kind });
            toastError(message, toastTitle);
        }
    };

    const handlePublish = runAction(
        "publish",
        publishAdminPost,
        "Quedó publicada y ya es visible en el sitio.",
        "No se pudo publicar.",
        "Publicar"
    );

    const handleUnpublish = runAction(
        "unpublish",
        unpublishAdminPost,
        "Se despublicó y ya no es visible en el sitio.",
        "No se pudo despublicar.",
        "Despublicar"
    );

    const handleDelete = async () => {
        if (isCreate) return;
        setActionState({ status: "idle", message: "", kind: "" });
        await confirm({
            title: "Eliminar pieza",
            description: `¿Eliminar esta pieza (ID ${numericPostId}) de forma permanente?`,
            confirmLabel: "Eliminar",
            onConfirm: async () => {
                await deleteAdminPost(numericPostId);
                navigate("/admin/posts", {
                    replace: true,
                    state: { flash: "Pieza eliminada correctamente." },
                });
            },
        });
    };

    const feedback = (() => {
        for (const state of [actionState, saveState]) {
            if (state.status === "error") return { tone: "error", message: state.message };
            if (state.status === "success") return { tone: "success", message: state.message };
        }
        return null;
    })();

    if (isCreate && !canCreate) {
        return <EmptyState title="Sin acceso" description="Solo escritor y admin pueden crear contenido nuevo." />;
    }

    if (loadState.status === "loading") {
        return <LoadingState title="Cargando…" />;
    }

    if (loadState.status === "error") {
        return (
            <>
                <ErrorState title="No se pudo cargar la pieza" error={loadState.error} onRetry={loadPost} />
                <p style={{ marginTop: "1rem" }}>
                    <Link to="/admin/posts" className="se-link">
                        Volver al listado
                    </Link>
                </p>
            </>
        );
    }

    if (!isCreate && !numericPostId) {
        return <EmptyState title="Ruta no válida" description="Falta el identificador de la pieza." />;
    }

    /** Whether publishing would be refused for a missing file, said before trying. */
    const missingMedia =
        (requiredMedia === "video" && !form.video_asset_id) ||
        (requiredMedia === "document" && !form.document_asset_id);

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
                <div>
                    <h1 className="se-heading-section" style={{ margin: 0 }}>
                        {/* "Crear"/"Editar" + the name works for every format;
                            "nueva informe" would not. */}
                        {isCreate
                            ? `Crear ${currentFormat?.name?.toLowerCase() ?? "pieza"}`
                            : `Editar ${currentFormat?.name?.toLowerCase() ?? "pieza"} #${postId}`}
                    </h1>
                    <p className="se-meta se-meta--category" style={{ marginTop: "0.5rem" }}>
                        Estado: {form.status === "published" ? "publicado" : "borrador"}
                    </p>
                </div>
                <Link to="/admin/posts" className="se-link">
                    ← Volver al listado
                </Link>
            </header>

            <div className="se-editor-group">
                <p className="se-editor-group__title">Formato</p>
                <label className="se-form-field" htmlFor="post-format">
                    <span className="se-form-label">Qué es esta pieza</span>
                    <select
                        id="post-format"
                        className="se-form-control"
                        value={form.format}
                        onChange={handleChange("format")}
                    >
                        <option value="">Elija un formato…</option>
                        {formats.map((f) => (
                            <option key={f.slug} value={f.slug}>
                                {f.name}
                            </option>
                        ))}
                    </select>
                </label>
                {form.format && currentFormat?.lede ? (
                    <p className="se-admin-meta-hint">{currentFormat.lede}</p>
                ) : null}
                {!form.format ? (
                    <p className="se-admin-meta-hint">
                        El formato decide qué pide el formulario y cómo se ve la pieza en el
                        sitio. Elíjalo para continuar.
                    </p>
                ) : null}
            </div>

            {form.format ? (
                <>
                    <div className="se-editor-group">
                        <p className="se-editor-group__title">La pieza</p>
                        <label className="se-form-field" htmlFor="post-title">
                            <span className="se-form-label">Título</span>
                            <input
                                id="post-title"
                                className="se-form-control"
                                value={form.title}
                                onChange={handleChange("title")}
                                required
                            />
                        </label>
                        {/* The same editor as the body: a summary is prose, and a
                            writer who needs an emphasis or a link in it should not
                            have to give it up because the field is smaller. */}
                        <div className="se-form-field se-form-field--brief" id="post-excerpt">
                            <span className="se-form-label">
                                {form.format === "editorial" ? "Entradilla" : "Resumen"}
                            </span>
                            <RichTextEditor
                                value={form.excerpt}
                                onChange={(html) => setForm((prev) => ({ ...prev, excerpt: html }))}
                                placeholder={
                                    form.format === "editorial"
                                        ? "La frase con la que abre el editorial…"
                                        : "Dos o tres líneas que resuman la pieza…"
                                }
                            />
                        </div>

                        {/* The published byline. Not the account that uploads the
                            piece -- nobody wants their personal login printed on
                            the site, and an editor rarely publishes under their
                            own name. */}
                        {currentFormat?.shows_author !== false ? (
                            <label className="se-form-field" htmlFor="post-byline">
                                <span className="se-form-label">
                                    Firma — nombre con el que se publica
                                </span>
                                <input
                                    id="post-byline"
                                    className="se-form-control"
                                    value={form.byline}
                                    onChange={handleChange("byline")}
                                    placeholder="Pablo Quintero, Redacción SurEconomics, …"
                                />
                                <span className="se-admin-meta-hint">
                                    Si lo deja vacío, la pieza se publica sin firma. No se usa el
                                    nombre de la cuenta.
                                </span>
                            </label>
                        ) : null}

                        <SourcesField
                            value={form.sources}
                            onChange={(sources) => setForm((prev) => ({ ...prev, sources }))}
                        />

                        {shows("interviewee") ? (
                            <>
                                <label className="se-form-field" htmlFor="post-interviewee">
                                    <span className="se-form-label">Entrevistado</span>
                                    <input
                                        id="post-interviewee"
                                        className="se-form-control"
                                        value={form.interviewee}
                                        onChange={handleChange("interviewee")}
                                    />
                                </label>
                                <label className="se-form-field" htmlFor="post-interviewee-role">
                                    <span className="se-form-label">Cargo</span>
                                    <input
                                        id="post-interviewee-role"
                                        className="se-form-control"
                                        value={form.interviewee_role}
                                        onChange={handleChange("interviewee_role")}
                                    />
                                </label>
                            </>
                        ) : null}

                        {shows("unit") ? (
                            <label className="se-form-field" htmlFor="post-unit">
                                <span className="se-form-label">Unidad que firma</span>
                                <input
                                    id="post-unit"
                                    className="se-form-control"
                                    value={form.unit}
                                    onChange={handleChange("unit")}
                                    placeholder="RendiGroup Advisors, …"
                                />
                            </label>
                        ) : null}

                        {currentFormat?.shows_author === false ? (
                            <p className="se-admin-meta-hint">
                                Este formato se publica sin firma personal: el sitio no muestra
                                autor.
                            </p>
                        ) : null}
                    </div>

                    <div className="se-editor-group">
                        <p className="se-editor-group__title">Cuerpo</p>
                        <div className="se-form-field">
                            <span className="se-form-label">
                                {form.format === "entrevista"
                                    ? "Resumen escrito de la conversación"
                                    : "Contenido"}
                            </span>
                            <RichTextEditor
                                value={form.content}
                                onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                            />
                        </div>

                        {/* The house position closes the note, so it sits after the body
                            rather than up with the identity fields. */}
                        {shows("opinion") ? (
                            <div className="se-form-field se-form-field--brief" id="post-house-opinion">
                                <span className="se-form-label">
                                    ¿Qué piensa SurEconomics? — cierre de la nota
                                </span>
                                <RichTextEditor
                                    value={form.house_opinion}
                                    onChange={(html) =>
                                        setForm((prev) => ({ ...prev, house_opinion: html }))
                                    }
                                    placeholder="La lectura del medio sobre el hecho. Si lo deja vacío, la nota se publica sin este bloque."
                                />
                            </div>
                        ) : null}
                    </div>

                    <div className="se-editor-group">
                        <p className="se-editor-group__title">Clasificación</p>
                        <AxisPicker
                            id="post-topics"
                            legend="Temas"
                            hint="El primero es el principal: es el único que se muestra en las tarjetas."
                            options={topics}
                            value={form.topic_ids}
                            onChange={(next) => setForm((prev) => ({ ...prev, topic_ids: next }))}
                        />
                        <AxisPicker
                            id="post-places"
                            legend="Lugares"
                            hint="Elija el lugar más específico que aplique. Al filtrar por una región aparecen sus países."
                            groups={placeGroups}
                            value={form.place_ids}
                            onChange={(next) => setForm((prev) => ({ ...prev, place_ids: next }))}
                        />
                    </div>

                    <div className="se-editor-group">
                        <p className="se-editor-group__title">Archivos</p>

                        {requiredMedia === "video" ? (
                            <AssetField
                                id="post-video"
                                label="Video de la entrevista"
                                hint="Puede pegar un enlace de YouTube o Vimeo. Sin video, la entrevista no se puede publicar."
                                kind="video"
                                value={form.video_asset_id}
                                asset={assets.video}
                                onChange={setAsset("video_asset_id", "video")}
                                required
                            />
                        ) : null}

                        {requiredMedia === "document" ? (
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
                        ) : null}

                        {/* Every format, because every format has a card in a listing
                            and any piece may arrive with a photo. */}
                        <>
                                <AssetField
                                    id="post-image-asset"
                                    label="Imagen"
                                    hint={IMAGE_HINT[form.format] ?? IMAGE_HINT.default}
                                    kind="image"
                                    value={form.image_asset_id}
                                    asset={assets.image}
                                    onChange={setAsset("image_asset_id", "image")}
                                    onUpload={uploadAdminMediaImage}
                                    accept={ACCEPTED_IMAGE_MIME}
                                />
                                {legacyImage ? (
                                    <p className="se-asset__legacy">
                                        Esta pieza trae una imagen por URL de antes de la
                                        biblioteca de archivos:{" "}
                                        <a
                                            className="se-link"
                                            href={form.featured_image_url}
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
                            </>
                        </div>

                    <div className="se-editor-group">
                        <p className="se-editor-group__title">Publicación</p>
                        <label className="se-form-field" htmlFor="post-status">
                            <span className="se-form-label">Estado</span>
                            <select
                                id="post-status"
                                className="se-form-control"
                                value={form.status}
                                onChange={handleChange("status")}
                            >
                                <option value="draft">Borrador</option>
                                {canPublish || form.status === "published" ? (
                                    <option value="published">Publicado</option>
                                ) : null}
                            </select>
                        </label>
                        <label className="se-form-field" htmlFor="post-published-at">
                            <span className="se-form-label">
                                Fecha de publicación (opcional)
                            </span>
                            <input
                                id="post-published-at"
                                type="datetime-local"
                                className="se-form-control"
                                value={form.published_at}
                                onChange={handleChange("published_at")}
                            />
                        </label>

                        {missingMedia ? (
                            <p className="se-admin-warning">
                                Falta {requiredMedia === "video" ? "el video" : "el documento"}.
                                Puede guardar como borrador, pero publicar será rechazado hasta
                                que lo adjunte.
                            </p>
                        ) : null}
                    </div>

                    {/* Slug and SEO are real needs and belong to the machine, not to the
                        story. Folded away so the form reads as editorial work first. */}
                    <details className="se-editor-advanced">
                        <summary>Avanzado — dirección y SEO</summary>
                        <div className="se-editor-advanced__body">
                            <label className="se-form-field" htmlFor="post-slug">
                                <span className="se-form-label">
                                    Slug (opcional; se genera del título si lo deja vacío)
                                </span>
                                <input
                                    id="post-slug"
                                    className="se-form-control"
                                    value={form.slug}
                                    onChange={handleChange("slug")}
                                />
                            </label>
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
                    </details>

                    <AdminFormFeedback tone={feedback?.tone} message={feedback?.message} />

                    <div className="se-admin-form-actions">
                        <button
                            type="button"
                            className="se-btn"
                            onClick={handleSave}
                            disabled={saveState.status === "loading"}
                        >
                            {saveState.status === "loading"
                                ? "Guardando…"
                                : isCreate
                                  ? "Crear"
                                  : "Guardar cambios"}
                        </button>
                        {!isCreate && canPublish ? (
                            <>
                                <button
                                    type="button"
                                    className="se-btn se-btn--secondary"
                                    onClick={handlePublish}
                                    disabled={actionState.status === "loading"}
                                >
                                    {actionState.status === "loading" &&
                                    actionState.kind === "publish"
                                        ? "Publicando…"
                                        : "Publicar"}
                                </button>
                                <button
                                    type="button"
                                    className="se-btn se-btn--secondary"
                                    onClick={handleUnpublish}
                                    disabled={actionState.status === "loading"}
                                >
                                    {actionState.status === "loading" &&
                                    actionState.kind === "unpublish"
                                        ? "Despublicando…"
                                        : "Despublicar"}
                                </button>
                                <button
                                    type="button"
                                    className="se-btn se-btn--secondary"
                                    onClick={handleDelete}
                                >
                                    Eliminar
                                </button>
                            </>
                        ) : null}
                    </div>
                </>
            ) : null}

            <ConfirmDialog />
        </main>
    );
};
