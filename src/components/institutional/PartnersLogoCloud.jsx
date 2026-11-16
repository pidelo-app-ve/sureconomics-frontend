import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useRef } from "react";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";

/**
 * Las unidades del grupo, desfilando.
 *
 * Antes era una rejilla de celdas con borde: cada marca dentro de su cuadrito, que
 * es justo lo que un logo ajeno no quiere. Ahora pasan en horizontal, sin caja, con
 * la misma técnica que el cintillo de mercado -- dos pasadas idénticas y el carril
 * se desplaza exactamente la mitad, así el salto del final al principio cae en un
 * punto donde las dos son iguales y no se ve.
 *
 * Se detiene al pasar el ratón, para poder leer una marca o pinchar su enlace, y
 * no se mueve para quien pidió menos movimiento en su sistema: una fila de logos
 * en bucle es decoración, y la decoración es lo primero que sobra ahí.
 *
 * `logo` en nulo cae al nombre. No es cautela: la lista tiene unidades cuyo
 * archivo todavía no existe, y un hueco en el desfile se leería como que la marca
 * no está.
 */
/**
 * Las tallas de un logo de `/brand/aliadas` (16-nov-2026): junto a cada `x.webp` de 432 px
 * hay un `x-280.webp`. El logo se ve a 158 px en el teléfono y a 216 en escritorio, así que
 * la de 280 basta salvo en una pantalla densa de escritorio. Otro archivo, sin tallas.
 */
const tallasDeLogo = (logo) =>
  /^\/brand\/aliadas\/[^/]+\.webp$/.test(logo)
    ? `${logo.replace(/\.webp$/, "-280.webp")} 280w, ${logo} 432w`
    : undefined;

/** Lo ancho que se ve (`.se-partners__img`). */
const SIZES_DE_LOGO = "(max-width: 640px) 158px, 216px";

const Marca = ({ aliada }) =>
  aliada.logo ? (
    <img
      className="se-partners__img"
      src={aliada.logo}
      srcSet={tallasDeLogo(aliada.logo)}
      sizes={tallasDeLogo(aliada.logo) ? SIZES_DE_LOGO : undefined}
      alt={aliada.nameLong ?? aliada.name}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className="se-partners__name">{aliada.name}</span>
  );

const formaAliada = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  nameLong: PropTypes.string,
  logo: PropTypes.string,
  url: PropTypes.string,
});

Marca.propTypes = { aliada: formaAliada.isRequired };

/** Una pasada completa de la lista. Se pinta dos veces para cerrar el bucle. */
const Pasada = ({ partners, oculta }) => (
  <div className="se-partners__run" aria-hidden={oculta ? "true" : undefined}>
    {partners.map((aliada) =>
      aliada.url ? (
        <a
          key={aliada.id}
          className="se-partners__logo se-partners__logo--link"
          href={aliada.url}
          target="_blank"
          rel="noreferrer noopener"
          title={aliada.nameLong ?? aliada.name}
          tabIndex={oculta ? -1 : undefined}
        >
          <Marca aliada={aliada} />
        </a>
      ) : (
        <div
          key={aliada.id}
          className="se-partners__logo"
          title={aliada.nameLong ?? aliada.name}
        >
          <Marca aliada={aliada} />
        </div>
      )
    )}
  </div>
);

Pasada.propTypes = {
  partners: PropTypes.arrayOf(formaAliada).isRequired,
  oculta: PropTypes.bool,
};

Pasada.defaultProps = { oculta: false };

export const PartnersLogoCloud = ({ partners }) => {
  const { t } = useIdioma();
  const sectionRef = useRef(null);
  useRevealOnScroll(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="se-partners se-reveal"
      aria-label={t("paginas.quienesSomos.aliadosRegion")}
    >
      <div className="se-container">
        <div className="se-partners__head">
          <h2 className="se-heading-section">{t("paginas.quienesSomos.aliados")}</h2>
          <p className="se-text-body">{t("paginas.quienesSomos.aliadosTexto")}</p>
        </div>
      </div>

      {/* Fuera del contenedor: el desfile ocupa el ancho de la pantalla y las
          marcas entran y salen por los bordes en vez de aparecer de la nada. */}
      <div className="se-partners__viewport">
        <div className="se-partners__track">
          <Pasada partners={partners} />
          {/* La segunda pasada es la misma lista otra vez, así que para un lector
              de pantalla es ruido: se oculta y queda fuera del tabulador. */}
          <Pasada partners={partners} oculta />
        </div>
      </div>
    </section>
  );
};

PartnersLogoCloud.propTypes = {
  partners: PropTypes.arrayOf(formaAliada).isRequired,
};
