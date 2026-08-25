import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { applyPageMeta } from "../lib/seo";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import {
  ArticleCardGrid,
  ContentExplorer,
  EditorialList,
  InterviewGrid,
  ListingPagination,
  NewsList,
  ReportGrid,
} from "../components/home";
import { FORMATO_META, FORMATO_POR_RUTA } from "../lib/pieza";
import { useContentFilter } from "../hooks/useContentFilter";
import { usePagedList } from "../hooks/usePagedList";
import { usePieces } from "../hooks/usePieces";
import { useTaxonomy } from "../hooks/useTaxonomy";
import { useDelayedFlag } from "../hooks/useDelayedFlag";

/**
 * Listing page for one content format.
 *
 * The header menu points every format here through `?formato=`. A missing param
 * means Artículos, matching the menu entry that has no param.
 *
 * The two explorer axes narrow *within* the format — a format page never leaves its
 * format. Cross-format results come from `/explorar` instead.
 */

const LAYOUTS = {
  noticia: (items) => <NewsList items={items} />,
  articulo: (items) => <ArticleCardGrid items={items} />,
  editorial: (items) => <EditorialList items={items} />,
  entrevista: (items) => <InterviewGrid items={items} />,
  informe: (items) => <ReportGrid items={items} />,
};

/**
 * One format's view, mounted fresh for each format.
 *
 * Split out of the page so the parent can key it on the format. All five formats
 * share the single `/articulos` route, so switching between them from the menu only
 * changes the query string: React keeps this subtree mounted and reuses the DOM
 * nodes. That had two consequences worth naming, both fixed by the key — the entry
 * animation never replayed, because a CSS animation only starts when its element is
 * created; and the filter selection carried over, so a topic chosen under Noticias
 * silently followed the reader into Editorial.
 */
export const FormatListing = ({ formatoApi }) => {
  const meta = FORMATO_META[formatoApi];
  const taxonomy = useTaxonomy();
  const { items: pieces, status, error, truncated } = usePieces({ format: formatoApi });

  const tree = {
    geoTop: taxonomy.geoTop,
    regiones: taxonomy.regiones,
    ancestros: taxonomy.ancestros,
  };
  const { temas, geos, query, results, setSelection, setQuery, isFiltered } =
    useContentFilter(pieces, tree);

  const listingRef = useRef(null);
  const { page, totalPages, visible, goTo, resetPage, from, to, total } = usePagedList(
    results,
    meta.porPagina,
    { scrollTo: listingRef }
  );

  // Every format shares the `/articulos` path, so the app's ScrollToTop — which
  // watches the pathname — never fires when the reader moves between them. This
  // subtree is keyed by format, so its mount *is* "a new view was entered", and a
  // new view starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Page four of the old result set means nothing in the new one, so any change to
  // the filters sends the reader back to the first page.
  const handleSelection = useCallback(
    (next) => {
      setSelection(next);
      resetPage();
    },
    [setSelection, resetPage]
  );

  const handleQuery = useCallback(
    (next) => {
      setQuery(next);
      resetPage();
    },
    [setQuery, resetPage]
  );

  const formato = taxonomy.formats.find((f) => f.slug === formatoApi);
  const titulo = formato?.name_plural ?? meta.plural;
  // Only announced when the wait is long enough to be worth announcing.
  const cargando = useDelayedFlag(status === "loading");

  return (
    <section className="se-section se-articles__hero" aria-label={titulo}>
      <div className="se-container">
        <div className="se-articles__head">
          <p className="se-articles__kicker">{titulo}</p>
          <h1 className="se-articles__title">{titulo}</h1>
          {formato?.lede ? (
            <p className="se-text-body se-articles__lead">{formato.lede}</p>
          ) : null}
        </div>
      </div>

      <div className="se-container">
        {status === "error" ? (
          <ErrorState title="No se pudo cargar esta sección" error={error} />
        ) : null}

        {cargando ? <LoadingState title={`Cargando ${titulo.toLowerCase()}…`} /> : null}

        {status === "success" ? (
          <>
            {/* The filters only mean something once the geography tree has loaded,
                and they are only worth showing when there is something to narrow. */}
            {taxonomy.ready && pieces.length ? (
              <ContentExplorer
                pieces={pieces}
                temasDisponibles={taxonomy.topics.map((t) => t.name)}
                geoTop={taxonomy.geoTop}
                continentes={taxonomy.continentes}
                regiones={taxonomy.regiones}
                ancestros={taxonomy.ancestros}
                temas={temas}
                geos={geos}
                query={query}
                onChange={handleSelection}
                onQueryChange={handleQuery}
                total={results.length}
                scopeLabel={`en ${titulo}`}
              />
            ) : null}

            <div className="se-listing" ref={listingRef}>
              {visible.length ? (
                LAYOUTS[formatoApi](visible)
              ) : (
                <EmptyState
                  title={isFiltered ? "Sin resultados" : `Todavía no hay ${titulo.toLowerCase()}`}
                  description={
                    isFiltered
                      ? "Ningún contenido de esta sección coincide con los filtros. Quite alguno para ampliar la búsqueda."
                      : "Cuando la redacción publique en esta sección, aparecerá aquí."
                  }
                />
              )}
            </div>

            {truncated ? (
              <p className="se-text-body se-listing__note">
                Se están mostrando las piezas más recientes de esta sección.
              </p>
            ) : null}

            <ListingPagination
              page={page}
              totalPages={totalPages}
              from={from}
              to={to}
              total={total}
              unit={titulo.toLowerCase()}
              onPageChange={goTo}
            />
          </>
        ) : null}
      </div>
    </section>
  );
};

FormatListing.propTypes = {
  formatoApi: PropTypes.oneOf(Object.keys(FORMATO_META)).isRequired,
};

export const Articulos = () => {
  const [searchParams] = useSearchParams();

  // An unknown slug falls back to Artículos rather than rendering an error — a
  // stale link should still land the reader somewhere useful.
  const formatoApi = FORMATO_POR_RUTA[searchParams.get("formato") ?? ""] ?? "articulo";
  const meta = FORMATO_META[formatoApi];

  useEffect(() => {
    applyPageMeta({
      title: `${meta.plural} — ${BRAND.name}`,
      description: `${meta.plural} de ${BRAND.name}.`,
    });
  }, [meta]);

  return (
    <main className="se-blog se-articles" role="main">
      <FormatListing formatoApi={formatoApi} key={formatoApi} />
    </main>
  );
};
