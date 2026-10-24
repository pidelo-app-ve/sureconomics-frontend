import { Fragment, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useNavegar } from "../components/Enlace";
import { NewsletterBlock } from "../components/blog";
import { BRAND, PARTNERS } from "../data/surEconomicsMock";
import { PartnersLogoCloud } from "../components/institutional/PartnersLogoCloud";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import { PrimeraPlana, elegirApertura } from "../components/home/PrimeraPlana";
import { PausaPortada } from "../components/home/PausaPortada";
import { AudiovisualGrid } from "../components/home/AudiovisualGrid";
import { ArticleCardGrid, ContentExplorer, EditorialList, FormatSection, InterviewGrid, MasLeido, MINIMO_MAS_LEIDAS, NoticiasDensas, PodcastGrid, ReportGrid } from "../components/home";
import { FORMATO_META, nombreDeFormato, nombreTraducido, rutaDeFormato } from "../lib/pieza";
import { useContentFilter } from "../hooks/useContentFilter";
import { useMasLeidas } from "../hooks/useMasLeidas";
import { usePieces } from "../hooks/usePieces";
import { useTaxonomy } from "../hooks/useTaxonomy";
import { ESPACIOS } from "../services/publicidadService";
import { ESPACIOS_DE_SITIO, FilaDeAnuncio, useEspacios } from "../components/publicidad";

/**
 * Homepage.
 *
 * El orden lo cambio el socio: primero el filtro, pegado al navbar, porque es la
 * entrada al sitio; despues noticias, que ocupa el lugar donde estaba el hero; y
 * detras la editorial del dia.
 *
 * Arriba va la primera plana (`PrimeraPlana`), como un diario financiero: Última
 * hora, la noticia que manda y, a la derecha, la editorial del día, dos análisis y las
 * monedas. La principal la fija la redaccion desde el editor por un tiempo («Abrir la
 * portada con esta pieza») o, si no hay nada fijado, es la noticia mas reciente.
 *
 * El filtro no esta siempre a la vista: lo abre la lupa de la
 * cabecera (`?buscar=1`) y cuelga del mastil, en su sitio de siempre. La redaccion
 * pidio «solo el icono»: bajo el mastil lo primero es la noticia. Al cerrarlo (la
 * lupa otra vez, o «atras») la seleccion se limpia, porque un filtro puesto con el
 * explorador escondido seria una portada recortada sin que se vea por que.
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

/** Lo que tarda el cajón del buscador en cerrarse: `se-cajon-cierra` en el CSS. */
const CIERRE_CAJON_MS = 200;

/** Cuántos análisis con firma lleva la columna de opinión de la primera plana. */
const ANALISIS_EN_PLANA = 2;

/**
 * How many pieces each block shows when nothing is filtered.
 *
 * `editorial` en 3 y no en 2: la rejilla tiene tres columnas, asi que con dos tarjetas
 * quedaba un hueco a la derecha -- y con una de las dos repitiendo la editorial del dia,
 * el lector veia **una sola** editorial nueva de las diez publicadas.
 */
const PREVIEW = {
  // Once: la primera manda a todo el ancho y las otras diez van
  // en dos columnas parejas de cinco (con diez quedaba una nota suelta abajo).
  noticia: 11,
  // Cuatro: con el contenedor a 1440 caben cuatro columnas, y con
  // tres quedaba un hueco a la derecha. Donde caben tres, la cuarta se oculta (CSS).
  articulo: 4,
  editorial: 4,
  entrevista: 3,
  informe: 2,
  podcast: 3,
};

/* Las dos rejillas de tarjetas de la portada llevan dentro su tarjeta nativa. Los
   demas formatos no: editorial es una lista, y entrevista, informe y podcast tienen
   retícula propia -- meter ahi una tarjeta de anuncio obligaria a un pintor por
   formato para que no desentonara, y la portada acabaria siendo mas anuncio que
   portada. Con dos basta. */
