import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { AssetField } from "../AssetField";
import { CampoMovil } from "../CampoMovil";
import { RichTextEditor } from "../../editor/RichTextEditor";
import { useEsMovil } from "../../../hooks/useEsMovil";
import { actualizarNumero, borrarNumero } from "../../../services/adminBoletinService";
import { ACCEPTED_IMAGE_MIME, uploadAdminMediaImage } from "../../../services/adminMediaService";
import { lunesLargo } from "./datosDelBoletin";
import { Estado } from "./Estado";
import { Paginas } from "./Paginas";
import { Envio } from "./Envio";

/** Cuántas palabras tiene un HTML del editor: para el resumen de la fila. */
const palabras = (html) => {
  const t = String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return t ? t.split(/\s+/).length : 0;
};

/** Lo que se edita a mano de un número, tal como está guardado. */
const textoDe = (numero) => ({
  subject: numero.subject ?? "",
  preheader: numero.preheader ?? "",
  body_html: numero.body_html ?? "",
});

// ------------------------------------------------------------------ el editor
export const Editor = ({ numero, correr, onCambio, onVolver, onBorrado, preguntar }) => {
  // En el teléfono cada bloque es una fila que abre su hoja, como en el editor de
  // piezas. «Probar y enviar» se queda a la vista: es la acción, no un campo.
  const esMovil = useEsMovil();
  const [texto, setTexto] = useState(() => textoDe(numero));

  // Al cambiar de número se reinicia el borrador. Al guardar el mismo, lo hace `guardar`.
  useEffect(() => {
    setTexto(textoDe(numero));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero.id]);

  const bloqueado = numero.status === "sending" || numero.status === "sent";
  const cambios =
    texto.subject !== (numero.subject ?? "") ||
    texto.preheader !== (numero.preheader ?? "") ||
    texto.body_html !== (numero.body_html ?? "");

  /**
   * Guarda y se queda con lo que guardó el servidor, no con lo escrito: el servidor
   * limpia la introducción y deja los atributos de un enlace en otro orden. Comparando
   * con lo escrito, la pantalla veía «cambios sin guardar» para siempre y «Enviar
   * ahora» no se encendía hasta recargar. Si mientras tanto se siguió escribiendo, se
   * respeta lo nuevo. Devuelve el número guardado, o nada si falló.
   */
  const guardar = async () => {
    const enviado = texto;
    const r = await correr(() => actualizarNumero(numero.id, enviado), "Cambios guardados");
    if (!r) return null;
    onCambio(r);
    setTexto((t) => (t === enviado ? textoDe(r) : t));
    return r;
  };

  // Volver a la lista con el asunto o la introducción a medias: en el teléfono se
  // pregunta, que un toque de más no se lleve lo escrito.
  const volver = async () => {
    if (esMovil && cambios) {
      const salir = await preguntar({
        title: "¿Salir sin guardar?",
        description: "El asunto o la introducción tienen cambios que todavía no se guardaron.",
        confirmLabel: "Salir sin guardar",
        cancelLabel: "Seguir editando",
      });
      if (!salir) return;
    }
    onVolver();
  };

  const nPaginas = numero.pages?.length ?? 0;
  const nPalabras = palabras(texto.body_html);

  return (
    <div className="se-bol__editor">
      <div className="se-bol__editor-barra">
        <button type="button" className="se-btn se-btn--secondary" onClick={volver}>
          ← Todos los números
        </button>
        <Estado status={numero.status} />
        {numero.send_on ? (
          <span className="se-bol__editor-lunes">Sale el {lunesLargo(numero.send_on)} · 9:00</span>
        ) : null}
        {!bloqueado ? (
          <button
            type="button"
            className="se-btn se-btn--secondary se-bol__borrar"
            onClick={async () => {
              const vale = await preguntar({
                title: `¿Borrar «${numero.subject}»?`,
                description:
                  "Se borra el número. Las imágenes se quedan en Archivos, así que se pueden volver a usar.",
                confirmLabel: "Borrar el número",
                busyLabel: "Borrando…",
              });
              if (!vale) return;
              const r = await correr(() => borrarNumero(numero.id), "Número borrado");
              if (r) onBorrado();
            }}
          >
            Borrar
          </button>
        ) : null}
      </div>

      {bloqueado ? (
        <p className="se-admin-pub__aviso">
          Este número ya salió hacia la lista, así que no se puede cambiar.
        </p>
      ) : null}

      <div className={esMovil ? "se-bol__bloque se-bol__filas" : "se-bol__grupo"}>
      <CampoMovil
        movil={esMovil}
        titulo="Bandeja de entrada"
        resumen={texto.subject.trim() || "Sin asunto"}
        estado={texto.subject.trim() ? "ok" : "falta"}
      >
      <section className="se-bol__bloque">
        <div className="se-bol__bloque-cabeza">
          <h2 className="se-bol__bloque-titulo">Bandeja de entrada</h2>
          <p className="se-admin-meta-hint">Lo que se lee antes de abrir el correo.</p>
        </div>
        <label className="se-form-label" htmlFor={`bol-${numero.id}-asunto`}>
          Asunto
        </label>
        <input
          id={`bol-${numero.id}-asunto`}
          className="se-form-control"
          value={texto.subject}
          maxLength={300}
          disabled={bloqueado}
          onChange={(e) => setTexto((t) => ({ ...t, subject: e.target.value }))}
        />
        <label className="se-form-label" htmlFor={`bol-${numero.id}-pre`}>
          Texto de vista previa <span className="se-admin-meta-hint">(opcional)</span>
        </label>
        <input
          id={`bol-${numero.id}-pre`}
          className="se-form-control"
          value={texto.preheader}
          maxLength={300}
          disabled={bloqueado}
          placeholder="La línea gris que sale junto al asunto en Gmail"
          onChange={(e) => setTexto((t) => ({ ...t, preheader: e.target.value }))}
        />
      </section>
      </CampoMovil>

      <CampoMovil
        movil={esMovil}
        titulo="Portada"
        resumen={numero.cover_url ? "Puesta" : "Sin portada (opcional)"}
        miniatura={numero.cover_url || undefined}
        estado={numero.cover_url ? "ok" : undefined}
      >
      <section className="se-bol__bloque">
        <div className="se-bol__bloque-cabeza">
          <h2 className="se-bol__bloque-titulo">Portada</h2>
          <p className="se-admin-meta-hint">
            La primera imagen del correo. Opcional: si la portada es la primera página,
            súbala sólo como página.
          </p>
        </div>
        <div className="se-bol__portada">
          {numero.cover_url ? (
            <img src={numero.cover_url} alt="" className="se-bol__portada-img" />
          ) : null}
          {!bloqueado ? (
            <AssetField
              id={`bol-${numero.id}-portada`}
              label="Imagen de portada"
              kind="image"
              value={numero.cover_media_id ?? null}
              asset={
                numero.cover_media_id
                  ? { id: numero.cover_media_id, url: numero.cover_url, original_filename: "Portada" }
                  : null
              }
              onChange={(id) =>
                correr(
                  () => actualizarNumero(numero.id, { cover_media_id: id ?? null }),
                  id ? "Portada puesta" : "Portada quitada",
                ).then((r) => (r ? onCambio(r) : null))
              }
              onUpload={uploadAdminMediaImage}
              accept={ACCEPTED_IMAGE_MIME}
            />
          ) : null}
        </div>
      </section>
      </CampoMovil>

      <CampoMovil
        movil={esMovil}
        titulo="Introducción"
        resumen={nPalabras ? `${nPalabras} ${nPalabras === 1 ? "palabra" : "palabras"}` : "Vacía (opcional)"}
        estado={nPalabras ? "ok" : undefined}
      >
      <section className="se-bol__bloque se-bol__intro">
        <div className="se-bol__bloque-cabeza">
          <h2 className="se-bol__bloque-titulo">
            Introducción <span className="se-admin-meta-hint">(opcional)</span>
          </h2>
          <p className="se-admin-meta-hint">
            Dos o tres líneas que presenten el número. Va debajo de la portada y antes de
            las páginas. <strong>No copie aquí el texto de las páginas</strong>: ya viajan
            como imagen, y repetirlo se lee como el mismo contenido escrito dos veces.
          </p>
        </div>
        <RichTextEditor
          value={texto.body_html}
          disabled={bloqueado}
          placeholder="Ej.: Esta semana, la inflación en cifras y lo que dejó la cumbre de Latam."
          onChange={(html) => setTexto((t) => ({ ...t, body_html: html }))}
        />
      </section>
      </CampoMovil>
      {/* En el teléfono las páginas van con las demás filas; en el computador, debajo
          del botón de guardar, como siempre. */}
      {esMovil ? (
        <CampoMovil
          movil
          titulo="Páginas"
          resumen={nPaginas ? `${nPaginas} ${nPaginas === 1 ? "página" : "páginas"}` : "Ninguna todavía"}
          miniatura={numero.pages?.[0]?.url || undefined}
          estado={nPaginas ? "ok" : "falta"}
        >
          <Paginas numero={numero} bloqueado={bloqueado} correr={correr} onCambio={onCambio} />
        </CampoMovil>
      ) : null}
      </div>

      {!bloqueado && (!esMovil || cambios) ? (
        <div className={`se-bol__guardar${esMovil ? " se-bol__guardar--movil" : ""}`}>
          <button
            type="button"
            className="se-btn se-btn--primary"
            disabled={!cambios || !texto.subject.trim()}
            onClick={guardar}
          >
            Guardar asunto e introducción
          </button>
          {cambios ? <span className="se-admin-meta-hint">Hay cambios sin guardar.</span> : null}
        </div>
      ) : null}

      {!esMovil ? (
        <Paginas numero={numero} bloqueado={bloqueado} correr={correr} onCambio={onCambio} />
      ) : null}

      <section className="se-bol__bloque se-bol__auto">
        <div className="se-bol__bloque-cabeza">
          <h2 className="se-bol__bloque-titulo">Te puede interesar</h2>
          <p className="se-admin-meta-hint">
            Se añade solo al final del correo: las cuatro últimas piezas publicadas en el
            sitio, con su foto, y un botón «Ver más en SurEconomics». Se eligen en el
            momento de enviar, así que siempre son las más recientes.
          </p>
        </div>
      </section>

      <Envio
        numero={numero}
        cambiosSinGuardar={cambios}
        asunto={texto.subject}
        guardarCambios={guardar}
        correr={correr}
        onCambio={onCambio}
        preguntar={preguntar}
      />
    </div>
  );
};

Editor.propTypes = {
  numero: PropTypes.object.isRequired,
  correr: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
  onVolver: PropTypes.func.isRequired,
  onBorrado: PropTypes.func.isRequired,
  preguntar: PropTypes.func.isRequired,
};
