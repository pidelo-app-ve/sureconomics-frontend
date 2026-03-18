import { BRAND, INSTITUTIONAL, TEAM } from "../data/surEconomicsMock";
import { TeamMemberCard } from "../components/institutional/TeamMemberCard";

const SectionBlock = ({ title, children }) => {
  return (
    <section className="se-section se-section--narrow">
      <h2 className="se-heading-section">{title}</h2>
      {children}
    </section>
  );
};

export const QuienesSomos = () => {
  return (
    <main className="se-blog" role="main">
      <section className="se-hero se-hero--institutional">
        <div className="se-container">
          <div className="se-institutional-hero">
            <h1 className="se-heading-hero">{BRAND.name}</h1>
            <p className="se-text-lead se-hero__claim">{BRAND.tagline}</p>
            <p className="se-text-body se-institutional-hero__desc">
              {INSTITUTIONAL.purpose}
            </p>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <div className="se-two-col">
            <div>
              <h2 className="se-heading-section">Propósito</h2>
              <p className="se-text-body">{INSTITUTIONAL.purpose}</p>
            </div>
            <div>
              <h2 className="se-heading-section">Objetivos</h2>
              <ul className="se-objectives">
                {INSTITUTIONAL.objectives.map((obj, idx) => (
                  <li key={idx} className="se-objectives__item">
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <SectionBlock title="Liderazgo / dirección editorial">
        <div className="se-team-grid">
          {TEAM.leadership.map((m) => (
            <TeamMemberCard key={m.id} member={m} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Consejo Editorial">
        <div className="se-team-grid">
          {TEAM.editorialBoard.map((m) => (
            <TeamMemberCard key={m.id} member={m} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Equipo operativo">
        <div className="se-team-grid">
          {TEAM.operational.map((m) => (
            <TeamMemberCard key={m.id} member={m} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Colaboradores">
        <div className="se-team-grid">
          {TEAM.collaborators.map((m) => (
            <TeamMemberCard key={m.id} member={m} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Equipo de investigación">
        <div className="se-team-grid">
          {TEAM.researchTeam.map((m) => (
            <TeamMemberCard key={m.id} member={m} />
          ))}
        </div>
      </SectionBlock>
    </main>
  );
};

