import {
  Hero,
  FeaturedPosts,
  BlogFeed,
  SuggestedReading,
  NewsletterBlock,
} from "../components/blog";
import { BRAND, INSTITUTIONAL, PARTNERS, REPORTS } from "../data/surEconomicsMock";
import { PartnersLogoCloud } from "../components/institutional/PartnersLogoCloud";
import { PlaceholderImage } from "../components/blog";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { contentService } from "../services/contentService";
import { applyPageMeta } from "../lib/seo";
import { ErrorState, LoadingState } from "../components/content";

export const Home = () => {
  const [state, setState] = useState({ status: "idle", posts: [], error: null });

  const handleLoad = async () => {
    setState({ status: "loading", posts: [], error: null });
    try {
      const res = await contentService.getPosts({ page: 1, limit: 12 });
      setState({ status: "success", posts: res.items ?? [], error: null });
    } catch (err) {
      setState({ status: "error", posts: [], error: err });
    }
  };

  useEffect(() => {
    applyPageMeta({
      title: `${BRAND.name} — Economía, mercados e inversión`,
      description: BRAND.description,
    });
  }, []);

  useEffect(() => {
    handleLoad();
  }, []);

  const derived = useMemo(() => {
    const posts = state.posts ?? [];
    const hero = posts[0] ?? null;
    const featured = posts.slice(1, 4);
    const feed = posts.slice(4, 9);
    const suggested = posts.slice(9, 12);

    const toCard = (post, fallbackPlaceholder) => {
      const firstCategory = post.categories?.[0]?.name || post.categories?.[0]?.slug || "Editorial";
      const imagePlaceholder = fallbackPlaceholder;
      return {
        id: post.id || post.slug,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        date: post.publishDate,
        author: post.author,
        category: firstCategory,
        imageUrl: post.featuredImage || "",
        imagePlaceholder,
        readTime: "",
      };
    };

    return {
      hero: hero ? toCard(hero, "chart") : null,
      featured: featured.map((p, i) => toCard(p, i % 2 === 0 ? "building" : "growth")),
      feed: feed.map((p, i) => toCard(p, i % 2 === 0 ? "chart" : "building")),
      suggested: suggested.map((p, i) => toCard(p, i % 2 === 0 ? "growth" : "chart")),
    };
  }, [state.posts]);

  return (
    <main className="se-blog" role="main">
      <Hero featuredPost={derived.hero} />
      <section className="se-section">
        <div className="se-container">
          <div className="se-two-col se-two-col--align-start">
            <div>
              <h2 className="se-heading-section">Una plataforma para entender Latinoamérica</h2>
              <p className="se-text-body">
                {BRAND.description}
              </p>
              <p className="se-text-body" style={{ marginTop: "1rem" }}>
                {INSTITUTIONAL.purpose}
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <Link to="/quienes-somos" className="se-link">
                  Conocer el proyecto
                </Link>
              </div>
            </div>
            <div>
              <div className="se-visual-card">
                <PlaceholderImage variant="chart" hero={false} />
                <div className="se-visual-card__text">
                  <div className="se-meta se-meta--category">Lectura ejecutiva</div>
                  <div className="se-visual-card__title">
                    Investigación + claridad
                  </div>
                  <p className="se-text-body">
                    Estructuramos datos para que puedas decidir con criterio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <div className="se-two-col se-two-col--align-start">
            <div>
              <h2 className="se-heading-section">Investigación destacada</h2>
              <p className="se-text-body">
                Nuestro enfoque combina economía, finanzas y lectura política con estructura de reporte.
              </p>
            </div>
            <div>
              <article className="se-card se-card--compact">
                <div className="se-card__body">
                  <span className="se-meta se-meta--category">{REPORTS[0].tier}</span>
                  <h3 className="se-heading-card se-heading-card--small">{REPORTS[0].title}</h3>
                  <p className="se-card__excerpt se-text-body">{REPORTS[0].excerpt}</p>
                  <div className="se-report-meta">
                    <time dateTime={REPORTS[0].date}>{REPORTS[0].date}</time>
                  </div>
                  <Link to="/informes" className="se-link se-card__cta">
                    Ver biblioteca
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <h2 className="se-heading-section">Temas clave</h2>
          <ul className="se-topics" aria-label="Temas clave">
            {[
              "Inflación",
              "Política monetaria",
              "Mercados y flujos",
              "Riesgo y volatilidad",
              "Inversión en Latinoamérica",
              "Geopolítica regional",
              "Sector energía y transición",
              "Consumo y crecimiento",
            ].map((t) => (
              <li key={t} className="se-topics__item">
                <span className="se-topics__chip">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {state.status === "loading" ? (
        <LoadingState title="Cargando publicaciones…" description="Obteniendo artículos publicados desde el backend." />
      ) : null}
      {state.status === "error" ? (
        <ErrorState title="No pudimos cargar el contenido editorial" error={state.error} onRetry={handleLoad} />
      ) : null}

      {state.status === "success" ? (
        <>
          <FeaturedPosts posts={derived.featured} />
          <BlogFeed posts={derived.feed} />
          <SuggestedReading posts={derived.suggested} />
        </>
      ) : null}

      <NewsletterBlock />
      <PartnersLogoCloud partners={PARTNERS} />
    </main>
  );
};
