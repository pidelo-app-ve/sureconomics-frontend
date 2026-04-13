import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export const SuggestedReading = ({ posts = [] }) => {
  return (
    <section className="se-suggested se-section" aria-labelledby="suggested-title">
      <div className="se-container">
        <h2 id="suggested-title" className="se-heading-section">
          También te puede interesar
        </h2>
        <ul className="se-suggested__list">
          {posts.map((post) => {
            const hasImage = Boolean(post?.imageUrl);
            return (
              <li key={post.id} className="se-suggested__item">
                <Link
                  to={`/articulo/${post.slug}`}
                  className={`se-suggested__link-wrap ${!hasImage ? "se-suggested__link-wrap--no-thumb" : ""}`}
                >
                  {hasImage && (
                    <span className="se-suggested__thumb">
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="se-suggested__img"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                  )}
                  <span className="se-suggested__text">
                    <span className="se-meta se-suggested__category">{post.category}</span>
                    <span className="se-suggested__link">{post.title}</span>
                    {post.readTime ? (
                      <span className="se-suggested__read-time">{post.readTime}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

SuggestedReading.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      category: PropTypes.string,
      imageUrl: PropTypes.string,
      readTime: PropTypes.string,
    })
  ),
};
