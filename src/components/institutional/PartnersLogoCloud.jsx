import PropTypes from "prop-types";

export const PartnersLogoCloud = ({ partners }) => {
  return (
    <section className="se-partners" aria-label="Partners y aliados">
      <div className="se-container">
        <div className="se-partners__head">
          <h2 className="se-heading-section">Aliados institucionales</h2>
          <p className="se-text-body">
            Una red de marcas asociadas al ecosistema de investigación, inversión y asesoría.
          </p>
        </div>

        <ul className="se-partners__grid" aria-label="Logos de aliados">
          {partners.map((p) => (
            <li key={p.id} className="se-partners__item">
              <div className="se-partners__logo" aria-label={p.name}>
                {p.name}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

PartnersLogoCloud.propTypes = {
  partners: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
  ).isRequired,
};

