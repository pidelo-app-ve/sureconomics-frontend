import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useUserAuth } from "./UserAuthContext";
import { dejarTema, getMisTemas, seguirTema } from "../services/userMeService";

/**
 * Qué temas sigue esta persona («Siga este tema»).
 *
 * El mismo molde que los marcadores (`MarcadoresContext`): la lista se pide una vez al
 * entrar y se guarda como un conjunto de slugs, así el botón de cada tema sabe al
 * pintarse si ya se sigue. Se marca al momento y, si el servidor falla, se deshace.
 */
const Contexto = createContext({
  listo: false,
  temas: [],
  sigue: () => false,
  alternar: async () => {},
});

export const ProveedorDeTemasSeguidos = ({ children }) => {
  const { isAuthenticated, isEmailVerified } = useUserAuth();
  const [temas, setTemas] = useState([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isEmailVerified) {
      setTemas([]);
      setListo(false);
      return undefined;
    }
    let vivo = true;
    getMisTemas()
      .then((lista) => {
        if (!vivo) return;
        setTemas(lista);
        setListo(true);
      })
      .catch(() => {
        if (vivo) setListo(true);
      });
    return () => {
      vivo = false;
    };
  }, [isAuthenticated, isEmailVerified]);

  const slugs = useMemo(() => new Set(temas.map((t) => t.slug)), [temas]);
  const sigue = useCallback((slug) => slugs.has(slug), [slugs]);

  const alternar = useCallback(
    async (slug, nombre = "") => {
      const seguia = slugs.has(slug);
      setTemas((antes) => (seguia ? antes.filter((t) => t.slug !== slug) : [...antes, { slug, name: nombre }]));
      try {
        const lista = seguia ? await dejarTema(slug) : await seguirTema(slug);
        setTemas(lista);
      } catch (err) {
        setTemas((antes) => (seguia ? [...antes, { slug, name: nombre }] : antes.filter((t) => t.slug !== slug)));
        throw err;
      }
    },
    [slugs]
  );

  const valor = useMemo(() => ({ listo, temas, sigue, alternar }), [listo, temas, sigue, alternar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

ProveedorDeTemasSeguidos.propTypes = { children: PropTypes.node };

export const useTemasSeguidos = () => useContext(Contexto);