const LAYOUTS = {
  // Noticias con el carril de «Lo más leído» al lado, si hay datos para él.
  noticia: (items, { carril } = {}) => (
    <NoticiasDensas
      items={items}
      espacioDeAnuncio={ESPACIOS.PORTADA_NATIVO}
      carril={carril}
    />
  ),
  articulo: (items) => (
    <ArticleCardGrid
      items={items}
      espacioDeAnuncio={ESPACIOS.PORTADA_NATIVO_ARTICULOS}
      columnas={4}
    />
  ),
  editorial: (items) => <EditorialList items={items} />,
  entrevista: (items) => <InterviewGrid items={items} />,
  informe: (items) => <ReportGrid items={items} />,
  podcast: (items) => <PodcastGrid items={items} />,
  // Entrevistas y podcast juntos (ver `AL_PUNTO`), con la tarjeta de /audiovisual.
  alpunto: (items) => <AudiovisualGrid items={items} />,
};

/**
 * «Al punto» en la portada: Entrevistas y Podcast en una sola sección,
 * las cuatro piezas más recientes de los dos formatos, intercaladas. Eran dos
 * bloques seguidos de tres tarjetas oscuras y alargaban el final. Con un filtro puesto
 * vuelven a ir por separado: ahí son resultados de búsqueda, agrupados por formato.
 */
const AL_PUNTO = { formatos: ["entrevista", "podcast"], cuantas: 4 };

