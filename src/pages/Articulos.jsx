import { useEffect, useMemo, useState } from "react";
import { PostCard } from "../components/blog";
import { BRAND } from "../data/surEconomicsMock";
import { contentService } from "../services/contentService";
import { applyPageMeta } from "../lib/seo";
import { ArticlesFiltersLite } from "../components/articles/ArticlesFiltersLite";
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

export const Articulos = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [postsState, setPostsState] = useState({
    status: "idle",
    items: [],
    total: 0,
    totalPages: 1,
    error: null,
  });

  const LIMIT = 12;

  const loadTaxonomies = async () => {
    try {
      const [cats, tgs] = await Promise.all([
        contentService.getCategories(),
        contentService.getTags(),
      ]);
      setCategories(cats);
      setTags(tgs);
    } catch {
      setCategories([]);
      setTags([]);
    }
  };

  const loadPosts = async () => {
    setPostsState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const res = await contentService.getPosts({
        page,
        limit: LIMIT,
        category,
        tag,
      });
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
    applyPageMeta({
      title: `Artículos — ${BRAND.name}`,
      description: "Explorador editorial de Sur Economics: artículos publicados y categorías.",
    });
  }, []);

  useEffect(() => {
    loadTaxonomies();
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, tag]);

  const filteredItems = useMemo(() => {
    const items = postsState.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      const haystack = `${p.title ?? ""} ${p.excerpt ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [postsState.items, query]);

  const handleReset = () => {
    setQuery("");
    setCategory("");
    setTag("");
    setPage(1);
  };

  const handleCategoryChange = (slug) => {
    setCategory(slug);
    setPage(1);
  };

  const handleTagChange = (slug) => {
    setTag(slug);
    setPage(1);
  };

  return (
    <main className="se-blog" role="main">
      <section className="se-section">
        <div className="se-container">
          <div className="se-page-head">
            <h1 className="se-heading-section">Artículos</h1>
            <p className="se-text-body">
              Explorador editorial: filtra por categoría y tags para encontrar lecturas publicadas con criterio.
            </p>
          </div>
        </div>

        <div className="se-container">
          <div className="se-articles-layout">
            <ArticlesFiltersLite
              query={query}
              onQueryChange={setQuery}
              category={category}
              onCategoryChange={handleCategoryChange}
              tag={tag}
              onTagChange={handleTagChange}
              categories={categories}
              tags={tags}
              onReset={handleReset}
            />

            <section className="se-articles-results" aria-label="Resultados">
              <div className="se-articles-results__meta">
                <span className="se-meta se-meta--category">
                  {postsState.status === "success"
                    ? `${postsState.total || filteredItems.length} artículos`
                    : "Artículos"}
                </span>
              </div>

              {postsState.status === "loading" ? (
                <LoadingState title="Cargando artículos…" />
              ) : null}

              {postsState.status === "error" ? (
                <ErrorState title="No pudimos cargar los artículos" error={postsState.error} onRetry={loadPosts} />
              ) : null}

              {postsState.status === "success" && filteredItems.length === 0 ? (
                <EmptyState
                  title="Sin resultados"
                  description={
                    query.trim()
                      ? "No encontramos artículos que coincidan con tu búsqueda en esta página."
                      : "No hay artículos publicados para los filtros seleccionados."
                  }
                />
              ) : null}

              {postsState.status === "success" && filteredItems.length > 0 ? (
                <>
                  <div className="se-articles-grid">
                    {filteredItems.map((post, idx) => {
                      const card = normalizeForCard(post, idx);
                      return (
                        <PostCard
                          key={card.id}
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
                      );
                    })}
                  </div>
                  <Pagination page={page} totalPages={postsState.totalPages || 1} onPageChange={setPage} />
                </>
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

