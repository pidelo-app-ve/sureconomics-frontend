import { Link } from "react-router-dom";
import { PostCard } from "./PostCard";
import { HERO_CLAIM, HERO_FEATURED } from "../../data/blogMock";
import { BRAND } from "../../data/surEconomicsMock";

export const Hero = () => {
  return (
    <section className="se-hero" aria-label="Destacado principal">
      <div className="se-container">
        <div className="se-hero__text">
          <h1 className="se-heading-hero">{BRAND.name}</h1>
          <p className="se-text-lead se-hero__claim">{HERO_CLAIM}</p>
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
          <PostCard
            slug={HERO_FEATURED.slug}
            category={HERO_FEATURED.category}
            title={HERO_FEATURED.title}
            excerpt={HERO_FEATURED.excerpt}
            date={HERO_FEATURED.date}
            readTime={HERO_FEATURED.readTime}
            imagePlaceholder={HERO_FEATURED.imagePlaceholder}
            imageUrl={HERO_FEATURED.imageUrl}
            author={HERO_FEATURED.author}
            variant="hero"
          />
        </div>
      </div>
    </section>
  );
};
