import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { CommentComposer } from "../comments/CommentComposer";
import { CommentList } from "../comments/CommentList";
import { useUserAuth } from "../../context/UserAuthContext";
import { useClaveIdempotente } from "../../hooks/useClaveIdempotente";
import { contentService } from "../../services/contentService";
import { postComment } from "../../services/userMeService";

/**
 * Los comentarios de una pieza: los aprobados, y la caja para dejar otro.
 *
 * Esta sección es el tramo que faltaba. El backend, el panel de moderación, la lista y
 * el compositor ya existían desde antes; lo que no había era nada que los montara, así
 * que la función estaba completa y el lector no la veía en ninguna parte.
 *
 * Quién puede comentar lo decide el servidor -- cuenta con correo confirmado -- y el
 * compositor pinta la invitación a registrarse cuando falta. Y **dónde** se puede lo
 * decide el formato: quien llama comprueba `pieza.admiteComentarios` antes de montar
 * esto, así que aquí no se repite la condición.
 *
 * La lista sólo trae los aprobados, que es lo que el endpoint público devuelve. Un
 * comentario recién enviado por tanto **no aparece**, y eso se dice con palabras en el
 * acuse del compositor en vez de dejar al lector buscando el suyo en la lista: la
 * alternativa -- pintarlo optimista como si ya estuviera -- sería mentir sobre una cola
 * de moderación que puede rechazarlo.
 */

/** Se piden de una vez; con más de esto la conversación ya pide su propia página. */
const POR_PAGINA = 50;

export const PieceComments = ({ pieza }) => {
  const { isAuthenticated, isEmailVerified } = useUserAuth();
  const { clave, renovar } = useClaveIdempotente();
  const [estado, setEstado] = useState({ status: "loading", items: [] });
  // Si este lector acaba de enviar uno. Sólo cambia lo que dice la lista vacía: su
  // comentario está en la cola y no puede aparecer, pero invitarle a "ser el primero
  // en participar" justo encima del acuse de que ya participó se lee como un fallo.
  const [enviado, setEnviado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { items } = await contentService.getPostComments(pieza.slug, {
        limit: POR_PAGINA,
      });
      return { status: "success", items: items ?? [] };
    } catch {
      // Se calla a propósito. Que los comentarios no carguen no puede tapar la pieza
      // que el lector vino a leer, así que la sección se retira y el artículo sigue
      // completo -- que es lo que pasaba antes de que esto existiera.
      return { status: "error", items: [] };
    }
  }, [pieza.slug]);

  useEffect(() => {
    let vivo = true;
    setEstado({ status: "loading", items: [] });
    cargar().then((next) => {
      if (vivo) setEstado(next);
    });
    return () => {
      vivo = false;
    };
  }, [cargar]);

  const enviar = useCallback(
    async (texto) => {
      await postComment(pieza.slug, texto, clave());
      // La clave se renueva sólo cuando el envío cuajó: si falla y la persona vuelve a
      // pulsar, la misma clave hace que el servidor devuelva la respuesta de la primera
      // en vez de guardar el comentario dos veces.
      renovar();
      setEnviado(true);
    },
    [pieza.slug, clave, renovar]
  );

  if (estado.status === "error") return null;

  const total = estado.items.length;

  return (
    <section className="se-comments" aria-labelledby="comments-title">
      <h2 id="comments-title" className="se-heading-section se-heading-section--small">
        {total ? `Comentarios (${total})` : "Comentarios"}
      </h2>

      {estado.status === "loading" ? (
        <p className="se-text-body se-comments__empty" role="status">
          Cargando comentarios…
        </p>
      ) : (
        <CommentList
          comments={estado.items}
          textoVacio={
            enviado
              ? "Su comentario está en revisión. Aparecerá aquí en cuanto lo apruebe la moderación."
              : undefined
          }
        />
      )}

      <CommentComposer
        isAuthenticated={isAuthenticated}
        isEmailVerified={isEmailVerified}
        volverA={pieza.rutaCanonica}
        onSubmitComment={enviar}
      />
    </section>
  );
};

PieceComments.propTypes = {
  pieza: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    /** La dirección de esta pieza, para devolver al lector tras entrar. */
    rutaCanonica: PropTypes.string.isRequired,
  }).isRequired,
};
