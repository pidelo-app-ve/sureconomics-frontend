import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { AssetField } from "../../components/admin/AssetField";
import { ModalDelPanel } from "../../components/admin/ModalDelPanel";
import { SelectorDeBiblioteca } from "../../components/admin/SelectorDeBiblioteca";
import { RichTextEditor } from "../../components/editor/RichTextEditor";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import {
  actualizarNumero,
  anadirPagina,
  borrarNumero,
  crearNumero,
  enviarLote,
  enviarPrueba,
  listarLunes,
  listarNumeros,
  ordenarPaginas,
  quitarPagina,
  verNumero,
} from "../../services/adminBoletinService";
import { ACCEPTED_IMAGE_MIME, uploadAdminMediaImage } from "../../services/adminMediaService";

/**
 * Los números de "Entorno en Viñetas".
 *
 * La redacción diseña las páginas fuera (Canva) y aquí sólo se suben y se ordenan: lo
 * que se ve en esta pantalla, de arriba abajo, es lo que llega al correo, en el mismo
 * orden. Por eso la pantalla está dispuesta como el correo y no como un formulario.
 *
 * Cada número pertenece a un lunes: sale solo ese día a las 9:00 de Caracas si está
 * **activo**, y un borrador no sale nunca (ver `boletin_programado.py` en el backend).
 * Antes, "Enviar prueba" manda una copia a un solo correo para ver cómo queda.
 */

const ESTADOS = {
  draft: { texto: "Borrador", tono: "borrador" },
  ready: { texto: "Activo", tono: "listo" },
  sending: { texto: "Enviándose", tono: "enviando" },
  sent: { texto: "Enviado", tono: "enviado" },
};

const CLAVE_PRUEBA = "se-boletin-destino-prueba";

const leerDestino = () => {
  try {
    return window.localStorage.getItem(CLAVE_PRUEBA) ?? "";
  } catch {
    return "";
  }
};

const guardarDestino = (valor) => {
  try {
    window.localStorage.setItem(CLAVE_PRUEBA, valor);
  } catch {
    /* sin almacenamiento: se vuelve a escribir la próxima vez */
  }
};

/** «lunes, 28 de septiembre». La fecha llega como `2026-09-28`, sin hora ni huso. */
const lunesLargo = (iso) => {
  if (!iso) return "";
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const fecha = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })
    : "";

const Estado = ({ status }) => {
  const e = ESTADOS[status] ?? { texto: status, tono: "borrador" };
  return <span className={`se-bol__estado se-bol__estado--${e.tono}`}>{e.texto}</span>;
};

Estado.propTypes = { status: PropTypes.string };

// ------------------------------------------------------------------ el listado
const Listado = ({ numeros, onAbrir, onNuevo }) => {
  if (!numeros.length) {
    return (
      <div className="se-bol__vacio">
        <p>Todavía no hay ningún número.</p>
        <button type="button" className="se-btn se-btn--primary" onClick={onNuevo}>
          Crear el primero
        </button>
      </div>
    );
  }
  return (
    <ul className="se-bol__lista">
      {numeros.map((n) => (
        <li key={n.id}>
          <button type="button" className="se-bol__fila" onClick={() => onAbrir(n.id)}>
            <span className="se-bol__portadita" aria-hidden="true">
              {n.cover_url ? <img src={n.cover_url} alt="" /> : null}
            </span>
            <span className="se-bol__fila-texto">
              <span className="se-bol__fila-lunes">
                {n.send_on ? `Sale el ${lunesLargo(n.send_on)}` : "Sin lunes asignado"}
              </span>
              <span className="se-bol__fila-asunto">{n.subject}</span>
              <span className="se-admin-pub__meta">
                {n.paginas} {n.paginas === 1 ? "página" : "páginas"} ·{" "}
                {n.sent_at ? `enviado el ${fecha(n.sent_at)}` : `creado el ${fecha(n.created_at)}`}
                {n.total_recipients ? ` · ${n.total_recipients} destinatarios` : ""}
              </span>
            </span>
            <Estado status={n.status} />
          </button>
        </li>
      ))}
    </ul>
  );
};

Listado.propTypes = {
  numeros: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAbrir: PropTypes.func.isRequired,
  onNuevo: PropTypes.func.isRequired,
};

