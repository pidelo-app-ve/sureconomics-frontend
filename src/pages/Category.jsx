import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PostCard } from "../components/blog";
import { contentService } from "../services/contentService";
import { applyPageMeta } from "../lib/seo";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../components/content";

const normalizeForCard = (post, idx = 0) => {
  const firstCategory = post.categories?.[0]?.name || post.categories?.[0]?.slug || "Editorial";
  const placeholders = ["chart", "building", "growth"];
  return {
    id: post.id || post.slug,
    slug: post.slug,
    category: firstCategory,
    title: post.title,
    excerpt: post.excerpt,
    date: post.publishDate,
    readTime: "",
    imagePlaceholder: placeholders[idx % placeholders.length],
    imageUrl: post.featuredImage || "",
    author: post.author,
  };
};

export const Category = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(1);
  const [categoriesState, setCategoriesState] = useState({ status: "idle", items: [], error: null });
  const [postsState, setPostsState] = useState({ status: "idle", items: [], total: 0, totalPages: 1, error: null });

  const category = useMemo(() => {
    return (categoriesState.items ?? []).find((c) => c.slug === slug) ?? null;
  }, [categoriesState.items, slug]);

  const LIMIT = 12;

  const loadCategories = async () => {
    setCategoriesState({ status: "loading", items: [], error: null });
    try {
      const items = await contentService.getCategories();
      setCategoriesState({ status: "success", items, error: null });
    } catch (err) {
      setCategoriesState({ status: "error", items: [], error: err });
    }
  };

  const loadPosts = async () => {
    if (!slug) return;
    setPostsState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const res = await contentService.getPosts({ page, limit: LIMIT, category: slug });
      setPostsState({
        status: "success",
        items: res.items ?? [],
        total: res.total ?? 0,
        totalPages: res.totalPages ?? 1,
        error: null,
      });
    } catch (err) {
      setPostsState((s) => ({ ...s, status: "error", error: err }));
    }
  };

  useEffect(() => {
    setPage(1);
  }, [slug]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, page]);

  useEffect(() => {
    if (!slug) return;
    applyPageMeta({
      title: category?.name ? `${category.name} — ${slug}` : `Categoría — ${slug}`,
      description: category?.name
        ? `Artículos publicados en la categoría ${category.name}.`
        : "Artículos publicados por categoría.",
    });
  }, [slug, category?.name]);

  if (categoriesState.status === "loading" || categoriesState.status === "idle") {
    return (
      <main className="se-blog" role="main">
        <LoadingState title="Cargando categoría…" />
      </main>
    );
  }

  if (categoriesState.status === "error") {
    return (
      <main className="se-blog" role="main">
        <ErrorState title="No pudimos cargar las categorías" error={categoriesState.error} onRetry={loadCategories} />
      </main>
    );
  }

  if (!category) {
    return (
      <main className="se-blog">
        <div className="se-container">
          <h1 className="se-heading-section">Categoría no encontrada</h1>
          <p className="se-text-body">La categoría puede no existir o haber sido renombrada.</p>
          <Link to="/articulos" className="se-link">
            Volver a artículos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="se-blog" role="main">
      <section className="se-section">
        <div className="se-container">
          <h1 className="se-heading-section">{category.name}</h1>

          {postsState.status === "loading" ? <LoadingState title="Cargando artículos…" /> : null}
          {postsState.status === "error" ? (
            <ErrorState title="No pudimos cargar los artículos" error={postsState.error} onRetry={loadPosts} />
          ) : null}
          {postsState.status === "success" && (postsState.items ?? []).length === 0 ? (
            <EmptyState title="Sin artículos" description="No hay artículos publicados en esta categoría." />
          ) : null}
          {postsState.status === "success" && (postsState.items ?? []).length > 0 ? (
            <>
              <ul className="se-feed__list">
                {postsState.items.map((post, idx) => {
                  const card = normalizeForCard(post, idx);
                  return (
                    <li key={card.id}>
                      <PostCard
                        slug={card.slug}
                        category={card.category}
                        title={card.title}
                        excerpt={card.excerpt}
                        date={card.date}
                        readTime={card.readTime}
                        imagePlaceholder={card.imagePlaceholder}
                        imageUrl={card.imageUrl}
                        author={card.author}
                      />
                    </li>
                  );
                })}
              </ul>
              <Pagination page={page} totalPages={postsState.totalPages || 1} onPageChange={setPage} />
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
};
