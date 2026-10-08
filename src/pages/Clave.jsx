import { useSearchParams } from "react-router-dom";
import { Enlace } from "../components/Enlace";
import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { Clave } from "../juegos/clave/Clave";
import "./pausa.css";

/**
 * `/clave`: la palabra del día, en seis intentos.
 *
 * Es la dirección que se comparte («¿adivinas la de hoy? sureconomics.com/clave»), con
 * `?c=` para abrir ya en la categoría del reto que mandaron. Lleva título y descripción
 * propios para la tarjeta de WhatsApp o de X, y va con la cabecera y el pie del sitio.
 * Usa la misma caja estrecha que `/pausa`.
 */
export const ClavePage = () => {
  const { t } = useIdioma();
  const [params] = useSearchParams();
  useMetaPagina({
    title: t("juegos.clave.meta.titulo", { marca: BRAND.name }),
    description: t("juegos.clave.meta.descripcion"),
  });

  return (
    <main className="se-blog">
      <section className="se-section se-pausa">
        <div className="se-container se-pausa__caja se-pausa__caja--clave">
          <header className="se-pausa__cabeza">
            <p className="se-pausa__kicker">{t("juegos.pausa.kicker")}</p>
            <h1 className="se-pausa__titulo">{t("juegos.clave.titulo")}</h1>
            <p className="se-pausa__entrada">{t("juegos.clave.entrada")}</p>
          </header>
          <Clave categoriaInicial={params.get("c") || undefined} />
          <p className="se-pausa__otro">
            <Enlace to="/pausa">{t("juegos.clave.irAPausa")}</Enlace>
          </p>
        </div>
      </section>
    </main>
  );
};

export default ClavePage;