// ------------------------------------------------------------------ las páginas
const Paginas = ({ numero, bloqueado, correr, onCambio }) => {
  const { toastSuccess } = useAdminToast();
  const [biblioteca, setBiblioteca] = useState(false);
  const [subiendo, setSubiendo] = useState(null);
  const entrada = useRef(null);
  const paginas = numero.pages ?? [];

  const subir = async (archivos) => {
    const lista = Array.from(archivos ?? []);
    if (!lista.length) return;
    // De una en una y en el orden en que se eligieron: el orden del selector de
    // archivos es el orden de las páginas, que es lo que se espera al elegir
    // "pagina-1, pagina-2, pagina-3" de una vez.
    let ultimo = null;
    for (let i = 0; i < lista.length; i += 1) {
      setSubiendo({ hecho: i, total: lista.length });
      const r = await correr(async () => {
        const medio = await uploadAdminMediaImage(lista[i]);
        return anadirPagina(numero.id, medio.id);
      }, null);
      if (!r) break;
      ultimo = r;
    }
    setSubiendo(null);
    if (entrada.current) entrada.current.value = "";
    if (ultimo) {
      onCambio(ultimo);
      toastSuccess(lista.length === 1 ? "Página añadida" : "Páginas añadidas");
    }
  };

  const mover = (desde, hacia) => {
    const orden = paginas.map((p) => p.id);
    const [id] = orden.splice(desde, 1);
    orden.splice(hacia, 0, id);
    correr(() => ordenarPaginas(numero.id, orden), "Orden guardado").then((r) =>
      r ? onCambio(r) : null,
    );
  };

  return (
    <section className="se-bol__bloque">
      <div className="se-bol__bloque-cabeza">
        <h2 className="se-bol__bloque-titulo">Páginas</h2>
        <p className="se-admin-meta-hint">
          Las que diseñaron en Canva, en el orden en que se leen. Van todas en el correo,
          una debajo de otra, a lo ancho del mensaje. Lo ideal: exportadas en PNG o JPG
          a unos 1080 px de ancho.
        </p>
      </div>

      {paginas.length ? (
        <ol className="se-bol__paginas">
          {paginas.map((p, i) => (
            <li key={p.id} className="se-bol__pagina">
              <span className="se-bol__pagina-n">{i + 1}</span>
              {p.url ? (
                <img
                  src={p.url}
                  alt={p.nombre || `Página ${i + 1}`}
                  className="se-bol__pagina-img"
                  loading="lazy"
                />
              ) : (
                <span className="se-bol__pagina-rota">Archivo no disponible</span>
              )}
              <span className="se-bol__pagina-nombre" title={p.nombre || ""}>
                {p.nombre || `Página ${i + 1}`}
              </span>
              {!bloqueado ? (
                <span className="se-bol__pagina-acciones">
                  <button
                    type="button"
                    className="se-btn se-btn--secondary se-btn--small"
                    disabled={i === 0}
                    onClick={() => mover(i, i - 1)}
                    aria-label={`Subir la página ${i + 1}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="se-btn se-btn--secondary se-btn--small"
                    disabled={i === paginas.length - 1}
                    onClick={() => mover(i, i + 1)}
                    aria-label={`Bajar la página ${i + 1}`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="se-btn se-btn--secondary se-btn--small"
                    onClick={() =>
                      correr(() => quitarPagina(numero.id, p.id), "Página quitada").then((r) =>
                        r ? onCambio(r) : null,
                      )
                    }
                  >
                    Quitar
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="se-bol__sin-paginas">Aún no hay páginas. Suba la primera.</p>
      )}

      {!bloqueado ? (
        <div className="se-bol__anadir">
          <input
            ref={entrada}
            type="file"
            accept={ACCEPTED_IMAGE_MIME}
            multiple
            hidden
            onChange={(e) => subir(e.target.files)}
          />
          <button
            type="button"
            className="se-btn se-btn--primary"
            disabled={Boolean(subiendo)}
            onClick={() => entrada.current?.click()}
          >
            {subiendo
              ? `Subiendo ${subiendo.hecho + 1} de ${subiendo.total}…`
              : "Subir páginas"}
          </button>
          <button
            type="button"
            className="se-btn se-btn--secondary"
            disabled={Boolean(subiendo)}
            onClick={() => setBiblioteca(true)}
          >
            Elegir una ya subida
          </button>
          <span className="se-admin-meta-hint">Puede elegir varias a la vez.</span>
        </div>
      ) : null}

      <ModalDelPanel
        abierto={biblioteca}
        onCerrar={() => setBiblioteca(false)}
        ancho="ancho"
        titulo="Elegir una página ya subida"
        subtitulo="Se añade al final. Luego se mueve con las flechas."
      >
        <SelectorDeBiblioteca
          id={`bol-${numero.id}-biblio`}
          kind="image"
          onElegir={(medio) => {
            setBiblioteca(false);
            correr(() => anadirPagina(numero.id, medio.id), "Página añadida").then((r) =>
              r ? onCambio(r) : null,
            );
          }}
        />
      </ModalDelPanel>
    </section>
  );
};

Paginas.propTypes = {
  numero: PropTypes.object.isRequired,
  bloqueado: PropTypes.bool,
  correr: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
};

// ------------------------------------------------------------------ el envío
const Envio = ({ numero, cambiosSinGuardar, correr, onCambio, preguntar }) => {
  const [destino, setDestino] = useState(leerDestino);
  const [progreso, setProgreso] = useState(null);
  const { toastSuccess, toastError } = useAdminToast();
  const entregas = numero.entregas ?? {};
  const enviados = entregas.sent ?? 0;
  const vacio = !(numero.pages?.length || (numero.body_html ?? "").trim());

  const probar = async () => {
    const correo = destino.trim();
    if (!correo.includes("@")) {
      toastError("Escriba el correo al que mandar la prueba.");
      return;
    }
    guardarDestino(correo);
    const r = await correr(() => enviarPrueba(numero.id, correo), null);
    if (r?.enviado) toastSuccess(`Prueba enviada a ${correo}`);
    else if (r) toastError("El servidor de correo no aceptó el envío. Pruebe otra vez en un momento.");
  };

  const mandar = async () => {
    const n = numero.suscriptores ?? 0;
    const vale = await preguntar({
      title: `¿Enviar «${numero.subject}» a ${n} ${n === 1 ? "suscriptor" : "suscriptores"}?`,
      description: numero.send_on
        ? `Sale ya, en vez de el ${lunesLargo(numero.send_on)} a las 9:00. Va a la lista real y no se puede deshacer.`
        : "Sale a la lista real y no se puede deshacer. Si aún no lo ha visto en su bandeja, mande antes una prueba.",
      confirmLabel: "Enviar ahora",
      warning: null,
    });
    if (!vale) return;

    // Por lotes: el servidor manda 25 o durante 12 segundos por llamada, lo que llegue
    // antes, y aquí se vuelve a llamar hasta que no quede nadie. Ver `boletin.py`.
    setProgreso({ enviados: enviados, pendientes: n - enviados });
    let r;
    do {
      r = await correr(() => enviarLote(numero.id), null);
      if (!r) break;
      setProgreso((p) => ({
        enviados: (p?.enviados ?? 0) + r.enviados_en_este_lote,
        pendientes: r.pendientes,
      }));
    } while (!r.terminado);
    setProgreso(null);
    const fresco = await correr(() => verNumero(numero.id), null);
    if (fresco) onCambio(fresco);
    if (r?.terminado) toastSuccess("Número enviado a toda la lista");
  };

  const listo = numero.status === "ready";
  const enCurso = numero.status === "sending";

  return (
    <section className="se-bol__bloque se-bol__envio">
      <div className="se-bol__bloque-cabeza">
        <h2 className="se-bol__bloque-titulo">Probar y enviar</h2>
      </div>

      {numero.status === "sent" ? (
        <p className="se-bol__enviado">
          Enviado el {fecha(numero.sent_at)} a {numero.total_recipients ?? enviados}{" "}
          suscriptores
          {entregas.failed ? ` · ${entregas.failed} no se pudieron entregar` : ""}.
        </p>
      ) : (
        <>
          <div className="se-bol__prueba">
            <label className="se-form-label" htmlFor={`bol-${numero.id}-prueba`}>
              Mandar una prueba a
            </label>
            <div className="se-bol__prueba-fila">
              <input
                id={`bol-${numero.id}-prueba`}
                type="email"
                className="se-form-control"
                placeholder="nombre@correo.com"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              />
              <button
                type="button"
                className="se-btn se-btn--secondary"
                disabled={vacio || Boolean(progreso)}
                onClick={probar}
              >
                Enviar prueba
              </button>
            </div>
            <p className="se-admin-meta-hint">
              Llega marcada como prueba y no toca la lista.
              {cambiosSinGuardar ? " Guarde antes los cambios: la prueba sale con lo guardado." : ""}
            </p>
          </div>

          <div className="se-bol__mandar">
            {!enCurso ? (
              <label className="se-admin-pub__casilla">
                <input
                  type="checkbox"
                  checked={listo}
                  disabled={vacio || Boolean(progreso)}
                  onChange={(e) =>
                    correr(
                      () => actualizarNumero(numero.id, { status: e.target.checked ? "ready" : "draft" }),
                      e.target.checked ? "Marcado como listo" : "Vuelve a borrador",
                    ).then((r) => (r ? onCambio(r) : null))
                  }
                />
                {numero.send_on
                  ? `Activo: sale solo el ${lunesLargo(numero.send_on)} a las 9:00 a ${numero.suscriptores ?? 0} suscriptores`
                  : "Activo"}
              </label>
            ) : null}
            {/* El camino normal es el lunes solo. Esto queda como salida de emergencia,
                por eso en secundario: sólo con el número activo, y pregunta antes. */}
            <button
              type="button"
              className={enCurso || progreso ? "se-btn se-btn--primary" : "se-btn se-btn--secondary"}
              disabled={!(listo || enCurso) || Boolean(progreso) || cambiosSinGuardar}
              onClick={mandar}
            >
              {progreso
                ? `Enviando… ${progreso.enviados} enviados, quedan ${progreso.pendientes}`
                : enCurso
                  ? `Seguir enviando (quedan ${entregas.pending ?? 0})`
                  : "Enviar ahora, sin esperar al lunes"}
            </button>
          </div>
          {vacio ? (
            <p className="se-admin-meta-hint">Suba al menos una página para poder probarlo.</p>
          ) : !listo && !enCurso ? (
            <p className="se-admin-meta-hint">
              Mientras esté en borrador no sale. Cuando lo haya revisado con una prueba,
              actívelo y el lunes sale solo.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
};

Envio.propTypes = {
  numero: PropTypes.object.isRequired,
  cambiosSinGuardar: PropTypes.bool,
  correr: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
  preguntar: PropTypes.func.isRequired,
};

// ------------------------------------------------------------------ el editor
const Editor = ({ numero, correr, onCambio, onVolver, onBorrado, preguntar }) => {
  const [texto, setTexto] = useState({
    subject: numero.subject ?? "",
    preheader: numero.preheader ?? "",
    body_html: numero.body_html ?? "",
  });

  // Al cambiar de número se reinicia el borrador; al guardar el mismo, no hace falta.
  useEffect(() => {
    setTexto({
      subject: numero.subject ?? "",
      preheader: numero.preheader ?? "",
      body_html: numero.body_html ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero.id]);

  const bloqueado = numero.status === "sending" || numero.status === "sent";
  const cambios =
    texto.subject !== (numero.subject ?? "") ||
    texto.preheader !== (numero.preheader ?? "") ||
    texto.body_html !== (numero.body_html ?? "");

  const guardar = () =>
    correr(() => actualizarNumero(numero.id, texto), "Cambios guardados").then((r) =>
      r ? onCambio(r) : null,
    );

  return (
    <div className="se-bol__editor">
      <div className="se-bol__editor-barra">
        <button type="button" className="se-btn se-btn--secondary" onClick={onVolver}>
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
                warning: null,
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

      <section className="se-bol__bloque">
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

      {!bloqueado ? (
        <div className="se-bol__guardar">
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

      <Paginas numero={numero} bloqueado={bloqueado} correr={correr} onCambio={onCambio} />

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

// ------------------------------------------------------------------ la pantalla
export const AdminBoletin = () => {
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm: preguntar, ConfirmDialog } = useAdminConfirm();
  const [numeros, setNumeros] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [asunto, setAsunto] = useState("");
  const [lunes, setLunes] = useState([]);
  const [elegido, setElegido] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const correr = useCallback(
    async (accion, aviso = "Guardado") => {
      setOcupado(true);
      try {
        const r = await accion();
        if (aviso) toastSuccess(aviso);
        return r ?? true;
      } catch (err) {
        toastError(adminErrorMessage(err));
        return undefined;
      } finally {
        setOcupado(false);
      }
    },
    [toastError, toastSuccess],
  );

  const cargar = useCallback(async () => {
    try {
      setNumeros(await listarNumeros());
      setError("");
    } catch (err) {
      setError(adminErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrir = async (id) => {
    const r = await correr(() => verNumero(id), null);
    if (r) {
      setAbierto(r);
      window.scrollTo({ top: 0 });
    }
  };

  const abrirNuevo = async () => {
    const r = await correr(() => listarLunes(), null);
    if (!r) return;
    setLunes(r);
    const libre = r.find((l) => !l.numero_id);
    setElegido(libre?.fecha ?? "");
    setAsunto(libre ? `Entorno en Viñetas · ${libre.texto}` : "");
    setNuevo(true);
  };

  const crear = async () => {
    const r = await correr(() => crearNumero(elegido, asunto.trim()), "Número creado");
    if (!r) return;
    setNuevo(false);
    setAsunto("");
    setAbierto(r);
    cargar();
  };

  return (
    <div className="se-admin-shell se-bol">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-admin-shell__title">Entorno en Viñetas</h1>
          <p className="se-admin-shell__subtitle">
            Un número por lunes. Se suben las páginas, se manda una prueba para ver cómo
            queda y se activa: ese lunes a las 9:00 sale solo a todos los suscriptores.
          </p>
        </div>
        {!abierto ? (
          <button type="button" className="se-btn se-btn--primary" onClick={abrirNuevo}>
            Nuevo número
          </button>
        ) : null}
      </header>

      {error ? <p className="se-admin-form-error">{error}</p> : null}

      {abierto ? (
        <Editor
          numero={abierto}
          correr={correr}
          preguntar={preguntar}
          onCambio={(r) => {
            setAbierto(r);
            setNumeros((lista) =>
              lista?.map((n) =>
                n.id === r.id ? { ...n, ...r, paginas: r.pages?.length ?? n.paginas } : n,
              ),
            );
          }}
          onVolver={() => {
            setAbierto(null);
            cargar();
          }}
          onBorrado={() => {
            setAbierto(null);
            cargar();
          }}
        />
      ) : numeros === null ? (
        !error ? <p className="se-admin-meta-hint">Cargando…</p> : null
      ) : (
        <Listado numeros={numeros} onAbrir={abrir} onNuevo={abrirNuevo} />
      )}

      <ModalDelPanel
        abierto={nuevo}
        ocupado={ocupado}
        onCerrar={() => setNuevo(false)}
        titulo="Nuevo número"
        subtitulo="Nace en borrador: no sale nada hasta que lo active."
        pie={
          <>
            <button type="button" className="se-btn se-btn--secondary" onClick={() => setNuevo(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="se-btn se-btn--primary"
              disabled={!elegido || ocupado}
              onClick={crear}
            >
              {ocupado ? "Creando…" : "Crear y seguir"}
            </button>
          </>
        }
      >
        <form
          className="se-asis__cuerpo"
          onSubmit={(e) => {
            e.preventDefault();
            if (elegido) crear();
          }}
        >
          <label className="se-form-label" htmlFor="bol-nuevo-lunes">
            Lunes en que sale
          </label>
          <select
            id="bol-nuevo-lunes"
            className="se-form-control"
            value={elegido}
            onChange={(e) => {
              const l = lunes.find((x) => x.fecha === e.target.value);
              setElegido(e.target.value);
              // El asunto sigue a la fecha mientras nadie lo haya escrito a mano.
              setAsunto((a) =>
                !a || lunes.some((x) => a === `Entorno en Viñetas · ${x.texto}`)
                  ? `Entorno en Viñetas · ${l?.texto ?? ""}`
                  : a,
              );
            }}
          >
            {lunes.map((l) => (
              <option key={l.fecha} value={l.fecha} disabled={Boolean(l.numero_id)}>
                {lunesLargo(l.fecha)}
                {l.numero_id ? " — ya tiene número" : ""}
              </option>
            ))}
          </select>
          <p className="se-admin-meta-hint">
            Sale a las 9:00 de Caracas, pero sólo si lo activa. Un borrador no sale nunca.
          </p>
          <label className="se-form-label" htmlFor="bol-nuevo-asunto">
            Asunto del correo
          </label>
          <input
            id="bol-nuevo-asunto"
            className="se-form-control"
            value={asunto}
            maxLength={300}
            placeholder="Entorno en Viñetas · 28 de septiembre de 2026"
            onChange={(e) => setAsunto(e.target.value)}
          />
          <p className="se-admin-meta-hint">Sale de la fecha. Se puede cambiar después.</p>
        </form>
      </ModalDelPanel>

      <ConfirmDialog />
    </div>
  );
};

export default AdminBoletin;
