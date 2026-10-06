import { useCallback, useEffect, useState } from "react";
import { Enlace } from "../../components/Enlace";
import { useUserAuth } from "../../context/UserAuthContext";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import * as userMeService from "../../services/userMeService";
import { Pagination } from "../../components/content/Pagination";
import { ErrorState, LoadingState } from "../../components/content";

export const CuentaMarcadores = () => {
  const { t } = useIdioma();
  const { isEmailVerified } = useUserAuth();
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  const handleLoad = useCallback(async (page = 1) => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await userMeService.getMyBookmarks({ page, limit: 10 });
      setState({ status: "success", data, error: null });
    } catch (err) {
      setState({ status: "error", data: null, error: err });
    }
  }, []);

  useMetaPagina({
    title: t("cuenta.marcadores.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.marcadores.meta.descripcion"),
    noindex: true,
  });

  useEffect(() => {
    if (!isEmailVerified) return;
    handleLoad(1);
  }, [handleLoad, isEmailVerified]);

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">{t("cuenta.marcadores.titulo")}</h1>
          <p className="se-reader-page-lead">
            {t("cuenta.marcadores.verifique")}{" "}
            <Enlace to="/cuenta/verificar-email" className="se-link">
              {t("cuenta.comun.verificar")}
            </Enlace>
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <LoadingState title={t("cuenta.marcadores.cargando")} />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <ErrorState title={t("cuenta.marcadores.noPudimosCargar")} error={state.error} onRetry={() => handleLoad(1)} />
      </div>
    );
  }

  const items = state.data?.items ?? [];

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-page-head">
        <h1 className="se-reader-page-title">{t("cuenta.marcadores.titulo")}</h1>
        <p className="se-reader-page-lead">{t("cuenta.marcadores.lead")}</p>
      </header>

      {items.length === 0 ? (
        <div className="se-reader-empty se-reader-card">
          <p className="se-reader-empty__title">{t("cuenta.marcadores.vacioTitulo")}</p>
          <p className="se-reader-empty__text">{t("cuenta.marcadores.vacioTexto")}</p>
          <Enlace to="/articulos" className="se-btn se-btn--secondary">
            {t("cuenta.marcadores.verArticulos")}
          </Enlace>
        </div>
      ) : (
        <ul className="se-reader-marks">
          {items.map((post) => (
            <li key={post.id || post.slug} className="se-reader-marks__item">
              <Enlace to={`/articulo/${encodeURIComponent(post.slug)}`} className="se-reader-marks__link">
                <span className="se-reader-marks__accent" aria-hidden="true" />
                <span className="se-reader-marks__body">
                  <span className="se-reader-marks__title">{post.title || post.slug}</span>
                  {post.excerpt ? (
                    <span className="se-reader-marks__excerpt">{post.excerpt}</span>
                  ) : null}
                </span>
                <span className="se-reader-marks__arrow" aria-hidden="true">
                  →
                </span>
              </Enlace>
            </li>
          ))}
        </ul>
      )}

      <div className="se-reader-pagination-wrap">
        <Pagination
          page={state.data?.page ?? 1}
          totalPages={state.data?.totalPages ?? 1}
          onPageChange={(p) => handleLoad(p)}
        />
      </div>
    </div>
  );
};
