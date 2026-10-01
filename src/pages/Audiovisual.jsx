import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { applyPageMeta } from "../lib/seo";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import { ContentExplorer, ListingPagination } from "../components/home";
import { AudiovisualGrid, AudiovisualHero } from "../components/home/AudiovisualGrid";
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
 * «Al punto»: entrevistas y podcast en una sola página.
 *
 * Hasta ahora ninguno de los dos tenía página propia -- el menú los mandaba al
 * listado genérico de `/articulos?formato=` -- y son los dos formatos que se ven o se
 * escuchan en vez de leerse, así que van juntos: quien viene a ver un video está más
 * cerca de escuchar un episodio que de leer un informe.
 *
 * La vista (`?ver=`) va en la dirección y no en el estado, para que «los podcast» sea
 * un enlace que se pueda compartir y poner en el menú. La página (`?pagina=`) ya lo
 * hace por su cuenta a través de `usePagedList`.
 */

/** Las tres vistas del control segmentado, con sus textos. */
const VISTAS = {
  todo: {
    etiqueta: "Todo",
    formatoApi: null,
    lateral: "Últimos episodios",
    lista: "Todo lo publicado",
    unidad: "piezas",
    vacio: "Todavía no hay entrevistas ni podcast",
  },
  entrevistas: {
    etiqueta: "Entrevistas",
    formatoApi: "entrevista",
    lateral: "Más entrevistas",
    lista: "Todas las entrevistas",
    unidad: "entrevistas",
    vacio: "Todavía no hay entrevistas",
  },
  podcast: {
    etiqueta: "Podcast",
    formatoApi: "podcast",
    lateral: "Más episodios",
    lista: "Todos los episodios",
    unidad: "episodios",
    vacio: "Todavía no hay episodios",
  },
};

const PARAM_VISTA = "ver";

/** Doce y no seis: la rejilla es de tres, y con dos formatos mezclados hay el doble. */
const POR_PAGINA = 12;

/** Cuántas piezas caben en la columna de «Lo último» sin pasar el alto del video. */
const EN_LA_COLUMNA = 5;

/** Más reciente primero. Sin fecha va al final: una pieza sin publicar no compite. */
const porFechaDesc = (a, b) => {
  const ta = Date.parse(a.fechaIso ?? "") || 0;
  const tb = Date.parse(b.fechaIso ?? "") || 0;
  return tb - ta;
};

