import { Enlace } from "../components/Enlace";
import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { Guacamaya } from "../juegos/guacamaya/Guacamaya";
import { PatrocinioDelJuego } from "../juegos/guacamaya/PatrocinioDelJuego";

/** El Analista, dentro del sitio y en la misma pestaña: ver `pages/ElAnalista.jsx`. */
const EL_ANALISTA = "/el-analista";

/**
 * `/pausa`: un minuto de juego entre lecturas.
 *
 * Es la dirección que se comparte («¿lo superas? sureconomics.com/pausa»), así que
 * lleva su título y su descripción propios para que la tarjeta de WhatsApp o de X diga
 * de qué se trata. Va con la cabecera y el pie del sitio: quien llega desde un enlace
 * compartido tiene que ver dónde está y tener a un toque las noticias.
 */
export const Pausa = () => {
  const { t } = useIdioma();
  useMetaPagina({
    title: t("juegos.pausa.meta.titulo", { marca: BRAND.name }),
    description: t("juegos.pausa.meta.descripcion"),
  });

  return (
    <main className="se-blog">
      <section className="se-section se-pausa">
        <div className="se-container se-pausa__caja">
          <header className="se-pausa__cabeza">
            <p className="se-pausa__kicker">{t("juegos.pausa.kicker")}</p>
            <h1 className="se-pausa__titulo">{t("juegos.pausa.titulo")}</h1>
            <p className="se-pausa__entrada">{t("juegos.pausa.entrada")}</p>
          </header>
          <Guacamaya patrocinio={<PatrocinioDelJuego />} />

          <section className="se-analista" aria-labelledby="analista-titulo">
            <p className="se-analista__kicker">{t("juegos.pausa.analista.kicker")}</p>
            <h2 id="analista-titulo" className="se-analista__titulo">El Analista</h2>
            <p className="se-analista__texto">{t("juegos.pausa.analista.texto")}</p>
            <Enlace className="se-analista__boton" to={EL_ANALISTA}>
              {t("nav.jugarAnalista")}
              <span className="se-analista__fuera" aria-hidden="true">→</span>
            </Enlace>
          </section>
        </div>
      </section>
    </main>
  );
};

export default Pausa;
