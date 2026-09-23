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

export const TeamMemberCard = ({ member, foto }) => {
  const initials = getInitials(member?.name);

  const hasExternalCv = Boolean(member?.cvUrl && member.cvUrl !== "#");
  const hasEmail = Boolean(member?.email);
  const hasLinkedin = Boolean(member?.linkedin);

  return (
    <article className="se-member-card">
      <div className="se-member-card__top">
        {/* La foto si la hay, y si no las iniciales. Sin foto es un estado normal
            de esta página -- no todo el mundo manda la suya -- así que no se pinta
            un hueco gris esperándola.

            `alt` vacío y `aria-hidden` por lo mismo que llevaban las iniciales: el
            nombre está escrito al lado, en el titular de la tarjeta, y repetirlo
            aquí haría que un lector de pantalla lo dijera dos veces seguidas. */}
        {foto ? (
          <img
            className="se-member-card__avatar se-member-card__avatar--foto"
            src={foto}
            alt=""
            aria-hidden="true"
            width="54"
            height="54"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="se-member-card__avatar" aria-hidden="true">
            {initials}
          </div>
        )}
        <div className="se-member-card__identity">
          <h3 className="se-member-card__name">{member.name}</h3>
          {/* El cargo se quito de todas las fichas a pedido del cliente (15/09/2026):
              solo Colaboradores lleva algo debajo del nombre, y es su credencial
              (`bio`), no un cargo -- de donde viene la persona, no que hace aqui. */}
          {member.bio ? <p className="se-member-card__bio">{member.bio}</p> : null}
        </div>
      </div>

      {(hasEmail || hasExternalCv || hasLinkedin) && (
        <div className="se-member-card__links">
          {hasEmail && (
            <a
              href={`mailto:${member.email}`}
              className="se-link se-member-card__link"
              aria-label={`Enviar correo a ${member.name}`}
            >
              Correo
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
          {/* El último de la fila: el correo es la vía de contacto que ofrece la casa,
              y el perfil es de la persona. `noopener` además de `noreferrer` -- este
              último ya lo implica en los navegadores actuales, pero escribirlo es lo
              que evita que una pestaña ajena pueda manipular la nuestra si alguno se
              queda atrás.

              El nombre va en el `aria-label` porque en una rejilla de veinte tarjetas
              un lector de pantalla leería «LinkedIn» veinte veces sin decir de quién. */}
          {hasLinkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="se-link se-member-card__link"
              aria-label={`Perfil de ${member.name} en LinkedIn`}
            >
              LinkedIn
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
    // Solo en Colaboradores: de donde viene la persona, no que hace aqui.
    bio: PropTypes.string,
    cvUrl: PropTypes.string,
    email: PropTypes.string,
    /** Su perfil. Sale de `LINKEDIN` en los datos, que lo guarda una sola vez. */
    linkedin: PropTypes.string,
  }).isRequired,
  /** La dirección de su foto, si alguien la subió desde el panel. */
  foto: PropTypes.string,
};

TeamMemberCard.defaultProps = { foto: "" };