export const Audiovisual = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Un valor desconocido en `?ver=` cae en «Todo»: un enlace viejo tiene que seguir
  // llevando a alguna parte útil.
  const verParam = searchParams.get(PARAM_VISTA) ?? "";
  const ver = VISTAS[verParam] ? verParam : "todo";
  const vista = VISTAS[ver];

  const taxonomy = useTaxonomy();

  // `usePieces` trae un formato; aquí hacen falta dos. Dos peticiones en paralelo y
  // se juntan: es más simple que pedir todo el sitio y tirar cuatro formatos de seis.
  const entrevistas = usePieces({ format: "entrevista" });
  const podcasts = usePieces({ format: "podcast" });

  // La página no está lista hasta que las dos respondan, porque el orden por fecha
  // mezcla las dos listas y un hueco de una se notaría como piezas que aparecen tarde.
  let status = "loading";
  if (entrevistas.status === "error" || podcasts.status === "error") status = "error";
  else if (entrevistas.status === "success" && podcasts.status === "success") status = "success";
  const error = entrevistas.error ?? podcasts.error;
  const truncated = entrevistas.truncated || podcasts.truncated;

  const todas = useMemo(
    () => [...entrevistas.items, ...podcasts.items].sort(porFechaDesc),
    [entrevistas.items, podcasts.items]
  );

  // El alcance de la vista: lo que el filtro cuenta y lo que la rejilla pinta.
  const alcance = useMemo(
    () => (vista.formatoApi ? todas.filter((p) => p.formatoApi === vista.formatoApi) : todas),
    [todas, vista.formatoApi]
  );

  const tree = useMemo(
    () => ({
      geoTop: taxonomy.geoTop,
      regiones: taxonomy.regiones,
      ancestros: taxonomy.ancestros,
    }),
    [taxonomy.geoTop, taxonomy.regiones, taxonomy.ancestros]
  );

  const { temas, geos, query, results, setSelection, setQuery, isFiltered } =
    useContentFilter(alcance, tree);

  // «Lo último» es una posición, no un resultado: la entrevista más reciente en grande
  // y, a su lado, la columna de los últimos episodios del podcast -- como la portada
  // de un diario, con la noticia del día y la lista de lo recién llegado. En la vista
  // de un solo formato la columna sigue a la principal con lo siguiente de ese formato.
  // Con un filtro puesto todo esto se retira: entonces el lector busca, y lo que pide
  // es la lista de lo que coincide, no una portada.
  const { principal, laterales } = useMemo(() => {
    if (isFiltered || !alcance.length) return { principal: null, laterales: [] };
    const primera =
      alcance.find((p) => p.formatoApi === (vista.formatoApi ?? "entrevista")) ?? alcance[0];
    const columna = vista.formatoApi
      ? alcance.filter((p) => p.id !== primera.id)
      : alcance.filter((p) => p.formatoApi === "podcast" && p.id !== primera.id);
    return { principal: primera, laterales: columna.slice(0, EN_LA_COLUMNA) };
  }, [alcance, isFiltered, vista.formatoApi]);

  // Lo que ya está arriba no se repite en la rejilla.
  const resto = useMemo(() => {
    if (!principal) return results;
    const arriba = new Set([principal.id, ...laterales.map((p) => p.id)]);
    return results.filter((p) => !arriba.has(p.id));
  }, [results, principal, laterales]);

  const listingRef = useRef(null);
  const { page, totalPages, visible, goTo, resetPage, from, to, total } = usePagedList(
    resto,
    POR_PAGINA,
    { scrollTo: listingRef }
  );

  useEffect(() => {
    applyPageMeta({
      title: `Al punto — ${BRAND.name}`,
      description: `Las entrevistas en video y los episodios del podcast de ${BRAND.name}, en un solo lugar.`,
    });
  }, []);

  // Cambiar de vista cambia el conjunto, así que la página vuelve a la primera. Se
  // reemplaza la entrada del historial en vez de apilar una: el control es una pestaña,
  // y volver atrás debería salir de la página, no deshacer pestaña a pestaña.
  const cambiarVista = useCallback(
    (clave) => {
      const next = new URLSearchParams(searchParams);
      if (clave === "todo") next.delete(PARAM_VISTA);
      else next.set(PARAM_VISTA, clave);
      next.delete("pagina");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Igual que en los listados por formato: la página cuatro del conjunto anterior no
  // significa nada en el nuevo.
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

  // Sólo se anuncia cuando la espera es lo bastante larga para merecerlo.
  const cargando = useDelayedFlag(status === "loading");

  // Los mismos huecos que un listado por formato, con el mismo criterio: el contexto
  // sale de la vista y de la selección, así que se espera al contenido. Los temas y
  // países van como listas y no como `Set`, que es lo que el servicio sabe leer.
  useEspacios({
    espacios: [...ESPACIOS_DE_SITIO, ESPACIOS.LISTADO_PATROCINIO, ESPACIOS.LISTADO_NATIVO],
    contexto: {
      seccion: "audiovisual",
      formato: vista.formatoApi ?? undefined,
      tema: [...temas],
      pais: [...geos],
    },
    listo: status === "success",
  });

  const tituloLista = isFiltered ? "Resultados" : vista.lista;

  return (
    <main className="se-blog se-articles se-alpunto" role="main">
      <section className="se-section se-articles__hero" aria-labelledby="alpunto-titulo">
        <div className="se-container">
          <div className="se-articles__head">
            <p className="se-articles__kicker">Entrevistas y podcast</p>
            {/* El mismo rótulo que el botón de la cabecera, en grande: el punto rojo de
                grabación titilando delante del nombre. Así la página se reconoce como
                el sitio al que lleva ese botón. */}
            <h1 id="alpunto-titulo" className="se-articles__title se-alpunto__titulo">
              <span className="se-alpunto__rec" aria-hidden="true" />
              AL PUNTO
            </h1>
          </div>

          <div className="se-alpunto__seg" role="group" aria-label="Qué ver">
            {Object.entries(VISTAS).map(([clave, v]) => (
              <button
                key={clave}
                type="button"
                className={`se-alpunto__seg-btn${clave === ver ? " se-alpunto__seg-btn--on" : ""}`}
                aria-pressed={clave === ver}
                onClick={() => cambiarVista(clave)}
              >
                {v.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="se-container">
          {status === "error" ? (
            <ErrorState title="No se pudo cargar esta sección" error={error} />
          ) : null}

          {cargando ? <LoadingState title="Cargando entrevistas y podcast…" /> : null}

          {status === "success" ? (
            <>
              {/* Los filtros sólo significan algo con el árbol geográfico cargado, y
                  sólo vale la pena mostrarlos cuando hay algo que estrechar. */}
              {taxonomy.ready && alcance.length ? (
                <ContentExplorer
                  pieces={alcance}
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
                  scopeLabel={`en ${vista.etiqueta === "Todo" ? "Al punto" : vista.etiqueta}`}
                />
              ) : null}

              {/* Formato C: la franja de patrocinio, encima del contenido, como en
                  los listados por formato. */}
              <EspacioPublicitario espacio={ESPACIOS.LISTADO_PATROCINIO} />

              {principal ? (
                <section className="se-alpunto__ultimo" aria-labelledby="alpunto-ultimo">
                  <h2 id="alpunto-ultimo" className="se-alpunto__h2">
                    Lo último
                  </h2>
                  <AudiovisualHero
                    principal={principal}
                    laterales={laterales}
                    tituloLateral={vista.lateral}
                    // Sólo en «Todo»: en la vista de un formato la rejilla de abajo ya
                    // es esa lista completa.
                    enlaceLateral={
                      vista.formatoApi
                        ? undefined
                        : { to: "/audiovisual?ver=podcast", texto: "Ver todos los episodios" }
                    }
                  />
                </section>
              ) : null}

              <section
                className="se-listing se-alpunto__lista"
                aria-labelledby="alpunto-lista"
                ref={listingRef}
              >
                <h2 id="alpunto-lista" className="se-alpunto__h2">
                  {tituloLista}
                </h2>
                {visible.length ? (
                  <AudiovisualGrid items={visible} />
                ) : principal ? (
                  // Hay hero pero nada más debajo: no es un vacío, es que sólo hay
                  // una pieza de cada.
                  <p className="se-text-body se-listing__note">
                    Por ahora, esto es todo lo publicado.
                  </p>
                ) : (
                  <EmptyState
                    title={isFiltered ? "Sin resultados" : vista.vacio}
                    description={
                      isFiltered
                        ? "Ningún contenido de esta sección coincide con los filtros. Quite alguno para ampliar la búsqueda."
                        : "Cuando la redacción publique en esta sección, aparecerá aquí."
                    }
                  />
                )}
              </section>

              {/* Formato A: la tarjeta nativa, entre la rejilla y la paginación. */}
              <EspacioPublicitario espacio={ESPACIOS.LISTADO_NATIVO} variante="lista" />

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
                unit={vista.unidad}
                onPageChange={goTo}
              />
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
};
