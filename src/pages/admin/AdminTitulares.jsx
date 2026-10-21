import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ErrorState, LoadingState } from "../../components/content";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { adminRequest } from "../../lib/api";
import { applyPageMeta } from "../../lib/seo";
import { unwrapEntity } from "../../services/adminResponseUtils";

/**
 * «Titulares» en el panel: lo mínimo para publicar sin revisión previa.
 *
 * Los titulares en caliente salen solos cada 10 minutos (ver `services/titulares_ciclo.py`
 * en el backend). Aquí la redacción ve lo publicado y lo **quita en el acto** si tiene un
 * error: borrar pide un motivo, la web lo deja de enseñar en menos de dos minutos y el
 * evento no vuelve a salir aunque lleguen más fuentes. Un admin puede además parar la
 * publicación automática u ocultar la sección entera (la emergencia).
 *
 * Editar, fijar, silenciar fuentes y el recorrido «Guía» llegan con el panel completo.
 */

const VISTAS = [
  { clave: "publicados", texto: "Publicados" },
  { clave: "borrados", texto: "Borrados" },
];

const cuando = (iso) =>
  iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas", dateStyle: "short", timeStyle: "short" }) : "—";
const usd = (n) => (typeof n === "number" ? `${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : "—");

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
        <select className="se-input" value={motivo} onChange={(e) => setMotivo(e.target.value)} required>
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
        <input className="se-input" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={500}
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

export const AdminTitulares = () => {
  const { role } = useAuth();
  const esAdmin = role === "admin";
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const [vista, setVista] = useState("publicados");
  const [state, setState] = useState({ status: "loading", resumen: null, ajustes: null, grupos: [], error: null });
  const [borrando, setBorrando] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Titulares", description: "Los titulares en caliente: lo publicado, borrar y pausar." });
  }, []);

  const cargar = useCallback(async () => {
    try {
      const [resumen, ajustes, lista] = await Promise.all([
        adminRequest("/admin/headlines/resumen"),
        adminRequest("/admin/headlines/settings"),
        adminRequest("/admin/headlines", { query: { vista, horas: 24, limite: 100 } }),
      ]);
      setState({
        status: "success",
        resumen: unwrapEntity(resumen),
        ajustes: unwrapEntity(ajustes),
        grupos: unwrapEntity(lista)?.grupos ?? [],
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

  const borrar = async (grupo, motivo, nota) => {
    setOcupado(true);
    try {
      await adminRequest(`/admin/headlines/${grupo.id}`, { method: "DELETE", json: { motivo, nota } });
      toastSuccess("Borrado. Deja de verse en la web en menos de dos minutos.", "Titulares");
      setBorrando(null);
      await cargar();
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo borrar."), "Titulares");
    } finally {
      setOcupado(false);
    }
  };

  const restaurar = async (grupo) => {
    const ok = await confirm({
      title: "Restaurar el titular",
      description: `«${grupo.titulo}» vuelve a la web.`,
      confirmLabel: "Restaurar",
    });
    if (!ok) return;
    setOcupado(true);
    try {
      await adminRequest(`/admin/headlines/${grupo.id}/restore`, { method: "POST" });
      toastSuccess("Restaurado.", "Titulares");
      await cargar();
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo restaurar."), "Titulares");
    } finally {
      setOcupado(false);
    }
  };

  const cambiar = async (clave, valor, pregunta) => {
    const ok = await confirm({ title: pregunta.titulo, description: pregunta.texto, confirmLabel: pregunta.boton });
    if (!ok) return;
    setOcupado(true);
    try {
      await adminRequest("/admin/headlines/settings", { method: "PUT", json: { [clave]: valor } });
      toastSuccess("Hecho.", "Titulares");
      await cargar();
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo cambiar."), "Titulares");
    } finally {
      setOcupado(false);
    }
  };

  if (state.status === "loading") return <LoadingState title="Cargando titulares…" />;
  if (state.status === "error") return <ErrorState title="No se pudo cargar." error={state.error} onRetry={cargar} />;

  const { resumen, ajustes, grupos } = state;
  const publica = ajustes?.autopublish_enabled;
  const visible = ajustes?.section_visible;
  const motivos = ajustes?.motivos ?? {};
  const ciclo = resumen?.ultimo_ciclo;

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>
            Titulares en caliente
          </h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
            Salen solos cada 10 minutos, redactados a partir de lo que trae el recolector, en español e inglés.
            Si uno tiene un error, bórrelo aquí: deja de verse en menos de dos minutos y no vuelve aunque lleguen
            más fuentes del mismo hecho.
          </p>
        </div>
      </header>

      <section className="se-admin-table-wrap" style={{ marginBottom: "1rem", padding: "1rem" }}>
        <div className="se-admin-filters" style={{ alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
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
          <div className="se-admin-filters__field se-admin-filters__field--grow">
            <span className="se-form-label">IA este mes</span>
            <span className="se-admin-meta-hint">
              {usd(resumen?.gasto_usd?.mes)} de {usd(resumen?.gasto_usd?.presupuesto_mes)} · hoy {usd(resumen?.gasto_usd?.hoy)}
              {ciclo?.empezo ? ` · último ciclo: ${cuando(ciclo.empezo)}` : ""}
            </span>
          </div>
        </div>
      </section>

      <div className="se-admin-filters" role="tablist" aria-label="Qué titulares ver" style={{ marginBottom: "0.75rem" }}>
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
          {grupos.map((g) => (
            <li key={g.id} className="se-admin-table-wrap" style={{ padding: "1rem" }}>
              <p className="se-admin-meta-hint" style={{ margin: 0 }}>
                {g.pais || "—"} · {g.categoria || "—"} · calor {g.calor} · {g.fuentes} fuente{g.fuentes === 1 ? "" : "s"}
                {vista === "publicados" ? ` · publicado ${cuando(g.publicado)}` : ` · borrado ${cuando(g.borrado)} (${motivos[g.motivo_borrado] || g.motivo_borrado || "—"})`}
              </p>
              <h2 className="se-heading-card" style={{ margin: "0.35rem 0" }}>{g.titulo}</h2>
              <p style={{ margin: 0 }}>{g.resumen}</p>
              <details style={{ marginTop: "0.5rem" }}>
                <summary className="se-admin-meta-hint">En inglés y fuentes</summary>
                <p style={{ margin: "0.5rem 0 0", fontWeight: 600 }}>{g.titulo_en}</p>
                <p style={{ margin: "0.25rem 0 0" }}>{g.resumen_en}</p>
                <ul className="se-admin-meta-hint">
                  {g.notas.map((n, k) => (
                    <li key={`${g.id}-${k}`}>
                      {n.medio} (nivel {n.nivel}, {n.idioma}): {n.titulo}
                    </li>
                  ))}
                </ul>
              </details>
              {vista === "publicados" ? (
                borrando === g.id ? (
                  <FormularioBorrar motivos={motivos} ocupado={ocupado} onCancelar={() => setBorrando(null)}
                    onBorrar={(motivo, nota) => borrar(g, motivo, nota)} />
                ) : (
                  <button type="button" className="se-btn se-btn--secondary" style={{ marginTop: "0.75rem" }}
                    onClick={() => setBorrando(g.id)} disabled={ocupado}>
                    Borrar
                  </button>
                )
              ) : (
                <button type="button" className="se-btn se-btn--secondary" style={{ marginTop: "0.75rem" }}
                  onClick={() => restaurar(g)} disabled={ocupado}>
                  Restaurar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog />
    </main>
  );
};
