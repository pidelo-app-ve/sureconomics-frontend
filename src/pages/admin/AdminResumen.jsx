import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { AssetField } from "../../components/admin/AssetField";
import { ErrorState, LoadingState } from "../../components/content";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { adminRequest } from "../../lib/api";
import { recorridoResumen } from "../../lib/guias/guiaResumen";
import { applyPageMeta } from "../../lib/seo";
import { ACCEPTED_IMAGE_MIME, uploadAdminMediaImage } from "../../services/adminMediaService";
import { unwrapEntity } from "../../services/adminResponseUtils";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";

/**
 * «Resumen diario» en el panel: ver cómo va a llegar al canal cada edición y ajustarla.
 *
 * Una hora antes de cada salida (6:00, 12:00 y 18:00) el backend arma solo un borrador
 * con lo nuevo desde la edición anterior (ver `services/resumen_service.py`), y **a su
 * hora sale solo** (7:00, 13:00 o 19:00) en la web, en Telegram y en el canal de
 * WhatsApp: nadie tiene que aprobarlo (lo pidió Ramón el 9-nov-2026). Hasta esa hora el
 * editor puede cambiar la **foto** que acompaña al mensaje -- la de otra noticia del
 * mensaje, una de la biblioteca o ninguna --, retocar los puntos, las cifras y la frase,
 * y ve el resultado en la maqueta del canal (`VistaPreviaWhatsApp`). Si lo cambia, sale
 * cambiado; si no lo toca, sale tal cual. «No mandar esta edición» frena una concreta.
 * Una edición con casi nada nuevo queda «sin contenido nuevo» y no sale.
 *
 * Los cambios se guardan con «Guardar cambios»: el borrador se edita aquí, en el
 * navegador, y solo se manda entero al guardar. La foto se ve en la maqueta al elegirla;
 * el texto, al guardar (lo arma el servidor, y es el mismo que se manda).
 *
 * Desde el 17-nov-2026 (auditoría D-02, D-03, D-08):
 * - **«Resumen activo»**, el interruptor general: apagado, no se arma, no sale ni se manda
 *   nada nuevo (las ediciones que iban a salir quedan «en pausa»). Para una emergencia de
 *   varias horas, sin tener que retener cada edición.
 * - **«Retirar edición»**: una que ya salió deja de verse en la web y el servidor la borra
 *   del canal de Telegram. No se deshace. Lo que ya salió por WhatsApp hay que borrarlo a
 *   mano en el canal (lo publica el VPS): la ficha lo avisa. Si el borrado de Telegram
 *   falla, el mismo botón lo reintenta.
 * - La ficha dice **quién hizo qué** con cada edición (`historial`) y qué se borró después
 *   de armarla (`caidos`, `quitados`).
 */

const ESTADO = {
  vacio: { texto: "Sin contenido nuevo", clase: "se-res-adm-chip--vacio" },
  borrador: { texto: "Borrador", clase: "se-res-adm-chip--borrador" },
  retenido: { texto: "Retenida", clase: "se-res-adm-chip--retenido" },
  publicado: { texto: "Publicado", clase: "se-res-adm-chip--publicado" },
  retirado: { texto: "Retirada", clase: "se-res-adm-chip--vacio" },
};
const CANAL = {
  apagado: "sin configurar",
  pendiente: "pendiente",
  enviando: "enviando…",
  enviado: "enviado",
  fallo: "falló",
  borrando: "borrándolo del canal…",
  retirado: "retirado",
};
/** Cómo quedó cada canal en una edición retirada. */
const CANAL_RETIRADA = {
  telegram: {
    apagado: "sin configurar",
    pendiente: "borrándolo del canal…",
    enviando: "borrándolo del canal…",
    enviado: "borrándolo del canal…",
    borrando: "borrándolo del canal…",
    retirado: "retirado del canal",
    fallo: "no se pudo borrar",
  },
  whatsapp: {
    apagado: "sin configurar",
    retirado: "no llegó a salir",
    enviando: "salió: hay que borrarlo a mano",
    enviado: "salió: hay que borrarlo a mano",
  },
};
const canal = (r, nombre, estado) =>
  (r.estado === "retirado" ? CANAL_RETIRADA[nombre][estado] : null) ?? CANAL[estado] ?? estado;
const MOMENTO = { manana: "Mañana", tarde: "Tarde", noche: "Noche" };
const { ancla } = recorridoResumen;
const zona = { timeZone: "America/Caracas" };
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("es-VE", { ...zona, hour: "2-digit", minute: "2-digit" }) : "—");
/** «17-nov 02:03 p. m.»: el día y la hora, en la de Caracas. */
const cuando = (iso) => {
  if (!iso) return "—";
  const f = new Date(iso);
  const dia = f.toLocaleDateString("es-VE", { ...zona, day: "numeric" });
  const mes = f.toLocaleDateString("es-VE", { ...zona, month: "short" }).replace(".", "");
  return `${dia}-${mes} ${hora(iso)}`;
};
/** El chip de una edición: un borrador dice a qué hora sale solo o, si ya no va a salir, que no salió. */
const chipDe = (r) => {
  if (r.estado !== "borrador") return ESTADO[r.estado] ?? { texto: r.estado, clase: "" };
  if (r.en_pausa) return { texto: "En pausa: el resumen está apagado", clase: "se-res-adm-chip--retenido" };
  if (r.sale_sola_a_las) return { texto: `Sale sola · ${hora(r.sale_sola_a_las)}`, clase: "se-res-adm-chip--borrador" };
  return { texto: r.pasa_a ? "No salió: pasó a la siguiente" : "No salió", clase: "se-res-adm-chip--vacio" };
};

/** Lo que cambió al guardar, con el nombre que le da la redacción. */
const CAMPO = { secciones: "los puntos", frase: "la frase", imagen_id: "la foto", cifras_manuales: "las cifras a mano" };
const enumerar = (cosas) => (cosas.length > 1 ? `${cosas.slice(0, -1).join(", ")} y ${cosas[cosas.length - 1]}` : cosas[0] ?? "");

/** Una línea del historial de la edición: «retiró la edición: «motivo»». Sin el nombre. */
const queHizo = (a) => {
  const d = a.datos || {};
  switch (a.accion) {
    case "armar":
      return `armó la edición${d.armado_con === "ia" ? " con la IA" : d.armado_con ? " por reglas" : ""}`;
    case "rehacer":
      return `rehízo la edición${d.armado_con === "ia" ? " con la IA" : d.armado_con ? " por reglas" : ""}`;
    case "editar": {
      const campos = (d.campos ?? []).map((c) => CAMPO[c]).filter(Boolean);
      return campos.length ? `cambió ${enumerar(campos)}` : "guardó cambios";
    }
    case "retener":
      return "la retuvo: no sale";
    case "soltar":
      return "dejó que saliera";
    case "retirar":
      return `${d.reintento ? "volvió a intentar borrarla de Telegram" : "retiró la edición"}${d.motivo ? `: «${d.motivo}»` : ""}`;
    case "whatsapp_reintentar":
      return "volvió a mandarla a WhatsApp";
    default:
      return a.accion;
  }
};

