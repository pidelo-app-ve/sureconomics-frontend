import { useRouteError } from "react-router-dom";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { esErrorDeCarga, recargarUnaVez } from "../lib/recargaTrasDespliegue";
import { NotFound } from "./NotFound";

/**
 * Lo que se pinta cuando una ruta falla.
 *
 * Si lo que falló es un trozo de código que ya no existe -- la pestaña es de antes del
 * último despliegue --, se recarga sola y trae la versión nueva. Si ya se recargó hace
 * nada y sigue fallando, se dice qué pasa y se ofrece recargar a mano, en vez de "página
 * no encontrada", que era mentira. Cualquier otro error sigue llevando a la 404.
 */
export const RouteError = () => {
  const error = useRouteError();
  const { t } = useIdioma();

  if (!esErrorDeCarga(error)) return <NotFound />;
  if (recargarUnaVez()) return null;

  return (
    <main className="se-blog" role="main">
      <section className="se-section">
        <div className="se-container se-container--narrow">
          <h1 className="se-heading-section">{t("comun.versionNueva.titulo")}</h1>
          <p className="se-text-body">{t("comun.versionNueva.texto")}</p>
          <button type="button" className="se-btn" style={{ marginTop: "1.5rem" }} onClick={() => window.location.reload()}>
            {t("comun.versionNueva.recargar")}
          </button>
        </div>
      </section>
    </main>
  );
};
