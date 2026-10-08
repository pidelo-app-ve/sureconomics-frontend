import PropTypes from "prop-types";
import { useEffect, useId, useRef, useState } from "react";

import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { imagenAncho } from "../../../lib/pieza";
import { MAX_IMAGE_BYTES, listAdminMedia } from "../../../services/adminMediaService";
import { ModalDelPanel } from "../ModalDelPanel";
import { SelectorDeBiblioteca, comoSeLlama } from "../SelectorDeBiblioteca";
import { atributosDeAsset } from "./atributos";
import { TIPOS_DE_IMAGEN } from "./figura";
import { IconoSubir } from "./iconos";

const megas = (bytes) => `${Math.round(bytes / (1024 * 1024))} MB`;

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
 * Las fotos recientes, y solo fotos. La biblioteca guarda también el arte de la
 * publicidad -- cintas de 8:1, logotipos, piezas de anunciante, que el asistente de
 * anuncios sube con etiquetas «Publicidad…» y «Logo…», o archivos que se llaman así -- y las ilustraciones de relleno
 * en SVG. Nada de eso se pone entre dos párrafos de una noticia, y en una rejilla de
 * miniaturas taparía las fotos de verdad.
 */
const CUANTAS_RECIENTES = 8;
const NO_ES_FOTO = /publicidad|logo|banner/i;
const esFoto = (fila) => {
  if (!fila?.url || fila.url.startsWith("data:")) return false;
  if ((fila.mime ?? "").includes("svg") || /\.svg($|\?)/i.test(fila.url)) return false;
  // La etiqueta, y si no la hay, el nombre del archivo: «alalza-logo.png».
  if (NO_ES_FOTO.test(`${fila.label ?? ""} ${fila.original_filename ?? ""}`)) return false;
  const { width: w, height: h } = fila;
  if (!w || !h) return true;
  const r = w / h;
  return r >= 0.5 && r <= 2.2;
};

/**
 * La ventana para poner una foto en el cuerpo, o cambiar la que ya está.
 *
 * Sobre `ModalDelPanel`, como el resto de modales del panel: tapa la pantalla entera
 * (barra lateral incluida), atrapa el foco y bloquea el desplazamiento de detrás.
 *
 * - **Sin foto todavía:** a la izquierda, el sitio donde soltarla o el botón para
 *   elegirla del equipo; debajo, las últimas fotos de la biblioteca, a un clic, y un
 *   buscador para el resto.
 * - **Con foto:** a la izquierda, cómo va a quedar -- sobre papel, al ancho de la
 *   columna de lectura y con el pie debajo --; a la derecha, el pie y la descripción.
 *   En el teléfono, una debajo de la otra.
 *
 * No inserta nada hasta que se pulsa el botón: cerrar a mitad no deja una foto huérfana
 * en el texto.
 */
