import { useCallback, useEffect, useRef } from "react";
import { BRAND } from "../data/surEconomicsMock";
import { applyPageMeta } from "../lib/seo";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import { ContentExplorer, EducativoGrid, ListingPagination } from "../components/home";
import { usePieces } from "../hooks/usePieces";
import { useContentFilter } from "../hooks/useContentFilter";
import { usePagedList } from "../hooks/usePagedList";
import { useTaxonomy } from "../hooks/useTaxonomy";
import { useDelayedFlag } from "../hooks/useDelayedFlag";

/**
 * Todo el contenido educativo, en una sola lista.
 *
 * Una lista y no bloques por formato, que fue la primera versión: agrupar por formato
 * reproducía la portada -- seis encabezados con una o dos piezas debajo cada uno -- y
 * eso enterraba el punto de la página. Aquí lo que reúne a las piezas es ser
 * educativas; el formato es un dato de cada tarjeta, que es donde se dice.
 *
 * Con el panel de filtros, como las páginas de formato: acota *dentro* de lo educativo
 * por tema, geografía y texto, que es lo que hace recorrible una sección que va a
 * mezclar formatos y años. El filtro vive en estado local y no en la dirección, igual
 * que en las páginas de formato -- a esta vista no llega ningún enlace con una
 * selección hecha; para compartir un recorte está el Explorador.
 */

const TITULO = "Educación";
const POR_PAGINA = 12;

export const Educacion = () => {
  const taxonomy = useTaxonomy();
  // Filtrado en el servidor: la sección cruza los seis formatos, así que traerse el
  // sitio entero para quedarse con una parte sería el camino largo.
  const { items: piezas, status, error } = usePieces({ educational: true });

  const tree = {
    geoTop: taxonomy.geoTop,
    regiones: taxonomy.regiones,
    ancestros: taxonomy.ancestros,
  };
  const { temas, geos, query, results, setSelection, setQuery, isFiltered } =
    useContentFilter(piezas, tree);

  useEffect(() => {
    applyPageMeta({
      title: `${TITULO} — ${BRAND.name}`,
      description: `Contenido educativo de ${BRAND.name}: material para entender cómo funcionan la economía y las finanzas.`,
    });
  }, []);

  const listingRef = useRef(null);
  const { page, totalPages, visible, goTo, resetPage, from, to, total } = usePagedList(
    results,
    POR_PAGINA,
    { scrollTo: listingRef }
  );

  // La página cuatro del resultado anterior no significa nada en el nuevo.
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

  const cargando = useDelayedFlag(status === "loading");

  return (
    <main className="se-blog se-articles" role="main">
      <section className="se-section se-articles__hero" aria-label={TITULO}>
        <div className="se-container">
          <div className="se-articles__head">
            <p className="se-articles__kicker">{TITULO}</p>
            <h1 className="se-articles__title">Contenido educativo</h1>
            <p className="se-text-body se-articles__lead">
              Material para entender cómo funcionan la economía y las finanzas, reunido
              aquí sin importar el formato en que se publicó. Cada pieza lleva su sello y
              sigue apareciendo también en su sección.
            </p>
          </div>
        </div>

        <div className="se-container">
          {status === "error" ? (
            <ErrorState title="No se pudo cargar el contenido educativo" error={error} />
          ) : null}

          {cargando ? <LoadingState title="Cargando contenido educativo…" /> : null}

          {status === "success" ? (
            <>
              {/* Los filtros sólo significan algo una vez cargado el árbol de
                  geografía, y sólo valen la pena cuando hay algo que acotar. */}
              {taxonomy.ready && piezas.length ? (
                <ContentExplorer
                  pieces={piezas}
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
                  scopeLabel="en contenido educativo"
                />
              ) : null}

              <div className="se-listing" ref={listingRef}>
                {visible.length ? (
                  <EducativoGrid items={visible} />
                ) : (
                  <EmptyState
                    title={isFiltered ? "Sin resultados" : "Todavía no hay contenido educativo"}
                    description={
                      isFiltered
                        ? "Ninguna pieza educativa coincide con los filtros. Quite alguno para ampliar la búsqueda."
                        : "Cuando la redacción marque la primera pieza como educativa, aparecerá aquí."
                    }
                  />
                )}
              </div>

              <ListingPagination
                page={page}
                totalPages={totalPages}
                from={from}
                to={to}
                total={total}
                unit="piezas"
                onPageChange={goTo}
              />
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
};
