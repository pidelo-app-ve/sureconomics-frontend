import { BRAND, INSTITUTIONAL, TEAM } from "../data/surEconomicsMock";
import { TeamMemberCard } from "../components/institutional/TeamMemberCard";
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const useInitialAccordionOpen = () => {
  const [initiallyOpen, setInitiallyOpen] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia?.("(min-width: 960px)");
    setInitiallyOpen(Boolean(mq?.matches));
  }, []);
  return initiallyOpen;
};

const BrandWordmark = () => {
  return (
    <span className="se-about__wordmark" aria-label={BRAND.name}>
      <span className="se-about__wordmark-sur">Sur</span>
      <span className="se-about__wordmark-e se-logomark-e" aria-hidden="true">
        E
      </span>
      <span className="se-about__wordmark-rest">conomics</span>
    </span>
  );
};

const TeamSection = ({ title, members, initiallyOpen }) => {
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
            <TeamMemberCard key={m.id} member={m} />
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
};

export const QuienesSomos = () => {
  const initiallyOpen = useInitialAccordionOpen();
  const signals = useMemo(
    () => [
      {
        title: "Investigación",
        description: "datos + contexto + comprensión = conocimiento",
      },
      {
        title: "Lectura ejecutiva",
        description: "resúmenes + análisis = información + toma de decisiones",
      },
      {
        title: "Red regional",
        description: "una mirada de LATAM con estándares de primer mundo",
      },
    ],
    []
  );

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
              <p className="se-about__tagline">{BRAND.tagline}</p>
              <p className="se-text-body se-about__desc">{BRAND.description}</p>
            </div>
            <div className="se-about__hero-aside" aria-hidden="true">
              <div className="se-about__hero-card">
                <div className="se-about__hero-card-title">Enfoque</div>
                <div className="se-about__hero-card-body">
                  <div className="se-about__hero-bullets">
                    <div className="se-about__hero-bullet">Economía + mercados</div>
                    <div className="se-about__hero-bullet">Contexto regional</div>
                    <div className="se-about__hero-bullet">Lectura ejecutiva</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="se-section se-about__signals" aria-label="Señales editoriales">
        <div className="se-container">
          <div className="se-about__signals-grid">
            {signals.map((s) => (
              <article key={s.title} className="se-about__signal">
                <h2 className="se-about__signal-title">{s.title}</h2>
                <p className="se-about__signal-desc">{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="se-section se-about__bands">
        <div className="se-container">
          <div className="se-about__band-grid">
            <article className="se-about__band">
              <h2 className="se-about__band-title">Propósito</h2>
              <p className="se-text-body se-about__band-text">{INSTITUTIONAL.purpose}</p>
            </article>
            <article className="se-about__band se-about__band--alt">
              <h2 className="se-about__band-title">Objetivos</h2>
              <ol className="se-about__objectives" aria-label="Objetivos">
                {INSTITUTIONAL.objectives.map((obj, idx) => (
                  <li key={idx} className="se-about__objective">
                    <span className="se-about__objective-num">{idx + 1}</span>
                    <span className="se-about__objective-text">{obj}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
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
            <TeamSection
              title="Liderazgo / dirección editorial"
              members={TEAM.leadership}
              initiallyOpen={initiallyOpen}
            />
            <TeamSection
              title="Consejo Editorial"
              members={TEAM.editorialBoard}
              initiallyOpen={initiallyOpen}
            />
            <TeamSection
              title="Equipo operativo"
              members={TEAM.operational}
              initiallyOpen={initiallyOpen}
            />
            <TeamSection
              title="Colaboradores"
              members={TEAM.collaborators}
              initiallyOpen={initiallyOpen}
            />
            <TeamSection
              title="Equipo de investigación"
              members={TEAM.researchTeam}
              initiallyOpen={initiallyOpen}
            />
          </div>
        </div>
      </section>
    </main>
  );
};

