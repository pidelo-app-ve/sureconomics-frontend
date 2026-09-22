import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";

import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { listAdminMedia } from "../../services/adminMediaService";

/**
 * Elegir un archivo que ya está subido, en vez de volver a subirlo.
 *
 * ## Por qué hacía falta
 *
 * `AssetField` sólo sabía subir o pegar una dirección. Para reutilizar el mismo arte en
 * dos piezas había que volver a buscar el archivo en el disco y subirlo otra vez — con
 * la duda añadida de si eso estaba duplicando algo.
 *
 * No lo duplicaba: la clave del objeto en R2 lleva el SHA-256 del contenido y
 * `register_stored` devuelve la fila que ya existe, así que subir dos veces lo mismo no
 * crea ni un objeto ni un registro nuevos. Pero el trabajo de encontrar el archivo y
 * esperar la subida sí era real, y eso es lo que esto quita.
 *
 * ## Por qué enseña las medidas
 *
 * Porque en publicidad el ancho y el alto son la mitad de la decisión. Una cinta de
 * 1456 × 180 y un logotipo cuadrado se llaman los dos «IMG_6746.PNG» y se distinguen
 * sólo por la proporción; sin las medidas, elegir de una rejilla de miniaturas es
 * adivinar. El buscador de retratos no las pinta porque allí todas las fotos son caras
 * y valen igual.
 *
 * ## Qué se busca
 *
 * El servidor compara contra la etiqueta, el nombre original del archivo y el crédito.
 * De ahí que subir con etiqueta sea lo que hace que un archivo se vuelva a encontrar:
 * `IMG_6746.PNG` no lo busca nadie, «banner Alalza» sí.
 */

const ESPERA_MS = 250;
const CUANTAS = 18;

/** Lo que un humano reconoce de una fila. La etiqueta primero. */
export const comoSeLlama = (fila) =>
  fila?.label || fila?.original_filename || fila?.credit || `Archivo #${fila?.id ?? "?"}`;

/** «1456 × 180», o nada si el archivo no las tiene (un PDF, un audio). */
const medidasDe = (fila) =>
  fila?.width && fila?.height ? `${fila.width} × ${fila.height}` : null;

export const SelectorDeBiblioteca = ({
  id,
  kind,
  puesto,
  busquedaInicial,
  onElegir,
}) => {
  const [aguja, setAguja] = useState(busquedaInicial ?? "");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(true);
  const [error, setError] = useState("");

  const buscar = useCallback(
    async (texto) => {
      setBuscando(true);
      setError("");
      try {
        const { items } = await listAdminMedia({ kind, q: texto, limit: CUANTAS });
        setResultados(items ?? []);
      } catch (err) {
        setError(adminErrorMessage(err, "No se pudo leer la biblioteca."));
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    },
    [kind],
  );

  // Con espera, para no lanzar una consulta por tecla. La primera sale sola: abrir el
  // selector y ver un vacio que en realidad es «todavia no he preguntado» es lo que
  // hace que nadie lo use dos veces.
  useEffect(() => {
    const reloj = setTimeout(() => buscar(aguja), ESPERA_MS);
    return () => clearTimeout(reloj);
  }, [aguja, buscar]);

  return (
    <div className="se-biblio">
      <label className="se-form-label" htmlFor={`${id}-q`}>
        Buscar entre lo ya subido
      </label>
      <input
        id={`${id}-q`}
        className="se-form-control"
        value={aguja}
        placeholder="banner, logotipo, el nombre del anunciante…"
        onChange={(e) => setAguja(e.target.value)}
      />
      <p className="se-admin-meta-hint">
        Busca por la etiqueta, por el nombre del archivo y por el crédito.
      </p>

      {buscando ? <p className="se-biblio__nota">Buscando…</p> : null}

      {!buscando && !resultados.length ? (
        <p className="se-biblio__nota">
          {aguja.trim()
            ? `Nada responde a «${aguja.trim()}». Puede subir un archivo nuevo abajo.`
            : "La biblioteca está vacía todavía."}
        </p>
      ) : null}

      {resultados.length ? (
        <ul className="se-biblio__lista">
          {resultados.map((fila) => (
            <li key={fila.id}>
              <button
                type="button"
                className={`se-biblio__opcion${
                  String(fila.id) === String(puesto) ? " se-biblio__opcion--puesta" : ""
                }`}
                onClick={() => onElegir(fila)}
              >
                {/* `contain` y no `cover`: recortar una cinta de 1456x180 para que
                    llene un cuadrado la deja irreconocible, que es justo lo contrario
                    de lo que se viene a hacer aqui. */}
                <span className="se-biblio__lienzo">
                  <img src={fila.url || ""} alt="" loading="lazy" />
                </span>
                <span className="se-biblio__nombre">{comoSeLlama(fila)}</span>
                {medidasDe(fila) ? (
                  <span className="se-biblio__medidas">{medidasDe(fila)}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="se-biblio__error">{error}</p> : null}
    </div>
  );
};

SelectorDeBiblioteca.propTypes = {
  /** Prefijo para los ids internos. */
  id: PropTypes.string.isRequired,
  kind: PropTypes.oneOf(["image", "video", "audio", "document"]).isRequired,
  /** El id que ya está adjunto, para marcarlo en la rejilla. */
  puesto: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  busquedaInicial: PropTypes.string,
  /** Se llama con la fila entera del archivo elegido. */
  onElegir: PropTypes.func.isRequired,
};

export default SelectorDeBiblioteca;
