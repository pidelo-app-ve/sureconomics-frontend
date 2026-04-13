import { Link } from "react-router-dom";
import { PostCard } from "./PostCard";
import { BRAND } from "../../data/surEconomicsMock";
import PropTypes from "prop-types";

export const Hero = ({ featuredPost }) => {
  const heroClaim = "Análisis y perspectiva sobre economía, mercados e inversión en la región.";
  return (
    <section className="se-hero" aria-label="Destacado principal">
      <div className="se-container">
        <div className="se-hero__text">
          <h1 className="se-heading-hero">{BRAND.name}</h1>
          <p className="se-text-lead se-hero__claim">{heroClaim}</p>
          <p className="se-text-body se-hero__description">{BRAND.description}</p>
          <div className="se-hero__actions">
            <Link to="/articulos" className="se-btn">
              Explorar artículos
            </Link>
            <Link to="/suscribirse" className="se-btn se-btn--secondary">
              Acceso premium
            </Link>
          </div>
        </div>
        <div className="se-hero__featured">
          {featuredPost ? (
            <PostCard
              slug={featuredPost.slug}
              category={featuredPost.category}
              title={featuredPost.title}
              excerpt={featuredPost.excerpt}
              date={featuredPost.date}
              readTime={featuredPost.readTime}
              imagePlaceholder={featuredPost.imagePlaceholder}
              imageUrl={featuredPost.imageUrl}
              author={featuredPost.author}
              variant="hero"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
};

Hero.propTypes = {
  featuredPost: PropTypes.shape({
    id: PropTypes.string,
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    date: PropTypes.string,
    category: PropTypes.string,
    author: PropTypes.string,
    imageUrl: PropTypes.string,
    imagePlaceholder: PropTypes.oneOf(["chart", "building", "growth"]),
    readTime: PropTypes.string,
  }),
};
