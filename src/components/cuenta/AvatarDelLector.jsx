import PropTypes from "prop-types";

/**
 * La cara del lector, en pequeño: su foto o sus iniciales.
 *
 * Existe porque el retrato hacía falta en dos sitios —el perfil, donde se sube, y el
 * saludo del inicio— y la regla de las iniciales estaba escrita en uno solo. Dos copias
 * de «coge la primera letra del nombre y la del apellido» se separan en cuanto alguien
 * toque una: son las mismas iniciales o no son las iniciales de nadie.
 *
 * ## El respaldo son iniciales y no una silueta gris
 *
 * Una silueta genérica se lee como «no se pudo cargar la imagen». Las iniciales sobre el
 * verde de marca se leen como «esta cuenta todavía no tiene foto», que es lo que pasa —
 * y además identifican: en una lista de comentarios, «AL» distingue y una silueta no.
 *
 * ## `alt` vacío a propósito
 *
 * El nombre va escrito al lado, siempre. Un `alt="Foto de Ana Lectora"` junto a un texto
 * que ya dice «Ana Lectora» hace que un lector de pantalla lo anuncie dos veces.
 */
export const AvatarDelLector = ({ perfil, tamano = "md" }) => {
  const iniciales =
    [perfil?.firstName, perfil?.lastName]
      .filter(Boolean)
      .map((p) => p.trim().charAt(0).toUpperCase())
      .join("") ||
    perfil?.email?.trim().charAt(0).toUpperCase() ||
    "?";

  return (
    <span className={`se-avatar se-avatar--${tamano}`} aria-hidden="true">
      {perfil?.photoUrl ? (
        <img src={perfil.photoUrl} alt="" className="se-avatar__img" loading="lazy" />
      ) : (
        <span className="se-avatar__iniciales">{iniciales}</span>
      )}
    </span>
  );
};

AvatarDelLector.propTypes = {
  perfil: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    photoUrl: PropTypes.string,
  }),
  /** `sm` para una fila, `md` junto a un titular, `lg` en el perfil. */
  tamano: PropTypes.oneOf(["sm", "md", "lg"]),
};

export default AvatarDelLector;