export const DialogoDeImagen = ({ abierto, inicial, subir, onAceptar, onCerrar }) => {
  const idBase = useId();
  const [imagen, setImagen] = useState(null); // atributos finales (src, srcset, medidas)
  const [local, setLocal] = useState(""); // vista previa mientras sube
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [pie, setPie] = useState("");
  const [alt, setAlt] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [encima, setEncima] = useState(false);
  const [recientes, setRecientes] = useState({ estado: "idle", filas: [] });
  const archivoRef = useRef(null);
  const turno = useRef(0);

  // Cada vez que se abre, parte de lo que hay (al editar) o de cero (al insertar).
  useEffect(() => {
    if (!abierto) return;
    turno.current += 1;
    setImagen(inicial?.src ? { ...inicial } : null);
    setPie(inicial?.pie ?? "");
    setAlt(inicial?.alt ?? "");
    setLocal("");
    setSubiendo(false);
    setError("");
    setBuscando(false);
  }, [abierto, inicial]);

  // Las recientes, una vez por apertura y solo si hacen falta.
  useEffect(() => {
    if (!abierto || imagen?.src || local) return undefined;
    let vivo = true;
    setRecientes((r) => (r.filas.length ? r : { estado: "cargando", filas: [] }));
    listAdminMedia({ kind: "image", limit: 60 })
      .then(({ items }) => {
        if (vivo) setRecientes({ estado: "listo", filas: (items ?? []).filter(esFoto).slice(0, CUANTAS_RECIENTES) });
      })
      .catch(() => vivo && setRecientes({ estado: "error", filas: [] }));
    return () => {
      vivo = false;
    };
  }, [abierto, imagen?.src, local]);

  useEffect(() => () => local && URL.revokeObjectURL(local), [local]);

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
    setBuscando(false);
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
    setBuscando(false);
  };

  const otraFoto = () => {
    turno.current += 1;
    setLocal("");
    setImagen(null);
    setSubiendo(false);
    setError("");
  };

  const aceptar = () => {
    if (!imagen?.src || subiendo) return;
    onAceptar({ ...imagen, pie: pie.trim(), alt: alt.trim() });
  };

  const soltar = (e) => {
    e.preventDefault();
    setEncima(false);
    tomarArchivo(e.dataTransfer?.files?.[0]);
  };

  const inputArchivo = (
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
  );

  const avisoDeError = error ? (
    <p className="se-imgdlg__error" role="alert">
      {error}
    </p>
  ) : null;

  return (
    <ModalDelPanel
      abierto={abierto}
      ancho="ancho"
      titulo={editando ? "Editar la foto" : "Foto en el texto"}
      subtitulo={editando ? "Cambie la foto, su pie o su descripción." : "Va donde dejó el cursor, entre dos párrafos."}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="se-btn se-btn--secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="button" className="se-btn" onClick={aceptar} disabled={!imagen?.src || subiendo}>
            {subiendo ? "Subiendo…" : editando ? "Guardar cambios" : "Poner en el texto"}
          </button>
        </>
      }
    >
      {inputArchivo}

      {vista ? (
        // —— Con foto: cómo queda y sus textos ——
        <div className="se-imgdlg__con-foto">
          <div className="se-imgdlg__previa">
            <figure className="se-imgdlg__papel">
              <div className="se-imgdlg__marco">
                <img src={vista} alt="" className="se-imgdlg__img" />
                {subiendo ? (
                  <span className="se-figura-ed__velo" role="status">
                    <span className="se-figura-ed__giro" aria-hidden="true" />
                    Subiendo la foto…
                  </span>
                ) : null}
              </div>
              <figcaption className={`se-imgdlg__pie-previo${pie.trim() ? "" : " se-imgdlg__pie-previo--vacio"}`}>
                {pie.trim() || "Aquí irá el pie, si escribe uno."}
              </figcaption>
            </figure>
            <p className="se-imgdlg__nota">Así se verá en la pieza, al ancho de la columna de lectura.</p>
            <button type="button" className="se-imgdlg__enlace" onClick={otraFoto} disabled={subiendo}>
              Elegir otra foto
            </button>
          </div>

          <div className="se-imgdlg__campos">
            <label className="se-form-field" htmlFor={`${idBase}-pie`}>
              <span className="se-form-label">Pie de foto (opcional)</span>
              <textarea
                id={`${idBase}-pie`}
                className="se-form-control se-imgdlg__area"
                rows={3}
                value={pie}
                maxLength={280}
                placeholder="Qué se ve, y el crédito si hace falta"
                onChange={(e) => setPie(e.target.value)}
              />
            </label>
            <label className="se-form-field" htmlFor={`${idBase}-alt`}>
              <span className="se-form-label">Descripción para quien no ve la imagen</span>
              <textarea
                id={`${idBase}-alt`}
                className="se-form-control se-imgdlg__area"
                rows={3}
                value={alt}
                maxLength={200}
                placeholder="Por ejemplo: grúas cargando contenedores en el puerto de La Guaira"
                onChange={(e) => setAlt(e.target.value)}
              />
              <span className="se-form-hint">La leen los lectores de pantalla y la usa Google. Una frase basta.</span>
            </label>
            {avisoDeError}
          </div>
        </div>
      ) : (
        // —— Sin foto: de dónde sale ——
        <div className="se-imgdlg__inicio">
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
            <button type="button" className="se-btn" onClick={() => archivoRef.current?.click()}>
              Elegir del equipo
            </button>
            <p className="se-imgdlg__suelo-ayuda">JPG, PNG o WebP · hasta {megas(MAX_IMAGE_BYTES)}</p>
          </div>
          {avisoDeError}

          <section className="se-imgdlg__biblio" aria-labelledby={`${idBase}-biblio`}>
            <div className="se-imgdlg__biblio-cabeza">
              <h3 id={`${idBase}-biblio`} className="se-imgdlg__biblio-titulo">
                {buscando ? "Buscar en la biblioteca" : "Ya subidas"}
              </h3>
              <button type="button" className="se-imgdlg__enlace" onClick={() => setBuscando((v) => !v)}>
                {buscando ? "Ver las recientes" : "Buscar en la biblioteca"}
              </button>
            </div>

            {buscando ? (
              <SelectorDeBiblioteca id={`${idBase}-buscar`} kind="image" onElegir={elegirDeBiblioteca} />
            ) : recientes.estado === "cargando" ? (
              <ul className="se-imgdlg__recientes" aria-busy="true">
                {Array.from({ length: CUANTAS_RECIENTES }, (_, i) => (
                  <li key={i} className="se-imgdlg__miniatura se-imgdlg__miniatura--cargando" />
                ))}
              </ul>
            ) : recientes.filas.length ? (
              <ul className="se-imgdlg__recientes">
                {recientes.filas.map((fila) => (
                  <li key={fila.id}>
                    <button
                      type="button"
                      className="se-imgdlg__miniatura"
                      onClick={() => elegirDeBiblioteca(fila)}
                      title={comoSeLlama(fila)}
                    >
                      <img src={imagenAncho(fila.url, 320)} alt={comoSeLlama(fila)} loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="se-imgdlg__vacio">
                {recientes.estado === "error"
                  ? "No se pudo cargar la biblioteca. Puede subir una foto igual."
                  : "Todavía no hay fotos en la biblioteca."}
              </p>
            )}
          </section>
        </div>
      )}
    </ModalDelPanel>
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
