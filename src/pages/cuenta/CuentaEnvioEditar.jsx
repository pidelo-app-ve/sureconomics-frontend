import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Enlace, useNavegar } from "../../components/Enlace";
import { useUserAuth } from "../../context/UserAuthContext";
import { ErrorState, LoadingState } from "../../components/content";
import { SubmissionForm } from "../../components/submissions/SubmissionForm";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import * as userMeService from "../../services/userMeService";

export const CuentaEnvioEditar = () => {
  const { t } = useIdioma();
  const { id } = useParams();
  const navigate = useNavegar();
  const { isEmailVerified } = useUserAuth();

  const [loadState, setLoadState] = useState({ status: "idle", error: null });
  const [values, setValues] = useState({ format: "articulo", title: "", excerpt: "", content: "", featuredImageUrl: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeId = useMemo(() => (id ? String(id) : null), [id]);

  useMetaPagina({
    title: t("cuenta.envioEditar.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.envioEditar.meta.descripcion"),
    noindex: true,
  });

  const load = useCallback(async () => {
    if (!safeId || !isEmailVerified) return;
    setLoadState({ status: "loading", error: null });
    setErrorMessage("");
    try {
      const submission = await userMeService.getSubmissionById(safeId);
      if (!submission) {
        setLoadState({ status: "error", error: new Error(t("cuenta.envioEditar.noEncontrado")) });
        return;
      }
      setValues({
        format: submission.format ?? "articulo",
        title: submission.title ?? "",
        excerpt: submission.excerpt ?? "",
        content: submission.content ?? "",
        featuredImageUrl: submission.featuredImageUrl ?? "",
      });
      setLoadState({ status: "success", error: null });
    } catch (err) {
      setLoadState({ status: "error", error: err });
    }
  }, [isEmailVerified, safeId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!safeId) return;

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await userMeService.patchMySubmission(safeId, {
        format: values.format,
        title: values.title,
        excerpt: values.excerpt,
        content: values.content,
        featured_image_url: values.featuredImageUrl ? values.featuredImageUrl : null,
      });
      navigate(`/cuenta/envios/${encodeURIComponent(safeId)}`, {
        replace: true,
        state: { flash: t("cuenta.envioEditar.actualizado") },
      });
    } catch (err) {
      if (err?.status === 409 || err?.code === "invalid_submission_status") {
        setErrorMessage(t("cuenta.envioEditar.yaNoEditable"));
      } else {
        setErrorMessage(err instanceof Error ? err.message : t("cuenta.envioEditar.fallo"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">{t("cuenta.envioEditar.titulo")}</h1>
          <p className="se-reader-page-lead">
            {t("cuenta.comun.verifiqueSuCorreo")}{" "}
            <Enlace to="/cuenta/verificar-email" className="se-link">
              {t("cuenta.comun.verificar")}
            </Enlace>
          </p>
        </div>
      </div>
    );
  }

  if (loadState.status === "loading" || loadState.status === "idle") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <LoadingState title={t("cuenta.comun.cargandoEnvio")} />
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <ErrorState title={t("cuenta.comun.noPudimosCargarEnvio")} error={loadState.error} onRetry={load} />
        {safeId ? (
          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            <Enlace to={`/cuenta/envios/${encodeURIComponent(safeId)}`} className="se-link">
              {t("cuenta.comun.volverAlEnvio")}
            </Enlace>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <SubmissionForm
      title={t("cuenta.envioEditar.titulo")}
      backHref={safeId ? `/cuenta/envios/${encodeURIComponent(safeId)}` : "/cuenta/envios"}
      backLabel={t("cuenta.comun.volverAlEnvio")}
      values={values}
      onChange={setValues}
      onSubmit={handleSubmit}
      submitLabel={t("cuenta.comun.guardarCambios")}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  );
};

