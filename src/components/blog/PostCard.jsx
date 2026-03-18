import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { PlaceholderImage } from "./PlaceholderImage";
import { formatDate } from "../../data/blogMock";

export const PostCard = ({
  slug,
  category,
  title,
  excerpt,
  date,
  readTime,
  author,
  imagePlaceholder,
  imageUrl,
  variant = "default",
}) => {
  const isHero = variant === "hero";
  const url = `/articulo/${slug}`;

  return (
    <article className={`se-card se-card--${variant}`} aria-labelledby={`title-${slug}`}>
      <Link to={url} className="se-card__media-link">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={`se-card__img ${isHero ? "se-card__img--hero" : ""}`}
            loading={isHero ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <PlaceholderImage variant={imagePlaceholder} hero={isHero} />
        )}
      </Link>
      <div className="se-card__body">
        <span className="se-meta se-meta--category">{category}</span>
        <h2 className="se-heading-card" id={`title-${slug}`}>
          <Link to={url}>{title}</Link>
        </h2>
        {excerpt && (
          <p className="se-card__excerpt se-text-body">{excerpt}</p>
        )}
        <div className="se-card__meta">
          <time dateTime={date}>{formatDate(date)}</time>
          {readTime && <span className="se-card__read-time">{readTime}</span>}
          {author && <span className="se-card__author">Por {author}</span>}
        </div>
        <Link to={url} className="se-link se-card__cta">
          Leer más
        </Link>
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
  imagePlaceholder: PropTypes.oneOf(["chart", "building", "growth"]),
  imageUrl: PropTypes.string,
  variant: PropTypes.oneOf(["default", "hero", "compact"]),
};
