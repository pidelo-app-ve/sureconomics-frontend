import { Suspense, lazy } from "react";
import { Enlace } from "../components/Enlace";
import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";

// La 404 no es una página que se visite a propósito: el juego se descarga solo si
// alguien llega aquí, y convierte un enlace roto en un minuto agradable.
const Guacamaya = lazy(() => import("../juegos/guacamaya/Guacamaya"));

export const NotFound = () => {
  const { t } = useIdioma();
  useMetaPagina({
    title: t("piezas.paginaNoEncontrada.meta.titulo", { marca: BRAND.name }),
    description: t("piezas.paginaNoEncontrada.meta.descripcion"),
    // Responde 200 (el sitio es una sola página), así que esto es lo que le dice al
    // buscador que no la guarde.
    noindex: true,
  });

  return (
    <main className="se-blog" role="main">
      <section className="se-section">
        <div className="se-container se-container--narrow">
          <h1 className="se-heading-section">{t("piezas.paginaNoEncontrada.titulo")}</h1>
          <p className="se-text-body">{t("piezas.paginaNoEncontrada.texto")}</p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Enlace to="/" className="se-btn">
              {t("comun.volverInicio")}
            </Enlace>
            <Enlace to="/articulos" className="se-btn se-btn--secondary">
              {t("piezas.paginaNoEncontrada.explorarArticulos")}
            </Enlace>
          </div>
        </div>
      </section>
      <section className="se-section" aria-label={t("piezas.paginaNoEncontrada.pausaRotulo")}>
        <div className="se-container" style={{ maxWidth: 560 }}>
          <p className="se-text-body" style={{ marginBottom: "1rem" }}>
            {t("piezas.paginaNoEncontrada.pausaTexto")}
          </p>
          <Suspense fallback={null}>
            <Guacamaya />
          </Suspense>
        </div>
      </section>
    </main>
  );
};
