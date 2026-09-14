import { BRAND, INSTITUTIONAL, TEAM, claveDeFoto } from "../data/surEconomicsMock";
import { getFotosDelEquipo } from "../services/publicContentService";
import { BRAND_PUBLIC_LOGO } from "../brand/publicBrandLogos";
import { TeamMemberCard } from "../components/institutional/TeamMemberCard";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";

const useInitialAccordionOpen = () => {
  const [initiallyOpen, setInitiallyOpen] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia?.("(min-width: 960px)");
    setInitiallyOpen(Boolean(mq?.matches));
  }, []);
  return initiallyOpen;
};

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

const TeamSection = ({ title, members, initiallyOpen, fotos }) => {
  const hasMembers = Boolean(members?.length);
  const [open, setOpen] = useState(Boolean(initiallyOpen));
  useEffect(() => {
    setOpen(Boolean(initiallyOpen));
  }, [initiallyOpen]);

  if (!hasMembers) return null;

  return (
    <details
      className="se-about__acc"
      open={open}
      onToggle={(e) => setOpen(Boolean(e.currentTarget.open))}
    >
      <summary className="se-about__acc-summary" aria-label={`Abrir sección ${title}`}>
        <span className="se-about__acc-title">{title}</span>
        <span className="se-about__acc-right">
          <span className="se-about__acc-meta" aria-label={`${members.length} integrantes`}>
            {members.length}
          </span>
          <span className="se-about__acc-chevron" aria-hidden="true" />
        </span>
      </summary>
      <div className="se-about__acc-body">
        <div className="se-team-grid">
          {members.map((m) => (
            <TeamMemberCard key={m.id} member={m} foto={fotos?.[claveDeFoto(m)] || ""} />
          ))}
        </div>
      </div>
    </details>
  );
};

TeamSection.propTypes = {
  title: PropTypes.string.isRequired,
  members: PropTypes.arrayOf(PropTypes.object),
  initiallyOpen: PropTypes.bool,
  /** `{ id de persona: direccion }`. Quien no este, sale con sus iniciales. */
  fotos: PropTypes.objectOf(PropTypes.string),
};

export const QuienesSomos = () => {
  const initiallyOpen = useInitialAccordionOpen();
  const fotos = useFotosDelEquipo();

  return (
    <main className="se-blog se-about" role="main">
      <section className="se-hero se-hero--institutional se-about__hero">
        <div className="se-container">
          <div className="se-about__hero-grid">
            <div className="se-about__hero-copy">
              <p className="se-about__kicker">Quiénes somos</p>
              <h1 className="se-about__title">
                <BrandWordmark />
              </h1>
              {/* Las tres líneas del documento del cliente. La primera hace de
                  entradilla y las otras dos, más cortas, van debajo: qué es,
                  quiénes lo hacen y desde dónde. Antes aquí se repetía el texto
                  del pie de página, que es el mismo párrafo largo que el lector
                  ya se encuentra al final de cada página. */}
              <p className="se-about__tagline">{INSTITUTIONAL.intro[0]}</p>
              <div className="se-about__intro">
                {INSTITUTIONAL.intro.slice(1).map((linea) => (
                  <p key={linea} className="se-about__intro-line">
                    {linea}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Los objetivos, que son este recorrido y ya no una lista aparte.
          Antes la página los decía dos veces: aquí el diagrama del documento del
          cliente y debajo cinco objetivos en prosa que repetían lo mismo. Los
          cinco están disueltos dentro de los cuatro pasos; ver `INSTITUTIONAL.flow`. */}
      <section className="se-section se-about__flow" aria-labelledby="se-flow-title">
        <div className="se-container">
          <header className="se-about__flow-head">
            <h2 className="se-heading-section se-about__flow-title" id="se-flow-title">
              Objetivos
            </h2>
            <p className="se-about__flow-lead">De la investigación a la decisión.</p>
          </header>

          {/* La franja que en el documento es una flecha sobre los cuatro pasos:
              todo el recorrido ocurre en la región, no es un paso más. */}
          <p className="se-about__flow-region">
            <span className="se-about__flow-region-text">Latinoamérica</span>
          </p>

          <ol className="se-about__flow-steps">
            {INSTITUTIONAL.flow.map((paso, idx) => (
              <li key={paso.title} className="se-about__flow-step">
                {/* El número es decorativo: el orden ya lo lleva la lista ordenada,
                    así que repetírselo a un lector de pantalla sería ruido. */}
                <span className="se-about__flow-step-num" aria-hidden="true">
                  {idx + 1}
                </span>
                <h3 className="se-about__flow-step-title">{paso.title}</h3>
                <p className="se-about__flow-step-text">{paso.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="se-section se-about__bands">
        <div className="se-container">
          <article className="se-about__band se-about__band--alt">
            <h2 className="se-about__band-title">Propósito</h2>
            <p className="se-text-body se-about__band-text se-about__band-text--lead">
              {INSTITUTIONAL.purpose}
            </p>
          </article>
        </div>
      </section>

      <section className="se-section se-about__team">
        <div className="se-container">
          <header className="se-about__team-head">
            <h2 className="se-heading-section se-about__team-title">Equipo</h2>
            <p className="se-text-body se-about__team-lead">
              La estructura editorial y operativa detrás de SurEconomics.
            </p>
          </header>

          <div className="se-about__acc-list">
            {/* Reestructurado a pedido del cliente (10/2026): solo estos tres
                grupos quedan en la pagina. "Colaboradores" y "Equipo de
                investigacion" se retiraron -- no solo se vaciaron -- porque
                un titulo de seccion sin nadie debajo se leeria como un hueco. */}
            <TeamSection
              title="Junta Directiva"
              members={TEAM.board}
              initiallyOpen={initiallyOpen}
              fotos={fotos}
            />
            <TeamSection
              title="Consejo Editorial"
              members={TEAM.editorialBoard}
              initiallyOpen={initiallyOpen}
              fotos={fotos}
            />
            <TeamSection
              title="Equipo operativo"
              members={TEAM.operational}
              initiallyOpen={initiallyOpen}
              fotos={fotos}
            />
          </div>
        </div>
      </section>
    </main>
  );
};

