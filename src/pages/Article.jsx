import { Link, useParams } from "react-router-dom";
import { getPostBySlug, formatDate } from "../data/blogMock";
import { PlaceholderImage } from "../components/blog";

const MOCK_BODY = `
<p>Este es un espacio reservado para el contenido completo del artículo. En la siguiente fase, el contenido se cargará desde un CMS o API.</p>
<p>Sur Economics se centra en ofrecer análisis riguroso y accesible sobre economía, inflación, política monetaria y mercados en la región. Nuestros artículos están pensados para lectores que buscan claridad y criterio en sus decisiones financieras.</p>
<p>La estructura de esta página está preparada para recibir contenido en HTML o Markdown y mostrarlo con la misma estética editorial del blog.</p>
`;

export const Article = () => {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <main className="se-blog se-article">
        <div className="se-container se-container--narrow">
          <h1 className="se-heading-section">Artículo no encontrado</h1>
          <p className="se-text-body">
            El enlace puede estar roto o el artículo ya no está disponible.
          </p>
          <Link to="/" className="se-link" style={{ marginTop: "1rem", display: "inline-block" }}>
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="se-blog se-article" role="main">
      <article>
        <header className="se-article__header">
          <div className="se-container se-container--narrow">
            <span className="se-meta se-meta--category">{post.category}</span>
            <h1 className="se-article__title">{post.title}</h1>
            <div className="se-article__meta">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.readTime && (
                <span className="se-article__read-time">{post.readTime} de lectura</span>
              )}
              {post.author && <span className="se-article__author">Por {post.author}</span>}
            </div>
          </div>
        </header>
        <div className="se-article__media se-container">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt=""
              className="se-article__img"
              loading="eager"
              decoding="async"
            />
          ) : (
            <PlaceholderImage variant={post.imagePlaceholder} hero />
          )}
        </div>
        <div className="se-article__body se-container">
          <div className="se-container--narrow se-article__content">
            <p className="se-text-lead">{post.excerpt}</p>
            <div
              className="se-article__prose se-text-body"
              dangerouslySetInnerHTML={{ __html: MOCK_BODY }}
            />
          </div>
        </div>
      </article>
      <div className="se-container se-article__back">
        <Link to="/" className="se-link">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
};
