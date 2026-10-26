import { Suspense, lazy } from "react";
import { Enlace } from "../components/Enlace";
import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { UltimaHoraColumna } from "../components/titulares/UltimaHoraColumna";

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
      {/* Como una página de diario que no está: el aviso y las salidas a la izquierda,
          y a la derecha lo último que pasó, para que el enlace roto lleve a algo. */}
      <section className="se-section se-404">
        <div className="se-container se-404__rejilla">
          <div className="se-404__aviso">
            <p className="se-404__cifra" aria-hidden="true">404</p>
            <h1 className="se-404__titulo">{t("piezas.paginaNoEncontrada.titulo")}</h1>
            <p className="se-404__texto">{t("piezas.paginaNoEncontrada.texto")}</p>
            <div className="se-404__salidas">
              <Enlace to="/" className="se-btn">
                {t("comun.volverInicio")}
              </Enlace>
              <Enlace to="/articulos" className="se-btn se-btn--secondary">
                {t("piezas.paginaNoEncontrada.explorarArticulos")}
              </Enlace>
            </div>
          </div>
          <div className="se-404__lateral">
            <UltimaHoraColumna />
          </div>
        </div>
      </section>
      <section className="se-section se-404__pausa" aria-label={t("piezas.paginaNoEncontrada.pausaRotulo")}>
        <div className="se-container se-404__pausa-caja">
          <p className="se-404__pausa-texto">{t("piezas.paginaNoEncontrada.pausaTexto")}</p>
          <Suspense fallback={null}>
            <Guacamaya />
          </Suspense>
        </div>
      </section>
    </main>
  );
};
