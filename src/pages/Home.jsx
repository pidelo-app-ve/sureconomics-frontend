import { useEffect } from "react";
import { Hero, NewsletterBlock } from "../components/blog";
import { BRAND, PARTNERS } from "../data/surEconomicsMock";
import { PartnersLogoCloud } from "../components/institutional/PartnersLogoCloud";
import { applyPageMeta } from "../lib/seo";
import { EmptyState, ErrorState } from "../components/content";
import {
  ArticleCardGrid,
  ContentExplorer,
  EditorialList,
  FormatSection,
  InterviewGrid,
  NewsList,
  ReportGrid,
} from "../components/home";
import { FORMATO_META, imagenAncho } from "../lib/pieza";
import { temaPrincipal } from "../lib/contentFilter";
import { useContentFilter } from "../hooks/useContentFilter";
import { usePieces } from "../hooks/usePieces";
import { useTaxonomy } from "../hooks/useTaxonomy";

/**
 * Homepage.
 *
 * Order comes from the functional mockup: ticker, opening piece, the explorer as
 * the second element (it is the main way into the site, not a closing widget), then
 * the five format blocks with equal weight, then newsletter and the group's units.
 *
 * The explorer here spans all five formats, so a selection turns the blocks below
 * into grouped results — Noticias first, then Artículos, Editorial, Entrevistas and
 * Informes, with empty groups dropped. Unfiltered, each block shows its most recent
 * handful.
 */

/** How many pieces each block shows when nothing is filtered. */
const PREVIEW = {
  noticia: 6,
  articulo: 3,
  editorial: 2,
  entrevista: 3,
  informe: 2,
};

const LAYOUTS = {
  noticia: (items) => <NewsList items={items} />,
  articulo: (items) => <ArticleCardGrid items={items} />,
  editorial: (items) => <EditorialList items={items} />,
  entrevista: (items) => <InterviewGrid items={items} />,
  informe: (items) => <ReportGrid items={items} />,
};

/** The `Hero` speaks a different shape; this is the whole translation. */
const aperturaDe = (pieza) =>
  pieza
    ? {
        id: pieza.id,
        slug: pieza.slug,
        title: pieza.titulo,
        excerpt: pieza.resumen || pieza.entrada || "",
        date: pieza.fecha,
        author: pieza.autor ?? "",
        category: temaPrincipal(pieza) ?? "",
        imageUrl: imagenAncho(pieza.imagenUrl, 1600) ?? "",
        imagePlaceholder: "growth",
        readTime: "",
      }
    : null;

export const Home = () => {
  const taxonomy = useTaxonomy();
  const { items: pieces, status, error } = usePieces();

  const tree = { geoTop: taxonomy.geoTop, regiones: taxonomy.regiones };
  const { temas, geos, query, results, setSelection, setQuery, isFiltered } =
    useContentFilter(pieces, tree);

  useEffect(() => {
    applyPageMeta({
      title: `${BRAND.name} — Economía, mercados e inversión`,
      description: BRAND.description,
    });
  }, []);

  // The API returns newest first, so the opening piece is simply the first one.
  const apertura = aperturaDe(pieces[0]);

  const blocks = Object.keys(FORMATO_META)
    .map((formatoApi) => {
      const all = results.filter((p) => p.formatoApi === formatoApi);
      const items = isFiltered ? all : all.slice(0, PREVIEW[formatoApi]);
      return { formatoApi, items, total: all.length };
    })
    .filter((b) => b.items.length > 0);

  const nombrePlural = (formatoApi) =>
    taxonomy.formats.find((f) => f.slug === formatoApi)?.name_plural ??
    FORMATO_META[formatoApi].plural;

  return (
    <main className="se-blog" role="main">
      {/* The hero carries the masthead, so it renders on arrival and its featured
          card fills in when the content does. Gating the whole thing on the fetch
          meant the reader waited for a request to see the name of the outlet. */}
      <Hero featuredPost={apertura} />

      {status === "error" ? (
        <section className="se-section">
          <div className="se-container">
            <ErrorState title="No se pudo cargar el contenido" error={error} />
          </div>
        </section>
      ) : null}

      {/* Nothing to explore before anything is published, and an empty filter bar
          on a launch-day homepage reads as a broken control rather than an
          honest one. */}
      {status === "success" && taxonomy.ready && pieces.length ? (
        <section className="se-section se-explorer-section" aria-label="Explorar contenido">
          <div className="se-container">
            <ContentExplorer
              pieces={pieces}
              temasDisponibles={taxonomy.topics.map((t) => t.name)}
              geoTop={taxonomy.geoTop}
              regiones={taxonomy.regiones}
              temas={temas}
              geos={geos}
              query={query}
              onChange={setSelection}
              onQueryChange={setQuery}
              total={results.length}
              scopeLabel="en todo el sitio"
            />
          </div>
        </section>
      ) : null}

      {status === "success" && !pieces.length ? (
        <section className="se-section">
          <div className="se-container">
            <EmptyState
              title="Todavía no hay nada publicado"
              description="Cuando la redacción publique la primera pieza, aparecerá aquí."
            />
          </div>
        </section>
      ) : null}

      {isFiltered && blocks.length === 0 && pieces.length ? (
        <section className="se-section">
          <div className="se-container">
            <EmptyState
              title="Sin resultados"
              description="Ninguna pieza coincide con los filtros. Quite alguno para ampliar la búsqueda."
            />
          </div>
        </section>
      ) : null}

      {blocks.map(({ formatoApi, items, total }) => (
        <FormatSection
          key={formatoApi}
          title={nombrePlural(formatoApi)}
          to={`/articulos?formato=${FORMATO_META[formatoApi].slug}`}
          linkLabel={isFiltered ? `Ver los ${total}` : "Ver todas"}
        >
          {LAYOUTS[formatoApi](items)}
        </FormatSection>
      ))}

      <NewsletterBlock />
      <PartnersLogoCloud partners={PARTNERS} />
    </main>
  );
};