/**
 * El motivo de «Retirar edición», dentro del diálogo de confirmación. Lleva su propio
 * estado (el diálogo pinta lo que se le pasó al abrirlo) y avisa cada cambio hacia fuera.
 */
const MOTIVO_MAX = 300;
const CampoMotivo = ({ onCambio }) => {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="se-form-field" style={{ marginTop: "0.75rem" }}>
      <label className="se-form-label" htmlFor="res-retirar-motivo">Motivo (opcional)</label>
      <textarea id="res-retirar-motivo" className="se-form-control" rows={2} maxLength={MOTIVO_MAX} value={motivo}
        onChange={(e) => {
          setMotivo(e.target.value);
          onCambio(e.target.value);
        }} />
      <p className="se-admin-meta-hint">
        Queda en el historial de la edición, para el equipo; en la web no se enseña. {motivo.length}/{MOTIVO_MAX}
      </p>
    </div>
  );
};

CampoMotivo.propTypes = { onCambio: PropTypes.func.isRequired };

/** Qué pasa en cada canal al retirar esta edición, para el diálogo. */
const alRetirar = (r) => {
  const t = r.canales?.telegram ?? {};
  const w = r.canales?.whatsapp ?? {};
  return [
    "Deja de verse en la web enseguida: quien abra su enlace verá que se retiró.",
    t.estado === "apagado"
      ? null
      : t.mensajes > 0 || ["enviando", "enviado"].includes(t.estado)
        ? "Se borra del canal de Telegram en el próximo minuto."
        : "No sale por Telegram.",
    w.estado === "apagado"
      ? null
      : ["enviando", "enviado"].includes(w.estado)
        ? "En WhatsApp ya salió y desde aquí no se puede borrar: después tendrás que borrarlo a mano en el canal."
        : "No sale por WhatsApp.",
    "Lo que llevaba no vuelve a entrar solo en la siguiente edición.",
  ].filter(Boolean);
};
const conVariacion = (c) =>
  typeof c.variacion === "number" && Math.abs(c.variacion) >= 0.005
    ? `${c.valor} (${c.variacion > 0 ? "+" : "−"}${Math.abs(c.variacion).toFixed(2).replace(".", ",")} %)`
    : c.valor;

/** Lo editable de un resumen, en la forma que se manda al guardar. */
const editable = (r) => ({
  secciones: (r?.secciones ?? []).map((s) => ({
    clave: s.clave,
    puntos: s.puntos.map((p) => ({ id: p.id, linea: p.linea, linea_en: p.linea_en })),
  })),
  frase: r?.frase ?? "",
  cifras_manuales: (r?.cifras_manuales ?? []).map((c) => ({ etiqueta: c.etiqueta, valor: c.valor })),
  imagen_id: r?.imagen_id ?? null,
});

/** La foto de una pieza del mensaje, en la forma en que `AssetField` describe un adjunto. */
const comoAdjunto = (f) => ({
  id: f.id, url: f.url, original_filename: f.titulo || f.alt || "Foto", width: f.ancho, height: f.alto, credit: f.credito,
});

/**
 * La foto que acompaña al mensaje (opcional): sale primero en WhatsApp y en Telegram,
 * antes del texto, y arriba en la web. Se elige sola -- la de la noticia más importante
 * del mensaje que tenga foto -- y el editor la cambia con un clic por la de otra noticia
 * del mensaje, o la sube o la elige de la biblioteca como la portada del boletín, o la
 * quita. Se guarda con el resto («Guardar cambios»). Sur la manda en JPG de 1600 px como
 * mucho, sin recortarla.
 */
