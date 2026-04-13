import { PostCard } from "./PostCard";
import PropTypes from "prop-types";

export const FeaturedPosts = ({ posts = [] }) => {
  return (
    <section className="se-featured se-section" aria-labelledby="featured-title">
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
