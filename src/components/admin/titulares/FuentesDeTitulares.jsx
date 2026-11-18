import { useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useAdminToast } from "../../../context/AdminToastContext";
import { useAuth } from "../../../context/AuthContext";
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { adminRequest } from "../../../lib/api";
import { recorridoTitulares } from "../../../lib/guias/guiaTitulares";
import { unwrapEntity } from "../../../services/adminResponseUtils";
import { ModalDelPanel } from "../ModalDelPanel";

const { ancla } = recorridoTitulares;

/**
 * Los medios que lee el sistema de titulares, con cuántas notas mandaron en 24 horas.
 *
 * Silenciar uno hace que sus notas nuevas dejen de contar; con la casilla marcada, se
 * borran además los titulares publicados donde era el único medio (motivo «fuente poco
 * confiable»). Reactivar lo devuelve desde ese momento. Va plegada: son decenas de
 * medios y se mira de vez en cuando, no a cada rato.
 *
 * **Un medio nuevo llega silenciado** (`"nueva": true`; auditoría del 17-nov-2026,
 * D-12): nadie lo ha revisado y sus notas no cuentan hasta que alguien lo activa aquí,
 * eligiendo su nivel. Van los primeros de la lista, con su marca, y el resumen plegado
 * dice cuántos esperan. Un medio nuevo nace con nivel 3 o peor, y es el que se propone.
 *
 * **El nivel va por su propia ruta** (`POST …/fuentes/<id>/nivel`): «Activar»,
 * «Reactivar» y «Cambiar nivel» abren la misma ventana. Activar o reactivar son dos
 * llamadas, primero el nivel (solo si cambió) y luego `unmute`; si la segunda falla, el
 * nivel ya quedó guardado y el medio sigue silenciado, y la ventana lo dice así y deja
 * reintentar. Los niveles 1 y 2 solo los pone un admin (el backend contesta 403 al
 * publicador): al resto se le enseñan deshabilitados, con el porqué.
 */

const NIVEL = { 1: "1 · oficial", 2: "2 · agencia", 3: "3 · medio", 4: "4 · Google News o pequeño" };

/**
 * Qué significa cada nivel, para quien lo elige. Sale de las reglas del backend
 * (`titulares_reglas.puede_publicar` y `titulares_ajustes`): con qué basta para publicar.
 */
const NIVELES = [
  { nivel: 1, nombre: "Oficial", ejemplo: "Bancos centrales, gobiernos, organismos públicos.",
    pesa: "Basta él solo para publicar una noticia." },
  { nivel: 2, nombre: "Agencia de noticias", ejemplo: "EFE, Reuters, AFP.",
    pesa: "Basta él solo para publicar una noticia." },
  { nivel: 3, nombre: "Medio reconocido", ejemplo: "Diarios nacionales de América Latina o del mundo.",
    pesa: "Basta él solo para una noticia normal; una delicada pide otro medio que la cuente." },
  { nivel: 4, nombre: "Google News o medio pequeño", ejemplo: "Búsquedas por tema, medios locales o poco conocidos.",
    pesa: "Nunca basta solo: hacen falta 3 medios distintos (2 si la noticia es de Venezuela)." },
];

const FILTROS = [
  { clave: "todas", texto: "Todos" },
  { clave: "nuevas", texto: "Nuevos, sin activar" },
  { clave: "silenciadas", texto: "Silenciados" },
  { clave: "cuentan", texto: "Que cuentan" },
];

const pasa = {
  todas: () => true,
  nuevas: (f) => f.nueva,
  silenciadas: (f) => f.silenciada && !f.nueva,
  cuentan: (f) => !f.silenciada,
};

/** Los niveles que solo pone un admin (`titulares_moderacion.NIVELES_SOLO_ADMIN`). */
const SOLO_ADMIN = [1, 2];

/** Lo que dice la ventana del nivel según para qué se abrió. */
const MODO = {
  activar: {
    titulo: "Activar",
    texto: "Llegó solo y todavía no cuenta. Antes de activarlo, compruebe que es un medio serio. Desde ahora sus notas sirven para elegir y redactar titulares.",
    boton: "Activar con nivel",
    hecho: "activado: sus notas cuentan desde ahora",
    verbo: "activar",
  },
  reactivar: {
    titulo: "Reactivar",
    texto: "Sus notas vuelven a contar desde ahora.",
    boton: "Reactivar con nivel",
    hecho: "vuelve a contar",
    verbo: "reactivar",
  },
  nivel: {
    titulo: "Cambiar el nivel de",
    texto: "El nivel nuevo cuenta desde ahora: también para sus notas guardadas y para los titulares publicados que lo citan.",
    boton: "Guardar nivel",
    hecho: "nivel cambiado",
    verbo: "cambiar el nivel",
  },
};

