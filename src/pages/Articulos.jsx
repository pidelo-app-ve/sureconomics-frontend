import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { Redirigir } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import {
  ArticleCardGrid,
  ContentExplorer,
  EditorialList,
  InterviewGrid,
  ListingPagination,
  NewsList,
  PodcastGrid,
  ReportGrid,
} from "../components/home";
import { FORMATO_META, FORMATO_POR_RUTA, nombreDeFormato, nombreTraducido } from "../lib/pieza";
import { useContentFilter } from "../hooks/useContentFilter";
import { usePagedList } from "../hooks/usePagedList";
import { usePieces } from "../hooks/usePieces";
import { useTaxonomy } from "../hooks/useTaxonomy";
import { useDelayedFlag } from "../hooks/useDelayedFlag";
import { ESPACIOS } from "../services/publicidadService";
import {
  ESPACIOS_DE_SITIO,
  EspacioPublicitario,
  useEspacios,
} from "../components/publicidad";

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
  podcast: (items) => <PodcastGrid items={items} />,
};

/**
 * One format's view, mounted fresh for each format.
 *
 * Split out of the page so the parent can key it on the format. All six formats
 * share the single `/articulos` route, so switching between them from the menu only
 * changes the query string: React keeps this subtree mounted and reuses the DOM
 * nodes. That had two consequences worth naming, both fixed by the key — the entry
 * animation never replayed, because a CSS animation only starts when its element is
 * created; and the filter selection carried over, so a topic chosen under Noticias
 * silently followed the reader into Editorial.
 */
export const FormatListing = ({ formatoApi }) => {
  const { t, lang } = useIdioma();
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

  // En español manda el nombre que la redacción puso en el panel (`name_plural`); en
  // inglés, el del diccionario, que es el único que existe en ese idioma.
  const titulo =
    (lang === "es" && taxonomy.formats.find((f) => f.slug === formatoApi)?.name_plural) ||
    nombreDeFormato(formatoApi);
  // Only announced when the wait is long enough to be worth announcing.
  const cargando = useDelayedFlag(status === "loading");

  // El patrocinio de tema/pais (formato C) solo tiene sentido con el filtro puesto:
  // lo que se vende es aparecer delante de quien ya dijo que le interesa ese tema.
  // Por eso los temas y paises del contexto salen de la seleccion y no del listado.
  useEspacios({
    espacios: [...ESPACIOS_DE_SITIO, ESPACIOS.LISTADO_PATROCINIO, ESPACIOS.LISTADO_NATIVO],
    contexto: { seccion: formatoApi, formato: formatoApi, tema: temas, pais: geos },
    listo: status === "success",
  });

  return (
    <section className="se-section se-articles__hero" aria-label={titulo}>
      <div className="se-container">
        <div className="se-articles__head">
          <h1 className="se-articles__title">{titulo}</h1>
        </div>
      </div>

      <div className="se-container">
        {status === "error" ? (
          <ErrorState title={t("listados.listado.errorSeccion")} error={error} />
        ) : null}

        {cargando ? (
          <LoadingState title={t("listados.formato.cargando", { titulo: titulo.toLowerCase() })} />
        ) : null}

        {status === "success" ? (
          <>
            {/* The filters only mean something once the geography tree has loaded,
                and they are only worth showing when there is something to narrow. */}
            {taxonomy.ready && pieces.length ? (
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
                scopeLabel={t("listados.listado.alcance", { ambito: titulo })}
              />
            ) : null}

            {/* Formato C: la franja de patrocinio, en la cabecera del listado ya
                filtrado y **encima** de las piezas, que es donde la maqueta la
                pone. Es la unica pieza publicitaria que va antes del contenido,
                y se lo gana porque es una linea de texto con un logotipo. */}
            <EspacioPublicitario espacio={ESPACIOS.LISTADO_PATROCINIO} />

            <div className="se-listing" ref={listingRef}>
              {/* El nivel que faltaba entre el h1 y los h3 de las tarjetas. */}
              <h2 className="se-sr-only">
                {t("listados.formato.todasLasPiezas", { titulo: titulo.toLowerCase() })}
              </h2>
              {visible.length ? (
                LAYOUTS[formatoApi](visible)
              ) : (
                <EmptyState
                  title={
                    isFiltered
                      ? t("comun.sinResultados")
                      : t("listados.formato.vacioTitulo", { titulo: titulo.toLowerCase() })
                  }
                  description={
                    isFiltered
                      ? t("listados.listado.sinResultadosSeccion")
                      : t("listados.listado.seccionVacia")
                  }
                />
              )}
            </div>

            {/* Formato A: la tarjeta nativa, entre el listado y la paginacion.
                La maqueta la intercala cada seis u ocho piezas; aqui va en una
                fila propia porque el listado lo pinta cada formato a su manera
                -- seis rejillas distintas -- y colarla dentro obligaria a tocar
                las seis para que ninguna se descuadrara. */}
            <EspacioPublicitario espacio={ESPACIOS.LISTADO_NATIVO} variante="lista" />

            {truncated ? (
              <p className="se-text-body se-listing__note">{t("listados.listado.soloRecientes")}</p>
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
  const { t } = useIdioma();
  const [searchParams] = useSearchParams();

  const formato = searchParams.get("formato") ?? "";

  // An unknown slug falls back to Artículos rather than rendering an error — a
  // stale link should still land the reader somewhere useful.
  const formatoApi = FORMATO_POR_RUTA[formato] ?? "articulo";

  // Entrevistas y podcast ya no se listan aquí sino juntos en «Al punto». Los enlaces
  // viejos -- el menú de antes, las piezas compartidas, los buscadores -- siguen
  // llegando a esta dirección, así que se reenvían a la vista que corresponde.
  const reenvia = formato === "podcast" || formato === "entrevistas";

  // Los dos formatos que se van a «Al punto» no ponen título: lo pone su página.
  const nombre = nombreDeFormato(formatoApi);
  useMetaPagina(
    reenvia
      ? {}
      : {
          title: t("listados.formato.meta.titulo", { formato: nombre, marca: BRAND.name }),
          description: t("listados.formato.meta.descripcion", { formato: nombre, marca: BRAND.name }),
        }
  );

  if (reenvia) {
    return (
      <Redirigir
        to={`/audiovisual${formato === "podcast" ? "?ver=podcast" : "?ver=entrevistas"}`}
        replace
      />
    );
  }

  return (
    <main className="se-blog se-articles" role="main">
      <FormatListing formatoApi={formatoApi} key={formatoApi} />
    </main>
  );
};
