import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { AssetField } from "../../components/admin/AssetField";
import { CifrasDeEducacion } from "../../components/admin/CifrasDeEducacion";
import { useConfirmacionDeGuardado } from "../../hooks/useConfirmacionDeGuardado";
import {
  ListaDeComprobacion,
  chequeoDeModulo,
  sePuedePublicar,
} from "../../components/admin/ListaDeComprobacion";
import { RichTextEditor } from "../../components/editor/RichTextEditor";
import {
  ACCEPTED_AUDIO_MIME,
  ACCEPTED_DOCUMENT_MIME,
  ACCEPTED_IMAGE_MIME,
  ACCEPTED_VIDEO_MIME,
  uploadAdminMediaAudio,
  uploadAdminMediaDocument,
  uploadAdminMediaImage,
} from "../../services/adminMediaService";
import { subirVideoDeStream } from "../../lib/subirVideoDeStream";
import { useClaveIdempotente } from "../../hooks/useClaveIdempotente";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import {
  getResumenEducacion,
  actualizarLeccion,
  actualizarModulo,
  borrarLeccion,
  borrarModulo,
  crearLeccion,
  crearModulo,
  listarModulos,
  moverLeccion,
} from "../../services/adminEducacionService";

/**
 * El panel de Educacion: modulos, lecciones y su orden.
 *
 * ## Por que todo se guarda al momento y no con un boton "Guardar"
 *
 * Al reves que "En redes" o "Fotos del equipo", que arman una lista entera y la mandan
 * de una vez. La diferencia no es de gusto: aqui **el servidor renumera**. Crear, mover
 * o borrar una leccion cambia las posiciones de las demas -- y con ellas, cual es la
 * gratuita --, asi que la pantalla no puede sostener un estado propio "pendiente de
 * guardar" sin acabar mostrando un orden que el servidor ya no tiene.
 *
 * Cada operacion devuelve el modulo entero y con eso se repinta. Es una peticion por
 * cambio, que en una pantalla de redaccion -- donde se toca una cosa cada vez -- no se
 * nota, y a cambio lo que se ve siempre es lo que hay.
 *
 * ## La primera leccion
 *
 * Su casilla de "gratis" sale marcada y deshabilitada. No es un capricho de la
 * interfaz: el servidor la trata como libre por posicion, se marque o no. Dejar la
 * casilla activa aqui permitiria desmarcarla y creer que se cerro, cuando no.
 */

const TIPOS = [
  { valor: "texto", etiqueta: "Texto" },
  { valor: "video", etiqueta: "Video" },
  { valor: "audio", etiqueta: "Audio" },
  { valor: "pdf", etiqueta: "PDF" },
];

/**
 * Qué clase de archivo pide cada tipo de lección. El texto no pide ninguno: su
 * contenido es el cuerpo.
 *
 * Es la misma tabla que el servidor usa para validar. Está repetida aquí a propósito y
 * con un límite claro: aquí decide **qué campo se dibuja**, allí decide **qué se
 * acepta**. Si las dos se separaran, el panel ofrecería subir algo que el servidor
 * rechaza -- molesto, pero no peligroso, porque quien manda es el servidor.
 */
const KIND_POR_TIPO = { video: "video", audio: "audio", pdf: "document" };

const NIVELES = [
  { valor: "", etiqueta: "Sin clasificar" },
  { valor: "inicial", etiqueta: "Inicial" },
  { valor: "intermedio", etiqueta: "Intermedio" },
  { valor: "avanzado", etiqueta: "Avanzado" },
];

const precioLegible = (centavos, moneda) =>
  `${((Number(centavos) || 0) / 100).toFixed(2)} ${moneda || "USD"}`;

/* ─── Una leccion ────────────────────────────────────────────────────────── */