const ImagenDelDia = ({ resumen, imagenId, elegida, bloqueado, onCambio }) => {
  const guardada = imagenId && imagenId === resumen.imagen_id ? resumen.imagen : null;
  // La que se eligió sola (la de la pieza más importante) hasta que el editor la cambie.
  const automatica = Boolean(resumen.imagen_auto && imagenId && imagenId === resumen.imagen_id);
  const url = elegida?.url ?? guardada?.url ?? null;
  const asset = imagenId
    ? { id: imagenId, url, original_filename: elegida?.original_filename || guardada?.alt || "Imagen del día" }
    : null;
  const fotos = resumen.fotos_de_las_piezas ?? [];
  return (
    <div className="se-res-adm-imagen">
      <h2 className="se-form-label">La foto del mensaje</h2>
      {automatica ? (
        <p className="se-admin-meta-hint">Elegida sola: la de la noticia más importante del mensaje. Cámbiala si quieres; la ves al momento en la maqueta de al lado.</p>
      ) : null}
      {bloqueado ? (
        <>
          {url ? <img src={url} alt="" className="se-res-adm-imagen__vista" /> : null}
          <p className="se-admin-meta-hint">{url ? "Foto de la edición." : "Sin foto."}</p>
        </>
      ) : (
        <>
          {fotos.length ? (
            <div className="se-res-adm-fotos" role="group" aria-label="Fotos de las noticias del mensaje">
              <p className="se-admin-meta-hint">Las fotos de las noticias del mensaje: pulsa la que debe acompañarlo.</p>
              <ul className="se-res-adm-fotos__lista">
                {fotos.map((f) => (
                  <li key={f.id}>
                    <button type="button" className={`se-res-adm-fotos__foto${imagenId === f.id ? " is-elegida" : ""}`}
                      aria-pressed={imagenId === f.id} title={f.titulo} onClick={() => onCambio(f.id, comoAdjunto(f))}>
                      <img src={f.url} alt="" loading="lazy" />
                      <span>{f.titulo}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" className={`se-res-adm-fotos__foto se-res-adm-fotos__foto--sin${imagenId ? "" : " is-elegida"}`}
                    aria-pressed={!imagenId} onClick={() => onCambio(null, null)}>
                    <span>Sin foto</span>
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <p className="se-admin-meta-hint">Ninguna noticia del mensaje tiene foto: elige una de la biblioteca, súbela, o sale sin foto.</p>
          )}
          <AssetField
            id={`res-${resumen.id}-imagen`}
            label="Otra foto"
            hint="De la biblioteca o subida ahora. Tiene que ser pública. En WhatsApp sale primero la foto y enseguida el mensaje; en la web va arriba."
            kind="image"
            value={imagenId}
            asset={asset}
            onChange={onCambio}
            onUpload={uploadAdminMediaImage}
            accept={ACCEPTED_IMAGE_MIME}
          />
        </>
      )}
    </div>
  );
};

const FOTO = PropTypes.shape({
  id: PropTypes.number, url: PropTypes.string, alt: PropTypes.string, titulo: PropTypes.string,
  ancho: PropTypes.number, alto: PropTypes.number, credito: PropTypes.string,
});

ImagenDelDia.propTypes = {
  resumen: PropTypes.shape({
    id: PropTypes.number.isRequired,
    imagen_id: PropTypes.number,
    imagen_auto: PropTypes.bool,
    imagen: FOTO,
    fotos_de_las_piezas: PropTypes.arrayOf(FOTO),
  }).isRequired,
  imagenId: PropTypes.number,
  elegida: PropTypes.shape({ url: PropTypes.string, original_filename: PropTypes.string, width: PropTypes.number, height: PropTypes.number }),
  bloqueado: PropTypes.bool.isRequired,
  onCambio: PropTypes.func.isRequired,
};

/** Las negritas y cursivas de WhatsApp (*así* y _así_), como las pinta el teléfono. */
const conFormatoDeWhatsApp = (linea) =>
  linea.split(/(\*[^*\n]+\*|_[^_\n]+_)/g).map((trozo, i) => {
    if (trozo.length > 2 && trozo.startsWith("*") && trozo.endsWith("*")) return <strong key={i}>{trozo.slice(1, -1)}</strong>;
    if (trozo.length > 2 && trozo.startsWith("_") && trozo.endsWith("_")) return <em key={i}>{trozo.slice(1, -1)}</em>;
    return trozo;
  });

/**
 * El mensaje como lo ve quien abre el canal: primero la foto, en su proporción (Sur la
 * manda en JPG de hasta 1600 px, sin recortarla), y enseguida el texto, que WhatsApp
 * remata con la **tarjeta del enlace**: la arma él solo con la foto (recortada a lo
 * ancho) y el título de la página del resumen, que `api/pieza.js` le da. Es una maqueta
 * fiel con los colores del chat de WhatsApp, no una captura.
 */
const VistaPreviaWhatsApp = ({ texto, foto, nombre, cuando }) => {
  const marca = cuando ? hora(cuando) : "";
  return (
    <div className="se-res-adm-wa" aria-label="Así se ve en el canal de WhatsApp">
      {foto?.url ? (
        <figure className="se-res-adm-wa__burbuja se-res-adm-wa__burbuja--foto">
          <img src={foto.url} alt="" style={foto.ancho && foto.alto ? { aspectRatio: `${foto.ancho} / ${foto.alto}` } : undefined} />
          <figcaption className="se-res-adm-wa__hora">{marca}</figcaption>
        </figure>
      ) : null}
      <div className="se-res-adm-wa__burbuja">
        <div className="se-res-adm-wa__tarjeta" aria-label="Tarjeta del enlace">
          {foto?.url ? <img src={foto.url} alt="" /> : <img src="/brand/og-default.jpg" alt="" />}
          <div className="se-res-adm-wa__tarjeta-texto">
            <strong>{nombre}</strong>
            <span>sureconomics.com</span>
          </div>
        </div>
        <p className="se-res-adm-wa__texto">
          {texto.split("\n").map((linea, i) => <span key={i}>{conFormatoDeWhatsApp(linea)}{"\n"}</span>)}
        </p>
        <span className="se-res-adm-wa__hora">{marca}</span>
      </div>
    </div>
  );
};

VistaPreviaWhatsApp.propTypes = {
  texto: PropTypes.string.isRequired,
  foto: PropTypes.shape({ url: PropTypes.string, ancho: PropTypes.number, alto: PropTypes.number }),
  nombre: PropTypes.string.isRequired,
  cuando: PropTypes.string,
};

const Punto = ({ punto, info, secciones, clave, primero, ultimo, bloqueado, onCambio, onMover, onQuitar, onSubir, onBajar }) => (
  <li className="se-res-adm-punto">
    <div className="se-res-adm-punto__fila">
      <input className="se-form-control" value={punto.linea} maxLength={140} disabled={bloqueado}
        aria-label="Línea del punto" onChange={(e) => onCambio({ ...punto, linea: e.target.value })} />
      <div className="se-res-adm-punto__botones">
        <button type="button" className="se-btn se-btn--secondary" aria-label="Subir" disabled={bloqueado || primero} onClick={onSubir}>↑</button>
        <button type="button" className="se-btn se-btn--secondary" aria-label="Bajar" disabled={bloqueado || ultimo} onClick={onBajar}>↓</button>
        <label className="se-sr-only" htmlFor={`mover-${punto.id}`}>Mover a otra sección</label>
        <select id={`mover-${punto.id}`} className="se-form-control se-res-adm-punto__mover" value="" disabled={bloqueado}
          onChange={(e) => e.target.value && onMover(e.target.value)}>
          <option value="">Mover a…</option>
          {secciones.filter((s) => s.clave !== clave).map((s) => (
            <option key={s.clave} value={s.clave}>{s.titulo}</option>
          ))}
        </select>
        <button type="button" className="se-btn se-btn--secondary" disabled={bloqueado} onClick={onQuitar}>Quitar</button>
      </div>
    </div>
    <p className="se-admin-meta-hint se-res-adm-punto__meta">
      {info?.tipo === "titular" ? `Última hora${info.fuente ? ` · ${info.fuente}` : ""}` : "Pieza de SurEconomics"} ·{" "}
      <a href={info?.url} target="_blank" rel="noopener noreferrer">ver original</a>
      {info?.titulo && info.titulo !== punto.linea ? ` · título original: «${info.titulo}»` : ""}
    </p>
    <details className="se-res-adm-punto__en">
      <summary className="se-admin-meta-hint">Inglés</summary>
      <input className="se-form-control" value={punto.linea_en ?? ""} maxLength={140} disabled={bloqueado}
        aria-label="Línea en inglés" onChange={(e) => onCambio({ ...punto, linea_en: e.target.value })} />
    </details>
  </li>
);

Punto.propTypes = {
  punto: PropTypes.shape({ id: PropTypes.string.isRequired, linea: PropTypes.string, linea_en: PropTypes.string }).isRequired,
  info: PropTypes.object,
  secciones: PropTypes.array.isRequired,
  clave: PropTypes.string.isRequired,
  primero: PropTypes.bool,
  ultimo: PropTypes.bool,
  bloqueado: PropTypes.bool,
  onCambio: PropTypes.func.isRequired,
  onMover: PropTypes.func.isRequired,
  onQuitar: PropTypes.func.isRequired,
  onSubir: PropTypes.func.isRequired,
  onBajar: PropTypes.func.isRequired,
};

/**
 * Lo que se borró después de armar la edición (un titular que se borró, una pieza que se
 * despublicó): `caidos`, lo que la edición todavía lleva pero ya no sale (ni se ve, si ya
 * salió), y `quitados`, lo que el servidor sacó al publicarla. No se puede volver a poner.
 */
const LoQueSeCayo = ({ resumen }) => {
  const caidos = resumen.caidos ?? [];
  const quitados = resumen.quitados ?? [];
  if (!caidos.length && !quitados.length) return null;
  const salio = ["publicado", "retirado"].includes(resumen.estado);
  const linea = (p) => `«${p.linea || p.id}»${p.motivo ? `: ${p.motivo}` : ""}`;
  return (
    <div className="se-tit-aviso" role="status">
      {caidos.length ? (
        <>
          <strong>
            {salio
              ? "Se borró después de salir y ya no se ve en la web:"
              : "Se borró después de armarla y ya no saldrá:"}
          </strong>
          <ul className="se-tit-historial__lista">
            {caidos.map((p) => <li key={`c-${p.id}`}>{linea(p)}</li>)}
          </ul>
        </>
      ) : null}
      {quitados.length ? (
        <>
          <strong>Se quitó al publicarla, porque se había borrado:</strong>
          <ul className="se-tit-historial__lista">
            {quitados.map((p, i) => <li key={`q-${p.id}-${i}`}>{linea(p)}</li>)}
          </ul>
        </>
      ) : null}
    </div>
  );
};

const PUNTO_CAIDO = PropTypes.shape({ id: PropTypes.string, linea: PropTypes.string, motivo: PropTypes.string });
LoQueSeCayo.propTypes = {
  resumen: PropTypes.shape({
    estado: PropTypes.string,
    caidos: PropTypes.arrayOf(PUNTO_CAIDO),
    quitados: PropTypes.arrayOf(PUNTO_CAIDO),
  }).isRequired,
};

/** Quién hizo qué con la edición, lo último primero: «Ramón retiró la edición · 17-nov 02:03 p. m.». */
const HistorialDeLaEdicion = ({ historial }) => (
  <>
    <h2 className="se-form-label">Lo que se hizo con esta edición</h2>
    {historial.length ? (
      <ul className="se-tit-historial__lista">
        {historial.map((a, k) => (
          <li key={`${a.cuando}-${k}`}>
            <span>
              {a.quien || "Alguien del equipo"} {queHizo(a)}
            </span>
            <span className="se-admin-meta-hint">{cuando(a.cuando)}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="se-admin-meta-hint">Nadie la ha tocado desde el panel.</p>
    )}
  </>
);

HistorialDeLaEdicion.propTypes = {
  historial: PropTypes.arrayOf(
    PropTypes.shape({ accion: PropTypes.string, cuando: PropTypes.string, quien: PropTypes.string, datos: PropTypes.object }),
  ).isRequired,
};

export const AdminResumen = () => {
  const { role } = useAuth();
  // Retirar y el interruptor: publicador y admin, como el resto de esta página en el servidor.
  const puede = role === "publicador" || role === "admin";
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm, ConfirmDialog } = useAdminConfirm();
  // El motivo que se escribe en el diálogo de «Retirar edición», y la petición en curso:
  // un doble clic muy rápido en «Retirar edición» espera a la misma, no manda otra.
  const motivoRef = useRef("");
  const retirandoRef = useRef(null);
  const [lista, setLista] = useState({ status: "loading", datos: null, error: null });
  const [actual, setActual] = useState(null);
  const [edicion, setEdicion] = useState(null);
  const [sucio, setSucio] = useState(false);
  // La imagen que se acaba de subir o elegir, para enseñarla antes de guardar.
  const [imagenElegida, setImagenElegida] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [anadir, setAnadir] = useState({ id: "", seccion: "importante" });

  useEffect(() => {
    applyPageMeta({ title: "Admin — Resumen diario", description: "Ver cómo sale cada edición del resumen y ajustarla antes de la hora." });
  }, []);

  const abrir = useCallback(async (id) => {
    const r = unwrapEntity(await adminRequest(`/admin/resumen/${id}`));
    setActual(r);
    setEdicion(editable(r));
    setImagenElegida(null);
    setSucio(false);
  }, []);

  const cargar = useCallback(async (elegir) => {
    try {
      const d = unwrapEntity(await adminRequest("/admin/resumen"));
      setLista({ status: "success", datos: d, error: null });
      const deHoy = d.resumenes.filter((r) => r.fecha === d.hoy);
      const enCurso = deHoy.find((r) => r.edicion === d.en_curso) ?? deHoy[0];
      const id = elegir ?? enCurso?.id ?? null;
      if (id) await abrir(id);
      else {
        setActual(null);
        setEdicion(null);
      }
    } catch (error) {
      setLista((l) => (l.datos ? l : { status: "error", datos: null, error }));
    }
  }, [abrir]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Una acción del panel: la petición, el aviso y volver a cargar. 202 = sigue en marcha. */
  const hacer = async (peticion, exito, fallo) => {
    setOcupado(true);
    try {
      const r = await peticion();
      const d = unwrapEntity(r);
      if (d?.en_marcha) {
        toastSuccess("Armándolo con la IA. Vuelve a mirar en un minuto.", "Resumen");
      } else {
        toastSuccess(exito, "Resumen");
      }
      await cargar(d?.id ?? actual?.id);
      return true;
    } catch (err) {
      toastError(adminErrorMessage(err, fallo), "Resumen");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const guardar = () =>
    hacer(() => adminRequest(`/admin/resumen/${actual.id}`, { method: "PATCH", json: edicion }),
      actual.sale_sola_a_las ? `Guardado. Así sale a las ${hora(actual.sale_sola_a_las)}.` : "Guardado.",
      "No se pudo guardar.");

  const retener = () =>
    hacer(() => adminRequest(`/admin/resumen/${actual.id}/retener`, { method: "POST" }),
      "Retenida: esta edición no sale. Si cambias de idea, pulsa «Dejar que salga».",
      "No se pudo retener.");

  const soltar = () =>
    hacer(() => adminRequest(`/admin/resumen/${actual.id}/soltar`, { method: "POST" }),
      "Vuelve a salir sola: a su hora o, si ya pasó, en el próximo minuto.",
      "No se pudo.");

  const rehacer = async () => {
    const ok = await confirm({
      title: "Rehacer esta edición",
      description: "Se arma otra vez desde cero con lo nuevo desde la edición anterior. Se pierden los cambios a las líneas; la frase, las cifras a mano y la foto que hayas elegido se conservan.",
      confirmLabel: "Rehacer",
      // Al recargar la edición también se va lo que no se guardó (frase y foto incluidas).
      warning: sucio
        ? "Los cambios a las líneas no se recuperan, ni lo que no hayas guardado."
        : "Los cambios a las líneas no se recuperan.",
    });
    if (ok) await hacer(() => adminRequest(`/admin/resumen/${actual.id}/rehacer`, { method: "POST" }), "Rehecho.", "No se pudo rehacer.");
  };

  /** Volver a cargar sin tapar el aviso que ya se dio: tras un 409, lo más probable es que alguien llegó antes. */
  const ponerAlDia = (id) => cargar(id).catch(() => {});

  /**
   * «Retirar edición»: no se deshace, así que se confirma dentro del panel con su motivo.
   * La petición corre desde el diálogo (`onConfirm`): mientras trabaja, el botón no se
   * puede volver a pulsar, y si falla (sin conexión, 409 porque otro ya la retiró, motivo
   * largo) el error sale en el propio diálogo, con el motivo escrito intacto.
   */
  const retirar = async () => {
    const r = actual;
    motivoRef.current = "";
    const ok = await confirm({
      title: "Retirar esta edición",
      description: (
        <>
          <p className="se-adm-dialog__text">
            {MOMENTO[r.edicion]} · {r.fecha_larga}. Al retirarla:
          </p>
          <ul className="se-adm-dialog__text">
            {alRetirar(r).map((linea) => <li key={linea}>{linea}</li>)}
          </ul>
          <CampoMotivo onCambio={(v) => { motivoRef.current = v; }} />
        </>
      ),
      warning: "No se puede deshacer.",
      confirmLabel: "Retirar edición",
      busyLabel: "Retirando…",
      onConfirm: () => {
        if (retirandoRef.current) return retirandoRef.current;
        retirandoRef.current = (async () => {
          try {
            await adminRequest(`/admin/resumen/${r.id}/retirar`, {
              method: "POST",
              json: { motivo: motivoRef.current.trim() || null },
            });
          } catch (err) {
            if (err?.status === 409) ponerAlDia(r.id);
            if (err?.status === 404) ponerAlDia();
            // El 422 trae la frase exacta («El motivo: pasa de 300 caracteres.»).
            throw new Error(err?.status === 422 && err.message ? err.message : adminErrorMessage(err, "No se pudo retirar."));
          } finally {
            retirandoRef.current = null;
          }
        })();
        return retirandoRef.current;
      },
    });
    if (!ok) return;
    const t = r.canales?.telegram ?? {};
    const w = r.canales?.whatsapp ?? {};
    toastSuccess(
      [
        "Retirada: ya no se ve en la web.",
        t.estado !== "apagado" && (t.mensajes > 0 || ["enviando", "enviado"].includes(t.estado))
          ? "De Telegram se borra en el próximo minuto."
          : null,
        ["enviando", "enviado"].includes(w.estado) ? "En WhatsApp hay que borrarla a mano." : null,
      ].filter(Boolean).join(" "),
      "Resumen",
    );
    setOcupado(true);
    try {
      await ponerAlDia(r.id);
    } finally {
      setOcupado(false);
    }
  };

  /** Ya retirada, si el borrado de Telegram falló: el mismo «retirar» lo vuelve a intentar. */
  const reintentarBorrado = async () => {
    const ok = await hacer(() => adminRequest(`/admin/resumen/${actual.id}/retirar`, { method: "POST", json: {} }),
      "Se vuelve a intentar borrarla de Telegram en el próximo minuto.", "No se pudo reintentar.");
    if (!ok) await ponerAlDia(actual.id);
  };

  /** «Resumen activo»: el interruptor general, con su confirmación. */
  const alternarActivo = async (activo, esperando) => {
    const encender = !activo;
    const ok = await confirm(
      encender
        ? {
            title: "Encender el resumen",
            description:
              "En el próximo minuto se arma la edición en curso si falta, y las ediciones vuelven a salir solas a su hora en la web, Telegram y WhatsApp.",
            warning: esperando
              ? `${esperando === 1 ? "Una edición de hoy está en pausa" : `${esperando} ediciones de hoy están en pausa`}: si ya pasó su hora, sale en el próximo minuto. Si no debe salir, ábrela y pulsa «No mandar esta edición» antes de encender.`
              : undefined,
            confirmLabel: "Encender",
          }
        : {
            title: "Apagar el resumen",
            description:
              "No se arma, no sale ni se manda ninguna edición nueva hasta que lo vuelvas a encender: es para una emergencia, sin tener que frenar cada edición. Lo que ya salió sigue en la web, y «Retirar edición» sigue funcionando.",
            confirmLabel: "Apagar",
          },
    );
    if (!ok) return;
    const hecho = await hacer(() => adminRequest("/admin/resumen/ajustes", { method: "PUT", json: { activo: encender } }),
      encender ? "Resumen encendido: vuelve a salir solo." : "Resumen apagado: no sale nada hasta que lo enciendas.",
      "No se pudo cambiar.");
    if (!hecho) await ponerAlDia(actual?.id);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(actual.texto_whatsapp);
      toastSuccess("Texto copiado.", "Resumen");
    } catch {
      toastError("No se pudo copiar: selecciónalo en la vista previa.", "Resumen");
    }
  };

  // —— la edición, en el navegador ——
  const cambiarSecciones = (fn) => {
    setEdicion((e) => ({ ...e, secciones: fn(e.secciones) }));
    setSucio(true);
  };
  const enSeccion = (clave, fn) => cambiarSecciones((ss) => ss.map((s) => (s.clave === clave ? { ...s, puntos: fn(s.puntos) } : s)));
  const mover = (clave, i, destino) =>
    cambiarSecciones((ss) => {
      const punto = ss.find((s) => s.clave === clave).puntos[i];
      return ss.map((s) => {
        if (s.clave === clave) return { ...s, puntos: s.puntos.filter((_, k) => k !== i) };
        if (s.clave === destino) return { ...s, puntos: [...s.puntos, punto] };
        return s;
      });
    });
  const intercambiar = (clave, i, j) =>
    enSeccion(clave, (ps) => {
      const copia = [...ps];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });

  // Lo que se puede añadir: lo que quedó fuera al armar más lo que se quitó aquí.
  const info = useMemo(() => {
    const m = new Map();
    for (const s of actual?.secciones ?? []) for (const p of s.puntos) m.set(p.id, p);
    for (const f of actual?.fuera ?? []) m.set(f.id, { ...f, linea: f.titulo });
    return m;
  }, [actual]);
  const usados = new Set((edicion?.secciones ?? []).flatMap((s) => s.puntos.map((p) => p.id)));
  const disponibles = [...info.values()].filter((p) => !usados.has(p.id));

  if (lista.status === "loading") return <LoadingState title="Cargando el resumen…" />;
  if (lista.status === "error") return <ErrorState title="No se pudo cargar." error={lista.error} onRetry={() => cargar()} />;

  const datos = lista.datos;
  const esHoy = actual?.fecha === datos.hoy;
  // La foto que va en la maqueta: la recién elegida (aún sin guardar) o la guardada; ninguna si se quitó.
  const fotoDelMensaje = !edicion?.imagen_id
    ? null
    : imagenElegida?.url
      ? { url: imagenElegida.url, ancho: imagenElegida.width ?? null, alto: imagenElegida.height ?? null }
      : edicion.imagen_id === actual?.imagen_id
        ? actual.imagen
        : null;
  const bloqueado = !actual || ["publicado", "vacio", "retirado"].includes(actual.estado) || ocupado;
  const deHoy = new Map(datos.resumenes.filter((r) => r.fecha === datos.hoy).map((r) => [r.edicion, r]));
  // Sin el campo (un servidor anterior), encendido: así estaba antes de existir el interruptor.
  const activo = datos.resumen_activo !== false;
  const enPausa = datos.resumenes.filter((r) => r.en_pausa).length;
  const retirada = actual?.estado === "retirado";
  const tg = actual?.canales?.telegram ?? {};
  const wa = actual?.canales?.whatsapp ?? {};
  // Ya retirada y con el borrado de Telegram en fallo: el mismo botón lo reintenta.
  const reintentaBorrado = retirada && tg.estado === "fallo" && tg.mensajes > 0;
  const armar = (clave) =>
    hacer(() => adminRequest("/admin/resumen/armar", { method: "POST", json: { edicion: clave } }),
      "Armado.", "No se pudo armar.");
  const abrirOtra = async (id) => {
    if (sucio && !(await confirm({ title: "Cambios sin guardar", description: "Se pierden si abres otra edición.", confirmLabel: "Abrir igual" }))) return;
    abrir(id);
  };

  return (
    <main role="main">
      <CabeceraDePagina
        titulo="Resumen diario"
        explica={
          <>
            Sale solo a las {datos.ediciones.map((e) => e.sale).join(", ")} en la web, Telegram y WhatsApp. Cada
            edición se arma una hora antes: hasta su hora puedes ajustarla o frenarla.
            {datos.reloj_encendido ? "" : " (Aquí no sale sola: ármala con los botones.)"}
          </>
        }
        guia={recorridoResumen}
      />
      <RecorridoVista recorrido={recorridoResumen} />

      {/* «Resumen activo»: el interruptor general, para una emergencia de varias horas. */}
      <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("activo")}>
        <div className="se-res-adm-estado">
          <span className="se-form-label">Resumen activo</span>
          <button type="button" role="switch" aria-checked={activo} aria-label="Resumen activo"
            className={`se-alaire${activo ? " is-on" : ""}`} disabled={ocupado || !puede}
            title={puede ? undefined : "Lo cambia un publicador o el administrador"}
            onClick={() => alternarActivo(activo, enPausa)}>
            <span className="se-alaire__pista" aria-hidden="true" />
            <span className="se-alaire__texto">{activo ? "Encendido" : "Apagado"}</span>
          </button>
        </div>
        {activo ? (
          <p className="se-admin-meta-hint">Cada edición se arma y sale sola a su hora.</p>
        ) : (
          <p className="se-tit-aviso" role="status">
            Apagado: no se arma, no sale ni se manda ninguna edición nueva
            {enPausa ? ` (${enPausa === 1 ? "una está en pausa" : `${enPausa} están en pausa`})` : ""}. Lo que ya salió
            sigue en la web; «Retirar edición» sigue funcionando.
          </p>
        )}
      </section>

      {/* Las tres de hoy: su estado de un vistazo, y abrir o armar cada una. */}
      <section className="se-admin-table-wrap se-res-adm-bloque se-res-adm-jornada" {...ancla("hoy")}>
        {datos.ediciones.map((e) => {
          const r = deHoy.get(e.clave);
          const abierta = r && r.id === actual?.id;
          return (
            <div key={e.clave} className={`se-res-adm-jornada__edicion${abierta ? " is-abierta" : ""}`}>
              <strong>{MOMENTO[e.clave]} · {e.sale}</strong>
              {r ? (
                <>
                  <span className={`se-res-adm-chip ${chipDe(r).clase}`}>{chipDe(r).texto}</span>
                  <button type="button" className="se-btn se-btn--secondary" disabled={abierta || ocupado}
                    onClick={() => abrirOtra(r.id)}>
                    {abierta ? "Abierta" : "Abrir"}
                  </button>
                </>
              ) : (
                <>
                  <span className="se-admin-meta-hint">Se arma a las {e.arma}</span>
                  <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={() => armar(e.clave)}>
                    Armar ahora
                  </button>
                </>
              )}
            </div>
          );
        })}
      </section>

      {actual ? (
        <>
          <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("estado")}>
            <div className="se-res-adm-estado">
              <span className={`se-res-adm-chip ${chipDe(actual).clase}`}>{chipDe(actual).texto}</span>
              <strong>{MOMENTO[actual.edicion]} · {actual.fecha_larga}{esHoy ? " · hoy" : ""}</strong>
              <span className="se-admin-meta-hint">
                {actual.estado === "borrador" && actual.sale_sola_a_las ? `sale sola a las ${hora(actual.sale_sola_a_las)} · ` : ""}
                {actual.estado === "borrador" && !actual.sale_sola_a_las && actual.pasa_a ? `ya no sale: lo suyo entra en la de ${actual.pasa_a} · ` : ""}
                {actual.estado === "borrador" && actual.en_pausa ? "en pausa: el resumen está apagado · " : ""}
                {actual.estado === "retenido" ? "retenida: no sale · " : ""}
                {["publicado", "retirado"].includes(actual.estado) && actual.publicado_en ? `salió a las ${hora(actual.publicado_en)} · ` : ""}
                {retirada ? `retirada el ${cuando(actual.retirado_en)} · ` : ""}
                armado {actual.armado_con === "ia" ? "con IA" : "por reglas"} a las {hora(actual.armado_en)}
              </span>
            </div>
            {actual.estado === "borrador" && actual.sale_sola_a_las ? (
              <p className="se-admin-meta-hint" role="status">
                Sale sola a las {hora(actual.sale_sola_a_las)} en la web, Telegram y el canal de WhatsApp, tal como la ves en
                la maqueta. Si cambias la foto o el texto antes y guardas, sale cambiada.
              </p>
            ) : null}
            {actual.estado === "borrador" && actual.en_pausa ? (
              <p className="se-tit-aviso" role="status">
                En pausa: el resumen está apagado (arriba, «Resumen activo») y esta edición no sale. Al encenderlo, sale a su
                hora o, si ya pasó, en el próximo minuto. Si no debe salir, pulsa «No mandar esta edición».
              </p>
            ) : null}
            {retirada ? (
              <p className="se-admin-meta-hint" role="status">
                Retirada: ya no se ve en la web (quien abra su enlace ve que se retiró). No se puede deshacer.
              </p>
            ) : null}
            {actual.estado === "vacio" ? (
              <p className="se-admin-meta-hint" role="status">
                No sale: {actual.motivo_vacio ?? "no había bastante nuevo"}. Si después llega algo, pulse «Rehacer».
              </p>
            ) : null}
            {actual.armado_con !== "ia" && !["publicado", "vacio", "retirado"].includes(actual.estado) ? (
              <p className="se-tit-aviso" role="alert">
                Este borrador salió por reglas, no por la IA
                {actual.motivo_reglas ? ` (${actual.motivo_reglas})` : ""}: es un reparto mecánico, sin
                redactar y con huecos. Pulse «Rehacer» para que lo arme la IA antes de que salga, o «No mandar esta edición».
              </p>
            ) : null}
            {["publicado", "retirado"].includes(actual.estado) ? (
              <p className="se-admin-meta-hint se-res-adm-canales">
                Telegram: {canal(actual, "telegram", tg.estado)}
                {tg.error && !(retirada && tg.estado === "fallo") ? ` (${tg.error})` : ""} · WhatsApp:{" "}
                {canal(actual, "whatsapp", wa.estado)}
                {wa.error && !wa.borrar_a_mano ? ` (${wa.error})` : ""}
              </p>
            ) : null}
            {retirada && tg.estado === "fallo" ? (
              <p className="se-tit-aviso" role="alert">
                No se pudo borrar de Telegram{tg.error ? `: ${tg.error.replace(/^no se pudo borrar:\s*/i, "")}` : ""}.{" "}
                {tg.mensajes > 0
                  ? "Pulsa «Reintentar borrado» o bórralo a mano en el canal."
                  : "Bórralo a mano en el canal de Telegram."}
              </p>
            ) : null}
            {wa.borrar_a_mano ? (
              <p className="se-tit-aviso" role="alert">
                Hay que borrarla a mano en WhatsApp: esta edición ya había salido en el canal de WhatsApp y desde aquí no se
                puede borrar. Desde un teléfono que administre el canal, mantén pulsado el mensaje (y su foto, si la lleva) y
                elige «Eliminar». Este aviso no se quita solo: el panel no puede saber si ya lo borraste.
              </p>
            ) : null}
            <LoQueSeCayo resumen={actual} />
            <div className="se-tit-acciones" {...ancla("acciones")}>
              {actual.estado === "borrador" && esHoy && (actual.sale_sola_a_las || actual.en_pausa) ? (
                <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={retener}>
                  No mandar esta edición
                </button>
              ) : null}
              {actual.estado === "retenido" && esHoy ? (
                <button type="button" className="se-btn se-btn--primary" disabled={ocupado || sucio} onClick={soltar}
                  title={sucio ? "Guarda los cambios antes" : undefined}>
                  Dejar que salga
                </button>
              ) : null}
              {!["publicado", "retirado"].includes(actual.estado) ? (
                <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={rehacer}>Rehacer</button>
              ) : null}
              <button type="button" className="se-btn se-btn--secondary" onClick={copiar}>Copiar el texto</button>
              {actual.estado === "publicado" ? (
                <a className="se-btn se-btn--secondary" href={actual.url} target="_blank" rel="noopener noreferrer">Ver en la web</a>
              ) : null}
              {actual.estado === "publicado" && esHoy && ["fallo", "enviando"].includes(actual.canales.whatsapp.estado) ? (
                <button type="button" className="se-btn se-btn--secondary" disabled={ocupado}
                  onClick={() => hacer(() => adminRequest(`/admin/resumen/${actual.id}/whatsapp/reintentar`, { method: "POST" }),
                    "WhatsApp vuelve a la cola: sale en el próximo minuto.", "No se pudo.")}>
                  Reintentar WhatsApp
                </button>
              ) : null}
              {puede && actual.estado === "publicado" ? (
                <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={retirar} {...ancla("retirar")}>
                  Retirar edición
                </button>
              ) : null}
              {puede && reintentaBorrado ? (
                <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={reintentarBorrado} {...ancla("retirar")}>
                  Reintentar borrado
                </button>
              ) : null}
            </div>
            {sucio ? (
              <p className="se-tit-aviso" role="status">
                Hay cambios sin guardar{actual.sale_sola_a_las ? `: si no los guardas antes de las ${hora(actual.sale_sola_a_las)}, sale sin ellos` : ""}.
              </p>
            ) : null}
            {["borrador", "retenido"].includes(actual.estado) && !esHoy ? (
              <p className="se-admin-meta-hint">Es de un día que ya pasó: no salió y ya no sale.</p>
            ) : null}
          </section>

          <div className="se-res-adm-rejilla">
            <div className="se-res-adm-col">
              <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("imagen")}>
                <ImagenDelDia
                  resumen={actual}
                  imagenId={edicion.imagen_id}
                  elegida={imagenElegida}
                  bloqueado={bloqueado}
                  onCambio={(id, row) => {
                    setEdicion((x) => ({ ...x, imagen_id: id ?? null }));
                    setImagenElegida(row ?? null);
                    setSucio(true);
                  }}
                />
              </section>

              <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("secciones")}>
                {edicion.secciones.map((s) => {
                  const meta = actual.secciones.find((x) => x.clave === s.clave);
                  return (
                    <div key={s.clave} className="se-res-adm-seccion">
                      <h2 className="se-form-label">{meta?.titulo} <span className="se-admin-meta-hint">({s.puntos.length} de {meta?.tope})</span></h2>
                      {s.puntos.length ? (
                        <ol className="se-res-adm-puntos">
                          {s.puntos.map((p, i) => (
                            <Punto key={p.id} punto={p} info={info.get(p.id)} secciones={actual.secciones} clave={s.clave}
                              primero={i === 0} ultimo={i === s.puntos.length - 1} bloqueado={bloqueado}
                              onCambio={(nuevo) => enSeccion(s.clave, (ps) => ps.map((x, k) => (k === i ? nuevo : x)))}
                              onMover={(destino) => mover(s.clave, i, destino)}
                              onQuitar={() => enSeccion(s.clave, (ps) => ps.filter((_, k) => k !== i))}
                              onSubir={() => intercambiar(s.clave, i, i - 1)}
                              onBajar={() => intercambiar(s.clave, i, i + 1)} />
                          ))}
                        </ol>
                      ) : (
                        <p className="se-admin-meta-hint">Vacía: no sale en el mensaje.</p>
                      )}
                    </div>
                  );
                })}
                {!bloqueado && disponibles.length ? (
                  <div className="se-res-adm-anadir">
                    <span className="se-form-label">Añadir</span>
                    <select className="se-form-control" value={anadir.id} aria-label="Qué añadir"
                      onChange={(e) => setAnadir((a) => ({ ...a, id: e.target.value }))}>
                      <option value="">Elige uno de lo que quedó fuera…</option>
                      {disponibles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.tipo === "titular" ? "Última hora · " : ""}{p.titulo ?? p.linea}
                        </option>
                      ))}
                    </select>
                    <select className="se-form-control" value={anadir.seccion} aria-label="En qué sección"
                      onChange={(e) => setAnadir((a) => ({ ...a, seccion: e.target.value }))}>
                      {actual.secciones.map((s) => (
                        <option key={s.clave} value={s.clave}>{s.titulo}</option>
                      ))}
                    </select>
                    <button type="button" className="se-btn se-btn--secondary" disabled={!anadir.id}
                      onClick={() => {
                        const p = info.get(anadir.id);
                        enSeccion(anadir.seccion, (ps) => [...ps, { id: p.id, linea: p.linea ?? p.titulo, linea_en: p.linea_en ?? p.titulo }]);
                        setAnadir((a) => ({ ...a, id: "" }));
                      }}>
                      Añadir
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("cifras")}>
                <h2 className="se-form-label">Cifras</h2>
                <ul className="se-res-adm-cifras">
                  {actual.cifras.map((c) => <li key={c.etiqueta}>{c.etiqueta}: {conVariacion(c)}</li>)}
                  {actual.monedas.length ? <li>Por dólar: {actual.monedas.map((m) => `${m.etiqueta} ${conVariacion(m)}`).join(" · ")}</li> : null}
                  {!actual.cifras.length && !actual.monedas.length ? <li className="se-admin-meta-hint">El cintillo no tenía cifras al armarlo.</li> : null}
                </ul>
                <p className="se-admin-meta-hint" style={{ marginBottom: "0.4rem" }}>A mano (hasta 3), por ejemplo el petróleo:</p>
                {edicion.cifras_manuales.map((c, i) => (
                  <div key={i} className="se-res-adm-manual">
                    <input className="se-form-control" placeholder="Nombre (Brent)" maxLength={40} value={c.etiqueta} disabled={bloqueado}
                      aria-label="Nombre de la cifra"
                      onChange={(e) => { setEdicion((x) => ({ ...x, cifras_manuales: x.cifras_manuales.map((y, k) => (k === i ? { ...y, etiqueta: e.target.value } : y)) })); setSucio(true); }} />
                    <input className="se-form-control" placeholder="Valor (64,30 $)" maxLength={30} value={c.valor} disabled={bloqueado}
                      aria-label="Valor de la cifra"
                      onChange={(e) => { setEdicion((x) => ({ ...x, cifras_manuales: x.cifras_manuales.map((y, k) => (k === i ? { ...y, valor: e.target.value } : y)) })); setSucio(true); }} />
                    <button type="button" className="se-btn se-btn--secondary" disabled={bloqueado}
                      onClick={() => { setEdicion((x) => ({ ...x, cifras_manuales: x.cifras_manuales.filter((_, k) => k !== i) })); setSucio(true); }}>
                      Quitar
                    </button>
                  </div>
                ))}
                {edicion.cifras_manuales.length < 3 && !bloqueado ? (
                  <button type="button" className="se-btn se-btn--secondary"
                    onClick={() => { setEdicion((x) => ({ ...x, cifras_manuales: [...x.cifras_manuales, { etiqueta: "", valor: "" }] })); setSucio(true); }}>
                    Añadir una cifra
                  </button>
                ) : null}
              </section>

              <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("frase")}>
                <label className="se-form-label" htmlFor="res-frase">Frase del día (opcional)</label>
                <textarea id="res-frase" className="se-form-control" rows={2} maxLength={240} value={edicion.frase} disabled={bloqueado}
                  onChange={(e) => { setEdicion((x) => ({ ...x, frase: e.target.value })); setSucio(true); }} />
              </section>

              {!bloqueado ? (
                <div className="se-tit-acciones se-res-adm-guardar">
                  <button type="button" className="se-btn se-btn--primary" disabled={!sucio || ocupado} onClick={guardar}>Guardar cambios</button>
                  <button type="button" className="se-btn se-btn--secondary" disabled={!sucio || ocupado}
                    onClick={() => { setEdicion(editable(actual)); setSucio(false); }}>
                    Descartar
                  </button>
                </div>
              ) : null}
            </div>

            <section className="se-admin-table-wrap se-res-adm-bloque se-res-adm-vista" {...ancla("vista")}>
              <h2 className="se-form-label">Así llega al canal de WhatsApp</h2>
              <p className="se-admin-meta-hint">
                Lo que ve quien abre el canal: primero la foto, en su proporción, y enseguida el mensaje con la tarjeta del
                enlace, que WhatsApp arma con la foto y el título de la página. La foto cambia al elegirla; el texto, al guardar.
              </p>
              <VistaPreviaWhatsApp texto={actual.texto_whatsapp} foto={fotoDelMensaje} nombre={actual.nombre}
                cuando={actual.sale_sola_a_las ?? actual.publicado_en ?? actual.sale_a_las} />
              {sucio ? <p className="se-admin-meta-hint">El texto de la maqueta se actualiza al guardar.</p> : null}
              <details className="se-res-adm-punto__en">
                <summary className="se-admin-meta-hint">El texto tal cual, sin formato</summary>
                <pre className="se-res-adm-texto">{actual.texto_whatsapp}</pre>
              </details>
            </section>
          </div>

          <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("registro")}>
            <HistorialDeLaEdicion historial={actual.historial ?? []} />
          </section>
        </>
      ) : null}

      <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("historial")}>
        <h2 className="se-form-label">Ediciones anteriores</h2>
        {datos.resumenes.length ? (
          <div className="se-tit-fuentes__tabla">
            <table className="se-admin-table">
              <thead>
                <tr>
                  <th scope="col">Día</th>
                  <th scope="col">Edición</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="se-tit-num">Puntos</th>
                  <th scope="col">Telegram</th>
                  <th scope="col">WhatsApp</th>
                  <th scope="col"><span className="se-sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {datos.resumenes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fecha_larga}</td>
                    <td>{MOMENTO[r.edicion]}</td>
                    <td>{chipDe(r).texto}</td>
                    <td className="se-tit-num">{r.puntos}</td>
                    <td>{["publicado", "retirado"].includes(r.estado) ? canal(r, "telegram", r.telegram) : "—"}</td>
                    <td>{["publicado", "retirado"].includes(r.estado) ? canal(r, "whatsapp", r.whatsapp) : "—"}</td>
                    <td className="se-admin-table__actions">
                      <button type="button" className="se-btn se-btn--secondary" disabled={r.id === actual?.id || ocupado}
                        onClick={() => abrirOtra(r.id)}>
                        {r.id === actual?.id ? "Abierto" : "Ver"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="se-admin-meta-hint">Todavía no hay ninguno.</p>
        )}
      </section>
      <ConfirmDialog />
    </main>
  );
};
