import { PostCard } from "./PostCard";
import { HERO_CLAIM, HERO_FEATURED } from "../../data/blogMock";

export const Hero = () => {
  return (
    <section className="se-hero" aria-label="Destacado principal">
      <div className="se-container">
        <div className="se-hero__text">
          <h1 className="se-heading-hero">Sur Economics</h1>
          <p className="se-text-lead se-hero__claim">{HERO_CLAIM}</p>
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
            variant="hero"
          />
        </div>
      </div>
    </section>
  );
};
