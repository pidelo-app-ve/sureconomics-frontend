import PropTypes from "prop-types";
import { useEffect, useId, useRef, useState } from "react";

import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { MAX_IMAGE_BYTES } from "../../../services/adminMediaService";
import { SelectorDeBiblioteca } from "../SelectorDeBiblioteca";
import { atributosDeAsset } from "./atributos";
import { TIPOS_DE_IMAGEN } from "./figura";
import { IconoSubir } from "./iconos";

const megas = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;

/** Lo que se le dice a quien elige un archivo que no sirve, antes de subirlo. */
const problemaDe = (archivo) => {
  if (!archivo) return "No llegó ningún archivo.";
  if (!TIPOS_DE_IMAGEN.includes(archivo.type)) return "Ese archivo no es una foto. Sirven JPG, PNG, WebP, GIF o AVIF.";
  if (archivo.size > MAX_IMAGE_BYTES) {
    return `La foto pesa ${megas(archivo.size)} y el máximo es ${megas(MAX_IMAGE_BYTES)}. Expórtela más liviana y vuelva a probar.`;
  }
  return "";
};

/**
 * La ventana para poner una foto en el cuerpo, o cambiar la que ya está.
 *
 * Dos pasos, y el segundo es el que importa:
 *
 * 1. **De dónde sale la foto:** se suelta o se elige del equipo, o se toma una que ya
 *    está en la biblioteca.
 * 2. **Cómo va a quedar:** la foto se ve en cuanto se elige -- antes de que termine de
 *    subir --, al ancho de la columna de lectura y con el pie debajo, con la letra de la
 *    pieza publicada. Ahí se escriben el pie (opcional) y la descripción para quien no
 *    ve la imagen.
 *
 * No inserta nada hasta que se pulsa el botón: cerrar la ventana a mitad no deja una
 * foto huérfana en el texto.
 */
