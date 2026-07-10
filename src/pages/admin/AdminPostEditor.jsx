import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
    createAdminPost,
    deleteAdminPost,
    getAdminPost,
    listAdminCategories,
    listAdminTags,
    patchAdminPost,
    publishAdminPost,
    unpublishAdminPost,
} from "../../services/adminPostsService";
import { EmptyState, ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useFlashMessage } from "../../hooks/useFlashMessage";

const emptyForm = () => ({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    meta_title: "",
    meta_description: "",
    canonical_url: "",
    featured_image_url: "",
    status: "draft",
    published_at: "",
    category_ids: [],
    tag_ids: [],
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
        title: pickStr(post, ["title"]),
        slug: pickStr(post, ["slug"]),
        excerpt: pickStr(post, ["excerpt", "summary"]),
        content: pickStr(post, ["content", "body", "html"]),
        meta_title: pickStr(post, ["meta_title", "metaTitle", "seo_title"]),
        meta_description: pickStr(post, ["meta_description", "metaDescription", "seo_description"]),
        canonical_url: pickStr(post, ["canonical_url", "canonicalUrl", "url"]),
        featured_image_url: pickStr(post, [
            "featured_image_url",
            "featuredImageUrl",
            "featured_image",
            "featuredImage",
        ]),
        status: pickStr(post, ["status", "publication_status", "state"], "draft"),
        published_at: typeof publishedAt === "string" ? isoToDateTimeLocal(publishedAt) : "",
        category_ids: idsFromRelation(post.categories ?? post.category_ids),
        tag_ids: idsFromRelation(post.tags ?? post.tag_ids),
    };
};

const formToPayload = (form) => {
    let publishedAtValue;
    if (form.published_at && String(form.published_at).trim()) {
        const d = new Date(form.published_at);
        publishedAtValue = Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    }

    const payload = {
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
        category_ids: form.category_ids.length ? form.category_ids : undefined,
        tag_ids: form.tag_ids.length ? form.tag_ids : undefined,
    };
    Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
    });
    return payload;
};

const toggleId = (list, id) => {
    const n = Number(id);
    const useNum = !Number.isNaN(n) && String(n) === String(id);
    const target = useNum ? n : id;
    const has = list.some((x) => String(x) === String(target));
    if (has) return list.filter((x) => String(x) !== String(target));
    return [...list, target];
};

