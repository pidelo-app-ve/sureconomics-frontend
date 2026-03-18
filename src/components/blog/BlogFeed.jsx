import { PostCard } from "./PostCard";
import { BLOG_FEED } from "../../data/blogMock";

export const BlogFeed = () => {
  return (
    <section className="se-feed se-section" aria-labelledby="feed-title">
      <div className="se-container">
        <h2 id="feed-title" className="se-heading-section">
          Últimas publicaciones
        </h2>
        <ul className="se-feed__list">
          {BLOG_FEED.map((post) => (
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
