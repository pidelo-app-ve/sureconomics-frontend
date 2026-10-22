import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { EditarTitular } from "../../components/admin/titulares/EditarTitular";
import { FuentesDeTitulares } from "../../components/admin/titulares/FuentesDeTitulares";
import { HistorialTitular } from "../../components/admin/titulares/HistorialTitular";
import { ErrorState, LoadingState } from "../../components/content";
import { BotonGuia, RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { adminRequest } from "../../lib/api";
import { recorridoTitulares } from "../../lib/guias/guiaTitulares";
import { applyPageMeta } from "../../lib/seo";
import { unwrapEntity } from "../../services/adminResponseUtils";

/**
 * «Titulares» en el panel: lo que hace la redacción con los titulares en caliente.
 *
 * Salen solos cada 10 minutos (ver `services/titulares_ciclo.py` en el backend). Aquí se
 * ven y se corrigen: **borrar** pide un motivo y el evento no vuelve aunque lleguen más
 * fuentes; **editar** corrige el texto en los dos idiomas y deja el titular bloqueado
 * para el sistema; **fijar** lo pone el primero durante un rato; el **historial** dice
 * quién hizo qué. Abajo, los medios que lee el sistema, para silenciar el que no sirva.
 * Un admin puede además parar la publicación automática u ocultar la sección entera (la
 * emergencia). El botón «Guía» lo explica sobre la propia página.
 */

const VISTAS = [
  { clave: "publicados", texto: "Publicados" },
  { clave: "borrados", texto: "Borrados" },
];

const FIJAR = [
  { minutos: 30, texto: "media hora" },
  { minutos: 60, texto: "una hora" },
  { minutos: 120, texto: "dos horas" },
];

const zona = { timeZone: "America/Caracas" };
const cuando = (iso) => (iso ? new Date(iso).toLocaleString("es-VE", { ...zona, dateStyle: "short", timeStyle: "short" }) : "—");
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("es-VE", { ...zona, hour: "2-digit", minute: "2-digit" }) : "—");
const usd = (n) => (typeof n === "number" ? `${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : "—");
const ancla = (clave) => ({ [recorridoTitulares.atributo]: clave });

/** Los nombres de las etapas del ciclo, para el aviso de «falló». */
const ETAPAS = { recuperar: "recuperar notas", notas: "agrupar notas", grupos: "redactar y publicar",
  caducar: "caducar", purgar: "limpiar" };

/**
 * Lo que hizo la última vuelta, en una línea. Sin esto, «no sale nada» no tenía
 * explicación a la vista: si era el presupuesto, si no había noticias que pasaran el
 * mínimo o si algo falló (revisión del 22-oct-2026).
 */
const resumenDelCiclo = (c) => {
  if (!c) return null;
  const n = (k) => Number(c[k] || 0);
  const partes = [
    [n("sumadas") + n("grupos_nuevos") + n("absorbidas"), "notas agrupadas"],
    [n("descartadas"), "descartadas por el filtro"],
    [n("redactados"), "redactados"],
    [n("publicados"), "publicados"],
    [n("sin_cupo"), "sin presupuesto"],
    [n("fuera_del_tope"), "fuera del tope por ciclo"],
    [n("caducados"), "caducados"],
  ].filter(([v]) => v > 0).map(([v, t]) => `${v} ${t}`);
  const fallos = Object.keys(c).filter((k) => k.startsWith("fallo_")).map((k) => ETAPAS[k.slice(6)] || k.slice(6));
  return { texto: partes.length ? partes.join(" · ") : "sin nada nuevo", fallos };
};

const FormularioBorrar = ({ motivos, ocupado, onBorrar, onCancelar }) => {
  const [motivo, setMotivo] = useState("");
  const [nota, setNota] = useState("");
  return (
    <form
      className="se-admin-filters"
      style={{ marginTop: "0.75rem", alignItems: "flex-end" }}
      onSubmit={(e) => {
        e.preventDefault();
        if (motivo) onBorrar(motivo, nota);
      }}
    >
      <label className="se-admin-filters__field">
        <span className="se-form-label">Motivo</span>
        <select className="se-form-control" value={motivo} onChange={(e) => setMotivo(e.target.value)} required>
          <option value="">Elija uno…</option>
          {Object.entries(motivos).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
      </label>
      <label className="se-admin-filters__field se-admin-filters__field--grow">
        <span className="se-form-label">Nota (opcional)</span>
        <input className="se-form-control" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={500}
               placeholder="Qué estaba mal, para ajustar fuentes e instrucciones" />
      </label>
      <button type="submit" className="se-btn se-btn--primary" disabled={!motivo || ocupado}>
        Borrar de la web
      </button>
      <button type="button" className="se-btn se-btn--secondary" onClick={onCancelar} disabled={ocupado}>
        Cancelar
      </button>
    </form>
  );
};

FormularioBorrar.propTypes = {
  motivos: PropTypes.objectOf(PropTypes.string).isRequired,
  ocupado: PropTypes.bool,
  onBorrar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};

/** «Fijar arriba» con su duración, o «Quitar de arriba» si ya está fijado. */
const FijarArriba = ({ grupo, ocupado, onFijar, onQuitar }) => {
  const [minutos, setMinutos] = useState(60);
  if (grupo.fijado_hasta) {
    return (
      <button type="button" className="se-btn se-btn--secondary" onClick={() => onQuitar(grupo)} disabled={ocupado}>
        Quitar de arriba
      </button>
    );
  }
  return (
    <span className="se-tit-fijar">
      <button type="button" className="se-btn se-btn--secondary" onClick={() => onFijar(grupo, minutos)} disabled={ocupado}>
        Fijar arriba
      </button>
      <label className="se-tit-fijar__durante">
        <span className="se-sr-only">Durante cuánto</span>
        <select className="se-form-control" value={minutos} onChange={(e) => setMinutos(Number(e.target.value))} disabled={ocupado}>
          {FIJAR.map((f) => (
            <option key={f.minutos} value={f.minutos}>
              {f.texto}
            </option>
          ))}
        </select>
      </label>
    </span>
  );
};

FijarArriba.propTypes = {
  grupo: PropTypes.shape({ fijado_hasta: PropTypes.string }).isRequired,
  ocupado: PropTypes.bool,
  onFijar: PropTypes.func.isRequired,
  onQuitar: PropTypes.func.isRequired,
};

export const AdminTitulares = () => {
  const { role } = useAuth();
  const esAdmin = role === "admin";
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const [vista, setVista] = useState("publicados");
  const [state, setState] = useState({ status: "loading", resumen: null, ajustes: null, grupos: [], fuentes: [], error: null });
  const [borrando, setBorrando] = useState(null);
  const [editando, setEditando] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Titulares", description: "Los titulares en caliente: corregir, fijar, borrar y silenciar medios." });
  }, []);

  const cargar = useCallback(async () => {
    try {
      const [resumen, ajustes, lista, fuentes] = await Promise.all([
        adminRequest("/admin/headlines/resumen"),
        adminRequest("/admin/headlines/settings"),
        adminRequest("/admin/headlines", { query: { vista, horas: 24, limite: 100 } }),
        // Los medios son un extra: si fallan, el resto del panel tiene que seguir sirviendo.
        adminRequest("/admin/headlines/fuentes").catch(() => null),
      ]);
      setState({
        status: "success",
        resumen: unwrapEntity(resumen),
        ajustes: unwrapEntity(ajustes),
        grupos: unwrapEntity(lista)?.grupos ?? [],
        fuentes: unwrapEntity(fuentes)?.fuentes ?? [],
        error: null,
      });
    } catch (err) {
      setState((s) => (s.resumen ? s : { ...s, status: "error", error: err }));
    }
  }, [vista]);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 60_000);
    return () => clearInterval(id);
  }, [cargar]);

  /** Una acción del panel: la petición, el aviso y volver a cargar. */
  const hacer = async (peticion, exito, fallo) => {
    setOcupado(true);
    try {
      await peticion();
      toastSuccess(exito, "Titulares");
      await cargar();
      return true;
    } catch (err) {
      toastError(adminErrorMessage(err, fallo), "Titulares");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const borrar = async (grupo, motivo, nota) => {
    const ok = await hacer(
      () => adminRequest(`/admin/headlines/${grupo.id}`, { method: "DELETE", json: { motivo, nota } }),
      "Borrado. Deja de verse en la web en menos de dos minutos.",
      "No se pudo borrar.",
    );
    if (ok) setBorrando(null);
  };

  const restaurar = async (grupo) => {
    const ok = await confirm({ title: "Restaurar el titular", description: `«${grupo.titulo}» vuelve a la web.`, confirmLabel: "Restaurar" });
    if (!ok) return;
    await hacer(() => adminRequest(`/admin/headlines/${grupo.id}/restore`, { method: "POST" }), "Restaurado.", "No se pudo restaurar.");
  };

  const fijar = (grupo, minutos) =>
    hacer(
      () => adminRequest(`/admin/headlines/${grupo.id}/pin`, { method: "POST", json: { minutos } }),
      "Fijado arriba. La web lo enseña el primero en menos de dos minutos.",
      "No se pudo fijar.",
    );

  const quitar = (grupo) =>
    hacer(() => adminRequest(`/admin/headlines/${grupo.id}/pin`, { method: "DELETE" }), "Quitado de arriba.", "No se pudo quitar.");

  const cambiar = async (clave, valor, pregunta) => {
    const ok = await confirm({ title: pregunta.titulo, description: pregunta.texto, confirmLabel: pregunta.boton });
    if (!ok) return;
    await hacer(() => adminRequest("/admin/headlines/settings", { method: "PUT", json: { [clave]: valor } }), "Hecho.", "No se pudo cambiar.");
  };

  if (state.status === "loading") return <LoadingState title="Cargando titulares…" />;
  if (state.status === "error") return <ErrorState title="No se pudo cargar." error={state.error} onRetry={cargar} />;

  const { resumen, ajustes, grupos, fuentes } = state;
  const publica = ajustes?.autopublish_enabled;
  const visible = ajustes?.section_visible;
  const motivos = ajustes?.motivos ?? {};
  const ciclo = resumen?.ultimo_ciclo;
  const vuelta = resumenDelCiclo(ciclo);

  return (
    <main role="main">
      <header className="se-admin-shell__header se-tit-cabecera" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>
            Titulares en caliente
          </h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
            Salen solos cada 10 minutos, redactados a partir de lo que publican otros medios, en español e inglés.
            Si uno tiene un error, corríjalo o bórrelo aquí: la web lo cambia en menos de dos minutos.
          </p>
        </div>
        <BotonGuia recorrido={recorridoTitulares} className="se-btn se-btn--secondary se-tit-guia" />
      </header>
      <RecorridoVista recorrido={recorridoTitulares} />

      <section className="se-admin-table-wrap" style={{ marginBottom: "1rem", padding: "1rem" }}>
        <div className="se-admin-filters" style={{ alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div className="se-tit-interruptores" {...ancla("interruptores")}>
            <div className="se-admin-filters__field">
              <span className="se-form-label">Publicación automática</span>
              <span className="se-admin-meta-hint">
                {publica ? "Encendida" : "Apagada: no sale nada nuevo"}
                {esAdmin ? (
                  <button type="button" className="se-btn se-btn--secondary" style={{ marginLeft: "0.75rem" }} disabled={ocupado}
                    onClick={() => cambiar("autopublish_enabled", !publica, publica
                      ? { titulo: "Pausar la publicación", texto: "No saldrá ningún titular nuevo hasta que la vuelva a encender. Lo publicado sigue en la web.", boton: "Pausar" }
                      : { titulo: "Encender la publicación", texto: "Los titulares que cumplan las reglas saldrán solos en cada ciclo.", boton: "Encender" })}>
                    {publica ? "Pausar" : "Encender"}
                  </button>
                ) : null}
              </span>
            </div>
            <div className="se-admin-filters__field">
              <span className="se-form-label">Sección en la web</span>
              <span className="se-admin-meta-hint">
                {visible ? "Visible" : "Oculta: la web no enseña ningún titular"}
                {esAdmin ? (
                  <button type="button" className="se-btn se-btn--secondary" style={{ marginLeft: "0.75rem" }} disabled={ocupado}
                    onClick={() => cambiar("section_visible", !visible, visible
                      ? { titulo: "Ocultar la sección", texto: "La sección y la tarjeta de la portada dejan de enseñar titulares en menos de dos minutos. Para emergencias.", boton: "Ocultar" }
                      : { titulo: "Volver a enseñar la sección", texto: "Los titulares publicados vuelven a verse.", boton: "Enseñar" })}>
                    {visible ? "Ocultar" : "Enseñar"}
                  </button>
                ) : null}
              </span>
            </div>
          </div>
          <div className="se-admin-filters__field se-admin-filters__field--grow" {...ancla("gasto")}>
            <span className="se-form-label">IA este mes</span>
            <span className="se-admin-meta-hint">
              {usd(resumen?.gasto_usd?.mes)} de {usd(resumen?.gasto_usd?.presupuesto_mes)} · hoy {usd(resumen?.gasto_usd?.hoy)}
            </span>
          </div>
          {vuelta ? (
            <div className="se-admin-filters__field se-tit-ciclo" {...ancla("ciclo")}>
              <span className="se-form-label">Último ciclo{ciclo?.empezo ? `, a las ${hora(ciclo.empezo)}` : ""}</span>
              <span className="se-admin-meta-hint">{vuelta.texto}</span>
              {vuelta.fallos.length ? (
                <span className="se-tit-aviso" role="status">
                  Falló: {vuelta.fallos.join(", ")}. El resto del ciclo siguió; si se repite, avise.
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="se-admin-filters" role="tablist" aria-label="Qué titulares ver" style={{ marginBottom: "0.75rem" }} {...ancla("vistas")}>
        {VISTAS.map((v) => (
          <button key={v.clave} type="button" role="tab" aria-selected={vista === v.clave}
            className={`se-btn ${vista === v.clave ? "se-btn--primary" : "se-btn--secondary"}`}
            onClick={() => { setVista(v.clave); setBorrando(null); }}>
            {v.texto}
          </button>
        ))}
      </div>

      {!grupos.length ? (
        <p className="se-admin-meta-hint">
          {vista === "publicados" ? "No hay titulares publicados en las últimas 24 horas." : "No hay titulares borrados en las últimas 24 horas."}
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.75rem" }}>
          {grupos.map((g, k) => (
            <li key={g.id} className="se-admin-table-wrap" style={{ padding: "1rem" }} {...(k === 0 ? ancla("titular") : {})}>
              <p className="se-admin-meta-hint" style={{ margin: 0 }}>
                {g.pais || "—"} · {g.categoria || "—"} · puntaje {g.calor} · {g.fuentes} fuente{g.fuentes === 1 ? "" : "s"}
                {vista === "publicados" ? ` · publicado ${cuando(g.publicado)}` : ` · borrado ${cuando(g.borrado)} (${motivos[g.motivo_borrado] || g.motivo_borrado || "—"})`}
              </p>
              {g.fijado_hasta || g.editado ? (
                <p className="se-tit-marcas">
                  {g.fijado_hasta ? <span className="se-tit-marca se-tit-marca--fijado">Fijado arriba hasta las {hora(g.fijado_hasta)}</span> : null}
                  {g.editado ? <span className="se-tit-marca">Editado a mano</span> : null}
                </p>
              ) : null}
              <h2 className="se-heading-card" style={{ margin: "0.35rem 0" }}>{g.titulo}</h2>
              <p style={{ margin: 0 }}>{g.resumen}</p>
              <details style={{ marginTop: "0.5rem" }}>
                <summary className="se-admin-meta-hint">En inglés y fuentes</summary>
                <p style={{ margin: "0.5rem 0 0", fontWeight: 600 }}>{g.titulo_en}</p>
                <p style={{ margin: "0.25rem 0 0" }}>{g.resumen_en}</p>
                <ul className="se-admin-meta-hint">
                  {g.notas.map((n, j) => (
                    <li key={`${g.id}-${j}`}>
                      {n.medio} (nivel {n.nivel}, {n.idioma}): {n.titulo}
                    </li>
                  ))}
                </ul>
              </details>
              {vista === "publicados" && borrando === g.id ? (
                <FormularioBorrar motivos={motivos} ocupado={ocupado} onCancelar={() => setBorrando(null)}
                  onBorrar={(motivo, nota) => borrar(g, motivo, nota)} />
              ) : (
                <div className="se-tit-acciones" {...(k === 0 ? ancla("acciones") : {})}>
                  {vista === "publicados" ? (
                    <>
                      <button type="button" className="se-btn se-btn--secondary" onClick={() => setEditando(g)} disabled={ocupado}>
                        Editar
                      </button>
                      <FijarArriba grupo={g} ocupado={ocupado} onFijar={fijar} onQuitar={quitar} />
                      <button type="button" className="se-btn se-btn--secondary" onClick={() => setHistorial(g)}>
                        Historial
                      </button>
                      <button type="button" className="se-btn se-btn--secondary" onClick={() => setBorrando(g.id)} disabled={ocupado}>
                        Borrar
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="se-btn se-btn--secondary" onClick={() => restaurar(g)} disabled={ocupado}>
                        Restaurar
                      </button>
                      <button type="button" className="se-btn se-btn--secondary" onClick={() => setHistorial(g)}>
                        Historial
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <FuentesDeTitulares fuentes={fuentes} onCambio={cargar} anclaje={ancla("fuentes")} />

      <EditarTitular grupo={editando} onCerrar={() => setEditando(null)}
        onGuardado={() => { setEditando(null); cargar(); }} />
      <HistorialTitular grupo={historial} motivos={motivos} onCerrar={() => setHistorial(null)} />
      <ConfirmDialog />
    </main>
  );
};