export const AdminPostEditor = () => {
    const { postId } = useParams();
    const { pathname } = useLocation();
    const isCreate = /\/admin\/posts\/new\/?$/.test(pathname);
    const navigate = useNavigate();

    const [form, setForm] = useState(emptyForm);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [loadState, setLoadState] = useState({ status: "idle", error: null });
    const [saveState, setSaveState] = useState({ status: "idle", error: null, message: "" });
    const [actionState, setActionState] = useState({ status: "idle", error: null, message: "", kind: "" });
    const { confirm, ConfirmDialog } = useAdminConfirm();
    const flash = useFlashMessage();

    const numericPostId = useMemo(() => {
        if (!postId) return null;
        const n = Number(postId);
        return Number.isFinite(n) ? n : postId;
    }, [postId]);

    const loadTaxonomies = useCallback(async () => {
        try {
            const [cats, tgs] = await Promise.all([listAdminCategories(), listAdminTags()]);
            setCategories(cats);
            setTags(tgs);
        } catch {
            setCategories([]);
            setTags([]);
        }
    }, []);

    const loadPost = useCallback(async () => {
        if (isCreate || !numericPostId) {
            setForm(emptyForm());
            setLoadState({ status: "success", error: null });
            return;
        }
        setLoadState({ status: "loading", error: null });
        try {
            const post = await getAdminPost(numericPostId);
            setForm(postToForm(post));
            setLoadState({ status: "success", error: null });
        } catch (err) {
            setLoadState({ status: "error", error: err });
        }
    }, [isCreate, numericPostId]);

    useEffect(() => {
        loadTaxonomies();
    }, [loadTaxonomies]);

    useEffect(() => {
        loadPost();
    }, [loadPost]);

    useEffect(() => {
        applyPageMeta({
            title: isCreate ? "Admin — Nuevo artículo" : `Admin — Editar #${postId ?? ""}`,
            description: "Edición de artículos (SurEconomics).",
        });
    }, [isCreate, postId]);

    const handleChange = (field) => (e) => {
        const v = e.target.value;
        setForm((prev) => ({ ...prev, [field]: v }));
    };

    const handleToggleCategory = (id) => {
        setForm((prev) => ({ ...prev, category_ids: toggleId(prev.category_ids, id) }));
    };

    const handleToggleTag = (id) => {
        setForm((prev) => ({ ...prev, tag_ids: toggleId(prev.tag_ids, id) }));
    };

    const handleSave = async () => {
        setSaveState({ status: "loading", error: null, message: "" });
        setActionState({ status: "idle", error: null, message: "" });
        try {
            const payload = formToPayload(form);
            if (isCreate) {
                const created = await createAdminPost(payload);
                const newId =
                    created?.id ??
                    created?._id ??
                    (typeof created === "object" && created !== null && "data" in created
                        ? created.data?.id
                        : null);
                if (newId != null) {
                    navigate(`/admin/posts/${newId}`, {
                        replace: true,
                        state: { flash: "Artículo creado correctamente." },
                    });
                } else {
                    navigate("/admin/posts", {
                        replace: true,
                        state: { flash: "Artículo creado correctamente." },
                    });
                }
                return;
            }
            const updated = await patchAdminPost(numericPostId, payload);
            setForm(postToForm(updated));
            setSaveState({ status: "success", error: null, message: "Cambios guardados correctamente." });
        } catch (err) {
            setSaveState({ status: "error", error: err, message: "" });
        }
    };

    const handlePublish = async () => {
        if (isCreate) return;
        setSaveState({ status: "idle", error: null, message: "" });
        setActionState({ status: "loading", error: null, message: "", kind: "publish" });
        try {
            const updated = await publishAdminPost(numericPostId);
            setForm(postToForm(updated));
            setActionState({ status: "success", error: null, message: "Artículo publicado correctamente.", kind: "publish" });
        } catch (err) {
            setActionState({ status: "error", error: err, message: "", kind: "publish" });
        }
    };

    const handleUnpublish = async () => {
        if (isCreate) return;
        setSaveState({ status: "idle", error: null, message: "" });
        setActionState({ status: "loading", error: null, message: "", kind: "unpublish" });
        try {
            const updated = await unpublishAdminPost(numericPostId);
            setForm(postToForm(updated));
            setActionState({ status: "success", error: null, message: "Artículo despublicado correctamente.", kind: "unpublish" });
        } catch (err) {
            setActionState({ status: "error", error: err, message: "", kind: "unpublish" });
        }
    };

    const handleDelete = async () => {
        if (isCreate) return;
        setActionState({ status: "idle", error: null, message: "", kind: "" });
        await confirm({
            title: "Eliminar artículo",
            description: `¿Eliminar este artículo (ID ${numericPostId}) de forma permanente?`,
            confirmLabel: "Eliminar artículo",
            onConfirm: async () => {
                await deleteAdminPost(numericPostId);
                navigate("/admin/posts", {
                    replace: true,
                    state: { flash: "Artículo eliminado correctamente." },
                });
            },
        });
    };

    const formatActionError = (err) => {
        if (!err) return "";
        if (err.status === 429) {
            return "Demasiadas solicitudes. Espere un momento e intente de nuevo.";
        }
        return err.message || "Error";
    };

    if (loadState.status === "loading") {
        return <LoadingState title="Cargando artículo…" />;
    }

    if (loadState.status === "error") {
        return (
            <>
                <ErrorState title="No se pudo cargar el artículo" error={loadState.error} onRetry={loadPost} />
                <p style={{ marginTop: "1rem" }}>
                    <Link to="/admin/posts" className="se-link">
                        Volver al listado
                    </Link>
                </p>
            </>
        );
    }

    if (!isCreate && !numericPostId) {
        return <EmptyState title="Ruta no válida" description="Falta el identificador del artículo." />;
    }

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
                <div>
                    <h1 className="se-heading-section" style={{ margin: 0 }}>
                        {isCreate ? "Nuevo artículo" : `Editar artículo #${postId}`}
                    </h1>
                    <p className="se-meta se-meta--category" style={{ marginTop: "0.5rem" }}>
                        Estado: {form.status || "—"}
                    </p>
                </div>
                <Link to="/admin/posts" className="se-link">
                    ← Listado
                </Link>
            </header>

            {flash ? (
                <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
                    {flash}
                </p>
            ) : null}
            {saveState.status === "error" ? (
                <p className="se-admin-login__error" role="alert">
                    {formatActionError(saveState.error)}
                </p>
            ) : null}
            {saveState.status === "success" ? (
                <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
                    {saveState.message}
                </p>
            ) : null}
            {actionState.status === "error" ? (
                <p className="se-admin-login__error" role="alert">
                    {formatActionError(actionState.error)}
                </p>
            ) : null}
            {actionState.status === "success" ? (
                <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
                    {actionState.message}
                </p>
            ) : null}

            <div className="se-contact-form">
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
                <label className="se-form-field" htmlFor="post-slug">
                    <span className="se-form-label">Slug (opcional; el backend puede autogenerarlo)</span>
                    <input
                        id="post-slug"
                        className="se-form-control"
                        value={form.slug}
                        onChange={handleChange("slug")}
                    />
                </label>
                <label className="se-form-field" htmlFor="post-status">
                    <span className="se-form-label">Estado</span>
                    <select
                        id="post-status"
                        className="se-form-control"
                        value={form.status}
                        onChange={handleChange("status")}
                    >
                        {form.status && !["draft", "published"].includes(form.status) ? (
                            <option value={form.status}>{form.status}</option>
                        ) : null}
                        <option value="draft">Borrador</option>
                        <option value="published">Publicado</option>
                    </select>
                </label>
                <label className="se-form-field" htmlFor="post-published-at">
                    <span className="se-form-label">Fecha de publicación (opcional, ISO vía selector local)</span>
                    <input
                        id="post-published-at"
                        type="datetime-local"
                        className="se-form-control"
                        value={form.published_at}
                        onChange={handleChange("published_at")}
                    />
                </label>
                <label className="se-form-field" htmlFor="post-excerpt">
                    <span className="se-form-label">Resumen (excerpt)</span>
                    <textarea
                        id="post-excerpt"
                        className="se-form-control se-form-control--textarea"
                        rows={3}
                        value={form.excerpt}
                        onChange={handleChange("excerpt")}
                    />
                </label>
                <label className="se-form-field" htmlFor="post-content">
                    <span className="se-form-label">Contenido</span>
                    <textarea
                        id="post-content"
                        className="se-form-control se-form-control--textarea"
                        rows={14}
                        value={form.content}
                        onChange={handleChange("content")}
                    />
                </label>
                <label className="se-form-field" htmlFor="post-meta-title">
                    <span className="se-form-label">Meta título (SEO)</span>
                    <input
                        id="post-meta-title"
                        className="se-form-control"
                        value={form.meta_title}
                        onChange={handleChange("meta_title")}
                    />
                </label>
                <label className="se-form-field" htmlFor="post-meta-desc">
                    <span className="se-form-label">Meta descripción (SEO)</span>
                    <textarea
                        id="post-meta-desc"
                        className="se-form-control se-form-control--textarea"
                        rows={2}
                        value={form.meta_description}
                        onChange={handleChange("meta_description")}
                    />
                </label>
                <label className="se-form-field" htmlFor="post-canonical">
                    <span className="se-form-label">URL canónica</span>
                    <input
                        id="post-canonical"
                        className="se-form-control"
                        value={form.canonical_url}
                        onChange={handleChange("canonical_url")}
                    />
                </label>
                <label className="se-form-field" htmlFor="post-image">
                    <span className="se-form-label">Imagen destacada (featured_image_url)</span>
                    <input
                        id="post-image"
                        className="se-form-control"
                        value={form.featured_image_url}
                        onChange={handleChange("featured_image_url")}
                    />
                </label>

                <fieldset className="se-form-field">
                    <legend className="se-form-label">Categorías</legend>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {categories.length === 0 ? (
                            <span className="se-text-body">No se pudieron cargar categorías.</span>
                        ) : (
                            categories.map((c) => {
                                const id = c.id ?? c._id;
                                const checked = form.category_ids.some((x) => String(x) === String(id));
                                return (
                                    <label key={String(id)} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleToggleCategory(id)}
                                        />
                                        <span>{c.name || c.slug || String(id)}</span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </fieldset>

                <fieldset className="se-form-field">
                    <legend className="se-form-label">Etiquetas</legend>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "220px", overflowY: "auto" }}>
                        {tags.length === 0 ? (
                            <span className="se-text-body">No se pudieron cargar etiquetas.</span>
                        ) : (
                            tags.map((t) => {
                                const id = t.id ?? t._id;
                                const checked = form.tag_ids.some((x) => String(x) === String(id));
                                return (
                                    <label key={String(id)} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                        <input type="checkbox" checked={checked} onChange={() => handleToggleTag(id)} />
                                        <span>{t.name || t.slug || String(id)}</span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </fieldset>

                <p className="se-admin-meta-hint">
                    Payload alineado con la API: title, slug, excerpt, content, featured_image_url, status,
                    published_at (ISO8601), meta_title, meta_description, canonical_url, category_ids, tag_ids.
                    Publicar / despublicar usan los endpoints dedicados (PATCH con cuerpo vacío).
                </p>

                <div className="se-admin-form-actions">
                    <button type="button" className="se-btn" onClick={handleSave} disabled={saveState.status === "loading"}>
                        {saveState.status === "loading" ? "Guardando…" : isCreate ? "Crear" : "Guardar cambios"}
                    </button>
                    {!isCreate ? (
                        <>
                            <button
                                type="button"
                                className="se-btn se-btn--secondary"
                                onClick={handlePublish}
                                disabled={actionState.status === "loading"}
                            >
                                {actionState.status === "loading" && actionState.kind === "publish" ? "Publicando…" : "Publicar"}
                            </button>
                            <button
                                type="button"
                                className="se-btn se-btn--secondary"
                                onClick={handleUnpublish}
                                disabled={actionState.status === "loading"}
                            >
                                {actionState.status === "loading" && actionState.kind === "unpublish" ? "Despublicando…" : "Despublicar"}
                            </button>
                            <button type="button" className="se-btn se-btn--secondary" onClick={handleDelete}>
                                Eliminar
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            <ConfirmDialog />
        </main>
    );
};
