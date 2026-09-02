import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import {
  ACCEPTED_IMAGE_MIME,
  listAdminMedia,
  patchAdminMedia,
  uploadAdminMediaImage,
} from "../../services/adminMediaService";
import { adminErrorMessage } from "../../lib/adminErrorMessage";

/**
 * El retrato de quien firma, elegido de la biblioteca.
 *
 * La foto se ata **a la pieza y no a una cuenta**, y de ahí sale la forma de este
 * campo. Una sola subida sirve para las cien piezas que firme esa persona, así que lo
 * que hace falta no es un formulario de subida por pieza -- eso multiplicaría la misma
 * cara en el almacenamiento -- sino un buscador sobre lo que ya está subido.
 *
 * Arranca buscando por el nombre que ya está escrito en la firma. En el caso normal,
 * alguien que ya ha firmado antes, el retrato aparece sin que haya que escribir nada;
 * ésa es la diferencia entre una función que se usa y una que se ignora.
 *
 * Al subir una foto nueva se le pone de etiqueta el nombre de la firma. No es un
 * adorno: es lo único que hará que la próxima pieza de esa persona la encuentre sola.
 * La etiqueta queda editable porque el nombre con que se publica no siempre es el
 * nombre con que se busca la foto.
 */

const ESPERA_MS = 250;
const CUANTAS = 12;

/** Qué se lee de una fila. La etiqueta primero, que es lo que un editor reconoce. */
const comoSeLlama = (fila) =>
  fila?.label || fila?.original_filename || fila?.credit || `Foto #${fila?.id ?? "?"}`;

