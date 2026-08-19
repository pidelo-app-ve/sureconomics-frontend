import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { applyPageMeta } from "../../lib/seo";
import * as userMeService from "../../services/userMeService";
import { SubmissionForm } from "../../components/submissions/SubmissionForm";

export const CuentaEnviosNuevo = () => {
  const navigate = useNavigate();
  const { isEmailVerified } = useUserAuth();
  const [values, setValues] = useState({ format: "articulo", title: "", excerpt: "", content: "", featuredImageUrl: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    applyPageMeta({
      title: "Nuevo envío — SurEconomics",
      description: "Enviar propuesta editorial.",
      noindex: true,
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const created = await userMeService.createSubmission({
        format: values.format,
        title: values.title,
        excerpt: values.excerpt,
        content: values.content,
        featured_image_url: values.featuredImageUrl,
      });
      const id =
        created?.id ??
        created?.submission_id ??
        (created && typeof created === "object" && created.data && created.data.id);
      const flashState = { flash: "Envío creado correctamente. Quedó a la espera de revisión." };
      if (id) {
        navigate(`/cuenta/envios/${encodeURIComponent(id)}`, { replace: true, state: flashState });
        return;
      }
      navigate("/cuenta/envios", { replace: true, state: flashState });
    } catch (err) {
      if (err?.status === 429) {
        setErrorMessage("Demasiadas solicitudes. Espere unos minutos e inténtelo de nuevo.");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "No se pudo crear el envío.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">Nuevo envío</h1>
          <p className="se-reader-page-lead">
            Verifique su correo para enviar propuestas.{" "}
            <Link to="/cuenta/verificar-email" className="se-link">
              Verificar
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <SubmissionForm
      title="Nuevo envío"
      backHref="/cuenta/envios"
      backLabel="Volver a la lista"
      values={values}
      onChange={setValues}
      onSubmit={handleSubmit}
      submitLabel="Enviar a revisión"
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  );
};
