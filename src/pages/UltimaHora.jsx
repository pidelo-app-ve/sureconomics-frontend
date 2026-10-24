import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { Enlace } from "../components/Enlace";
import { BRAND } from "../data/surEconomicsMock";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import { haceCuanto, useHeadlines } from "../hooks/useHeadlines";
import { formatearFecha } from "../i18n/motor";
import { nuevosEn, queHacer } from "../lib/listaUltimaHora";
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
 * Los seis más recientes (lo fijado, primero): uno nuevo entra arriba y el más antiguo
 * sale (la redacción, 22-oct-2026; antes eran los ocho más calientes). Son los mismos
 * seis, en el mismo orden, que rota la tarjeta de la portada: su enlace nunca cae en
 * el vacío.
 *
 * Cada titular lleva su hora («9:21», y «Hace 12 min» debajo): en una sección de
 * última hora es lo primero que se busca. El punto del título late mientras lo más
 * reciente tiene menos de una hora. Al lado, en escritorio, el resumen del día y las
 * monedas: lo que el lector de esta página suele buscar después.
 *
 * Cuándo entra lo nuevo (`lib/listaUltimaHora.js`): solo si el lector está al principio
 * de la lista. Si bajó leyendo, espera tras «Ver 1 titular nuevo» para no moverle el
 * texto (revisión del 22-oct-2026, 3.2), y entra solo en cuanto vuelve arriba. Los dos
 * casos se anuncian a los lectores de pantalla. Lo que sí cambia en el acto: un texto
 * corregido, y lo que la redacción borra u oculta, que desaparece aunque nadie pulse nada.
 */

const EN_LA_SECCION = 6;
const UNA_HORA_MS = 60 * 60 * 1000;

/** La hora de ahora, al minuto: para «Hace 12 min» y para saber si el punto late. */
const useAhora = () => {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return ahora;
};

/** «9:21» si es de hoy; «4 ago, 9:21» si no. */
const horaDe = (iso, lang, ahora) => {
  const ms = Date.parse(iso || "");
  if (!ms) return "";
  const hoy = new Date(ahora).toDateString() === new Date(ms).toDateString();
  return formatearFecha(iso, hoy ? "hora" : "conHora", lang);
};
/** Lo que acaba de entrar se ilumina este rato, para que se vea qué es nuevo. */
const LLEGA_MS = 4000;

/**
 * Los titulares que la página enseña. Guarda solo los ids: cada uno se pinta con su
 * versión de ahora, y uno que ya no está en la lista (borrado, oculto) no sale. Cuándo
 * se ponen los nuevos lo decide `queHacer`, según si el lector está arriba (`lista`).
 */
const useListaEstable = (todos, status, lista) => {
  const [ids, setIds] = useState(null);
  const [llegados, setLlegados] = useState([]);
  const [arriba, setArriba] = useState(true);

  const objetivo = todos.slice(0, EN_LA_SECCION);
  const porId = new Map(todos.map((i) => [i.id, i]));
  const items = ids === null ? objetivo : ids.map((id) => porId.get(id)).filter(Boolean);
  const enPantalla = items.map((i) => i.id);
  const idsObjetivo = objetivo.map((i) => i.id);
  const nuevos = ids === null ? [] : nuevosEn(enPantalla, idsObjetivo);
  let decision = "nada";
  if (status === "success") decision = ids === null ? "poner" : queHacer({ enPantalla, objetivo: idsObjetivo, arriba });
  const clave = idsObjetivo.join(",");
  const claveNuevos = nuevos.join(",");

  const ponerAlDia = useCallback(() => {
    setIds(clave ? clave.split(",").map(Number) : []);
    setLlegados(claveNuevos ? claveNuevos.split(",").map(Number) : []);
  }, [clave, claveNuevos]);

  useEffect(() => {
    if (decision === "poner") ponerAlDia();
  }, [decision, ponerAlDia]);

  // «Arriba»: se ve el principio de la lista (un poco de margen para la cabecera fija).
  useEffect(() => {
    const medir = () => {
      const el = lista.current;
      const v = !el || el.getBoundingClientRect().top >= -24;
      setArriba((antes) => (antes === v ? antes : v));
    };
    medir();
    window.addEventListener("scroll", medir, { passive: true });
    return () => window.removeEventListener("scroll", medir);
  }, [lista]);

  useEffect(() => {
    if (!llegados.length) return undefined;
    const reloj = setTimeout(() => setLlegados([]), LLEGA_MS);
    return () => clearTimeout(reloj);
  }, [llegados]);

  return { items, nuevos: decision === "boton" ? nuevos.length : 0, llegados, ponerAlDia };
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
  const { t, lang } = useIdioma();
  const ahora = useAhora();
  const { status, items: todos, error } = useHeadlines();
  const lista = useRef(null);
  const { items, nuevos, llegados, ponerAlDia } = useListaEstable(todos, status, lista);
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

  const masReciente = items.reduce((max, i) => Math.max(max, Date.parse(i.published_at || "") || 0), 0);
  const enVivo = masReciente > 0 && ahora - masReciente < UNA_HORA_MS;

  return (
    <main className="se-section se-uh-seccion" role="main">
      <div className="se-container se-uh-seccion__rejilla">
        <div className="se-uh-seccion__caja">
          <h1 className="se-uh-seccion__titulo">
            <span className={`se-uh__punto${enVivo ? " se-uh__punto--vivo" : ""}`} aria-hidden="true" />
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
            {!nuevos && llegados.length ? (
              <span className="se-sr-only">{t("titulares.seccion.entraron", { n: llegados.length })}</span>
            ) : null}
          </div>

          {items.length ? (
            <ol className="se-uh-lista" ref={lista} tabIndex={-1}>
              {items.map((item) => (
                <li
                  key={item.id}
                  id={`t-${item.id}`}
                  className={`se-uh-item${llegados.includes(item.id) ? " se-uh-item--llega" : ""}`}
                >
                  <p className="se-uh-item__cuando">
                    <time dateTime={item.published_at ?? undefined}>{horaDe(item.published_at, lang, ahora)}</time>
                    <span>{haceCuanto(item.published_at, t, ahora)}</span>
                  </p>
                  <div className="se-uh-item__cuerpo">
                    <h2 className="se-uh-item__titulo">{item.title}</h2>
                    {item.summary ? <p className="se-uh-item__resumen">{item.summary}</p> : null}
                    <Fuentes item={item} t={t} />
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        {/* Lo que se busca después de la última hora: el resumen del día y las monedas. */}
        <aside className="se-uh-lateral" aria-label={t("titulares.seccion.lateral.region")}>
          <section className="se-uh-lateral__bloque">
            <h2 className="se-uh-lateral__titulo">
              <Enlace to="/resumen">{t("titulares.seccion.lateral.resumen")}</Enlace>
            </h2>
            <p>{t("titulares.seccion.lateral.resumenTexto")}</p>
          </section>
          <section className="se-uh-lateral__bloque">
            <h2 className="se-uh-lateral__titulo">
              <Enlace to="/monedas">{t("titulares.seccion.lateral.monedas")}</Enlace>
            </h2>
            <p>{t("titulares.seccion.lateral.monedasTexto")}</p>
          </section>
        </aside>
      </div>
    </main>
  );
};
