import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { ErrorState, LoadingState } from "../../components/content";
import { SubmissionForm } from "../../components/submissions/SubmissionForm";
import { applyPageMeta } from "../../lib/seo";
import * as userMeService from "../../services/userMeService";

export const CuentaEnvioEditar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isEmailVerified } = useUserAuth();

  const [loadState, setLoadState] = useState({ status: "idle", error: null });
  const [values, setValues] = useState({ title: "", excerpt: "", content: "", featuredImageUrl: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeId = useMemo(() => (id ? String(id) : null), [id]);

  useEffect(() => {
    applyPageMeta({
      title: "Editar envío — Sur Economics",
      description: "Editar propuesta editorial.",
      noindex: true,
    });
  }, []);

  const load = useCallback(async () => {
    if (!safeId || !isEmailVerified) return;
    setLoadState({ status: "loading", error: null });
    setErrorMessage("");
    try {
      const submission = await userMeService.getSubmissionById(safeId);
      if (!submission) {
        setLoadState({ status: "error", error: new Error("No encontrado.") });
        return;
      }
      setValues({
        title: submission.title ?? "",
        excerpt: submission.excerpt ?? "",
        content: submission.content ?? "",
        featuredImageUrl: submission.featuredImageUrl ?? "",
      });
      setLoadState({ status: "success", error: null });
    } catch (err) {
      setLoadState({ status: "error", error: err });
    }
  }, [isEmailVerified, safeId]);

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
        title: values.title,
        excerpt: values.excerpt,
        content: values.content,
        featured_image_url: values.featuredImageUrl ? values.featuredImageUrl : null,
      });
      navigate(`/cuenta/envios/${encodeURIComponent(safeId)}`, { replace: true });
    } catch (err) {
      if (err?.status === 409 || err?.code === "invalid_submission_status") {
        setErrorMessage("Este envío ya no se puede editar porque cambió de estado.");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "No se pudo actualizar el envío.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">Editar envío</h1>
          <p className="se-reader-page-lead">
            Verifique su correo.{" "}
            <Link to="/cuenta/verificar-email" className="se-link">
              Verificar
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (loadState.status === "loading" || loadState.status === "idle") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <LoadingState title="Cargando envío…" />
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <ErrorState title="No pudimos cargar el envío" error={loadState.error} onRetry={load} />
        {safeId ? (
          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            <Link to={`/cuenta/envios/${encodeURIComponent(safeId)}`} className="se-link">
              Volver al envío
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <SubmissionForm
      title="Editar envío"
      backHref={safeId ? `/cuenta/envios/${encodeURIComponent(safeId)}` : "/cuenta/envios"}
      backLabel="Volver al envío"
      values={values}
      onChange={setValues}
      onSubmit={handleSubmit}
      submitLabel="Guardar cambios"
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  );
};

