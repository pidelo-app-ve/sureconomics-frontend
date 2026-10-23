import { useEffect, useMemo, useState } from "react";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { piezasFromApi } from "../lib/pieza";
import { getMasLeidas } from "../services/publicContentService";

/**
 * Las piezas más leídas de la última semana, para «Lo más leído» de la portada.
 *
 * Se guardan las filas tal como llegan y se convierten al pintar con el idioma de la
 * página, por lo mismo que `usePieces`: cambiar de idioma no debe dejar los títulos en
 * el anterior. Un minuto en memoria, como el resto de lo público.
 */
const GUARDADO_MS = 60_000;
let guardado = null;

const fresco = () => guardado && Date.now() - guardado.en < GUARDADO_MS;

export const useMasLeidas = (dias = 7) => {
  const { lang } = useIdioma();
  const [state, setState] = useState(() =>
    fresco() ? { status: "success", filas: guardado.filas } : { status: "loading", filas: [] }
  );

  useEffect(() => {
    let vivo = true;
    if (fresco()) {
      setState({ status: "success", filas: guardado.filas });
      return () => {
        vivo = false;
      };
    }
    getMasLeidas(dias)
      .then((filas) => {
        guardado = { filas, en: Date.now() };
        if (vivo) setState({ status: "success", filas });
      })
      .catch(() => {
        if (vivo) setState({ status: "error", filas: [] });
      });
    return () => {
      vivo = false;
    };
  }, [dias]);

  // `lang` como dependencia a propósito: la conversión lee el idioma del motor.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const piezas = useMemo(() => piezasFromApi(state.filas), [state.filas, lang]);
  return { status: state.status, piezas };
};
