import { Fragment, useEffect } from "react";
import { NewsletterBlock } from "../components/blog";
import { BRAND, PARTNERS } from "../data/surEconomicsMock";
import { PartnersLogoCloud } from "../components/institutional/PartnersLogoCloud";
import { applyPageMeta } from "../lib/seo";
import { EmptyState, ErrorState } from "../components/content";
import {
  ArticleCardGrid,
  ContentExplorer,
  EditorialDelDia,
  EditorialList,
  FormatSection,
  InterviewGrid,
  NewsList,
  ReportGrid,
} from "../components/home";
import { FORMATO_META } from "../lib/pieza";
import { useContentFilter } from "../hooks/useContentFilter";
import { usePieces } from "../hooks/usePieces";
import { useTaxonomy } from "../hooks/useTaxonomy";

/**
 * Homepage.
 *
 * El orden lo cambio el socio: primero el filtro, pegado al navbar, porque es la
 * entrada al sitio; despues noticias, que ocupa el lugar donde estaba el hero; y
 * detras la editorial del dia.
 *
 * El hero -- logotipo grande, claim, descripcion y los dos botones -- se queda en
 * `components/blog/Hero.jsx` sin renderizarse, a peticion expresa: "dejalo por ahi,
 * sin verse por ahora". Quien lo devuelva necesita traducirle la forma: espera un
 * `featuredPost` con las claves del mock (title, excerpt, imageUrl, category) y no
 * las de la API (titulo, resumen, imagenUrl); esa traduccion vivia aqui y esta en
 * el historial.
 *
 * El filtro abarca los cinco formatos, asi que una seleccion convierte los bloques
 * de abajo en resultados agrupados -- Noticias primero, luego Articulos, Editorial,
 * Entrevistas e Informes, y los grupos vacios se caen. Sin filtrar, cada bloque
 * muestra su punado mas reciente.
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

export const Home = () => {
  const taxonomy = useTaxonomy();
  const { items: pieces, status, error } = usePieces();

  const tree = {
    geoTop: taxonomy.geoTop,
    regiones: taxonomy.regiones,
    ancestros: taxonomy.ancestros,
  };
  const { temas, geos, query, results, setSelection, setQuery, isFiltered } =
    useContentFilter(pieces, tree);

  // La editorial mas reciente, para el bloque que va detras de noticias. Se lee de
  // la lista sin filtrar a proposito: es la posicion del medio, no un resultado de
  // busqueda, y no tiene que desaparecer porque el lector haya estrechado el filtro.
  const editorialDelDia = pieces.find((p) => p.formatoApi === "editorial") ?? null;

  useEffect(() => {
    applyPageMeta({
      title: `${BRAND.name} — Economía, mercados e inversión`,
      description: BRAND.description,
    });
  }, []);

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

  // La editorial va detras de noticias. Si el filtro dejo la portada sin bloque de
  // noticias, va delante de todo: no puede caerse de la pagina por un filtro.
  const hayNoticias = blocks.some((b) => b.formatoApi === "noticia");

  return (
    <main className="se-blog" role="main">
      {/* El encabezado de la pagina, sin verse. El logotipo grande se fue con el
          hero y con el el unico `h1`; una portada sin encabezado deja a los
          buscadores y a los lectores de pantalla sin saber que pagina es esta. */}
      <h1 className="se-sr-only">
        {BRAND.name} — análisis y perspectiva sobre economía, mercados e inversión en
        América Latina
      </h1>

      {status === "error" ? (
        <section className="se-section">
          <div className="se-container">
            <ErrorState title="No se pudo cargar el contenido" error={error} />
          </div>
        </section>
      ) : null}

      {/* El filtro, lo primero bajo el navbar. Nada que explorar antes de que haya
          algo publicado, y una barra de filtros vacia el dia del lanzamiento se lee
          como un control roto y no como uno honesto. */}
      {status === "success" && taxonomy.ready && pieces.length ? (
        <section
          className="se-section se-explorer-section se-explorer-section--primera"
          aria-label="Explorar contenido"
        >
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

      {hayNoticias ? null : <EditorialDelDia pieza={editorialDelDia} />}

      {blocks.map(({ formatoApi, items, total }) => (
        <Fragment key={formatoApi}>
          <FormatSection
            title={nombrePlural(formatoApi)}
            to={`/articulos?formato=${FORMATO_META[formatoApi].slug}`}
            linkLabel={isFiltered ? `Ver los ${total}` : "Ver todas"}
          >
            {LAYOUTS[formatoApi](items)}
          </FormatSection>
          {formatoApi === "noticia" ? <EditorialDelDia pieza={editorialDelDia} /> : null}
        </Fragment>
      ))}

      <NewsletterBlock />
      <PartnersLogoCloud partners={PARTNERS} />
    </main>
  );
};
