import { Fragment, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import { useHeadlines } from "../hooks/useHeadlines";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import "../styles/titulares.css";

/**
 * «Última hora»: los titulares en caliente que redacta el backend cada 10 minutos.
 *
 * Cada uno es título, resumen y su fuente, y nada más: así lo pidió la redacción. El
 * resumen ya atribuye («según EFE»); debajo van los medios con su enlace, para que el
 * lector vaya al original. Todo se pinta como texto, nunca como HTML: lo redacta un
 * modelo a partir de notas de terceros.
 *
 * Se mantiene al día sola (`useHeadlines`): lo nuevo aparece y lo que borra la
 * redacción desaparece sin recargar. La tarjeta de la portada enlaza a cada titular
 * por su ancla (`#t-<id>`), que aquí se resalta. Sin indexar por ahora (la guía lo
 * deja fuera de esta fase).
 *
 * Solo los ocho más importantes, en el orden de la tarjeta: la redacción pidió entre
 * seis y diez (21-oct-2026), porque la lista entera se leía como un muro. Al ser los
 * mismos en el mismo orden, los seis que rota la tarjeta siempre están aquí y su
 * enlace nunca cae en el vacío. La lista se renueva con cada ciclo de 10 minutos.
 *
 * Lo que llega mientras alguien lee no empuja la lista (revisión del 22-oct-2026, 3.2):
 * espera detrás de «Ver 3 titulares nuevos», que también oyen los lectores de pantalla.
 * Lo que sí cambia en el acto: un texto corregido, y lo que la redacción borra u oculta,
 * que desaparece aunque nadie pulse nada.
 */

const EN_LA_SECCION = 8;

/**
 * Los titulares que la página enseña, fijos hasta que el lector pide los nuevos.
 * Guarda solo los ids: cada uno se pinta con su versión de ahora, y uno que ya no está
 * en la lista (borrado, oculto) no sale.
 */
const useListaEstable = (todos, status) => {
  const [ids, setIds] = useState(null);
  const arriba = todos.slice(0, EN_LA_SECCION);
  const porId = new Map(todos.map((i) => [i.id, i]));
  const items = ids === null ? arriba : ids.map((id) => porId.get(id)).filter(Boolean);
  const nuevos = ids === null ? 0 : arriba.filter((i) => !ids.includes(i.id)).length;
  const claveArriba = arriba.map((i) => i.id).join(",");
  const vacia = ids !== null && !items.length;

  // La primera carga, o una lista que se quedó vacía (todo borrado, o la sección que se
  // vuelve a enseñar): no hay lectura que proteger, se enseña lo que hay.
  useEffect(() => {
    if (status !== "success" || !(ids === null || vacia)) return;
    if (ids !== null && ids.join(",") === claveArriba) return;
    setIds(claveArriba ? claveArriba.split(",").map(Number) : []);
  }, [status, ids, vacia, claveArriba]);

  const ponerAlDia = () => setIds(arriba.map((i) => i.id));
  return { items, nuevos, ponerAlDia };
};

const Fuentes = ({ item, t }) => {
  const fuentes = item.sources || [];
  if (!fuentes.length) return null;
  const extra = Math.max(0, (item.sources_count || 0) - fuentes.length);
  return (
    <p className="se-uh-item__fuentes">
      {fuentes.length > 1 ? t("titulares.seccion.fuentes") : t("titulares.seccion.fuente")}:{" "}
      {fuentes.map((f, k) => (
        <Fragment key={`${f.name}-${k}`}>
          {k ? " · " : null}
          {f.url ? (
            <a href={f.url} target="_blank" rel="noopener noreferrer nofollow">
              {f.name}
            </a>
          ) : (
            f.name
          )}
        </Fragment>
      ))}
      {extra ? ` · ${t("titulares.seccion.masFuentes", { n: extra })}` : null}
    </p>
  );
};

Fuentes.propTypes = {
  item: PropTypes.shape({
    sources: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, url: PropTypes.string })),
    sources_count: PropTypes.number,
  }).isRequired,
  t: PropTypes.func.isRequired,
};

export const UltimaHora = () => {
  const { t } = useIdioma();
  const { status, items: todos, error } = useHeadlines();
  const { items, nuevos, ponerAlDia } = useListaEstable(todos, status);
  const lista = useRef(null);
  const { hash } = useLocation();

  const verNuevos = () => {
    ponerAlDia();
    // Al principio de la lista, y el foco con ella: quien navega con teclado o lector de
    // pantalla sigue leyendo desde ahí.
    lista.current?.scrollIntoView({ block: "start" });
    lista.current?.focus({ preventScroll: true });
  };

  useMetaPagina({
    title: t("titulares.seccion.meta", { marca: BRAND.name }),
    description: t("titulares.seccion.intro"),
    noindex: true,
  });

  // Al llegar desde la tarjeta de la portada: al titular que se estaba viendo.
  useEffect(() => {
    if (status !== "success" || !hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [status, hash]);

  return (
    <main className="se-section se-uh-seccion" role="main">
      <div className="se-container se-uh-seccion__caja">
        <h1 className="se-uh-seccion__titulo">
          <span className="se-uh__punto" aria-hidden="true" />
          {t("titulares.seccion.titulo")}
        </h1>
        <p className="se-uh-seccion__intro">{t("titulares.seccion.intro")}</p>

        {status === "loading" && !items.length ? <LoadingState title={t("titulares.seccion.cargando")} /> : null}
        {status === "error" && !items.length ? (
          <ErrorState title={t("titulares.seccion.error")} error={error} onRetry={() => window.location.reload()} />
        ) : null}
        {status === "success" && !items.length ? (
          <EmptyState title={t("titulares.seccion.vacioTitulo")} description={t("titulares.seccion.vacio")} />
        ) : null}

        {/* Siempre montado: una región que avisa tiene que existir antes del aviso. */}
        <div className="se-uh-nuevos" role="status">
          {nuevos ? (
            <button type="button" className="se-uh-nuevos__boton" onClick={verNuevos}>
              <span className="se-uh__punto" aria-hidden="true" />
              {t("titulares.seccion.nuevos", { n: nuevos })}
            </button>
          ) : null}
        </div>

        {items.length ? (
          <ol className="se-uh-lista" ref={lista} tabIndex={-1}>
            {items.map((item) => (
              <li key={item.id} id={`t-${item.id}`} className="se-uh-item">
                <h2 className="se-uh-item__titulo">{item.title}</h2>
                {item.summary ? <p className="se-uh-item__resumen">{item.summary}</p> : null}
                <Fuentes item={item} t={t} />
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </main>
  );
};
