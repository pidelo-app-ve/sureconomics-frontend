import { useState } from "react";
import { Enlace, useNavegar } from "../../components/Enlace";
import { useUserAuth } from "../../context/UserAuthContext";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import * as userMeService from "../../services/userMeService";
import { SubmissionForm, normalizarPropuesta } from "../../components/submissions/SubmissionForm";
import { useClaveIdempotente } from "../../hooks/useClaveIdempotente";
import { useBorradorLocal } from "../../hooks/useBorradorLocal";
import "../../styles/cuenta.css";

/** Con lo que abre el formulario. Fuera del componente: el borrador compara contra esto. */
const VACIO = { format: "articulo", title: "", excerpt: "", content: "", featuredImageUrl: "" };

export const CuentaEnviosNuevo = () => {
  const { t } = useIdioma();
  const navigate = useNavegar();
  const { isEmailVerified, profile } = useUserAuth();
  const [values, setValues] = useState(VACIO);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // La misma clave mientras el envío no cuaje: si la respuesta se pierde por el camino
  // y la persona vuelve a pulsar, no acaba con dos propuestas iguales a revisión.
  const { clave } = useClaveIdempotente();
  // Lo escrito se guarda solo en este equipo y vuelve si se cierra la página a medias.
  const borrador = useBorradorLocal({
    clave: isEmailVerified && profile?.id ? `propuesta-nueva-${profile.id}` : null,
    valores: values,
    base: VACIO,
    aplicar: setValues,
    normalizar: normalizarPropuesta,
  });

  useMetaPagina({
    title: t("cuenta.envioNuevo.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.envioNuevo.meta.descripcion"),
    noindex: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const created = await userMeService.createSubmission(
        {
          format: values.format,
          title: values.title,
          excerpt: values.excerpt,
          content: values.content,
          // Opcional: vacía no se manda (la API la rechazaría como dirección no válida).
          featured_image_url: values.featuredImageUrl.trim() || null,
        },
        clave(),
      );
      const id =
        created?.id ??
        created?.submission_id ??
        (created && typeof created === "object" && created.data && created.data.id);
      borrador.borrar();
      const flashState = { flash: t("cuenta.envioNuevo.creado") };
      if (id) {
        navigate(`/cuenta/envios/${encodeURIComponent(id)}`, { replace: true, state: flashState });
        return;
      }
      navigate("/cuenta/envios", { replace: true, state: flashState });
    } catch (err) {
      if (err?.status === 429) {
        setErrorMessage(t("cuenta.comun.demasiadasSolicitudes"));
      } else {
        setErrorMessage(err instanceof Error ? err.message : t("cuenta.envioNuevo.fallo"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">{t("cuenta.envioNuevo.titulo")}</h1>
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

  return (
    <SubmissionForm
      title={t("cuenta.envioNuevo.titulo")}
      backHref="/cuenta/envios"
      backLabel={t("cuenta.envioNuevo.volverALaLista")}
      values={values}
      onChange={setValues}
      onSubmit={handleSubmit}
      submitLabel={t("cuenta.envioNuevo.enviarARevision")}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      borrador={borrador}
    />
  );
};
