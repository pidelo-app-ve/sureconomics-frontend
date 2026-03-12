import { PostCard } from "./PostCard";
import { FEATURED_POSTS } from "../../data/blogMock";

export const FeaturedPosts = () => {
  return (
    <section className="se-featured se-section" aria-labelledby="featured-title">
      <div className="se-container">
        <h2 id="featured-title" className="se-heading-section">
          Destacados
        </h2>
        <div className="se-featured__grid">
          {FEATURED_POSTS.map((post) => (
            <PostCard
              key={post.id}
              slug={post.slug}
              category={post.category}
              title={post.title}
              excerpt={post.excerpt}
              date={post.date}
              readTime={post.readTime}
              imagePlaceholder={post.imagePlaceholder}
              imageUrl={post.imageUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