const FilaDeLeccion = ({
  leccion,
  total,
  ocupado,
  onGuardar,
  onMover,
  onBorrar,
  subirVideo,
}) => {
  const [abierta, setAbierta] = useState(false);
  // El objeto del archivo, para que el selector pueda enseñar lo que hay puesto.
  // Vive aparte del borrador porque no se guarda: se manda el id, y esto es lo que
  // se pinta mientras tanto.
  const [archivo, setArchivo] = useState(leccion.archivo ?? null);
  const [avisoDeTipo, setAvisoDeTipo] = useState("");
  const [borrador, setBorrador] = useState({
    titulo: leccion.titulo,
    tipo: leccion.tipo,
    duracion: leccion.duracion_minutos == null ? "" : String(leccion.duracion_minutos),
    libre: leccion.libre,
    cuerpo: leccion.cuerpo ?? "",
    archivo_id: leccion.archivo_id ?? null,
  });

  // Si el servidor renumera o renombra, lo que se edita tiene que seguirle.
  useEffect(() => {
    setBorrador({
      titulo: leccion.titulo,
      tipo: leccion.tipo,
      duracion: leccion.duracion_minutos == null ? "" : String(leccion.duracion_minutos),
      libre: leccion.libre,
      cuerpo: leccion.cuerpo ?? "",
      archivo_id: leccion.archivo_id ?? null,
    });
    setArchivo(leccion.archivo ?? null);
    setAvisoDeTipo("");
  }, [
    leccion.id,
    leccion.titulo,
    leccion.tipo,
    leccion.duracion_minutos,
    leccion.libre,
    leccion.cuerpo,
    leccion.archivo_id,
    leccion.archivo,
  ]);

  /**
   * Cambiar el tipo cambia lo que se sube, y suelta lo que ya no encaja.
   *
   * Se avisa en el momento y no al guardar: quien acaba de pasar una lección de video
   * a PDF ha dejado de tener video ahí, y descubrirlo veinte líneas de texto más tarde
   * con un 422 es haber trabajado para nada. El archivo no se borra de la biblioteca,
   * solo se desengancha -- puede estar en uso en otra lección.
   */
  /** Lo que devuelve `AssetField`: el id que se guarda y el objeto que se pinta. */
  const adjuntar = (idDelArchivo, objeto) => {
    setBorrador((b) => ({ ...b, archivo_id: idDelArchivo ?? null }));
    setArchivo(objeto ?? null);
    setAvisoDeTipo("");
  };

  const cambiarTipo = (nuevo) => {
    const esperado = KIND_POR_TIPO[nuevo] ?? null;
    const sobra = borrador.archivo_id != null && (!esperado || archivo?.kind !== esperado);

    setBorrador((b) => ({ ...b, tipo: nuevo, archivo_id: sobra ? null : b.archivo_id }));
    if (sobra) {
      setArchivo(null);
      setAvisoDeTipo(
        esperado
          ? `El archivo que había adjunto no sirve para una lección de ${
              TIPOS.find((x) => x.valor === nuevo)?.etiqueta.toLowerCase() ?? nuevo
            }. Suba el que corresponde; el anterior sigue en Archivos.`
          : "Una lección de texto no lleva archivo: su contenido es el cuerpo. El que había sigue en Archivos.",
      );
    } else {
      setAvisoDeTipo("");
    }
  };

  const id = `leccion-${leccion.id}`;

  return (
    <li className="se-admin-edu__leccion">
      <div className="se-admin-edu__leccion-cabeza">
        <span className="se-admin-edu__orden">
          <span className="se-admin-edu__num">{leccion.posicion}</span>
          <button
            type="button"
            className="se-admin-edu__flecha"
            aria-label="Subir una posición"
            disabled={leccion.posicion === 1 || ocupado}
            onClick={() => onMover(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="se-admin-edu__flecha"
            aria-label="Bajar una posición"
            disabled={leccion.posicion === total || ocupado}
            onClick={() => onMover(1)}
          >
            ↓
          </button>
        </span>

        <button
          type="button"
          className="se-admin-edu__leccion-titulo"
          aria-expanded={abierta}
          onClick={() => setAbierta((v) => !v)}
        >
          {leccion.titulo}
          <span className="se-admin-edu__leccion-meta">
            {TIPOS.find((t) => t.valor === leccion.tipo)?.etiqueta ?? leccion.tipo}
            {/* La duración va en el resumen plegado, y el hueco cuando falta es a
                propósito: quien repasa el módulo tiene que poder ver de un vistazo
                cuáles quedan sin medir, porque una sola sin medir deja al catálogo
                sin poder anunciar la duración del módulo entero. */}
            {leccion.duracion_minutos
              ? ` · ${leccion.duracion_minutos} min`
              : " · sin medir"}
            {leccion.libre ? " · gratis" : null}
          </span>
        </button>

        {leccion.primera ? (
          <span className="se-admin-edu__sello">Puerta de entrada</span>
        ) : null}

        <button
          type="button"
          className="se-btn se-btn--secondary"
          disabled={ocupado}
          onClick={() => onBorrar()}
        >
          Quitar
        </button>
      </div>

      {abierta ? (
        <div className="se-admin-edu__leccion-cuerpo">
          <label className="se-form-label" htmlFor={`${id}-titulo`}>
            Título
          </label>
          <input
            id={`${id}-titulo`}
            className="se-form-control"
            value={borrador.titulo}
            onChange={(e) => setBorrador({ ...borrador, titulo: e.target.value })}
          />

          <div className="se-admin-edu__fila-doble">
            <div>
              <label className="se-form-label" htmlFor={`${id}-tipo`}>
                Tipo
              </label>
              <select
                id={`${id}-tipo`}
                className="se-form-control"
                value={borrador.tipo}
                onChange={(e) => cambiarTipo(e.target.value)}
              >
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="se-form-label" htmlFor={`${id}-duracion`}>
                Duración (min)
              </label>
              <input
                id={`${id}-duracion`}
                className="se-form-control"
                type="number"
                min="1"
                max="1440"
                placeholder="—"
                value={borrador.duracion}
                onChange={(e) => setBorrador({ ...borrador, duracion: e.target.value })}
              />
              <p className="se-admin-meta-hint">
                Déjelo vacío mientras no lo sepa. El catálogo solo anuncia la duración
                del módulo cuando <strong>todas</strong> sus lecciones están medidas:
                con una sin medir, una suma parcial prometería menos de lo que hay.
              </p>
            </div>

            <label className="se-admin-edu__casilla">
              <input
                type="checkbox"
                checked={borrador.libre}
                // La primera es libre por posición, se marque o no. Dejar la casilla
                // activa permitiría desmarcarla y creer que se cerró.
                disabled={leccion.primera}
                onChange={(e) => setBorrador({ ...borrador, libre: e.target.checked })}
              />
              <span>
                Gratis
                {leccion.primera ? (
                  <small> — la primera lección siempre lo es</small>
                ) : null}
              </span>
            </label>
          </div>

          {avisoDeTipo ? (
            <p className="se-admin-edu__aviso" role="status">
              {avisoDeTipo}
            </p>
          ) : null}

          {/* El archivo que pide **este** tipo de lección, y solo ese. Antes había un
              campo numérico donde pegar a mano el id copiado de Archivos; ahora es el
              mismo selector de las piezas: sube, enseña lo que hay puesto y, en video,
              admite un enlace de YouTube.

              La lección de texto no tiene campo: su contenido es el cuerpo, y un
              selector de archivo ahí solo invita a adjuntar algo que nadie va a ver. */}
          {borrador.tipo === "video" ? (
            <AssetField
              id={`${id}-archivo`}
              label="Video de la clase"
              hint="Súbalo y se aloja en nuestro servicio de video, o pegue un enlace de YouTube o Vimeo."
              kind="video"
              value={borrador.archivo_id}
              asset={archivo}
              onChange={adjuntar}
              onUpload={(file, opciones) => subirVideo(file, opciones)}
              accept={ACCEPTED_VIDEO_MIME}
            />
          ) : null}

          {borrador.tipo === "audio" ? (
            <AssetField
              id={`${id}-archivo`}
              label="Audio de la clase (MP3 o M4A)"
              hint="Se sirve con la sesión puesta, nunca por enlace directo: es contenido de pago."
              kind="audio"
              value={borrador.archivo_id}
              asset={archivo}
              onChange={adjuntar}
              onUpload={uploadAdminMediaAudio}
              accept={ACCEPTED_AUDIO_MIME}
            />
          ) : null}

          {borrador.tipo === "pdf" ? (
            <AssetField
              id={`${id}-archivo`}
              label="Documento de la clase (PDF)"
              hint="Se descarga con la sesión comprobada en cada petición."
              kind="document"
              value={borrador.archivo_id}
              asset={archivo}
              onChange={adjuntar}
              onUpload={uploadAdminMediaDocument}
              accept={ACCEPTED_DOCUMENT_MIME}
            />
          ) : null}

          {/* Un `span` y no un `label htmlFor`: el editor no es un `input`, así que no
              hay nada a lo que apuntar y un `for` colgando es peor que ninguno. Mismo
              patrón que el editor de piezas. */}
          <span className="se-form-label">
            {borrador.tipo === "texto" ? "El texto de la clase" : "Introducción"}
          </span>
          <RichTextEditor
            value={borrador.cuerpo}
            onChange={(html) => setBorrador((b) => ({ ...b, cuerpo: html }))}
            placeholder={
              borrador.tipo === "texto"
                ? "Escriba aquí la clase…"
                : "Lo que se lee antes de dar al play. Puede quedarse vacío."
            }
          />
          <p className="se-admin-meta-hint">
            {borrador.tipo === "texto"
              ? "Se escribe aquí como en cualquier procesador; no hace falta saber HTML."
              : "Lo que se lee antes de dar al play. Puede quedarse vacío."}
          </p>

          <div className="se-admin-form-actions">
            <button
              type="button"
              className="se-btn"
              disabled={ocupado}
              onClick={() =>
                onGuardar({ ...borrador, duracion_minutos: borrador.duracion })
              }
            >
              Guardar la lección
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
};

FilaDeLeccion.propTypes = {
  /** Sube un video a Stream y devuelve su fila de la biblioteca. */
  subirVideo: PropTypes.func,
  leccion: PropTypes.object.isRequired,
  total: PropTypes.number.isRequired,
  ocupado: PropTypes.bool,
  onGuardar: PropTypes.func.isRequired,
  onMover: PropTypes.func.isRequired,
  onBorrar: PropTypes.func.isRequired,
};

/* ─── Un modulo ──────────────────────────────────────────────────────────── */

const TarjetaDeModulo = ({ modulo, ocupado, onCambio, onError }) => {
  const [abierto, setAbierto] = useState(false);
  // Una clave por módulo: dos pestañas abiertas en módulos distintos son subidas
  // distintas, y compartirla haría que la segunda recibiera la respuesta de la primera.
  const { clave: claveDeVideo, renovar: renovarClaveDeVideo } = useClaveIdempotente();
  const [portada, setPortada] = useState(modulo.portada ?? null);
  const { guardado, confirmar } = useConfirmacionDeGuardado();
  useEffect(() => setPortada(modulo.portada ?? null), [modulo.portada]);
  const [borrador, setBorrador] = useState({
    titulo: modulo.titulo,
    resumen: modulo.resumen ?? "",
    nivel: modulo.nivel ?? "",
    portada_id: modulo.portada_id ?? null,
    precio: String((modulo.precio_centavos ?? 0) / 100),
    moneda: modulo.moneda,
  });
  const [tituloNuevo, setTituloNuevo] = useState("");

  useEffect(() => {
    setBorrador({
      titulo: modulo.titulo,
      resumen: modulo.resumen ?? "",
      nivel: modulo.nivel ?? "",
      portada_id: modulo.portada_id ?? null,
      precio: String((modulo.precio_centavos ?? 0) / 100),
      moneda: modulo.moneda,
    });
  }, [
    modulo.titulo,
    modulo.resumen,
    modulo.nivel,
    modulo.portada_id,
    modulo.precio_centavos,
    modulo.moneda,
  ]);

  /**
   * Sube el video de una clase. Misma ruta que el de una entrevista -- Cloudflare
   * Stream -- porque es el mismo problema: un archivo grande que hay que transcodificar
   * y servir por HLS.
   *
   * La clave de idempotencia se renueva cuando la subida cuaja: a partir de ahí lo que
   * venga es otro video y no un reintento de este. Sin renovarla, el segundo video de
   * un módulo recibiría la dirección del primero.
   */
  const subirVideoDeLaClase = async (file, opciones = {}) => {
    const fila = await subirVideoDeStream(file, {
      ...opciones,
      clave: claveDeVideo(),
      onProcesando: () =>
        onError(
          "Video subido. Cloudflare lo está procesando; en unos minutos se verá en la clase.",
        ),
    });
    renovarClaveDeVideo();
    return fila;
  };

  const correr = async (accion) => {
    try {
      onError("");
      onCambio(await accion());
      // Sólo si salió bien. Confirmar pase lo que pase diría «guardado» también cuando
      // el servidor rechazó el cambio, que es la mentira más cara de esta pantalla.
      confirmar();
    } catch (err) {
      onError(adminErrorMessage(err));
    }
  };

  const publicado = modulo.estado === "publicado";
  const chequeo = chequeoDeModulo(modulo);
  const listo = sePuedePublicar(chequeo);
  // Se abre al intentar publicar algo que no puede publicarse: decir "no" sin decir
  // por que es la peor forma de bloquear a nadie.
  const [mostrarChequeo, setMostrarChequeo] = useState(false);

  return (
    <section className="se-admin-edu__modulo">
      <header className="se-admin-edu__modulo-cabeza">
        <button
          type="button"
          className="se-admin-edu__modulo-titulo"
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          {modulo.titulo}
          <span className="se-admin-edu__modulo-meta">
            /{modulo.slug} · {modulo.lecciones.length}{" "}
            {modulo.lecciones.length === 1 ? "lección" : "lecciones"} ·{" "}
            {modulo.precio_centavos ? precioLegible(modulo.precio_centavos, modulo.moneda) : "gratis"}
            {modulo.compras ? ` · ${modulo.compras} vendido${modulo.compras === 1 ? "" : "s"}` : null}
          </span>
        </button>

        {guardado ? <span className="se-guardado">Guardado ✓</span> : null}

        <span
          className={`se-admin-edu__estado${publicado ? " se-admin-edu__estado--on" : ""}`}
        >
          {publicado ? "Publicado" : "Borrador"}
        </span>

        {/* Ver la pieza como la ve un lector, sin salir a buscarla. Un borrador no
            tiene página pública todavía, así que el enlace solo aparece publicado. */}
        {publicado ? (
          <a
            className="se-btn se-btn--secondary"
            href={`/educacion/${modulo.slug}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            Ver en el sitio ↗
          </a>
        ) : null}

        <button
          type="button"
          className="se-btn se-btn--secondary"
          disabled={ocupado}
          onClick={() => {
            if (!publicado && !listo) {
              setMostrarChequeo(true);
              setAbierto(true);
              return;
            }
            correr(() =>
              actualizarModulo(modulo.id, {
                estado: publicado ? "borrador" : "publicado",
              }),
            );
          }}
        >
          {publicado ? "Pasar a borrador" : "Publicar"}
        </button>
      </header>

      {abierto ? (
        <div className="se-admin-edu__modulo-cuerpo">
          {/* La lista se enseña sola cuando alguien intenta publicar y no puede, y a
              demanda el resto del tiempo: en un módulo que ya está bien, una lista de
              comprobación permanente es ruido. */}
          {mostrarChequeo || !listo ? (
            <ListaDeComprobacion titulo="Antes de publicar" puntos={chequeo} />
          ) : null}

          <label className="se-form-label" htmlFor={`m-${modulo.id}-titulo`}>
            Título
          </label>
          <input
            id={`m-${modulo.id}-titulo`}
            className="se-form-control"
            value={borrador.titulo}
            onChange={(e) => setBorrador({ ...borrador, titulo: e.target.value })}
          />

          <label className="se-form-label" htmlFor={`m-${modulo.id}-resumen`}>
            Resumen
          </label>
          <textarea
            id={`m-${modulo.id}-resumen`}
            className="se-form-control"
            rows={3}
            value={borrador.resumen}
            onChange={(e) => setBorrador({ ...borrador, resumen: e.target.value })}
          />

          {/* La portada. El servidor la aceptaba desde el principio, pero el panel no
              pintaba el campo: ningún módulo podía tener una, y por eso todas las
              tarjetas del catálogo salían sin imagen. */}
          <AssetField
            id={`m-${modulo.id}-portada`}
            label="Portada del módulo"
            hint="Sale en la tarjeta del catálogo. Sin ella la tarjeta funciona igual, pero con ella destaca."
            kind="image"
            value={borrador.portada_id}
            asset={portada}
            onChange={(id, objeto) => {
              setBorrador((b) => ({ ...b, portada_id: id ?? null }));
              setPortada(objeto ?? null);
            }}
            onUpload={uploadAdminMediaImage}
            accept={ACCEPTED_IMAGE_MIME}
          />

          <label className="se-form-label" htmlFor={`m-${modulo.id}-nivel`}>
            Nivel
          </label>
          <select
            id={`m-${modulo.id}-nivel`}
            className="se-form-control"
            value={borrador.nivel}
            onChange={(e) => setBorrador({ ...borrador, nivel: e.target.value })}
          >
            {NIVELES.map((n) => (
              <option key={n.valor} value={n.valor}>
                {n.etiqueta}
              </option>
            ))}
          </select>
          <p className="se-admin-meta-hint">
            Sale en la tarjeta del catálogo y en la ficha. No cierra el módulo a nadie:
            es una orientación, no un requisito.
          </p>

          <div className="se-admin-edu__fila-doble">
            <div>
              <label className="se-form-label" htmlFor={`m-${modulo.id}-precio`}>
                Precio
              </label>
              <input
                id={`m-${modulo.id}-precio`}
                className="se-form-control"
                type="number"
                min="0"
                step="0.01"
                value={borrador.precio}
                onChange={(e) => setBorrador({ ...borrador, precio: e.target.value })}
              />
              <p className="se-admin-meta-hint">Cero = módulo gratuito, sin pasar por caja.</p>
            </div>
            <div>
              <label className="se-form-label" htmlFor={`m-${modulo.id}-moneda`}>
                Moneda
              </label>
              <input
                id={`m-${modulo.id}-moneda`}
                className="se-form-control"
                maxLength={3}
                value={borrador.moneda}
                onChange={(e) =>
                  setBorrador({ ...borrador, moneda: e.target.value.toUpperCase() })
                }
              />
            </div>
          </div>

          <div className="se-admin-form-actions">
            <button
              type="button"
              className="se-btn"
              disabled={ocupado}
              onClick={() =>
                correr(() =>
                  actualizarModulo(modulo.id, {
                    titulo: borrador.titulo,
                    resumen: borrador.resumen,
                    nivel: borrador.nivel,
                    portada_id: borrador.portada_id,
                    // El precio se escribe en unidades y viaja en centavos: redondear
                    // aquí evita que un 19.99 llegue como 1998.9999 por el binario.
                    precio_centavos: Math.round((Number(borrador.precio) || 0) * 100),
                    moneda: borrador.moneda,
                  }),
                )
              }
            >
              Guardar el módulo
            </button>

            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() => {
                if (!window.confirm(`¿Borrar «${modulo.titulo}» y todas sus lecciones?`)) return;
                correr(async () => {
                  await borrarModulo(modulo.id);
                  return null;
                });
              }}
            >
              Borrar el módulo
            </button>
          </div>

          <h3 className="se-admin-edu__sub">Lecciones</h3>
          {modulo.lecciones.length ? (
            <ol className="se-admin-edu__lecciones">
              {modulo.lecciones.map((leccion) => (
                <FilaDeLeccion
                  key={leccion.id}
                  leccion={leccion}
                  total={modulo.lecciones.length}
                  ocupado={ocupado}
                  onGuardar={(datos) =>
                    correr(() =>
                      actualizarLeccion(leccion.id, {
                        titulo: datos.titulo,
                        tipo: datos.tipo,
                        duracion_minutos: datos.duracion_minutos,
                        libre: datos.libre,
                        cuerpo: datos.cuerpo,
                        archivo_id: datos.archivo_id,
                      }),
                    )
                  }
                  subirVideo={subirVideoDeLaClase}
                  onMover={(salto) => correr(() => moverLeccion(leccion.id, salto))}
                  onBorrar={() => {
                    if (!window.confirm(`¿Quitar «${leccion.titulo}»?`)) return;
                    correr(() => borrarLeccion(leccion.id));
                  }}
                />
              ))}
            </ol>
          ) : (
            <p className="se-admin-meta-hint">
              Todavía no tiene lecciones. Sin al menos una, el módulo no se puede publicar.
            </p>
          )}

          <div className="se-admin-edu__nueva">
            <input
              className="se-form-control"
              placeholder="Título de la nueva lección"
              value={tituloNuevo}
              onChange={(e) => setTituloNuevo(e.target.value)}
            />
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado || !tituloNuevo.trim()}
              onClick={() =>
                correr(async () => {
                  const datos = await crearLeccion(modulo.id, { titulo: tituloNuevo.trim() });
                  setTituloNuevo("");
                  return datos;
                })
              }
            >
              Añadir lección
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

TarjetaDeModulo.propTypes = {
  modulo: PropTypes.object.isRequired,
  ocupado: PropTypes.bool,
  /** Recibe el módulo actualizado, o `null` si se borró. */
  onCambio: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

/* ─── La pantalla ────────────────────────────────────────────────────────── */

export const AdminEducacion = () => {
  const [modulos, setModulos] = useState([]);
  const [carga, setCarga] = useState({ estado: "cargando", error: "" });
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [tituloNuevo, setTituloNuevo] = useState("");
  const [resumen, setResumen] = useState(null);

  const cargar = useCallback(async () => {
    setCarga({ estado: "cargando", error: "" });
    try {
      setModulos(await listarModulos());
      setCarga({ estado: "listo", error: "" });
    } catch (err) {
      setCarga({ estado: "error", error: adminErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Las cifras van por su cuenta: el panel pinta primero los módulos, que es lo que se
  // vino a editar, y si el agregado falla o tarda no se lleva la edición por delante.
  useEffect(() => {
    let vivo = true;
    getResumenEducacion()
      .then((d) => vivo && setResumen(d))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  /** Mete en la lista el módulo que devolvió el servidor, o lo saca si se borró. */
  const aplicar = (id) => (actualizado) => {
    if (actualizado === null) {
      setModulos((antes) => antes.filter((m) => m.id !== id));
      return;
    }
    setModulos((antes) => antes.map((m) => (m.id === id ? actualizado : m)));
  };

  return (
    <div className="se-admin-shell se-admin-edu">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>
            Educación
          </h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem", maxWidth: "70ch" }}>
            Cada módulo se compra entero. La primera lección siempre es gratuita —con
            cuenta y correo verificado— y es la que engancha: conviene que sea la mejor.
            Los cambios se guardan al momento.
          </p>
        </div>
      </header>

      {resumen ? <CifrasDeEducacion resumen={resumen} /> : null}

      {carga.estado === "cargando" ? <p className="se-admin-meta-hint">Cargando…</p> : null}
      {carga.estado === "error" ? (
        <p className="se-admin-form-feedback" role="alert">
          {carga.error}
        </p>
      ) : null}
      {error ? (
        <p className="se-admin-form-feedback" role="alert">
          {error}
        </p>
      ) : null}

      {carga.estado === "listo" ? (
        <>
          <div className="se-admin-edu__nueva se-admin-edu__nueva--modulo">
            <input
              className="se-form-control"
              placeholder="Título del nuevo módulo"
              value={tituloNuevo}
              onChange={(e) => setTituloNuevo(e.target.value)}
            />
            <button
              type="button"
              className="se-btn"
              disabled={ocupado || !tituloNuevo.trim()}
              onClick={async () => {
                setOcupado(true);
                setError("");
                try {
                  const creado = await crearModulo({ titulo: tituloNuevo.trim() });
                  setModulos((antes) => [creado, ...antes]);
                  setTituloNuevo("");
                } catch (err) {
                  setError(adminErrorMessage(err));
                } finally {
                  setOcupado(false);
                }
              }}
            >
              Nuevo módulo
            </button>
          </div>

          {modulos.length === 0 ? (
            <p className="se-admin-meta-hint">
              Todavía no hay módulos. El primero empieza aquí arriba.
            </p>
          ) : null}

          {modulos.map((modulo) => (
            <TarjetaDeModulo
              key={modulo.id}
              modulo={modulo}
              ocupado={ocupado}
              onCambio={aplicar(modulo.id)}
              onError={setError}
            />
          ))}
        </>
      ) : null}
    </div>
  );
};

export default AdminEducacion;
