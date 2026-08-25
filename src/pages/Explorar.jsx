import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { applyPageMeta } from "../lib/seo";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import {
  ArticleCardGrid,
  ContentExplorer,
  EditorialList,
  FormatSection,
  InterviewGrid,
  NewsList,
  ReportGrid,
} from "../components/home";
import { FORMATO_META } from "../lib/pieza";
import { applyFilter } from "../lib/contentFilter";
import { usePieces } from "../hooks/usePieces";
import { useTaxonomy } from "../hooks/useTaxonomy";
import { useDelayedFlag } from "../hooks/useDelayedFlag";

/**
 * Cross-format results — the way in that doesn't start by choosing a format.
 *
 * Selection lives in the query string, not in component state, because this is the
 * page every clickable tag on every piece links to. `?tema=` and `?donde=` repeat
 * for multiple values, so a link can carry a whole selection and a reader can share
 * the result they are looking at.
 *
 * Groups appear in a fixed order and empty ones are dropped.
 */

const LAYOUTS = {
  noticia: (items) => <NewsList items={items} />,
  articulo: (items) => <ArticleCardGrid items={items} />,
  editorial: (items) => <EditorialList items={items} />,
  entrevista: (items) => <InterviewGrid items={items} />,
  informe: (items) => <ReportGrid items={items} />,
};

export const Explorar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const taxonomy = useTaxonomy();
  const { items: pieces, status, error } = usePieces();

  const temas = useMemo(() => new Set(searchParams.getAll("tema")), [searchParams]);
  const geos = useMemo(() => new Set(searchParams.getAll("donde")), [searchParams]);
  const query = searchParams.get("q") ?? "";

  const tree = useMemo(
    () => ({
      geoTop: taxonomy.geoTop,
      regiones: taxonomy.regiones,
      ancestros: taxonomy.ancestros,
    }),
    [taxonomy.geoTop, taxonomy.regiones, taxonomy.ancestros]
  );

  const results = useMemo(
    () => applyFilter(pieces, { temas, geos, query, tree }),
    [pieces, temas, geos, query, tree]
  );

  const write = useCallback(
    ({ temas: nextTemas, geos: nextGeos, query: nextQuery }) => {
      const params = new URLSearchParams();
      [...nextTemas].forEach((t) => params.append("tema", t));
      [...nextGeos].forEach((g) => params.append("donde", g));
      if (nextQuery.trim()) params.set("q", nextQuery);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const handleSelection = useCallback((next) => write({ ...next, query }), [write, query]);

  const handleQuery = useCallback(
    (nextQuery) => write({ temas, geos, query: nextQuery }),
    [write, temas, geos]
  );

  // "Energía y Minería · en Venezuela".
  const titulo = useMemo(() => {
    const partes = [];
    if (temas.size) partes.push([...temas].join(" y "));
    if (geos.size) partes.push(`en ${[...geos].join(" y ")}`);
    return partes.length ? partes.join(" · ") : "Todo el contenido";
  }, [temas, geos]);

  useEffect(() => {
    applyPageMeta({
      title: `${titulo} — ${BRAND.name}`,
      description: `Contenido de ${BRAND.name} sobre ${titulo.toLowerCase()}.`,
    });
  }, [titulo]);

  const isFiltered = temas.size > 0 || geos.size > 0 || query.trim().length > 0;
  const cargando = useDelayedFlag(status === "loading");

  const nombrePlural = (formatoApi) =>
    taxonomy.formats.find((f) => f.slug === formatoApi)?.name_plural ??
    FORMATO_META[formatoApi].plural;

  const grupos = Object.keys(FORMATO_META)
    .map((formatoApi) => {
      const todos = results.filter((p) => p.formatoApi === formatoApi);
      // Each group caps at that format's page size and links out for the rest, so
      // one popular topic cannot bury the other four formats below it.
      const tope = FORMATO_META[formatoApi].porPagina;
      return { formatoApi, items: todos.slice(0, tope), total: todos.length };
    })
    .filter((g) => g.items.length > 0);

  return (
    <main className="se-blog se-articles" role="main">
      <section className="se-section se-articles__hero" aria-label={titulo}>
        <div className="se-container">
          <div className="se-articles__head">
            <p className="se-articles__kicker">Explorar</p>
            <h1 className="se-articles__title">{titulo}</h1>
            {status === "success" ? (
              <p className="se-text-body se-articles__lead">
                {results.length} {results.length === 1 ? "pieza" : "piezas"} en los cinco
                formatos, agrupadas.
              </p>
            ) : null}
          </div>
        </div>

        {status === "success" && taxonomy.ready && pieces.length ? (
          <div className="se-container">
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
              scopeLabel="en todo el sitio"
            />
          </div>
        ) : null}
      </section>

      {status === "error" ? (
        <section className="se-section">
          <div className="se-container">
            <ErrorState title="No se pudo cargar el contenido" error={error} />
          </div>
        </section>
      ) : null}

      {cargando ? (
        <section className="se-section">
          <div className="se-container">
            <LoadingState title="Buscando…" />
          </div>
        </section>
      ) : null}

      {status === "success" && grupos.length === 0 ? (
        <section className="se-section">
          <div className="se-container">
            <EmptyState
              title={isFiltered ? "Sin resultados" : "Todavía no hay nada publicado"}
              description={
                isFiltered
                  ? "Ninguna pieza coincide con los filtros. Quite alguno para ampliar la búsqueda."
                  : "Cuando la redacción publique la primera pieza, aparecerá aquí."
              }
            />
          </div>
        </section>
      ) : null}

      {grupos.map(({ formatoApi, items, total }) => (
        <FormatSection
          key={formatoApi}
          title={`${nombrePlural(formatoApi)} (${total})`}
          to={`/articulos?formato=${FORMATO_META[formatoApi].slug}`}
          linkLabel={total > items.length ? `Ver las ${total}` : "Ver toda la sección"}
        >
          {LAYOUTS[formatoApi](items)}
        </FormatSection>
      ))}
    </main>
  );
};