const nivelValido = (n) => (NIVEL[n] ? n : 3);

const estadoDe = (f) => {
  if (f.nueva) return <span className="se-tit-marca se-tit-marca--nueva">Nuevo, sin activar</span>;
  if (f.silenciada) return `Silenciado${f.silenciada_por ? ` por ${f.silenciada_por}` : ""}`;
  return "Cuenta";
};

export const FuentesDeTitulares = ({ fuentes, onCambio, anclaje, verNuevas = 0 }) => {
  const { toastSuccess, toastError } = useAdminToast();
  const { role } = useAuth();
  const esAdmin = role === "admin";
  const [silenciando, setSilenciando] = useState(null);
  const [retirar, setRetirar] = useState(false);
  const [ventana, setVentana] = useState(null); // { fuente, modo: "activar" | "reactivar" | "nivel" }
  const [nivel, setNivel] = useState(3);
  const [fallo, setFallo] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [ocupado, setOcupado] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const grupoNivel = useId();
  const caja = useRef(null);

  // «Ver esos medios» del aviso de arriba (notas de medios nuevos descartadas): abre la
  // lista, deja solo los nuevos y la trae a la vista. Cada pulsación sube el número.
  useEffect(() => {
    if (!verNuevas) return;
    setFiltro("nuevas");
    setAbierta(true);
    caja.current?.scrollIntoView({ block: "start" });
  }, [verNuevas]);

  // Los pasos de la guía que hablan de los medios (`abrirFuentes`) despliegan la lista:
  // lo que el paso explica tiene que verse. Solo abre; cerrarla es cosa de quien mira.
  useEffect(() => {
    const mirar = () => {
      if (recorridoTitulares.definicionActual()?.abrirFuentes) setAbierta(true);
    };
    mirar();
    return recorridoTitulares.suscribir(mirar);
  }, []);

  // Silenciados a mano; los nuevos, que también lo están, se cuentan aparte.
  const silenciadas = fuentes.filter((f) => f.silenciada && !f.nueva).length;
  const nuevas = fuentes.filter((f) => f.nueva).length;
  // Las nuevas, arriba: son las que piden que alguien haga algo. El resto, en el orden
  // del servidor (`sort` es estable).
  const visibles = fuentes.filter(pasa[filtro] ?? pasa.todas).sort((a, b) => Number(Boolean(b.nueva)) - Number(Boolean(a.nueva)));

  const silenciar = async () => {
    setOcupado(true);
    try {
      const r = await adminRequest(`/admin/headlines/fuentes/${encodeURIComponent(silenciando.id)}/mute`, {
        method: "POST",
        json: { retirar },
      });
      const n = unwrapEntity(r)?.retirados?.length ?? 0;
      toastSuccess(
        `${silenciando.nombre} silenciada.${n ? ` Se borraron ${n} titular${n === 1 ? "" : "es"} donde era la única fuente.` : ""}`,
        "Titulares",
      );
      setSilenciando(null);
      onCambio();
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo silenciar."), "Titulares");
    } finally {
      setOcupado(false);
    }
  };

  /**
   * Abre la ventana del nivel. Propone el que tiene; a un medio nuevo, 3 o peor (así nace
   * en el backend: el recolector no puede subirlo a oficial ni a agencia).
   */
  const abrirVentana = (f, modo) => {
    setNivel(f.nueva ? Math.max(3, nivelValido(f.nivel)) : nivelValido(f.nivel));
    setFallo(null);
    setVentana({ fuente: f, modo });
  };

  const guardar = async () => {
    const { fuente: f, modo } = ventana;
    const ruta = `/admin/headlines/fuentes/${encodeURIComponent(f.id)}`;
    const cambia = nivel !== f.nivel;
    let paso = "nivel";
    setOcupado(true);
    setFallo(null);
    try {
      if (cambia) await adminRequest(`${ruta}/nivel`, { method: "POST", json: { nivel } });
      paso = "activar";
      if (modo !== "nivel") await adminRequest(`${ruta}/unmute`, { method: "POST" });
      toastSuccess(`${f.nombre}: ${MODO[modo].hecho}, con nivel ${nivel}.`, "Titulares");
      setVentana(null);
      onCambio();
    } catch (err) {
      if (paso === "activar" && cambia) {
        // A medias: el nivel ya está guardado y el medio sigue silenciado. Se dice tal
        // cual, la ventana se queda para reintentar (ya sin volver a mandar el nivel) y
        // la lista se recarga para enseñar el nivel nuevo.
        setFallo(
          `Se guardó el nivel ${nivel}, pero no se pudo ${MODO[modo].verbo}: ${adminErrorMessage(err, "error del servidor.")} ` +
            `El medio sigue silenciado; pulse «${MODO[modo].boton} ${nivel}» para intentarlo otra vez.`,
        );
        setVentana((v) => (v ? { ...v, fuente: { ...v.fuente, nivel } } : v));
        onCambio();
      } else {
        setFallo(adminErrorMessage(err, paso === "nivel" ? "No se pudo guardar el nivel." : `No se pudo ${MODO[modo].verbo}.`));
      }
    } finally {
      setOcupado(false);
    }
  };

  const activa = ventana?.fuente;
  const modo = ventana ? MODO[ventana.modo] : null;

  return (
    <details ref={caja} className="se-admin-table-wrap se-tit-fuentes" open={abierta}
      onToggle={(e) => setAbierta(e.currentTarget.open)} {...anclaje}>
      <summary className="se-tit-fuentes__resumen">
        <span className="se-heading-card">Medios que lee el sistema</span>
        <span className="se-admin-meta-hint">
          {fuentes.length} medio{fuentes.length === 1 ? "" : "s"}
          {silenciadas ? ` · ${silenciadas} silenciado${silenciadas === 1 ? "" : "s"}` : ""}
        </span>
        {nuevas ? (
          <span className="se-tit-marca se-tit-marca--nueva">
            {nuevas} nuevo{nuevas === 1 ? "" : "s"} sin activar
          </span>
        ) : null}
      </summary>
      {fuentes.length ? (
        <>
          <div className="se-admin-filters se-tit-fuentes__filtros" {...ancla("fuentes-nuevas")}>
            <label className="se-admin-filters__field">
              <span className="se-form-label">Enseñar</span>
              <select className="se-form-control" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                {FILTROS.map((o) => (
                  <option key={o.clave} value={o.clave}>
                    {o.texto}
                    {o.clave === "nuevas" ? ` (${nuevas})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <span className="se-admin-meta-hint">
              Un medio nuevo llega silenciado: sus notas no cuentan hasta que alguien lo revisa y lo activa. Van los primeros.
            </span>
          </div>
          {visibles.length ? (
            <div className="se-tit-fuentes__tabla">
              <table className="se-admin-table">
                <thead>
                  <tr>
                    <th scope="col">Medio</th>
                    <th scope="col" {...ancla("fuentes-nivel")}>Nivel</th>
                    <th scope="col">País</th>
                    <th scope="col" className="se-tit-num">Notas 24 h</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span className="se-sr-only">Acción</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((f) => (
                    <tr key={f.id} className={f.silenciada && !f.nueva ? "se-tit-fuentes__fila--muda" : undefined}>
                      <td>{f.nombre}</td>
                      <td>{NIVEL[f.nivel] || f.nivel}</td>
                      <td>{f.pais}</td>
                      <td className="se-tit-num">{f.notas_24h}</td>
                      <td>{estadoDe(f)}</td>
                      <td className="se-admin-table__actions">
                        {f.silenciada ? (
                          <button type="button" className={`se-btn ${f.nueva ? "se-btn--primary" : "se-btn--secondary"}`}
                            disabled={ocupado} onClick={() => abrirVentana(f, f.nueva ? "activar" : "reactivar")}>
                            {f.nueva ? "Activar…" : "Reactivar…"}
                          </button>
                        ) : (
                          <>
                            <button type="button" className="se-btn se-btn--secondary" disabled={ocupado}
                              onClick={() => abrirVentana(f, "nivel")}>
                              Cambiar nivel…
                            </button>
                            <button type="button" className="se-btn se-btn--secondary" disabled={ocupado}
                              onClick={() => { setRetirar(false); setSilenciando(f); }}>
                              Silenciar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="se-admin-meta-hint">Ningún medio en esta lista.</p>
          )}
        </>
      ) : (
        <p className="se-admin-meta-hint">Todavía no llegó ninguna nota.</p>
      )}

      <ModalDelPanel
        abierto={Boolean(ventana)}
        ocupado={ocupado}
        onCerrar={() => setVentana(null)}
        titulo={`${modo?.titulo ?? ""} ${activa?.nombre ?? ""}`}
        subtitulo={activa?.pais ? `País: ${activa.pais}` : undefined}
        pie={
          <>
            <button type="button" className="se-btn se-btn--secondary" onClick={() => setVentana(null)} disabled={ocupado}>
              Cancelar
            </button>
            <button type="button" className="se-btn se-btn--primary" onClick={guardar}
              disabled={ocupado || (ventana?.modo === "nivel" && nivel === activa?.nivel)}>
              {ocupado ? "Guardando…" : `${modo?.boton ?? ""} ${nivel}`}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>{modo?.texto}</p>
        <fieldset className="se-tit-niveles">
          <legend className="se-form-label">¿Qué tipo de medio es?</legend>
          {NIVELES.map((n) => {
            // El publicador no pone el 1 ni el 2; si ya lo tiene, puede dejarlo como está.
            const vetado = !esAdmin && SOLO_ADMIN.includes(n.nivel) && n.nivel !== activa?.nivel;
            return (
              <label key={n.nivel} className={`se-tit-nivel${vetado ? " se-tit-nivel--vetado" : ""}`}>
                <input type="radio" name={grupoNivel} value={n.nivel} checked={nivel === n.nivel}
                  onChange={() => setNivel(n.nivel)} disabled={ocupado || vetado} />
                <span>
                  <strong>{n.nivel} · {n.nombre}</strong>
                  {activa?.nivel === n.nivel ? (
                    <span className="se-admin-meta-hint"> ({activa.nueva ? "el que propone el sistema" : "el que tiene ahora"})</span>
                  ) : null}
                  {vetado ? <span className="se-admin-meta-hint"> (solo un administrador)</span> : null}
                  <span className="se-tit-nivel__texto">{n.ejemplo} {n.pesa}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
        {!esAdmin ? (
          <p className="se-admin-meta-hint">
            Los niveles 1 y 2 solo los pone un administrador: con ellos, un medio basta solo para publicar, también lo delicado.
            Si cree que este medio lo merece, pídaselo.
          </p>
        ) : null}
        <p className="se-admin-meta-hint" style={{ marginBottom: 0 }}>
          Las noticias delicadas (política, sucesos, tribunales) piden más: dos medios distintos o uno de nivel 1 o 2;
          un caso judicial con nombres, siempre dos medios. Cuanto más bajo el número, más pesa el medio al elegir qué sale.
        </p>
        {fallo ? <p className="se-tit-aviso" role="alert">{fallo}</p> : null}
      </ModalDelPanel>

      <ModalDelPanel
        abierto={Boolean(silenciando)}
        ocupado={ocupado}
        onCerrar={() => setSilenciando(null)}
        titulo={`Silenciar ${silenciando?.nombre ?? ""}`}
        pie={
          <>
            <button type="button" className="se-btn se-btn--secondary" onClick={() => setSilenciando(null)} disabled={ocupado}>
              Cancelar
            </button>
            <button type="button" className="se-btn se-btn--primary" onClick={silenciar} disabled={ocupado}>
              {ocupado ? "Silenciando…" : "Silenciar"}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          Sus notas nuevas dejan de contar para elegir y redactar titulares. Lo que ya contó sigue contando.
          Se puede reactivar cuando quiera.
        </p>
        <label className="se-tit-casilla">
          <input type="checkbox" checked={retirar} onChange={(e) => setRetirar(e.target.checked)} />
          Borrar también los titulares publicados donde este medio era la única fuente
        </label>
      </ModalDelPanel>
    </details>
  );
};

FuentesDeTitulares.propTypes = {
  fuentes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nombre: PropTypes.string,
      nivel: PropTypes.number,
      pais: PropTypes.string,
      notas_24h: PropTypes.number,
      silenciada: PropTypes.bool,
      nueva: PropTypes.bool,
      silenciada_por: PropTypes.string,
    }),
  ).isRequired,
  onCambio: PropTypes.func.isRequired,
  anclaje: PropTypes.object,
  /** Sube en uno cada vez que hay que enseñar los medios nuevos (el aviso de la página). */
  verNuevas: PropTypes.number,
};
