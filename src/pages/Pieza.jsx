import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { Enlace, Redirigir } from "../components/Enlace";
import { sinPrefijo } from "../i18n/motor";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { LoadingState } from "../components/content";
import { ShareButtons } from "../components/content/ShareButtons";
import { BotonDeMarcador } from "../components/content/BotonDeMarcador";
import {
  Media,
  PieceBody,
  PieceByline,
  PieceComments,
  PieceTags,
  RelatedPieces,
} from "../components/piece";
import { temaPrincipal } from "../lib/contentFilter";
import { enlaceParaCompartir, rutaDeFormato, rutaDePieza } from "../lib/pieza";
import { getPiece, getRelated } from "../services/publicContentService";
import { piezaFromApi } from "../lib/pieza";
import { useTaxonomy } from "../hooks/useTaxonomy";
import { useDelayedFlag } from "../hooks/useDelayedFlag";
import { ESPACIOS } from "../services/publicidadService";
import { InvitacionPausa } from "../components/home/TarjetaPausa";
import { ClaveDeLaPieza } from "../components/piece/ClaveDeLaPieza";
import {
  ESPACIOS_DE_SITIO,
  EspacioPublicitario,
  useEspacios,
} from "../components/publicidad";

/**
 * Detail page for a piece of any format.
 *
 * One shell for all five, with only the body switching — the breadcrumb, kicker,
 * headline, byline, tags and related module do the same job whatever the format,
 * and five near-identical pages would drift apart on the first change.
 */

const NoEncontrada = () => {
  const { t } = useIdioma();
  return (
    <main className="se-blog se-articles" role="main">
      <section className="se-section">
        <div className="se-container">
          <div className="se-piece">
            <h1 className="se-piece__title">{t("piezas.noEncontrada.titulo")}</h1>
            <p className="se-piece__lead">{t("piezas.noEncontrada.texto")}</p>
            <Enlace to="/" className="se-piece__back">
              {t("piezas.noEncontrada.volver")}
            </Enlace>
          </div>
        </div>
      </section>
    </main>
  );
};

/**
 * La pieza que ya vino dentro del HTML, si es esta.
 *
 * `api/pieza.js` la mete en `window.__SE_PIEZA__` al servir la página, para que los
 * buscadores vean el texto. Aprovecharla aquí ahorra pedirla otra vez a la API y, sobre
 * todo, evita que el artículo que ya se veía desaparezca tras un «Cargando…» y vuelva.
 * Se usa una sola vez: al navegar a otra pieza dentro del sitio, se pide como siempre.
 */
const tomarPiezaDelHtml = (slug) => {
  // Solo lee. Se borra en el efecto, ya usada: React, en modo estricto, llama dos veces
  // a la función que prepara el estado inicial, y borrarla aquí dejaba la segunda
  // llamada sin pieza -- y la página la volvía a pedir a la API.
  try {
    const datos = window.__SE_PIEZA__;
    return datos && datos.slug === slug ? piezaFromApi(datos) : null;
  } catch {
    return null;
  }
};

