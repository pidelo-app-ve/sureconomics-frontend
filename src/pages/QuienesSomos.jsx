import { BRAND, INSTITUTIONAL, TEAM } from "../data/surEconomicsMock";
import { TeamMemberCard } from "../components/institutional/TeamMemberCard";
import { useMemo } from "react";

const TeamSection = ({ title, members, defaultOpen }) => {
  if (!members?.length) return null;
  return (
    <details className="se-about__acc" defaultOpen={defaultOpen}>
      <summary className="se-about__acc-summary">
        <span className="se-about__acc-title">{title}</span>
        <span className="se-about__acc-meta">{members.length}</span>
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

export const QuienesSomos = () => {
  const defaultAccordionOpen = useMemo(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 960px)").matches;
  }, []);

  return (
    <main className="se-blog se-about" role="main">
      <section className="se-hero se-hero--institutional se-about__hero">
        <div className="se-container">
          <div className="se-about__hero-grid">
            <div className="se-about__hero-copy">
              <p className="se-about__kicker">Quiénes somos</p>
              <h1 className="se-about__title">{BRAND.name}</h1>
              <p className="se-about__tagline">{BRAND.tagline}</p>
              <p className="se-text-body se-about__desc">{INSTITUTIONAL.purpose}</p>
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
            <h2 className="se-heading-section" style={{ margin: 0 }}>
              Equipo
            </h2>
            <p className="se-text-body se-about__team-lead">
              La estructura editorial y operativa detrás de Sur Economics.
            </p>
          </header>

          <div className="se-about__acc-list">
            <TeamSection
              title="Liderazgo / dirección editorial"
              members={TEAM.leadership}
              defaultOpen={defaultAccordionOpen}
            />
            <TeamSection
              title="Consejo Editorial"
              members={TEAM.editorialBoard}
              defaultOpen={defaultAccordionOpen}
            />
            <TeamSection
              title="Equipo operativo"
              members={TEAM.operational}
              defaultOpen={defaultAccordionOpen}
            />
            <TeamSection
              title="Colaboradores"
              members={TEAM.collaborators}
              defaultOpen={defaultAccordionOpen}
            />
            <TeamSection
              title="Equipo de investigación"
              members={TEAM.researchTeam}
              defaultOpen={defaultAccordionOpen}
            />
          </div>
        </div>
      </section>
    </main>
  );
};

