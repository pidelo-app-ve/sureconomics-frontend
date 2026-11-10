import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { sugerirClasificacion } from "../../services/adminPostsService";
import "./sugerenciasDeClasificacion.css";

/** Cuánto se espera tras la última tecla antes de preguntar: no una petición por letra. */
const ESPERA_MS = 1200;
/** Con menos texto que esto no hay de dónde sugerir. */
const MINIMO_DE_LETRAS = 12;

/**
 * Lo que el texto parece tratar, para aceptarlo con un toque.
 *
 * Elegir tema y lugar es el paso que la redacción se saltaba: 8 de cada 10 piezas
 * recientes estaban sin clasificar. El servidor los propone leyendo el título y el
 * texto, con reglas y sin IA (`clasificacion_service`); aquí solo se enseñan los que
 * todavía no están puestos. Si la petición falla no se dice nada: es una ayuda, y la
 * lista de abajo sigue funcionando igual.
 */
export const useSugerenciasDeClasificacion = ({ titulo, resumen, contenido }) => {
  const [sugerencias, setSugerencias] = useState({ temas: [], lugares: [] });

  useEffect(() => {
    if (`${titulo}${contenido}`.trim().length < MINIMO_DE_LETRAS) {
      setSugerencias({ temas: [], lugares: [] });
      return undefined;
    }
    let vigente = true;
    const reloj = setTimeout(() => {
      sugerirClasificacion({ title: titulo, excerpt: resumen, content: contenido })
        .then((datos) => {
          if (vigente) setSugerencias({ temas: datos?.temas ?? [], lugares: datos?.lugares ?? [] });
        })
        .catch(() => {});
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(reloj);
    };
  }, [titulo, resumen, contenido]);

  return sugerencias;
};

export const SugerenciasDeClasificacion = ({ sugerencias, temasPuestos, lugaresPuestos, onTema, onLugar, tope }) => {
  const falta = (lista, puestos) =>
    puestos.length >= tope ? [] : lista.filter((s) => !puestos.some((id) => String(id) === String(s.id)));
  const temas = falta(sugerencias.temas, temasPuestos);
  const lugares = falta(sugerencias.lugares, lugaresPuestos);
  if (!temas.length && !lugares.length) return null;

  return (
    <div className="se-sugerencias" role="group" aria-label="Sugerencias de clasificación">
      <span className="se-sugerencias__rotulo">Por lo que dice el texto:</span>
      {temas.map((s) => (
        <button key={`t${s.id}`} type="button" className="se-sugerencias__opcion" onClick={() => onTema(s.id)}>
          <span aria-hidden="true">+</span> {s.name}
          <span className="se-sr-only"> (añadir como tema)</span>
        </button>
      ))}
      {lugares.map((s) => (
        <button key={`l${s.id}`} type="button" className="se-sugerencias__opcion" onClick={() => onLugar(s.id)}>
          <span aria-hidden="true">+</span> {s.name}
          <span className="se-sr-only"> (añadir como lugar)</span>
        </button>
      ))}
    </div>
  );
};

const forma = PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number.isRequired, name: PropTypes.string.isRequired }));

SugerenciasDeClasificacion.propTypes = {
  sugerencias: PropTypes.shape({ temas: forma.isRequired, lugares: forma.isRequired }).isRequired,
  temasPuestos: PropTypes.array.isRequired,
  lugaresPuestos: PropTypes.array.isRequired,
  onTema: PropTypes.func.isRequired,
  onLugar: PropTypes.func.isRequired,
  /** Cuántos caben por eje: el mismo tope de `AxisPicker`. */
  tope: PropTypes.number,
};

SugerenciasDeClasificacion.defaultProps = { tope: 3 };
