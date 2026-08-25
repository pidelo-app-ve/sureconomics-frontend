import { PostCard } from "./PostCard";
import PropTypes from "prop-types";
import { useRef } from "react";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";

export const BlogFeed = ({ posts = [] }) => {
  const sectionRef = useRef(null);
  useRevealOnScroll(sectionRef);

  return (
    <section ref={sectionRef} className="se-feed se-section se-reveal se-reveal--stagger" aria-labelledby="feed-title">
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
      imageUrl: PropTypes.string,
      author: PropTypes.string,
    })
  ),
};
