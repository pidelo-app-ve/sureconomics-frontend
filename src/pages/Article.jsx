import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PlaceholderImage, ArticleBody } from "../components/blog";
import { contentService } from "../services/contentService";
import { formatDateEs } from "../lib/date";
import { applyPageMeta } from "../lib/seo";
import { ErrorState, LoadingState } from "../components/content";

export const Article = () => {
  const { slug } = useParams();
  const [state, setState] = useState({ status: "idle", post: null, error: null });

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

  return (
    <main className="se-blog se-article" role="main">
      <article>
        <header className="se-article__header">
          <div className="se-container se-container--narrow">
            <span className="se-meta se-meta--category">{categoryLabel}</span>
            <h1 className="se-article__title">{post.title}</h1>
            <div className="se-article__meta">
              <time dateTime={post.publishDate}>{formatDateEs(post.publishDate)}</time>
              {post.author && <span className="se-article__author">Por {post.author}</span>}
            </div>
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
      </article>
      <div className="se-container se-article__back">
        <Link to="/" className="se-link">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
};