export const BylinePhotoField = ({ id, value, asset, byline, onChange }) => {
  const [abierto, setAbierto] = useState(false);
  const [aguja, setAguja] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  // La etiqueta vive en la foto, no en la pieza, así que se guarda por su cuenta: la
  // misma cara en otra pieza llega ya etiquetada, y corregir un nombre mal escrito lo
  // corrige en todas a la vez.
  const [etiqueta, setEtiqueta] = useState("");
  const [etiquetaBusy, setEtiquetaBusy] = useState(false);
  const [etiquetaLista, setEtiquetaLista] = useState(false);

  useEffect(() => {
    setEtiqueta(asset?.label ?? "");
    setEtiquetaLista(false);
  }, [asset?.id, asset?.label]);

  const buscar = useCallback(async (texto) => {
    setBuscando(true);
    setError("");
    try {
      const { items } = await listAdminMedia({ kind: "image", q: texto, limit: CUANTAS });
      setResultados(items ?? []);
    } catch (err) {
      setError(adminErrorMessage(err, "No se pudo buscar en la biblioteca."));
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }, []);

  // Sólo con el buscador abierto: si no, cada tecla escrita en el campo de la firma
  // dispararía una consulta cuyo resultado nadie va a mirar.
  useEffect(() => {
    if (!abierto) return undefined;
    const reloj = setTimeout(() => buscar(aguja), ESPERA_MS);
    return () => clearTimeout(reloj);
  }, [abierto, aguja, buscar]);

  const abrir = () => {
    // El nombre ya escrito es la mejor conjetura que tenemos, y casi siempre acierta.
    setAguja((previa) => previa || (byline ?? "").trim());
    setAbierto(true);
  };

  const elegir = (fila) => {
    onChange(fila?.id ?? null, fila ?? null);
    setAbierto(false);
    setError("");
  };

  const subir = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSubiendo(true);
    setError("");
    try {
      let fila = await uploadAdminMediaImage(file);
      const nombre = (byline ?? "").trim();
      if (nombre) {
        try {
          fila = await patchAdminMedia(fila.id, { label: nombre });
        } catch {
          // La foto ya está subida. Adjuntarla sin etiqueta es mejor que perderla:
          // la etiqueta se puede escribir a mano en el campo de abajo.
          setError("La foto se subió, pero no se le pudo poner la etiqueta. Escríbala abajo.");
        }
      }
      elegir(fila);
    } catch (err) {
      setError(adminErrorMessage(err, "No se pudo subir la foto."));
    } finally {
      setSubiendo(false);
    }
  };

  const guardarEtiqueta = async () => {
    setEtiquetaBusy(true);
    setError("");
    try {
      const actualizada = await patchAdminMedia(value, { label: etiqueta.trim() });
      // Se reporta hacia arriba para que el editor sostenga la versión fresca: sin
      // esto el campo mostraría la etiqueta guardada y la pieza seguiría con la vieja.
      onChange(value, actualizada);
      setEtiquetaLista(true);
    } catch (err) {
      setError(adminErrorMessage(err, "No se pudo guardar la etiqueta."));
    } finally {
      setEtiquetaBusy(false);
    }
  };

  let rotuloBuscar = "Buscar una foto";
  if (abierto) rotuloBuscar = "Cerrar el buscador";
  else if (value) rotuloBuscar = "Cambiar la foto";

  return (
    <fieldset className="se-form-field se-retrato" id={id}>
      <legend className="se-form-label">Foto de quien firma</legend>
      <p className="se-retrato__hint">
        Opcional. Sin foto, la pieza sale con un icono de persona. Las fotos se
        reutilizan entre piezas: busque por el nombre antes de subir una nueva.
      </p>

      {value ? (
        <div className="se-retrato__actual">
          <img
            className="se-retrato__foto"
            src={asset?.url || ""}
            alt=""
            width="64"
            height="64"
          />
          <div className="se-retrato__datos">
            <p className="se-retrato__nombre">{comoSeLlama(asset)}</p>
            <label className="se-form-label" htmlFor={`${id}-label`}>
              Etiqueta — el nombre con el que se busca
            </label>
            <div className="se-retrato__fila">
              <input
                id={`${id}-label`}
                className="se-form-control"
                value={etiqueta}
                placeholder="Luis Ojeda"
                maxLength={160}
                onChange={(event) => {
                  setEtiqueta(event.target.value);
                  setEtiquetaLista(false);
                }}
              />
              <button
                type="button"
                className="se-btn se-btn--secondary se-btn--small"
                disabled={etiquetaBusy || etiqueta.trim() === (asset?.label ?? "")}
                onClick={guardarEtiqueta}
              >
                {etiquetaBusy ? "Guardando…" : "Guardar"}
              </button>
            </div>
            {etiquetaLista ? <p className="se-retrato__ok">Etiqueta guardada.</p> : null}
          </div>
          <button
            type="button"
            className="se-btn se-btn--secondary se-btn--small"
            onClick={() => elegir(null)}
          >
            Quitar
          </button>
        </div>
      ) : (
        <p className="se-retrato__vacio">
          Sin foto. La pieza saldrá con un icono de persona, que es un caso normal y no
          un error.
        </p>
      )}

      <div className="se-retrato__acciones">
        <button
          type="button"
          className="se-btn se-btn--secondary se-btn--small"
          onClick={() => (abierto ? setAbierto(false) : abrir())}
        >
          {rotuloBuscar}
        </button>
        <label className="se-btn se-btn--secondary se-btn--small">
          {subiendo ? "Subiendo…" : "Subir una nueva"}
          <input
            type="file"
            accept={ACCEPTED_IMAGE_MIME}
            onChange={subir}
            disabled={subiendo}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {abierto ? (
        <div className="se-retrato__buscador">
          <label className="se-form-label" htmlFor={`${id}-q`}>
            Buscar por nombre
          </label>
          <input
            id={`${id}-q`}
            className="se-form-control"
            value={aguja}
            placeholder="Luis Ojeda"
            onChange={(event) => setAguja(event.target.value)}
          />

          {buscando ? <p className="se-retrato__nota">Buscando…</p> : null}

          {!buscando && resultados.length === 0 ? (
            <p className="se-retrato__nota">
              {aguja.trim()
                ? `Ninguna foto responde a «${aguja.trim()}». Puede subir una nueva.`
                : "No hay imágenes en la biblioteca todavía."}
            </p>
          ) : null}

          {resultados.length > 0 ? (
            <ul className="se-retrato__lista">
              {resultados.map((fila) => (
                <li key={fila.id}>
                  <button
                    type="button"
                    className={
                      fila.id === value
                        ? "se-retrato__opcion se-retrato__opcion--puesta"
                        : "se-retrato__opcion"
                    }
                    onClick={() => elegir(fila)}
                  >
                    <img src={fila.url || ""} alt="" width="48" height="48" loading="lazy" />
                    <span className="se-retrato__opcion-nombre">{comoSeLlama(fila)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="se-retrato__error">{error}</p> : null}
    </fieldset>
  );
};

BylinePhotoField.propTypes = {
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  asset: PropTypes.shape({
    id: PropTypes.number,
    url: PropTypes.string,
    label: PropTypes.string,
    original_filename: PropTypes.string,
    credit: PropTypes.string,
  }),
  /** La firma ya escrita: con eso se precarga la búsqueda y se etiqueta lo que se sube. */
  byline: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

BylinePhotoField.defaultProps = {
  id: "post-byline-photo",
  value: null,
  asset: null,
  byline: "",
};
