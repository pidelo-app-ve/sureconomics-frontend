import { useMemo, useState } from "react";
import { PostCard } from "../components/blog";
import { ALL_POSTS } from "../data/blogMock";
import { ArticleFilters } from "../components/articles/ArticleFilters";
import { BRAND } from "../data/surEconomicsMock";

const uniqSorted = (arr) =>
  Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));

const matchesDateFrom = (dateStr, dateFrom) => {
  if (!dateFrom) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const from = new Date(dateFrom);
  if (Number.isNaN(d.getTime()) || Number.isNaN(from.getTime())) return true;
  return d >= from;
};

export const Articulos = () => {
  const [query, setQuery] = useState("");
  const [contentType, setContentType] = useState("");
  const [mainTheme, setMainTheme] = useState("");
  const [regionGeo, setRegionGeo] = useState("");
  const [sector, setSector] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [author, setAuthor] = useState("");

  const sortedPosts = useMemo(() => {
    return [...ALL_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, []);

  const options = useMemo(() => {
    const REQUIRED_CONTENT_TYPES = [
      "Opinión",
      "Noticias",
      "Divulgación / información",
    ];
    const REQUIRED_MAIN_THEMES = [
      "Economía",
      "Finanzas",
      "Política",
      "Inversiones",
    ];
    const REQUIRED_REGION_GEOS = [
      "Latinoamérica",
      "Brasil",
      "México",
      "Colombia",
      "Cono Sur",
      "USA",
      "China",
      "Asia",
      "América del Sur",
    ];
    const REQUIRED_SECTORS = [
      "Tecnología",
      "Telecomunicaciones",
      "Energía",
      "Salud",
      "Consumo básico",
      "Consumo discrecional",
      "Materia prima",
      "Industria",
      "Servicios públicos",
      "Inmobiliario",
      "Construcción",
      "Finanzas",
      "Otros",
    ];

    const mergeRequired = (required, available) => {
      const merged = Array.from(new Set([...required, ...available]));
      return merged.filter(Boolean);
    };

    return {
      authors: uniqSorted(sortedPosts.map((p) => p.author)),
      contentTypes: mergeRequired(REQUIRED_CONTENT_TYPES, uniqSorted(sortedPosts.map((p) => p.contentType))),
      mainThemes: mergeRequired(REQUIRED_MAIN_THEMES, uniqSorted(sortedPosts.map((p) => p.mainTheme))),
      regionGeos: mergeRequired(REQUIRED_REGION_GEOS, uniqSorted(sortedPosts.map((p) => p.regionGeo))),
      sectors: mergeRequired(REQUIRED_SECTORS, uniqSorted(sortedPosts.map((p) => p.sector))),
    };
  }, [sortedPosts]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortedPosts.filter((p) => {
      if (q) {
        const haystack = `${p.title ?? ""} ${p.excerpt ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (contentType && p.contentType !== contentType) return false;
      if (mainTheme && p.mainTheme !== mainTheme) return false;
      if (regionGeo && p.regionGeo !== regionGeo) return false;
      if (sector && p.sector !== sector) return false;
      if (author && p.author !== author) return false;
      if (!matchesDateFrom(p.date, dateFrom)) return false;
      return true;
    });
  }, [sortedPosts, query, contentType, mainTheme, regionGeo, sector, dateFrom, author]);

  const handleReset = () => {
    setQuery("");
    setContentType("");
    setMainTheme("");
    setRegionGeo("");
    setSector("");
    setDateFrom("");
    setAuthor("");
  };

  return (
    <main className="se-blog" role="main">
      <section className="se-section">
        <div className="se-container">
          <div className="se-page-head">
            <h1 className="se-heading-section">Artículos</h1>
            <p className="se-text-body">
              Explorador editorial: filtra por tipo de contenido, tema principal, región, sector, fecha y autor para encontrar lecturas con criterio.
            </p>
          </div>
        </div>

        <div className="se-container">
          <div className="se-articles-layout">
            <ArticleFilters
              query={query}
              onQueryChange={setQuery}
              contentType={contentType}
              onContentTypeChange={setContentType}
              mainTheme={mainTheme}
              onMainThemeChange={setMainTheme}
              regionGeo={regionGeo}
              onRegionGeoChange={setRegionGeo}
              sector={sector}
              onSectorChange={setSector}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              author={author}
              onAuthorChange={setAuthor}
              authors={options.authors}
              contentTypes={options.contentTypes}
              mainThemes={options.mainThemes}
              regionGeos={options.regionGeos}
              sectors={options.sectors}
              onReset={handleReset}
            />

            <section className="se-articles-results" aria-label="Resultados">
              <div className="se-articles-results__meta">
                <span className="se-meta se-meta--category">
                  {filteredPosts.length} artículos
                </span>
              </div>

              <div className="se-articles-grid">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    slug={post.slug}
                    category={post.category}
                    title={post.title}
                    excerpt={post.excerpt}
                    date={post.date}
                    readTime={post.readTime}
                    imagePlaceholder={post.imagePlaceholder}
                    imageUrl={post.imageUrl}
                    author={post.author}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

