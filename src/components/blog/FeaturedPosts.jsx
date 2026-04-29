import { PostCard } from "./PostCard";
import PropTypes from "prop-types";
import { useRef } from "react";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";

export const FeaturedPosts = ({ posts = [] }) => {
  const sectionRef = useRef(null);
  useRevealOnScroll(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="se-featured se-section se-reveal se-reveal--stagger"
      aria-labelledby="featured-title"
    >
      <div className="se-container">
        <h2 id="featured-title" className="se-heading-section">
          Destacados
        </h2>
        <div className="se-featured__grid">
          {posts.map((post) => (
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
              author={post.author}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

FeaturedPosts.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      category: PropTypes.string,
      title: PropTypes.string.isRequired,
      excerpt: PropTypes.string,
      date: PropTypes.string,
      readTime: PropTypes.string,
      imagePlaceholder: PropTypes.oneOf(["chart", "building", "growth"]),
      imageUrl: PropTypes.string,
      author: PropTypes.string,
    })
  ),
};
