import { useEffect, useMemo, useState } from "react";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { piezasFromApi } from "../lib/pieza";
import { getMasLeidas } from "../services/publicContentService";
import { trasLaFoto } from "../lib/trasLaFoto";

/**
 * Las piezas más leídas de la última semana, para «Lo más leído» de la portada.
 *
 * Se guardan las filas tal como llegan y se convierten al pintar con el idioma de la
 * página, por lo mismo que `usePieces`: cambiar de idioma no debe dejar los títulos en
 * el anterior. Un minuto en memoria, como el resto de lo público.
 *
 * `aplazar`: la portada en el teléfono, donde el carril va debajo de las noticias y lejos
 * de la primera pantalla. Se pide después de la foto que abre la portada (`trasLaFoto`),
 * para no quitarle ancho de banda. En escritorio no: ahí el carril va al lado de las
 * noticias y les cambia el ancho, y llegando tarde las movería.
 */
const GUARDADO_MS = 60_000;
let guardado = null;

const fresco = (dias) => guardado && guardado.dias === dias && Date.now() - guardado.en < GUARDADO_MS;

export const useMasLeidas = (dias = 7, { aplazar = false } = {}) => {
  const { lang } = useIdioma();
  const [state, setState] = useState(() =>
    fresco(dias) ? { status: "success", filas: guardado.filas } : { status: "loading", filas: [] }
  );

  useEffect(() => {
    let vivo = true;
    if (fresco(dias)) {
      setState({ status: "success", filas: guardado.filas });
      return () => {
        vivo = false;
      };
    }
    (aplazar ? trasLaFoto() : Promise.resolve())
      .then(() => (vivo ? getMasLeidas(dias) : null))
      .then((filas) => {
        if (!filas) return;
        guardado = { dias, filas, en: Date.now() };
        if (vivo) setState({ status: "success", filas });
      })
      .catch(() => {
        if (vivo) setState({ status: "error", filas: [] });
      });
    return () => {
      vivo = false;
    };
  }, [dias, aplazar]);

  // `lang` como dependencia a propósito: la conversión lee el idioma del motor.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const piezas = useMemo(() => piezasFromApi(state.filas), [state.filas, lang]);
  return { status: state.status, piezas };
};
