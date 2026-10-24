import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { getFotosDelEquipo } from "../services/publicContentService";
import { BRAND_PUBLIC_LOGO } from "../brand/publicBrandLogos";
import { ArbolDelEquipo } from "../components/institutional/ArbolDelEquipo";
import { Recorte, Recortes } from "../components/comun/Recorte";
import { useEffect, useState } from "react";

/**
 * El logotipo, del archivo del brandbook y no dibujado a mano.
 *
 * Aqui habia tres <span> de texto -- "Sur", una "E" en cobre y "conomics" -- montando
 * una imitacion del logotipo con la tipografia de la pagina. Se parecia, y era otra
 * cosa: sin el isotipo, con otro trazo y con un kerning que no es el que fija el
 * brandbook. En la cabecera y en el pie ya se servia el archivo de verdad, asi que
 * la portada de "Quienes somos" era el unico sitio del sitio con un logotipo falso.
 *
 * Va la version principal -- isotipo verde y el nombre en negro -- porque el fondo de
 * esta cabecera es claro. La negativa es para la franja verde.
 */
const BrandWordmark = () => (
  <img
    className="se-about__logo"
    src={BRAND_PUBLIC_LOGO.light.wordmarkNoTagline}
    alt={BRAND.name}
    width="445"
    height="57"
  />
);

/**
 * Las fotos del equipo, del panel.
 *
 * Se piden una vez para toda la página y se reparten por `id`. La lista de personas no
 * viene de aquí -- esa la tiene `TEAM` -- así que si la petición falla, o si nadie ha
 * subido ninguna foto todavía, la página se dibuja igual de completa con las
 * iniciales. Por eso no hay estado de carga ni de error: no hay nada que esperar.
 */
const useFotosDelEquipo = () => {
  const [fotos, setFotos] = useState({});
  useEffect(() => {
    let vivo = true;
    getFotosDelEquipo().then((mapa) => {
      if (vivo) setFotos(mapa);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return fotos;
};

export const QuienesSomos = () => {
  const { t } = useIdioma();
  const fotos = useFotosDelEquipo();
  useMetaPagina({
    title: t("paginas.quienesSomos.meta.titulo", { marca: BRAND.name }),
    description: t("paginas.quienesSomos.meta.descripcion"),
  });

  return (
    <main className="se-blog se-about" role="main">
      <section className="se-hero se-hero--institutional se-about__hero">
        <div className="se-container">
          <div className="se-about__hero-grid">
            <div className="se-about__hero-copy">
              <h1 className="se-about__title">
                <BrandWordmark />
              </h1>
              {/* Las tres líneas del documento del cliente. La primera hace de
                  entradilla y las otras dos, más cortas, van debajo: qué es,
                  quiénes lo hacen y desde dónde. Antes aquí se repetía el texto
                  del pie de página, que es el mismo párrafo largo que el lector
                  ya se encuentra al final de cada página. */}
              <p className="se-about__tagline">{t("paginas.quienesSomos.intro1")}</p>
              <div className="se-about__intro">
                {["intro2", "intro3"].map((clave) => (
                  <p key={clave} className="se-about__intro-line">
                    {t(`paginas.quienesSomos.${clave}`)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* El diagrama de "Objetivos" se quito a pedido del cliente (09/2026): solo
          queda el Proposito. `INSTITUTIONAL.flow` tambien se retiro de los datos --
          nada mas lo usaba. */}
      <section className="se-section se-about__bands">
        <div className="se-container">
          {/* El propósito, recortado como una cita de la casa. */}
          <Recortes className="se-about__proposito">
            <Recorte as="article">
              <h2 className="se-about__band-title">{t("paginas.quienesSomos.proposito")}</h2>
              <p className="se-text-body se-about__band-text se-about__band-text--lead">
                {t("paginas.quienesSomos.propositoTexto")}
              </p>
            </Recorte>
          </Recortes>
        </div>
      </section>

      <section className="se-section se-about__team">
        <div className="se-container">
          <header className="se-about__team-head">
            <h2 className="se-heading-section se-about__team-title">{t("paginas.quienesSomos.equipo")}</h2>
            <p className="se-text-body se-about__team-lead">{t("paginas.quienesSomos.equipoLead")}</p>
          </header>

          {/* Seis grupos, calcados del documento del cliente ("Quiénes Somos - SurE",
              15/09/2026) y en su mismo orden, ahora como organigrama. La misma persona
              puede estar en más de un grupo -- ver el comentario de `TEAM` --: cada
              bloque es un cargo o un comité, no una casilla exclusiva. */}
          <ArbolDelEquipo fotos={fotos} />
        </div>
      </section>
    </main>
  );
};

