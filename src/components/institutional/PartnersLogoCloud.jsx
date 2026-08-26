import PropTypes from "prop-types";
import { useRef } from "react";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";

/**
 * Las unidades del grupo, con su logo.
 *
 * Antes eran los nombres puestos en una caja, que es lo que se pidió cambiar: una
 * marca se reconoce por su logo antes de leerse.
 *
 * `logo` en nulo cae al nombre. No es un adorno defensivo: la lista tiene unidades
 * cuyo archivo todavía no existe, y un hueco vacío en la rejilla se leería como que
 * la marca no está.
 *
 * Los logos llegan con fondo blanco opaco —tres de los cinco no traen
 * transparencia— así que van sobre papel y no sobre un parche de color. Con el
 * enfoque visual claro eso deja de ser un problema y pasa a ser lo correcto.
 */
const Marca = ({ aliada }) => (
  <>
    {aliada.logo ? (
      <img
        className="se-partners__img"
        src={aliada.logo}
        alt={aliada.nameLong ?? aliada.name}
        loading="lazy"
        decoding="async"
      />
    ) : (
      <span className="se-partners__name">{aliada.name}</span>
    )}
  </>
);

const formaAliada = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  nameLong: PropTypes.string,
  logo: PropTypes.string,
  url: PropTypes.string,
});

Marca.propTypes = { aliada: formaAliada.isRequired };

export const PartnersLogoCloud = ({ partners }) => {
  const sectionRef = useRef(null);
  useRevealOnScroll(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="se-partners se-reveal se-reveal--stagger"
      aria-label="Partners y aliados"
    >
      <div className="se-container">
        <div className="se-partners__head">
          <h2 className="se-heading-section">Aliados institucionales</h2>
          <p className="se-text-body">
            Una red de marcas asociadas al ecosistema de investigación, inversión y asesoría.
          </p>
        </div>

        <ul className="se-partners__grid" aria-label="Logos de aliados">
          {partners.map((aliada) => (
            <li key={aliada.id} className="se-partners__item">
              {/* Enlace solo cuando la unidad tiene sitio propio. Un enlace que no
                  lleva a ninguna parte es peor que un logo quieto. */}
              {aliada.url ? (
                <a
                  className="se-partners__logo se-partners__logo--link"
                  href={aliada.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={aliada.nameLong ?? aliada.name}
                >
                  <Marca aliada={aliada} />
                </a>
              ) : (
                <div className="se-partners__logo" title={aliada.nameLong ?? aliada.name}>
                  <Marca aliada={aliada} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

PartnersLogoCloud.propTypes = {
  partners: PropTypes.arrayOf(formaAliada).isRequired,
};
