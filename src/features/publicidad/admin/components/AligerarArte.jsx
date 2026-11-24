import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { adminErrorMessage } from "../../../../lib/adminErrorMessage";
import { subirArte } from "../api";
import {
  AVISO_OPTIMIZANDO,
  descargarImagen,
  esSvg,
  kilobytes,
  origenDeLaImagen,
} from "../../../../components/admin/aligerarImagen";
import { prepararArte } from "../aligerarArte";
import { arteDemasiadoPesado, topeDelArte } from "../utils";

/**
 * «Aligerar», bajo un arte que ya está puesto (en una pieza o como logotipo) y pesa de
 * más: lo convierte en el navegador, pregunta, lo sube y lo pone en su lugar.
 *
 * Para saber si pesa, lo descarga al abrir la ficha (el servidor no manda el peso con
 * la pieza, y suele estar ya en la caché porque la vista previa lo pinta). Si es ligero,
 * o es de otro sitio y no se puede medir, no pinta nada.
 *
 * El archivo de antes se queda en Archivos: aquí solo se cambia cuál usa la pieza.
 */
export const AligerarArte = ({ asset, medidas, preguntar, onReemplazar, deshabilitado }) => {
  // El archivo bajado y por qué pesa de más; null si no pasa del tope (o no se sabe).
  const [pesado, setPesado] = useState(null);
  const [estado, setEstado] = useState("quieto"); // optimizando · esperando · subiendo
  const [error, setError] = useState("");
  const [nota, setNota] = useState("");
  const cancelar = useRef(null);
  const url = asset?.url ?? null;

  useEffect(() => {
    setPesado(null);
    setError("");
    if (origenDeLaImagen(url, window.location.origin) !== "propio") return undefined;
    const control = new AbortController();
    descargarImagen(asset, { senal: control.signal })
      .then((archivo) => {
        const datos = { mime: archivo.type, bytes: archivo.size, nombre: archivo.name };
        if (arteDemasiadoPesado(datos)) setPesado({ archivo, ...datos });
      })
      // Si no se pudo medir, no se afirma nada: el servidor sigue de red.
      .catch(() => {});
    return () => control.abort();
    // Solo cuando cambia el archivo; `asset` trae más campos que no cuentan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Si la ficha se cierra a mitad, se deja de trabajar y no se sube nada.
  useEffect(() => () => cancelar.current?.abort(), []);

  const aligerar = async () => {
    const control = new AbortController();
    cancelar.current = control;
    setError("");
    setNota("");
    setEstado("optimizando");
    try {
      const { archivo, nota: hecho } = await prepararArte(pesado.archivo, { medidas, senal: control.signal });
      setEstado("esperando");
      const vale = await preguntar({
        title: "¿Poner el arte aligerado?",
        description:
          `Queda de ${kilobytes(pesado.bytes)} KB a ${kilobytes(archivo.size)} KB, en WebP y con la misma imagen, ` +
          "y pasa a ser el que sale publicado. El archivo de ahora se queda en Archivos por si hiciera falta.",
        confirmLabel: "Reemplazar",
        busyLabel: "Reemplazando…",
      });
      if (!vale || control.signal.aborted) return;
      setEstado("subiendo");
      const fila = await subirArte(archivo, { medidas, signal: control.signal });
      // `onReemplazar` lo guarda y avisa si falla (con el aviso flotante del panel).
      if (await onReemplazar(fila)) setNota(hecho);
    } catch (err) {
      if (err?.name !== "AbortError") setError(adminErrorMessage(err, "No se pudo aligerar el arte."));
    } finally {
      if (cancelar.current === control) cancelar.current = null;
      setEstado("quieto");
    }
  };

  if (!pesado && !nota && !error) return null;

  const trabajando = estado !== "quieto";
  return (
    <>
      {pesado ? (
        <div className="se-admin-pub__rescate">
          <p>
            Este arte pesa <b>{kilobytes(pesado.bytes)} KB</b> y{" "}
            {esSvg(pesado) ? "un SVG de anuncio" : "una imagen de anuncio"} puede pesar hasta{" "}
            {kilobytes(topeDelArte(pesado))} KB: cada lector lo baja entero en cada portada. «Aligerar» hace una
            copia en WebP, del tamaño de su hueco, que pesa menos, y la pone en su lugar.
          </p>
          <div className="se-admin-pub__acciones">
            <button
              type="button"
              className="se-btn se-btn--primary"
              disabled={deshabilitado || trabajando}
              onClick={aligerar}
            >
              {estado === "optimizando"
                ? AVISO_OPTIMIZANDO
                : estado === "subiendo"
                  ? "Subiendo…"
                  : "Aligerar"}
            </button>
            {estado === "optimizando" ? (
              <button
                type="button"
                className="se-btn se-btn--secondary"
                onClick={() => cancelar.current?.abort()}
              >
                Cancelar
              </button>
            ) : null}
          </div>
          {error ? <p className="se-asset__error">{error}</p> : null}
        </div>
      ) : error ? (
        <p className="se-asset__error">{error}</p>
      ) : null}
      {nota ? <p className="se-asset__nota">{nota}</p> : null}
    </>
  );
};

AligerarArte.propTypes = {
  /** El arte puesto ahora (`url` y `original_filename`). */
  asset: PropTypes.shape({ url: PropTypes.string, original_filename: PropTypes.string }),
  /** La caja de su hueco (`MEDIDAS_DE_ARTE`). */
  medidas: PropTypes.shape({ ancho: PropTypes.number.isRequired, alto: PropTypes.number.isRequired }).isRequired,
  /** El diálogo de confirmar del panel; resuelve a `true` si se aceptó. */
  preguntar: PropTypes.func.isRequired,
  /** Pone el archivo nuevo en lugar del de ahora y lo guarda; resuelve a `true` si salió. */
  onReemplazar: PropTypes.func.isRequired,
  deshabilitado: PropTypes.bool,
};
