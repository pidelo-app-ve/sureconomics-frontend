import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import {
  ArticleCardGrid,
  ContentExplorer,
  EditorialList,
  FormatSection,
  InterviewGrid,
  NewsList,
  PodcastGrid,
  ReportGrid,
} from "../components/home";
import { FORMATO_META, nombreDeFormato, nombreTraducido, rutaDeFormato } from "../lib/pieza";
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
  podcast: (items) => <PodcastGrid items={items} />,
};

export const Explorar = () => {
  const { t, lang } = useIdioma();
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
    const union = t("listados.explorar.union");
    const partes = [];
    if (temas.size) partes.push([...temas].join(union));
    if (geos.size) partes.push(t("listados.explorar.enLugar", { lugares: [...geos].join(union) }));
    return partes.length ? partes.join(" · ") : t("listados.explorar.todoElContenido");
  }, [temas, geos, t]);

  useMetaPagina({
    title: t("listados.explorar.meta.titulo", { titulo, marca: BRAND.name }),
    description: t("listados.explorar.meta.descripcion", { marca: BRAND.name, titulo: titulo.toLowerCase() }),
  });

  const isFiltered = temas.size > 0 || geos.size > 0 || query.trim().length > 0;
  const cargando = useDelayedFlag(status === "loading");

  // En español manda el nombre que la redacción puso en el panel; en inglés, el del
  // diccionario, que es el único que existe en ese idioma.
  const nombrePlural = (formatoApi) =>
    (lang === "es" && taxonomy.formats.find((f) => f.slug === formatoApi)?.name_plural) ||
    nombreDeFormato(formatoApi);

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
            <p className="se-articles__kicker">{t("listados.explorar.kicker")}</p>
            <h1 className="se-articles__title">{titulo}</h1>
            {status === "success" ? (
              <p className="se-text-body se-articles__lead">
                {t("listados.explorar.conteo", { n: results.length })}
              </p>
            ) : null}
          </div>
        </div>

        {status === "success" && taxonomy.ready && pieces.length ? (
          <div className="se-container">
            <ContentExplorer
              pieces={pieces}
              // `nombreTraducido` y no `name`: las piezas ya traen sus temas en el
              // idioma de la página, y las opciones tienen que casar con ellos.
              temasDisponibles={taxonomy.topics.map((tema) => nombreTraducido(tema))}
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
              scopeLabel={t("listados.explorar.alcance")}
            />
          </div>
        ) : null}
      </section>

      {status === "error" ? (
        <section className="se-section">
          <div className="se-container">
            <ErrorState title={t("listados.explorar.errorCarga")} error={error} />
          </div>
        </section>
      ) : null}

      {cargando ? (
        <section className="se-section">
          <div className="se-container">
            <LoadingState title={t("listados.explorar.buscando")} />
          </div>
        </section>
      ) : null}

      {status === "success" && grupos.length === 0 ? (
        <section className="se-section">
          <div className="se-container">
            <EmptyState
              title={isFiltered ? t("comun.sinResultados") : t("listados.explorar.vacioTitulo")}
              description={
                isFiltered
                  ? t("listados.explorar.sinResultadosTexto")
                  : t("listados.explorar.vacioTexto")
              }
            />
          </div>
        </section>
      ) : null}

      {grupos.map(({ formatoApi, items, total }) => (
        <FormatSection
          key={formatoApi}
          title={`${nombrePlural(formatoApi)} (${total})`}
          to={rutaDeFormato(formatoApi)}
          linkLabel={
            total > items.length
              ? t("listados.explorar.verLasN", { n: total })
              : t("listados.explorar.verSeccion")
          }
        >
          {LAYOUTS[formatoApi](items)}
        </FormatSection>
      ))}
    </main>
  );
};
