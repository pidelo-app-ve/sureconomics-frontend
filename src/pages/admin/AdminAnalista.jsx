import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { useAuth } from "../../context/AuthContext";
import { applyPageMeta } from "../../lib/seo";
import { listAdminCarreras, moderarCarrera } from "../../services/analistaService";

/**
 * El ranking de El Analista, para moderarlo.
 *
 * Cada carrera la anota un lector con cuenta, pero los datos los pone el juego en su
 * navegador: alguien puede figurar con un nombre ofensivo o con una cifra imposible. Se
 * **oculta**, no se borra: deja de salir en el ranking (y sube la siguiente mejor de esa
 * cuenta), y si fue un error se vuelve a mostrar.
 */

const ESTADOS = [
  { value: "", label: "Todas" },
  { value: "0", label: "Visibles en el ranking" },
  { value: "1", label: "Ocultas" },
];

const dinero = (n) =>
  `USD ${Number(n || 0).toLocaleString("es", { maximumFractionDigits: 0 })}`;

const fecha = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "—";

export const AdminAnalista = () => {
  const { role } = useAuth();
  const puede = role === "publicador" || role === "admin";
  const [page, setPage] = useState(1);
  const [oculta, setOculta] = useState("");
  const [buscar, setBuscar] = useState("");
  const [consulta, setConsulta] = useState("");
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
  const [ocupada, setOcupada] = useState(null);
  const [aviso, setAviso] = useState(null);

  const cargar = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { items, meta } = await listAdminCarreras({ page, limit: 20, oculta, q: consulta });
      setState({ status: "success", items, meta, error: null });
    } catch (err) {
      setState({ status: "error", items: [], meta: null, error: err });
    }
  }, [page, oculta, consulta]);

  useEffect(() => {
    applyPageMeta({ title: "Admin — El Analista", description: "Moderación del ranking de El Analista.", noindex: true });
  }, []);

  useEffect(() => {
    if (puede) cargar();
  }, [puede, cargar]);

  const cambiar = async (fila, ocultar) => {
    setOcupada(fila.id);
    setAviso(null);
    try {
      await moderarCarrera(fila.id, ocultar);
      setAviso({
        tipo: "ok",
        texto: ocultar
          ? `«${fila.n}» ya no sale en el ranking.`
          : `«${fila.n}» vuelve a salir en el ranking.`,
      });
      await cargar();
    } catch (err) {
      setAviso({ tipo: "error", texto: err instanceof Error ? err.message : "No se pudo cambiar." });
    } finally {
      setOcupada(null);
    }
  };

  if (!puede) {
    return <EmptyState title="Sin acceso" description="Solo publicador y admin pueden moderar el ranking." />;
  }

  const meta = state.meta;
  const totalPages = meta?.pages ?? 1;

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          Ranking de El Analista
        </h1>
      </header>
      <p className="se-text-body" style={{ marginTop: 0, maxWidth: "62ch" }}>
        Cada carrera la anotó un lector con cuenta y el correo confirmado. Ocultar una la saca
        del ranking sin borrarla; si esa cuenta tiene otra carrera, sale la siguiente mejor.
      </p>

      <form
        className="se-contact-form se-contact-form--toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setConsulta(buscar.trim());
        }}
      >
        <label className="se-form-field" htmlFor="analista-estado">
          <span className="se-form-label">Estado</span>
          <select
            id="analista-estado"
            className="se-form-control"
            value={oculta}
            onChange={(e) => {
              setOculta(e.target.value);
              setPage(1);
            }}
          >
            {ESTADOS.map((o) => (
              <option key={o.value || "todas"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="se-form-field" htmlFor="analista-buscar">
          <span className="se-form-label">Buscar</span>
          <input
            id="analista-buscar"
            className="se-form-control"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Nombre en el ranking o correo"
          />
        </label>
        <button type="submit" className="se-btn se-btn--secondary">
          Filtrar
        </button>
      </form>

      {aviso?.tipo === "ok" ? (
        <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
          {aviso.texto}
        </p>
      ) : null}
      {aviso?.tipo === "error" ? (
        <p className="se-admin-login__error" role="alert">
          {aviso.texto}
        </p>
      ) : null}

      {state.status === "loading" ? <LoadingState title="Cargando carreras…" /> : null}
      {state.status === "error" ? (
        <ErrorState title="No se pudieron cargar las carreras" error={state.error} onRetry={cargar} />
      ) : null}
      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState
          title="Sin carreras"
          description={consulta || oculta ? "Ninguna carrera coincide con estos filtros." : "Todavía nadie ha anotado una carrera."}
        />
      ) : null}

      {state.status === "success" && state.items.length > 0 ? (
        <>
          <div className="se-admin-paginas">
            <p className="se-text-body" style={{ margin: 0 }}>
              Página {meta?.page ?? page} de {totalPages} — {meta?.total ?? state.items.length} en total
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} compacta etiqueta="Paginación (arriba)" />
          </div>
          <div className="se-admin-table-wrap">
            <table className="se-admin-table">
              <thead>
                <tr>
                  <th scope="col">Nombre en el ranking</th>
                  <th scope="col">Patrimonio</th>
                  <th scope="col">Carrera</th>
                  <th scope="col">Cuenta</th>
                  <th scope="col">Anotada</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((fila) => (
                  <tr key={fila.id}>
                    <td style={{ fontWeight: 600 }}>{fila.n}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{dinero(fila.p)}</td>
                    <td>
                      <div style={{ display: "grid", gap: "0.15rem" }}>
                        <span>
                          {fila.c || "—"} · se retiró a los {fila.e}
                          {fila.m ? ` · ◆${fila.m}` : ""}
                        </span>
                        {fila.v ? (
                          <span className="se-text-body" style={{ fontSize: "0.8em", opacity: 0.8 }}>
                            {fila.v}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: "0.15rem" }}>
                        <span>{fila.cuenta?.nombre || "—"}</span>
                        <span className="se-text-body" style={{ fontSize: "0.8em", opacity: 0.8 }}>
                          {fila.cuenta?.email}
                        </span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{fecha(fila.fecha)}</td>
                    <td>
                      <span className={`se-status-pill ${fila.oculta ? "se-status-pill--negative" : "se-status-pill--positive"}`}>
                        {fila.oculta ? "Oculta" : "Visible"}
                      </span>
                    </td>
                    <td className="se-admin-table__actions">
                      <button
                        type="button"
                        className="se-link se-header__nav-link--button"
                        disabled={ocupada === fila.id}
                        onClick={() => cambiar(fila, !fila.oculta)}
                      >
                        {fila.oculta ? "Volver a mostrar" : "Ocultar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(n) => {
              setPage(n);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      ) : null}
    </main>
  );
};

export default AdminAnalista;
