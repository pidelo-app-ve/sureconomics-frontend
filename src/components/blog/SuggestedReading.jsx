import { Link } from "react-router-dom";
import { SUGGESTED_READING, getPostBySlug } from "../../data/blogMock";

export const SuggestedReading = () => {
  return (
    <section className="se-suggested se-section" aria-labelledby="suggested-title">
      <div className="se-container">
        <h2 id="suggested-title" className="se-heading-section">
          También te puede interesar
        </h2>
        <ul className="se-suggested__list">
          {SUGGESTED_READING.map((item) => {
            const post = getPostBySlug(item.slug);
            const hasImage = Boolean(post?.imageUrl);
            return (
              <li key={item.id} className="se-suggested__item">
                <Link
                  to={`/articulo/${item.slug}`}
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
                    <span className="se-meta se-suggested__category">{item.category}</span>
                    <span className="se-suggested__link">{item.title}</span>
                    <span className="se-suggested__read-time">{item.readTime}</span>
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
