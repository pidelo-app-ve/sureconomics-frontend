import { PostCard } from "./PostCard";
import PropTypes from "prop-types";

export const BlogFeed = ({ posts = [] }) => {
  return (
    <section className="se-feed se-section" aria-labelledby="feed-title">
      <div className="se-container">
        <h2 id="feed-title" className="se-heading-section">
          Últimas publicaciones
        </h2>
        <ul className="se-feed__list">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

BlogFeed.propTypes = {
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
