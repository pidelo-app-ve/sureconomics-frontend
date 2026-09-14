import PropTypes from "prop-types";
import { formatDateEs } from "../../lib/date";

export const CommentList = ({ comments, textoVacio }) => {
  if (!comments?.length) {
    return (
      <p className="se-text-body se-comments__empty" role="status">
        {textoVacio}
      </p>
    );
  }

  return (
    <ul className="se-comments__list">
      {comments.map((c) => (
        <li key={c.id || `${c.author}-${c.createdAt}`} className="se-comments__item">
          <div className="se-comments__author">{c.author}</div>
          {c.createdAt ? (
            <time className="se-meta" dateTime={c.createdAt}>
              {formatDateEs(c.createdAt)}
            </time>
          ) : null}
          <p className="se-comments__body">{c.content}</p>
          {c.status && String(c.status).toLowerCase().includes("pend") ? (
            <p className="se-comments__pending">Comentario en revisión.</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
};

CommentList.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      author: PropTypes.string,
      content: PropTypes.string,
      createdAt: PropTypes.string,
      status: PropTypes.string,
    })
  ),
  /**
   * Qué decir cuando no hay ninguno.
   *
   * Es un prop y no un texto fijo porque el caso "todavía nadie ha comentado" y el caso
   * "usted acaba de comentar y está en revisión" son la misma lista vacía y necesitan
   * decir cosas distintas. Con el texto fijo, quien acababa de enviar su comentario
   * leía "sea el primero en participar" justo encima del acuse de que ya lo había
   * hecho.
   */
  textoVacio: PropTypes.string,
};

CommentList.defaultProps = {
  textoVacio: "Aún no hay comentarios. Sea el primero en participar.",
};
