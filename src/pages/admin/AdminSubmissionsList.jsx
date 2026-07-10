import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminSubmissions } from "../../services/adminSubmissionsService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import {
  formatSubmissionDate,
  submissionStatusCssModifier,
  submissionStatusLabel,
} from "../../lib/submissionDisplay";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "submitted", label: "Enviado" },
  { value: "pending", label: "Pendiente" },
  { value: "under_review", label: "En revisión" },
  { value: "accepted", label: "Aceptado" },
  { value: "rejected", label: "Rechazado" },
];

const ChevronRightIcon = () => (
  <svg className="se-admin-submissions__cta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const truncateText = (text, maxLen) => {
  const t = String(text ?? "").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen).trim()}…`;
};

const mapRow = (row) => {
  const sid = adminPick(row, ["id", "_id"], "");
  const title = adminPick(row, ["title"], "(sin título)");
  const st = adminPick(row, ["status"], "");
  const excerptRaw = adminPick(row, ["excerpt", "summary"], "");
  const excerpt = excerptRaw && excerptRaw !== "—" ? truncateText(excerptRaw, 140) : "";
  const createdRaw = adminPick(row, ["created_at", "createdAt"], "");
  const dateLabel = createdRaw && createdRaw !== "—" ? formatSubmissionDate(createdRaw) : "";
  const statusLabel = submissionStatusLabel(st);
  const statusMod = submissionStatusCssModifier(st);
  return { sid, title, st, excerpt, dateLabel, statusLabel, statusMod };
};

export const AdminSubmissionsList = () => {
  const [page, setPage] = useState(1);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { items, meta } = await listAdminSubmissions({
        page,
        limit: 20,
        status: submissionStatus || undefined,
      });
      setState({ status: "success", items, meta, error: null });
    } catch (err) {
      setState({ status: "error", items: [], meta: null, error: err });
    }
  }, [page, submissionStatus]);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Envíos colaborativos", description: "Revisiones de propuestas.", noindex: true });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const meta = state.meta;
  const totalPages = meta?.pages ?? 1;
  const limit = Number(meta?.limit ?? 20) || 20;
  const total = Number(meta?.total ?? 0);
  const currentPage = Number(meta?.page ?? page) || page;

  const rangeLabel = useMemo(() => {
    if (state.status !== "success" || state.items.length === 0) return null;
    const safeTotal = total > 0 ? total : state.items.length;
    const start = safeTotal === 0 ? 0 : (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, safeTotal);
    return { start, end, safeTotal };
  }, [state.status, state.items.length, total, currentPage, limit]);

  const handleFilterChange = (value) => {
    setSubmissionStatus(value);
    setPage(1);
  };

  const activeFilterLabel = STATUS_FILTERS.find((f) => f.value === submissionStatus)?.label ?? "Todos";

  return (
    <main role="main" className="se-admin-submissions">
      <header className="se-admin-shell__header" style={{ marginBottom: "0.5rem", alignItems: "flex-start" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>
            Envíos colaborativos
          </h1>
          <p className="se-admin-submissions__intro">
            Revise propuestas de lectores, deje notas por envío y actualice el estado del flujo editorial desde el detalle
            de cada fila.
          </p>
        </div>
      </header>

      <div className="se-admin-submissions__toolbar" role="search" aria-label="Filtrar envíos por estado">
        <span className="se-admin-submissions__toolbar-label" id="submissions-filter-legend">
          Estado
        </span>
        <div className="se-admin-submissions__chips" role="group" aria-labelledby="submissions-filter-legend">
          {STATUS_FILTERS.map((f) => {
            const isActive = submissionStatus === f.value;
            return (
              <button
                key={f.value || "all"}
                type="button"
                className={`se-admin-submissions__chip${isActive ? " se-admin-submissions__chip--active" : ""}`}
                aria-pressed={isActive}
                onClick={() => handleFilterChange(f.value)}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {state.status === "loading" ? <LoadingState title="Cargando envíos…" /> : null}
      {state.status === "error" ? (
        <ErrorState title="No se pudieron cargar los envíos" error={state.error} onRetry={load} />
      ) : null}

      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState
          title="Sin envíos"
          description={
            submissionStatus
              ? `No hay resultados con el filtro «${activeFilterLabel}». Pruebe otro estado o muestre todos.`
              : "No hay envíos que coincidan con esta vista. Vuelva más tarde o pruebe otro filtro."
          }
        />
      ) : null}

      {state.status === "success" && state.items.length > 0 ? (
        <>
          <div className="se-admin-submissions__meta-bar">
            {rangeLabel ? (
              <span className="se-admin-submissions__stat">
                Mostrando <strong>{rangeLabel.start}</strong>–<strong>{rangeLabel.end}</strong> de{" "}
                <strong>{rangeLabel.safeTotal}</strong>
              </span>
            ) : null}
            <span className="se-admin-submissions__stat">
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>
          </div>

          <div className="se-admin-submissions__cards" aria-label="Lista de envíos (vista móvil)">
            {state.items.map((row) => {
              const r = mapRow(row);
              if (!r.sid) return null;
              return (
                <article key={r.sid} className="se-admin-submissions__card">
                  <div className="se-admin-submissions__card-top">
                    <span className="se-admin-submissions__id">#{r.sid}</span>
                    <span className={`se-admin-submissions__status se-admin-submissions__status--${r.statusMod}`}>
                      {r.statusLabel}
                    </span>
                  </div>
                  <h2 className="se-admin-submissions__card-title">
                    <Link to={`/admin/submissions/${encodeURIComponent(r.sid)}`}>{r.title}</Link>
                  </h2>
                  {r.excerpt ? <p className="se-admin-submissions__card-excerpt">{r.excerpt}</p> : null}
                  {r.dateLabel ? <p className="se-admin-submissions__card-date">{r.dateLabel}</p> : null}
                  <Link
                    to={`/admin/submissions/${encodeURIComponent(r.sid)}`}
                    className="se-btn se-btn--secondary se-admin-submissions__card-cta se-admin-submissions__cta"
                  >
                    Revisar
                    <ChevronRightIcon />
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="se-admin-submissions__table-only">
            <div className="se-admin-table-wrap">
              <table className="se-admin-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Propuesta</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {state.items.map((row) => {
                    const r = mapRow(row);
                    if (!r.sid) return null;
                    return (
                      <tr key={r.sid}>
                        <td>
                          <span className="se-admin-submissions__id">{r.sid}</span>
                        </td>
                        <td>
                          <div className="se-admin-submissions__title-stack">
                            <Link className="se-admin-submissions__title-link" to={`/admin/submissions/${encodeURIComponent(r.sid)}`}>
                              {r.title}
                            </Link>
                            {r.excerpt ? <p className="se-admin-submissions__excerpt">{r.excerpt}</p> : null}
                          </div>
                        </td>
                        <td>
                          <span className={`se-admin-submissions__status se-admin-submissions__status--${r.statusMod}`}>
                            {r.statusLabel}
                          </span>
                        </td>
                        <td>{r.dateLabel ? <span className="se-admin-submissions__date">{r.dateLabel}</span> : "—"}</td>
                        <td>
                          <Link
                            to={`/admin/submissions/${encodeURIComponent(r.sid)}`}
                            className="se-btn se-btn--secondary se-admin-submissions__cta"
                          >
                            Revisar
                            <ChevronRightIcon />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : null}
    </main>
  );
};
