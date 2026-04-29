import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { PlaceholderImage, ArticleBody } from "../components/blog";
import { contentService } from "../services/contentService";
import { formatDateEs } from "../lib/date";
import { applyPageMeta } from "../lib/seo";
import { ErrorState, LoadingState, Pagination } from "../components/content";
import { ShareButtons } from "../components/content/ShareButtons";
import { useUserAuth } from "../context/UserAuthContext";
import * as userMeService from "../services/userMeService";
import { CommentList } from "../components/comments/CommentList";
import { CommentComposer } from "../components/comments/CommentComposer";

export const Article = () => {
  const { slug } = useParams();
  const { isAuthenticated, isEmailVerified } = useUserAuth();
  const [state, setState] = useState({ status: "idle", post: null, error: null });
  const [commentsState, setCommentsState] = useState({
    status: "idle",
    page: 1,
    data: null,
    error: null,
  });
  const [bookmarkState, setBookmarkState] = useState({
    bookmarked: false,
    busy: false,
    error: "",
  });

  const handleLoad = async () => {
    setState({ status: "loading", post: null, error: null });
    try {
      const post = await contentService.getPostBySlug(slug);
      if (!post?.slug) {
        setState({ status: "not_found", post: null, error: null });
        return;
      }
      setState({ status: "success", post, error: null });
    } catch (err) {
      if (err?.status === 404) {
        setState({ status: "not_found", post: null, error: null });
        return;
      }
      setState({ status: "error", post: null, error: err });
    }
  };

  useEffect(() => {
    if (!slug) return;
    handleLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (state.status !== "success" || !state.post) return;
    const post = state.post;
    applyPageMeta({
      title: post.metaTitle || post.title || "Artículo",
      description: post.metaDescription || post.excerpt,
      canonicalUrl: post.canonicalUrl,
    });
  }, [state.status, state.post]);

  const handleLoadComments = useCallback(
    async (page = 1) => {
      if (!slug) return;
      setCommentsState((s) => ({ ...s, status: "loading", error: null }));
      try {
        const data = await contentService.getPostComments(slug, { page, limit: 15 });
        setCommentsState({ status: "success", page: data.page ?? page, data, error: null });
      } catch (err) {
        setCommentsState((s) => ({ ...s, status: "error", error: err }));
      }
    },
    [slug]
  );

  useEffect(() => {
    if (state.status !== "success" || !slug) return;
    handleLoadComments(1);
  }, [state.status, slug, handleLoadComments]);

  useEffect(() => {
    const post = state.post;
    if (!post?.id || !isEmailVerified) {
      setBookmarkState({ bookmarked: false, busy: false, error: "" });
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await userMeService.getMyBookmarks({ page: 1, limit: 50 });
        const found = (res.items ?? []).some((p) => String(p.id) === String(post.id));
        if (!cancelled) {
          setBookmarkState({ bookmarked: found, busy: false, error: "" });
        }
      } catch {
        if (!cancelled) {
          setBookmarkState({ bookmarked: false, busy: false, error: "" });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.post, isEmailVerified]);

  const handleToggleBookmark = async () => {
    const post = state.post;
    if (!post?.id || !isEmailVerified) return;
    setBookmarkState((s) => ({ ...s, busy: true, error: "" }));
    try {
      if (bookmarkState.bookmarked) {
        await userMeService.removeBookmark(post.id);
        setBookmarkState({ bookmarked: false, busy: false, error: "" });
      } else {
        await userMeService.addBookmark(post.id);
        setBookmarkState({ bookmarked: true, busy: false, error: "" });
      }
    } catch (err) {
      const msg =
        err?.status === 429
          ? "Demasiadas solicitudes. Intente más tarde."
          : err instanceof Error
            ? err.message
            : "No se pudo actualizar el marcador.";
      setBookmarkState((s) => ({ ...s, busy: false, error: msg }));
    }
  };

  const handleSubmitComment = async (content) => {
    await userMeService.postComment(slug, content);
    await handleLoadComments(commentsState.page ?? 1);
  };

  if (state.status === "loading" || state.status === "idle") {
    return (
      <main className="se-blog se-article" role="main">
        <LoadingState title="Cargando artículo…" />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="se-blog se-article" role="main">
        <ErrorState title="No pudimos cargar el artículo" error={state.error} onRetry={handleLoad} />
      </main>
    );
  }

  if (state.status === "not_found") {
    return (
      <main className="se-blog se-article">
        <div className="se-container se-container--narrow">
          <h1 className="se-heading-section">Artículo no encontrado</h1>
          <p className="se-text-body">
            El enlace puede estar roto o el artículo ya no está disponible.
          </p>
          <Link to="/articulos" className="se-link" style={{ marginTop: "1rem", display: "inline-block" }}>
            Volver a artículos
          </Link>
        </div>
      </main>
    );
  }

  const post = state.post;
  const categoryLabel = post.categories?.[0]?.name || post.categories?.[0]?.slug || "Editorial";
  const commentItems = commentsState.data?.items ?? [];

  return (
    <main className="se-blog se-article" role="main">
      <article>
        <header className="se-article__header">
          <div className="se-container">
            <span className="se-meta se-meta--category">{categoryLabel}</span>
            <h1 className="se-article__title">{post.title}</h1>
            <div className="se-article__meta">
              <time dateTime={post.publishDate}>{formatDateEs(post.publishDate)}</time>
              {post.author && <span className="se-article__author">Por {post.author}</span>}
            </div>
            <div className="se-article__share">
              <ShareButtons url={post.canonicalUrl || `/articulo/${post.slug}`} title={post.title} />
            </div>
            {post.id && isEmailVerified ? (
              <div className="se-article__toolbar">
                <button
                  type="button"
                  className={bookmarkState.bookmarked ? "se-btn" : "se-btn se-btn--secondary"}
                  onClick={handleToggleBookmark}
                  disabled={bookmarkState.busy}
                  aria-pressed={bookmarkState.bookmarked}
                  aria-label={bookmarkState.bookmarked ? "Quitar de marcadores" : "Guardar en marcadores"}
                >
                  {bookmarkState.busy
                    ? "Guardando…"
                    : bookmarkState.bookmarked
                      ? "En marcadores"
                      : "Guardar"}
                </button>
                {bookmarkState.error ? (
                  <span className="se-text-small" role="alert">
                    {bookmarkState.error}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>
        <div className="se-article__media se-container">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt=""
              className="se-article__img"
              loading="eager"
              decoding="async"
            />
          ) : (
            <PlaceholderImage variant="chart" hero />
          )}
        </div>
        <div className="se-article__body se-container">
          <div className="se-container--narrow se-article__content">
            <p className="se-text-lead">{post.excerpt}</p>
            <ArticleBody content={post.content} />
          </div>
        </div>
        <section className="se-container se-container--narrow se-comments" aria-labelledby="comments-title">
          <h2 id="comments-title" className="se-heading-section se-heading-section--small">
            Comentarios
          </h2>
          {commentsState.status === "loading" ? (
            <p className="se-text-body" aria-live="polite">
              Cargando comentarios…
            </p>
          ) : null}
          {commentsState.status === "error" ? (
            <ErrorState
              title="No pudimos cargar los comentarios"
              error={commentsState.error}
              onRetry={() => handleLoadComments(commentsState.page ?? 1)}
            />
          ) : null}
          {commentsState.status === "success" ? <CommentList comments={commentItems} /> : null}
          <div style={{ marginTop: "1.5rem" }}>
            <CommentComposer
              slug={slug}
              isAuthenticated={isAuthenticated}
              isEmailVerified={isEmailVerified}
              onSubmitComment={handleSubmitComment}
            />
          </div>
          {commentsState.status === "success" && commentsState.data ? (
            <Pagination
              page={commentsState.data.page ?? 1}
              totalPages={commentsState.data.totalPages ?? 1}
              onPageChange={(p) => handleLoadComments(p)}
            />
          ) : null}
        </section>
      </article>
      <div className="se-container se-article__back">
        <Link to="/" className="se-link">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
};
