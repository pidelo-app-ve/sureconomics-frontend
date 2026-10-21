import { Fragment, useEffect } from "react";
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
 */

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
  const { status, items, error } = useHeadlines();
  const { hash } = useLocation();

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

        {items.length ? (
          <ol className="se-uh-lista">
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
