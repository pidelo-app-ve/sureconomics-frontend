import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha } from "../../i18n/motor";
import { fondoDeTema } from "../../lib/tarjeta";
import { ShareButtons } from "../content/ShareButtons";

export const PostCard = ({
  slug,
  category,
  title,
  excerpt,
  date,
  readTime,
  author,
  imageUrl,
  variant = "default",
}) => {
  const { t } = useIdioma();
  const isHero = variant === "hero";
  const url = `/articulo/${slug}`;

  return (
    <article className={`se-card se-card--${variant}`} aria-labelledby={`title-${slug}`}>
      <Enlace to={url} className="se-card__media-link">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={`se-card__img ${isHero ? "se-card__img--hero" : ""}`}
            loading={isHero ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          /* The grey line drawing this used to render is what the front page was
             showing for a piece with no photograph, and it read as a broken image. A
             colour field from the topic instead -- and nothing written on it,
             because this card prints the topic directly underneath, and the first
             version of this said "Agro y Alimentos" twice in a row. */
          <div
            className={`se-cardfill${isHero ? " se-cardfill--hero" : ""}`}
            style={{ background: fondoDeTema(category) }}
            aria-hidden="true"
          />
        )}
      </Enlace>
      <div className="se-card__body">
        <span className="se-meta se-meta--category">{category}</span>
        <h2 className="se-heading-card" id={`title-${slug}`}>
          <Enlace to={url}>{title}</Enlace>
        </h2>
        {excerpt && (
          <p className="se-card__excerpt se-text-body">{excerpt}</p>
        )}
        <div className="se-card__meta">
          <time dateTime={date}>{formatearFecha(date, "larga") || date}</time>
          {readTime && <span className="se-card__read-time">{readTime}</span>}
          {author && <span className="se-card__author">{t("portada.tarjeta.por", { autor: author })}</span>}
        </div>
        <div className="se-card__share">
          <ShareButtons url={url} title={title} />
        </div>
        <Enlace to={url} className="se-link se-card__cta">
          {t("comun.leerMas")}
        </Enlace>
      </div>
    </article>
  );
};

PostCard.propTypes = {
  slug: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  excerpt: PropTypes.string,
  date: PropTypes.string.isRequired,
  readTime: PropTypes.string,
  author: PropTypes.string,
  imageUrl: PropTypes.string,
  variant: PropTypes.oneOf(["default", "hero", "compact"]),
};
