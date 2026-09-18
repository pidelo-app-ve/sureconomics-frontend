import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useUserAuth } from "./UserAuthContext";
import { addBookmark, getMyBookmarks, removeBookmark } from "../services/userMeService";

/**
 * Qué piezas ha guardado esta persona.
 *
 * ## Por qué existe
 *
 * El botón de guardar tiene que saber, al pintarse, si **esta** pieza ya está guardada.
 * Preguntarlo pieza por pieza sería una petición por artículo abierto; el pago público
 * de la pieza tampoco lo dice, y añadirlo obligaría a que una respuesta cacheable
 * dependiera de quién pregunta — que es justo lo que la vuelve no cacheable.
 *
 * Así que la lista se pide **una vez** al entrar y se guarda como un conjunto de ids.
 * Nadie tiene diez mil marcadores; el conjunto cabe de sobra y la respuesta del botón es
 * instantánea.
 *
 * ## Se pinta antes de que el servidor conteste, y se revierte si falla
 *
 * Guardar un artículo es una acción trivial y frecuente: esperar medio segundo a que el
 * servidor confirme para que el icono cambie hace que parezca que el botón no responde,
 * y la gente vuelve a pulsarlo. Se marca al momento y, si la petición falla, se
 * deshace — que es lo honesto: el estado en pantalla vuelve a ser el que hay de verdad.
 */

/**
 * El id, siempre como número.
 *
 * El mapeo de una pieza lo entrega como cadena (`String(row.id)`) y la lista de
 * marcadores lo devuelve como número. Un `Set` distingue `"10"` de `10`, así que sin
 * esto el botón nunca aparecería marcado — y el fallo sería mudo: no hay error, solo un
 * icono que no se enciende nunca.
 */
const comoNumero = (id) => Number(id);

const Contexto = createContext({
  listo: false,
  tiene: () => false,
  alternar: async () => {},
  cuantos: 0,
});

export const ProveedorDeMarcadores = ({ children }) => {
  const { isAuthenticated, isEmailVerified } = useUserAuth();
  const [ids, setIds] = useState(() => new Set());
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // Sin cuenta verificada no hay marcadores que traer, y el conjunto se vacía: si
    // alguien cierra sesión, lo que quedara en memoria sería de otra persona.
    if (!isAuthenticated || !isEmailVerified) {
      setIds(new Set());
      setListo(false);
      return undefined;
    }
    let vivo = true;
    getMyBookmarks({ page: 1, limit: 200 })
      .then((r) => {
        if (!vivo) return;
        setIds(new Set((r.items ?? []).map((p) => comoNumero(p.id))));
        setListo(true);
      })
      .catch(() => {
        // Que no se pueda leer la lista no puede dejar el botón inservible: se queda
        // sin marcar y guardar sigue funcionando.
        if (vivo) setListo(true);
      });
    return () => {
      vivo = false;
    };
  }, [isAuthenticated, isEmailVerified]);

  const tiene = useCallback((postId) => ids.has(comoNumero(postId)), [ids]);

  const alternar = useCallback(
    async (idCrudo) => {
      const postId = comoNumero(idCrudo);
      const estaba = ids.has(postId);
      setIds((antes) => {
        const copia = new Set(antes);
        if (estaba) copia.delete(postId);
        else copia.add(postId);
        return copia;
      });
      try {
        if (estaba) await removeBookmark(postId);
        else await addBookmark(postId);
      } catch (err) {
        // Deshacer: dejar el icono marcado tras un fallo es prometer un marcador que
        // no existe, y se descubre al volver a la lista y no encontrarlo.
        setIds((antes) => {
          const copia = new Set(antes);
          if (estaba) copia.add(postId);
          else copia.delete(postId);
          return copia;
        });
        throw err;
      }
    },
    [ids],
  );

  const valor = useMemo(
    () => ({ listo, tiene, alternar, cuantos: ids.size }),
    [listo, tiene, alternar, ids],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

ProveedorDeMarcadores.propTypes = { children: PropTypes.node };

export const useMarcadores = () => useContext(Contexto);
