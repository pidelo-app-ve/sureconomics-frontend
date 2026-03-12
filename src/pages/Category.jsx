import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  NAV_CATEGORIES,
  FEATURED_POSTS,
  BLOG_FEED,
  formatDate,
} from "../data/blogMock";
import { PostCard } from "../components/blog";

export const Category = () => {
  const { slug } = useParams();
  const category = NAV_CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    return (
      <main className="se-blog">
        <div className="se-container">
          <h1 className="se-heading-section">Categoría no encontrada</h1>
          <Link to="/" className="se-link">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const allPosts = [...FEATURED_POSTS, ...BLOG_FEED];
  const posts = allPosts.filter((p) => p.categorySlug === slug);

  return (
    <main className="se-blog" role="main">
      <section className="se-section">
        <div className="se-container">
          <h1 className="se-heading-section">{category.label}</h1>
          {posts.length === 0 ? (
            <p className="se-text-body">No hay artículos en esta categoría.</p>
          ) : (
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
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
};
