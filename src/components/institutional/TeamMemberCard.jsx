import PropTypes from "prop-types";

const getInitials = (name) => {
  const parts = String(name ?? "")
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "SE";
};

export const TeamMemberCard = ({ member }) => {
  const initials = getInitials(member?.name);

  const hasExternalCv = Boolean(member?.cvUrl && member.cvUrl !== "#");
  const hasEmail = Boolean(member?.email);

  return (
    <article className="se-member-card">
      <div className="se-member-card__top">
        <div className="se-member-card__avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="se-member-card__identity">
          <h3 className="se-member-card__name">{member.name}</h3>
          <div className="se-member-card__role">{member.role}</div>
        </div>
      </div>

      {member.summary && (
        <p className="se-member-card__summary se-text-body">
          {member.summary}
        </p>
      )}

      {(hasEmail || hasExternalCv) && (
        <div className="se-member-card__links">
          {hasEmail && (
            <a
              href={`mailto:${member.email}`}
              className="se-link se-member-card__link"
              aria-label={`Enviar email a ${member.name}`}
            >
              Email
            </a>
          )}
          {hasExternalCv && (
            <a
              href={member.cvUrl}
              target="_blank"
              rel="noreferrer"
              className="se-link se-member-card__link"
            >
              CV / Perfil
            </a>
          )}
        </div>
      )}
    </article>
  );
};

TeamMemberCard.propTypes = {
  member: PropTypes.shape({
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    summary: PropTypes.string,
    cvUrl: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
};

