import { Suspense, lazy } from "react";
import { useRouteError } from "react-router-dom";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { cargarZonas } from "../i18n/motor";
import { esErrorDeCarga, recargarUnaVez } from "../lib/recargaTrasDespliegue";

// La 404 se descarga cuando hace falta, con los textos de su juego, como en `routes.jsx`:
// importarla aquí de golpe la metería otra vez en el archivo de la portada. Una por
// idioma, porque cada una pide las zonas del suyo.
const noEncontradaEn = (lang) =>
  lazy(() => Promise.all([import("./NotFound"), cargarZonas(lang, ["juegos"])]).then(([m]) => ({ default: m.NotFound })));
const NO_ENCONTRADA = { es: noEncontradaEn("es"), en: noEncontradaEn("en") };

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
  const { t, lang } = useIdioma();

  if (!esErrorDeCarga(error)) {
    const NotFound = NO_ENCONTRADA[lang] ?? NO_ENCONTRADA.es;
    return (
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    );
  }
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