export const Pieza = () => {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const { t, lang } = useIdioma();
  const { geoTop } = useTaxonomy();
  const [state, setState] = useState(() => {
    const pieza = tomarPiezaDelHtml(slug);
    return pieza ? { status: "success", pieza, delHtml: true } : { status: "loading", pieza: null };
  });
  const [relacionadas, setRelacionadas] = useState([]);

  useEffect(() => {
    let alive = true;
    const cargarRelacionadas = (pieza) => {
      // Related pieces load after the piece and never block it: the article is
      // what the reader came for, and a slow sidebar must not hold it back.
      getRelated(pieza)
        .then((items) => {
          if (alive) setRelacionadas(items);
        })
        .catch(() => {
          if (alive) setRelacionadas([]);
        });
    };
    // La pieza ya llegó con el HTML: solo faltan las relacionadas.
    if (state.delHtml && state.pieza?.slug === slug) {
      try {
        window.__SE_PIEZA__ = null;
      } catch {
        /* nada */
      }
      cargarRelacionadas(state.pieza);
      return () => {
        alive = false;
      };
    }
    setState({ status: "loading", pieza: null });
    setRelacionadas([]);
    getPiece(slug)
      .then((pieza) => {
        if (!alive) return;
        setState({ status: pieza ? "success" : "missing", pieza });
        if (pieza) cargarRelacionadas(pieza);
      })
      .catch(() => {
        if (alive) setState({ status: "missing", pieza: null });
      });
    return () => {
      alive = false;
    };
    // `state` no va en las dependencias a propósito: solo se mira para saber si la
    // pieza del primer render vino con el HTML, y volver a correr con cada cambio de
    // estado pediría la pieza en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const pieza = state.pieza;
  const cargando = useDelayedFlag(state.status === "loading");

  // El título, la descripción y las señales para Google, en su idioma. El texto de las
  // piezas solo existe en español (`soloEspanol`): en `/en` la página sale con `noindex`
  // y el canónico apuntando al español. Y una dirección que no lleva a ninguna pieza
  // no debe quedar en los buscadores.
  useMetaPagina(
    state.status === "missing"
      ? { title: t("piezas.noEncontrada.meta.titulo", { marca: BRAND.name }), noindex: true }
      : pieza
        ? {
            title: t("piezas.pieza.meta.titulo", { titulo: pieza.titulo, marca: BRAND.name }),
            description: pieza.resumen || pieza.entrada || temaPrincipal(pieza) || BRAND.name,
            soloEspanol: true,
          }
        : { soloEspanol: true }
  );

  // La barra de direcciones también lleva la versión: quien copia el enlace de ahí para
  // pegarlo en X comparte el mismo que el botón. `replaceState` y no `navigate`: sólo
  // cambia lo que se ve y se copia, sin volver a pintar ni a pedir nada. La canónica
  // de la página sigue sin el parámetro, así que para Google es la misma pieza.
  useEffect(() => {
    if (!pieza?.version) return;
    const actual = new URL(window.location.href);
    if (sinPrefijo(actual.pathname) !== rutaDePieza(pieza)) return;
    if (actual.searchParams.get("v") === pieza.version) return;
    actual.searchParams.set("v", pieza.version);
    window.history.replaceState(
      window.history.state,
      "",
      `${actual.pathname}${actual.search}${actual.hash}`
    );
  }, [pieza]);

  // Los huecos de esta pieza, declarados **antes** de los returns tempranos de abajo:
  // un hook no puede quedarse sin ejecutar en un render y sí en el siguiente.
  //
  // `listo` espera a tener la pieza porque el contexto -- formato, temas, países -- es
  // lo que decide qué campaña encaja, y pedir sin él serviría un anuncio al azar y,
  // peor, contaría esa impresión. Y se apaga entero si la redacción marcó la pieza
  // como «sin publicidad»: no se piden espacios, así que no hay nada que ocultar
  // después.
  useEspacios({
    espacios: [...ESPACIOS_DE_SITIO, ESPACIOS.ARTICULO_NATIVO, ESPACIOS.ARTICULO_RAIL],
    contexto: {
      seccion: pieza?.formatoApi ?? null,
      formato: pieza?.formatoApi ?? null,
      tema: pieza?.temaSlugs ?? [],
      pais: pieza?.geoSlugs ?? [],
    },
    listo: Boolean(pieza) && !pieza.sinPublicidad,
  });

  if (state.status === "loading") {
    // Nothing at all for the first fraction of a second: a piece that loads fast
    // should just appear, without a card flashing in front of it.
    return (
      <main className="se-blog se-articles" role="main">
        <section className="se-section">
          <div className="se-container">{cargando ? <LoadingState title={t("comun.cargando")} /> : null}</div>
        </section>
      </main>
    );
  }

  if (!pieza) return <NoEncontrada />;

  // The format lives in the URL, so a hand-edited path can disagree with the
  // piece. Send it to the canonical address rather than serving a lie.
  const canonica = rutaDePieza(pieza);
  if (sinPrefijo(pathname) !== canonica) return <Redirigir to={canonica} replace />;

  const lugar = pieza.geos?.[0] ?? geoTop;
  const tema = temaPrincipal(pieza);

  // La entradilla sale del campo que cada formato usa para ella.
  const entradilla = pieza.resumenHtml || pieza.entradaHtml || "";
  // La entrevista no lleva portada en la cabecera: su portada es el video. Y sin
  // fotografía tampoco: la cabecera de dos columnas dejaba la de la derecha vacía y el
  // titular encajonado en la mitad del ancho.
  const conPortada = pieza.formatoApi !== "entrevista" && Boolean(pieza.imagenUrl);

  return (
    <main className="se-blog se-articles" role="main">
      <section className="se-section">
        <div className="se-container">
          <article className="se-piece">
            <nav className="se-piece__crumbs" aria-label={t("piezas.pieza.ubicacion")}>
              <Enlace to="/">{t("nav.inicio")}</Enlace>
              <span aria-hidden="true"> › </span>
              <Enlace to={rutaDeFormato(pieza.formatoApi)}>{pieza.formatoNombre}</Enlace>
              {lugar ? (
                <>
                  <span aria-hidden="true"> › </span>
                  <Enlace to={`/explorar?donde=${encodeURIComponent(lugar)}`}>{lugar}</Enlace>
                </>
              ) : null}
            </nav>

            {/* La cabecera, a dos columnas: el titular y la entradilla a la
                izquierda, la fotografía a la derecha. Antes la imagen iba debajo del
                titular y empujaba el texto fuera de la primera pantalla.

                La entrevista queda fuera: su portada es el video, que se reproduce
                y por tanto vive en el cuerpo, no en un hueco de cabecera. */}
            <header className={`se-piece__head${conPortada ? " se-piece__head--media" : ""}`}>
              <div className="se-piece__head-text">
                <p className="se-piece__kicker">
                  {pieza.formatoNombre}
                  {tema ? ` · ${tema}` : ""}
                </p>
                <h1 className="se-piece__title">{pieza.titulo}</h1>
                {entradilla ? (
                  <div
                    className="se-piece__lead se-piece__lead--head"
                    dangerouslySetInnerHTML={{ __html: entradilla }}
                  />
                ) : null}
              </div>

              {conPortada ? (
                <div className="se-piece__head-media">
                  <Media pieza={pieza} />
                </div>
              ) : null}
            </header>

            <div className="se-piece__meta">
              <PieceByline
                autor={pieza.autor}
                autorFoto={pieza.autorFoto}
                fecha={pieza.fecha}
                unidad={pieza.unidad}
                esEditorial={pieza.formatoApi === "editorial"}
              />
              <div className="se-piece__acciones">
                {/* Guardar, al lado de compartir: las dos son «qué hago con esto
                    después de leerlo». El botón faltaba por completo -- la sección de
                    marcadores de la cuenta existía con su pantalla y su endpoint, pero
                    nada la alimentaba, así que no podía tener nada dentro. */}
                <BotonDeMarcador postId={pieza.id} />
                <ShareButtons
                  url={enlaceParaCompartir(canonica, pieza.version)}
                  title={pieza.titulo}
                  className="se-piece__share"
                />
              </div>
            </div>

            {/* El cuerpo y, al lado, lo que se puede leer después. La columna de
                lectura se estrecha a propósito: un párrafo que cruza la pantalla
                entera cansa, y el brandbook lo maqueta así. */}
            <div className="se-piece__cols">
              <div className="se-piece__main">
                {/* El texto de las piezas solo existe en español. En `/en` se dice,
                    discreto y antes del cuerpo, para que nadie lo tome por un fallo. */}
                {lang === "en" ? (
                  <p className="se-pieza__solo-espanol">{t("idioma.soloEnEspanol")}</p>
                ) : null}
                <PieceBody pieza={pieza} enCabecera={conPortada} />
                <PieceTags temas={pieza.temas} geos={pieza.geos} />
                {/* Para quien llegó al final: la palabra de esta pieza (si la redacción la
                    dejó) y un minuto de pausa antes de lo siguiente. */}
                <ClaveDeLaPieza pieza={pieza} />
                <InvitacionPausa />

                {/* La tarjeta nativa del cuerpo, detrás del texto y de las etiquetas.
                    Se probó a mitad del cuerpo, partiendo los párrafos, y el cliente
                    lo descartó: en una pieza corta el corte llega enseguida y la
                    lectura se parte antes de haber dicho nada.

                    Lleva la misma etiqueta de publicidad que en la portada: lo que la
                    separa de una pieza de la redacción no puede depender de dónde
                    esté. */}
                <EspacioPublicitario espacio={ESPACIOS.ARTICULO_NATIVO} variante="cuerpo" />

                {/* Debajo del cuerpo y las etiquetas, en la columna de lectura: la
                    conversación es sobre lo que se acaba de leer.

                    Sólo donde la sección los admite -- hoy artículo, editorial,
                    entrevista y podcast. La decisión viaja en la pieza porque es una
                    política del formato, editable desde el panel, y no una lista de
                    formatos escrita aquí: la página de detalle es una sola para los
                    seis, así que sin esta condición aparecerían en todos. */}
                {pieza.admiteComentarios ? (
                  <PieceComments pieza={{ slug: pieza.slug, rutaCanonica: canonica }} />
                ) : null}
              </div>

              <aside className="se-piece__aside" aria-label={t("piezas.pieza.masContenido")}>
                {/* El rail va **encima** de «También te puede interesar», como en la
                    maqueta: es la primera cosa que ve quien levanta la vista del texto,
                    y es el sitio que se vende. Si no hay campaña que encaje no pinta
                    nada y la columna arranca directamente en las relacionadas. */}
                <EspacioPublicitario espacio={ESPACIOS.ARTICULO_RAIL} />
                {relacionadas.length ? <RelatedPieces items={relacionadas} /> : null}
              </aside>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
};