export const DialogoDeImagen = ({ abierto, inicial, subir, onAceptar, onCerrar }) => {
  const idBase = useId();
  const [imagen, setImagen] = useState(null); // atributos finales (src, srcset, medidas)
  const [local, setLocal] = useState(""); // vista previa mientras sube
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [pie, setPie] = useState("");
  const [alt, setAlt] = useState("");
  const [biblioteca, setBiblioteca] = useState(false);
  const [encima, setEncima] = useState(false);
  const archivoRef = useRef(null);
  const superficieRef = useRef(null);
  const turno = useRef(0);

  // Cada vez que se abre, parte de lo que hay (al editar) o de cero (al insertar).
  useEffect(() => {
    if (!abierto) return undefined;
    turno.current += 1;
    setImagen(inicial?.src ? { ...inicial } : null);
    setPie(inicial?.pie ?? "");
    setAlt(inicial?.alt ?? "");
    setLocal("");
    setSubiendo(false);
    setError("");
    setBiblioteca(false);
    const t = window.setTimeout(() => superficieRef.current?.querySelector("[data-primero]")?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [abierto, inicial]);

  useEffect(() => () => local && URL.revokeObjectURL(local), [local]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const editando = Boolean(inicial?.src);
  const vista = local || imagen?.src || "";

  const tomarArchivo = async (archivo) => {
    const problema = problemaDe(archivo);
    if (problema) {
      setError(problema);
      return;
    }
    const miTurno = (turno.current += 1);
    setError("");
    setBiblioteca(false);
    setLocal(URL.createObjectURL(archivo));
    setSubiendo(true);
    try {
      const attrs = await subir(archivo);
      if (turno.current !== miTurno) return; // eligió otra mientras tanto
      setImagen(attrs);
    } catch (err) {
      if (turno.current !== miTurno) return;
      setLocal("");
      setError(adminErrorMessage(err, "No se pudo subir la foto. Pruebe otra vez."));
    } finally {
      if (turno.current === miTurno) setSubiendo(false);
    }
  };

  const elegirDeBiblioteca = (fila) => {
    turno.current += 1;
    setLocal("");
    setSubiendo(false);
    setError("");
    setImagen(atributosDeAsset(fila));
    setBiblioteca(false);
  };

  const aceptar = (e) => {
    e.preventDefault();
    if (!imagen?.src || subiendo) return;
    onAceptar({ ...imagen, pie: pie.trim(), alt: alt.trim() });
  };

  const soltar = (e) => {
    e.preventDefault();
    setEncima(false);
    tomarArchivo(e.dataTransfer?.files?.[0]);
  };

  return (
    <div className="se-adm-dialog" role="presentation">
      <div className="se-adm-dialog__backdrop" aria-hidden="true" onClick={onCerrar} />
      <div
        ref={superficieRef}
        className="se-adm-dialog__surface se-imgdlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idBase}-titulo`}
      >
        <header className="se-adm-dialog__header">
          <h2 className="se-adm-dialog__title" id={`${idBase}-titulo`}>
            {editando ? "Editar la foto" : "Foto en el texto"}
          </h2>
          <button type="button" className="se-adm-dialog__x" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        <form onSubmit={aceptar} className="se-adm-dialog__body se-imgdlg__cuerpo">
          {vista ? (
            // —— Cómo va a quedar ——
            <div className="se-imgdlg__previa">
              <p className="se-imgdlg__rotulo">Así se verá en la pieza</p>
              <figure className="se-imgdlg__figura">
                <div className="se-imgdlg__marco">
                  <img src={vista} alt="" className="se-imgdlg__img" />
                  {subiendo ? (
                    <span className="se-figura-ed__velo" role="status">
                      <span className="se-figura-ed__giro" aria-hidden="true" />
                      Subiendo la foto…
                    </span>
                  ) : null}
                </div>
                {pie.trim() ? <figcaption className="se-imgdlg__pie-previo">{pie}</figcaption> : null}
              </figure>
            </div>
          ) : (
            // —— De dónde sale ——
            <div
              className={`se-imgdlg__suelo${encima ? " se-imgdlg__suelo--encima" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setEncima(true);
              }}
              onDragLeave={() => setEncima(false)}
              onDrop={soltar}
            >
              <span className="se-imgdlg__suelo-icono" aria-hidden="true">
                <IconoSubir />
              </span>
              <p className="se-imgdlg__suelo-texto">Suelte aquí la foto</p>
              <p className="se-imgdlg__suelo-ayuda">JPG, PNG o WebP, hasta {megas(MAX_IMAGE_BYTES)}.</p>
              <button type="button" className="se-btn" data-primero onClick={() => archivoRef.current?.click()}>
                Elegir del equipo
              </button>
            </div>
          )}

          <input
            ref={archivoRef}
            type="file"
            accept={TIPOS_DE_IMAGEN.join(",")}
            hidden
            onChange={(e) => {
              tomarArchivo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div className="se-imgdlg__fuentes">
            {vista ? (
              <button type="button" className="se-imgdlg__enlace" onClick={() => archivoRef.current?.click()}>
                Usar otra foto del equipo
              </button>
            ) : null}
            <button
              type="button"
              className="se-imgdlg__enlace"
              aria-expanded={biblioteca}
              onClick={() => setBiblioteca((v) => !v)}
            >
              {biblioteca ? "Cerrar la biblioteca" : "Elegir una ya subida"}
            </button>
          </div>
          {biblioteca ? (
            <SelectorDeBiblioteca id={`${idBase}-biblio`} kind="image" onElegir={elegirDeBiblioteca} />
          ) : null}

          {error ? (
            <p className="se-imgdlg__error" role="alert">
              {error}
            </p>
          ) : null}

          {vista ? (
            <div className="se-imgdlg__campos">
              <label className="se-form-field" htmlFor={`${idBase}-pie`}>
                <span className="se-form-label">Pie de foto (opcional)</span>
                <input
                  id={`${idBase}-pie`}
                  className="se-form-control"
                  value={pie}
                  maxLength={280}
                  data-primero
                  placeholder="Qué se ve, y el crédito si hace falta"
                  onChange={(e) => setPie(e.target.value)}
                />
              </label>
              <label className="se-form-field" htmlFor={`${idBase}-alt`}>
                <span className="se-form-label">Descripción para quien no ve la imagen</span>
                <input
                  id={`${idBase}-alt`}
                  className="se-form-control"
                  value={alt}
                  maxLength={200}
                  placeholder="Por ejemplo: grúas cargando contenedores en el puerto de La Guaira"
                  onChange={(e) => setAlt(e.target.value)}
                />
                <span className="se-form-hint">La leen los lectores de pantalla y la usa Google. Una frase basta.</span>
              </label>
            </div>
          ) : null}

          <footer className="se-adm-dialog__actions">
            <button type="button" className="se-btn se-btn--secondary" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="se-btn" disabled={!imagen?.src || subiendo}>
              {subiendo ? "Subiendo…" : editando ? "Guardar cambios" : "Poner en el texto"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

DialogoDeImagen.propTypes = {
  abierto: PropTypes.bool.isRequired,
  /** Los atributos de la foto que se está editando; nulo al insertar una nueva. */
  inicial: PropTypes.object,
  /** `(file) => Promise<atributos>` */
  subir: PropTypes.func.isRequired,
  onAceptar: PropTypes.func.isRequired,
  onCerrar: PropTypes.func.isRequired,
};

DialogoDeImagen.defaultProps = { inicial: null };

export default DialogoDeImagen;