export const Home = () => {
  const { t, lang } = useIdioma();
  const taxonomy = useTaxonomy();
  const { items: pieces, status, error } = usePieces();

  const tree = {
    geoTop: taxonomy.geoTop,
    regiones: taxonomy.regiones,
    ancestros: taxonomy.ancestros,
  };
  const { temas, geos, query, results, setSelection, setQuery, reset, isFiltered } =
    useContentFilter(pieces, tree);
  const masLeidas = useMasLeidas();

  // El explorador solo se pinta con `?buscar=1` en la URL (la lupa de la cabecera).
  //
  // El cajón se abre y se cierra con animación. La URL manda, pero al cerrar el cajón
  // sigue pintado `CIERRE_CAJON_MS` más -- el tiempo de `se-cajon-cierra` -- y solo
  // entonces se quita y se limpia la selección. Sin esto desaparecía de golpe, y si
  // había un filtro puesto la portada saltaba de los resultados a todo en el mismo
  // cuadro. Escape lo cierra, y el foco vuelve a la lupa si estaba dentro.
  const [parametros] = useSearchParams();
  const ubicacion = useLocation();
  const navegar = useNavegar();
  // El foco entra en el campo solo si el lector pulsó la lupa; no al cargar un enlace
  // compartido con `?buscar=1`, que dejaría el foco antes de la cabecera.
  const desdeLaLupa = Boolean(ubicacion.state?.desdeLaLupa);
  const buscadorAbierto = parametros.get("buscar") === "1";
  const [cajon, setCajon] = useState(buscadorAbierto ? "abierto" : "cerrado");
  // Cuántas veces se ha abierto: la clave del explorador, para que vuelva a montarse (y
  // a enfocar el campo) al reabrir aunque el cierre anterior no hubiera terminado.
  const [aperturas, setAperturas] = useState(0);
  const cajonRef = useRef(null);
  useEffect(() => {
    if (buscadorAbierto) {
      setCajon("abierto");
      setAperturas((n) => n + 1);
      return undefined;
    }
    setCajon((estado) => (estado === "abierto" ? "cerrando" : estado));
    const id = setTimeout(() => {
      const teniaElFoco = cajonRef.current?.contains(document.activeElement);
      setCajon("cerrado");
      reset();
      // La lupa que se ve: hay dos (barra y cajón del menú) y la primera puede estar oculta.
      if (teniaElFoco) {
        [...document.querySelectorAll(".se-header__buscar")].find((b) => b.offsetParent)?.focus();
      }
    }, CIERRE_CAJON_MS);
    return () => clearTimeout(id);
  }, [buscadorAbierto, reset]);
  // `replace`: cerrar no es una página más, y «atrás» no tiene que volver a abrirlo.
  const cerrarBuscador = () => navegar("/", { replace: true });
  useEffect(() => {
    if (!buscadorAbierto) return undefined;
    const alTeclear = (e) => {
      // Si Escape ya cerró un desplegable del explorador, no cierra también el cajón.
      // En `window` y no en `document`: así este oyente va después del del explorador
      // y ve su `preventDefault`.
      if (e.key === "Escape" && !e.defaultPrevented) cerrarBuscador();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
    // `cerrarBuscador` cambia con `navegar`, que es estable mientras no cambie el idioma.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscadorAbierto]);

  // La apertura: la pieza que manda y su columna. Sale de la lista sin filtrar; pero
  // con un filtro puesto se retira, porque entonces el lector está buscando y lo que
  // pide es lo que coincide, no la portada del día. Se le pasa la lista entera y no
  // sólo las noticias: la redacción puede fijar como apertura una pieza de cualquier
  // formato (`enPortada`), y `elegirApertura` la busca entre todas.
  const apertura = isFiltered
    ? { principal: null, secundarias: [], fijada: false }
    : elegirApertura(pieces);
  const enApertura = new Set(
    [apertura.principal, ...apertura.secundarias].filter(Boolean).map((p) => p.id)
  );

  // Los análisis de la columna de opinión: los artículos más recientes que no están ya
  // arriba. Solo sin filtro, como la primera plana entera.
  const analisis = isFiltered
    ? []
    : pieces.filter((p) => p.formatoApi === "articulo" && !enApertura.has(p.id)).slice(0, ANALISIS_EN_PLANA);
  const enOpinion = new Set(analisis.map((p) => p.id));

  // La editorial más reciente, para la columna de opinión de la primera plana. Si es
  // la que está fijada como principal, pasa a la siguiente: la misma pieza dos veces
  // en la primera pantalla no es énfasis, es un error.
  const editorialDelDia =
    pieces.find((p) => p.formatoApi === "editorial" && !enApertura.has(p.id)) ?? null;

  useMetaPagina({
    title: t("portada.meta.titulo", { marca: BRAND.name }),
    description: t("marca.descripcion"),
  });

  const blocks = Object.keys(FORMATO_META)
    .map((formatoApi) => {
      const all = results.filter((p) => p.formatoApi === formatoApi);

      // La editorial del dia ya esta puesta arriba, a lo ancho y con su propio
      // encabezado. Sin quitarla de aqui salia otra vez en la primera tarjeta del
      // bloque -- las dos son "la mas reciente", asi que la repeticion era segura, no
      // casual. Se quita tambien cuando hay filtro, porque el bloque de arriba se pinta
      // igual: esta en pantalla de las dos maneras.
      // Lo mismo con lo que está en la apertura: ya está arriba, en grande. Se mira en
      // todos los formatos y no sólo en noticias, porque la pieza fijada puede ser una
      // entrevista o un informe, y sin esto abriría también su propio bloque.
      // Y los análisis de la columna de opinión de arriba, por lo mismo.
      const sinApertura = all.filter((p) => !enApertura.has(p.id) && !enOpinion.has(p.id));
      const visibles =
        formatoApi === "editorial" && editorialDelDia && !isFiltered
          ? sinApertura.filter((p) => p.id !== editorialDelDia.id)
          : sinApertura;

      const items = isFiltered ? visibles : visibles.slice(0, PREVIEW[formatoApi]);

      // `total` cuenta `all` y no `visibles`: es la cifra del enlace "Ver los N", y la
      // editorial de arriba tambien esta en esa lista. Restarla ahi seria mentir sobre
      // cuantas hay.
      return { formatoApi, items, total: all.length };
    })
    .filter((b) => b.items.length > 0)
    .reduce((acc, b) => {
      if (isFiltered || !AL_PUNTO.formatos.includes(b.formatoApi)) return [...acc, b];
      const previo = acc.find((x) => x.formatoApi === "alpunto");
      if (previo) {
        // Intercaladas y no por fecha: por fecha salían tres episodios de podcast y
        // ninguna entrevista, y la sección se llama «Al punto» por las dos.
        const [x, y] = [previo.items, b.items];
        const mezcla = [];
        for (let k = 0; k < Math.max(x.length, y.length); k += 1) {
          if (x[k]) mezcla.push(x[k]);
          if (y[k]) mezcla.push(y[k]);
        }
        previo.items = mezcla.slice(0, AL_PUNTO.cuantas);
        previo.total += b.total;
        return acc;
      }
      return [...acc, { formatoApi: "alpunto", items: b.items.slice(0, AL_PUNTO.cuantas), total: b.total }];
    }, []);

  // El nombre que la redacción puso en el panel manda en español; en inglés sale el
  // del diccionario, porque el panel sólo guarda el nombre en español.
  const nombrePlural = (formatoApi) =>
    (lang === "es" && taxonomy.formats.find((f) => f.slug === formatoApi)?.name_plural) ||
    nombreDeFormato(formatoApi);

  // Los huecos de la portada, declarados de una vez: el sorteo necesita ver la
  // pagina entera para no repetir anunciante entre el banner y la tarjeta.
  //
  // **Sin esperar al contenido, y a proposito.** Aqui el contexto es la constante
  // `portada`: no sale de la pieza ni de sus temas, asi que no hay nada que esperar.
  // Con `listo` puesto, la peticion de publicidad no arrancaba hasta que terminaba la
  // del contenido -- dos viajes en fila en vez de dos en paralelo -- y el anuncio
  // aparecia notablemente despues que la pagina.
  //
  // No hay riesgo de facturar de mas: la impresion no se cuenta al entregar sino
  // cuando el navegador avisa de que la pieza aparecio de verdad en pantalla
  // (`POST /publicidad/visto`). Pedir antes no cuenta nada antes.
  //
  // Las vistas cuyo contexto SI depende del contenido -- una pieza y sus temas, un
  // listado y su filtro -- siguen esperando, porque ahi pedir pronto seria pedir con
  // el contexto equivocado.
  //
  // El bloque del boletin (`ESPACIOS.BOLETIN`) lo pinta esta misma vista, asi que su
  // hueco se pide aqui: es la pagina la que declara, no el componente.
  useEspacios({
    espacios: [...ESPACIOS_DE_SITIO, ESPACIOS.PORTADA_BANNER, ESPACIOS.PORTADA_NATIVO, ESPACIOS.PORTADA_NATIVO_ARTICULOS, ESPACIOS.BOLETIN],
    contexto: { seccion: "portada" },
  });

  // La editorial va detras de noticias. Si el filtro dejo la portada sin bloque de
  // noticias, va delante de todo: no puede caerse de la pagina por un filtro.
  const hayNoticias = blocks.some((b) => b.formatoApi === "noticia");
  const hayEditorial = blocks.some((b) => b.formatoApi === "editorial");

  // Mientras llega el contenido -- y el arbol de temas, sin el cual el filtro de arriba
  // no se pinta -- la portada guarda una pantalla de alto. Antes no dibujaba nada: el
  // boletin, los aliados y el pie subian hasta la cabecera y bajaban de golpe al
  // llegar las piezas. Medido, un CLS de 0,9, casi todo de ese salto.
  const cargando =
    status === "loading" ||
    (status === "success" && pieces.length > 0 && taxonomy.status === "loading");

  // El béisbol y los juegos, discretos: solo sin filtro (quien busca algo concreto no
  // vino a jugar), y en el teléfono plegados.
  const pausa =
    !cargando && status === "success" && pieces.length && !isFiltered ? <PausaPortada /> : null;

  return (
    <main className="se-blog se-portada" role="main">
      {/* El encabezado de la pagina, sin verse. El logotipo grande se fue con el
          hero y con el el unico `h1`; una portada sin encabezado deja a los
          buscadores y a los lectores de pantalla sin saber que pagina es esta. */}
      <h1 className="se-sr-only">{t("portada.inicio.encabezado", { marca: BRAND.name })}</h1>

      {cargando ? (
        <section className="se-section se-portada-cargando" aria-busy="true">
          <div className="se-container">
            <LoadingState title={t("portada.inicio.cargando")} />
          </div>
        </section>
      ) : null}

      {status === "error" ? (
        <section className="se-section">
          <div className="se-container">
            <ErrorState title={t("portada.inicio.noSePudoCargar")} error={error} />
          </div>
        </section>
      ) : null}

      {/* El filtro, pegado al navbar, solo cuando la lupa lo abre. Nada que explorar
          antes de que haya algo publicado, y una barra de filtros vacia el dia del
          lanzamiento se lee como un control roto y no como uno honesto. */}
      {cajon !== "cerrado" && !cargando && status === "success" && taxonomy.ready && pieces.length ? (
        <section
          ref={cajonRef}
          className={`se-section se-explorer-section se-explorer-section--primera${
            cajon === "cerrando" ? " se-explorer-section--cierra" : ""
          }`}
          aria-label={t("portada.inicio.explorarContenido")}
        >
          <div className="se-container se-explorer-section__marco">
            {/* `nombreTraducido` y no `name`: las piezas ya traen sus temas traducidos
                (`piezaFromApi`), y las opciones tienen que decir lo mismo que ellas
                para que las cuentas casen. */}
            <ContentExplorer
              pieces={pieces}
              temasDisponibles={taxonomy.topics.map((tema) => nombreTraducido(tema))}
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
              scopeLabel={t("portada.inicio.enTodoElSitio")}
              enfocarAlMontar={desdeLaLupa}
              key={aperturas}
            />
            <button
              type="button"
              className="se-explorer-section__cerrar"
              onClick={cerrarBuscador}
              aria-label={t("nav.cerrarBuscador")}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                <path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </section>
      ) : null}

      {status === "success" && !pieces.length ? (
        <section className="se-section">
          <div className="se-container">
            <EmptyState
              title={t("portada.inicio.nadaPublicado")}
              description={t("portada.inicio.nadaPublicadoTexto")}
            />
          </div>
        </section>
      ) : null}

      {isFiltered && blocks.length === 0 && pieces.length ? (
        <section className="se-section">
          <div className="se-container">
            <EmptyState
              title={t("comun.sinResultados")}
              description={t("portada.inicio.sinResultadosTexto")}
            />
          </div>
        </section>
      ) : null}

      {cargando ? null : (
        <PrimeraPlana
          principal={apertura.principal}
          secundarias={apertura.secundarias}
          fijada={apertura.fijada}
          editorial={isFiltered ? null : editorialDelDia}
          analisis={analisis}
          recientes={pieces.filter((p) => !enApertura.has(p.id))}
        />
      )}

      {/* Si no hay bloque de noticias, el béisbol y los juegos van aquí, bajo la
          primera plana; si lo hay, van detrás de él. */}
      {hayNoticias ? null : pausa}

      {(cargando ? [] : blocks).map(({ formatoApi, items, total }) => (
        <Fragment key={formatoApi}>
          <FormatSection
            title={formatoApi === "alpunto" ? t("nav.alPunto") : nombrePlural(formatoApi)}
            to={formatoApi === "alpunto" ? "/audiovisual" : rutaDeFormato(formatoApi)}
            linkLabel={isFiltered ? t("portada.inicio.verLos", { n: total }) : t("comun.verTodas")}
          >
            {LAYOUTS[formatoApi](items, { carril: masLeidas.piezas.length >= MINIMO_MAS_LEIDAS ? <MasLeido piezas={masLeidas.piezas} /> : null })}
          </FormatSection>
          {/* La franja nativa ancha que iba aqui se movio **dentro** de la rejilla
              -- ver LAYOUTS. Iba detras de las noticias, a lo ancho del contenedor,
              y el cliente pidio lo que decia la maqueta: misma retícula que una
              pieza. Una franja ancha entre dos bloques parte la pagina en dos; una
              tarjeta en la rejilla ocupa el hueco que ya habia. */}
          {/* El béisbol y los juegos, detrás de las noticias: un juego delante hacía
              que el sitio pareciera de juegos antes que de prensa. */}
          {formatoApi === "noticia" ? pausa : null}
          {/* La banda grande, detrás de Editorial (o de Artículos si no hay
              Editorial): detrás de Artículos, que ya lleva su ficha, eran dos anuncios
              en la misma pantalla. */}
          {formatoApi === (hayEditorial ? "editorial" : "articulo") ? (
            <FilaDeAnuncio espacio={ESPACIOS.PORTADA_BANNER} />
          ) : null}
        </Fragment>
      ))}

      <NewsletterBlock />
      <PartnersLogoCloud partners={PARTNERS} />
    </main>
  );
};
