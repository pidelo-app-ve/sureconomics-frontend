import { useCallback, useEffect, useState } from "react";
import { Enlace } from "../../components/Enlace";
import { useUserAuth } from "../../context/UserAuthContext";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import * as userMeService from "../../services/userMeService";
import { Pagination } from "../../components/content/Pagination";
import { ErrorState, LoadingState } from "../../components/content";
import { formatSubmissionDate, submissionStatusLabel } from "../../lib/submissionDisplay";
import { useFlashMessage } from "../../hooks/useFlashMessage";

export const CuentaEnviosList = () => {
  const { t } = useIdioma();
  const { isEmailVerified } = useUserAuth();
  const flash = useFlashMessage();
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  const handleLoad = useCallback(async (page = 1) => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await userMeService.listMySubmissions({ page, limit: 10 });
      setState({ status: "success", data, error: null });
    } catch (err) {
      setState({ status: "error", data: null, error: err });
    }
  }, []);

  useMetaPagina({
    title: t("cuenta.envios.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.envios.meta.descripcion"),
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
          <h1 className="se-reader-page-title">{t("cuenta.envios.titulo")}</h1>
          <p className="se-reader-page-lead">
            {t("cuenta.comun.verifiqueParaEnviar")}{" "}
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
        <LoadingState title={t("cuenta.envios.cargando")} />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <ErrorState title={t("cuenta.envios.noPudimosCargar")} error={state.error} onRetry={() => handleLoad(1)} />
      </div>
    );
  }

  const items = state.data?.items ?? [];

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-page-head se-reader-page-head--row">
        <div>
          <h1 className="se-reader-page-title">{t("cuenta.envios.titulo")}</h1>
          <p className="se-reader-page-lead">{t("cuenta.envios.lead")}</p>
        </div>
        <Enlace to="/cuenta/envios/nuevo" className="se-btn">
          {t("cuenta.envios.nuevo")}
        </Enlace>
      </header>

      {flash ? (
        <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
          {flash}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="se-reader-empty se-reader-card">
          <p className="se-reader-empty__title">{t("cuenta.envios.vacioTitulo")}</p>
          <p className="se-reader-empty__text">{t("cuenta.envios.vacioTexto")}</p>
          <Enlace to="/cuenta/envios/nuevo" className="se-btn">
            {t("cuenta.envios.crearPrimero")}
          </Enlace>
        </div>
      ) : (
        <ul className="se-reader-subs">
          {items.map((s) => (
            <li key={s.id} className="se-reader-subs__item">
              <Enlace to={`/cuenta/envios/${encodeURIComponent(s.id)}`} className="se-reader-subs__link">
                <span className="se-reader-subs__dot" aria-hidden="true" />
                <span className="se-reader-subs__main">
                  <span className="se-reader-subs__title">{s.title || t("cuenta.envios.sinTitulo", { id: s.id })}</span>
                  <span className="se-reader-subs__meta">
                    <span className="se-reader-subs__pill">{s.status ? submissionStatusLabel(s.status) : "—"}</span>
                    {s.createdAt ? <span>{formatSubmissionDate(s.createdAt)}</span> : null}
                  </span>
                </span>
                <span className="se-reader-subs__arrow" aria-hidden="true">
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
