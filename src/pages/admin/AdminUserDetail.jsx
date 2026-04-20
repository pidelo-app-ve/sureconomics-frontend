import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminUser, patchAdminUser } from "../../services/adminUsersService";
import { ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";

const readCollabFlag = (row) => {
  if (!row || typeof row !== "object") return false;
  const v = row.can_submit_collaborations ?? row.collaborative_submissions_enabled ?? row.collaborative ?? row.is_collaborator;
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  return false;
};

export const AdminUserDetail = () => {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [collab, setCollab] = useState(false);
  const [loadState, setLoadState] = useState({ status: "idle", error: null });
  const [saveState, setSaveState] = useState({ status: "idle", error: null });

  const numericId = useMemo(() => {
    if (!id) return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : id;
  }, [id]);

  const load = useCallback(async () => {
    if (!numericId) return;
    setLoadState({ status: "loading", error: null });
    try {
      const data = await getAdminUser(numericId);
      setRow(data);
      setCollab(readCollabFlag(data));
      setLoadState({ status: "success", error: null });
    } catch (err) {
      setLoadState({ status: "error", error: err });
    }
  }, [numericId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    applyPageMeta({ title: `Admin — Usuario #${id ?? ""}`, description: "Detalle de usuario.", noindex: true });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numericId) return;
    setSaveState({ status: "loading", error: null });
    try {
      const updated = await patchAdminUser(numericId, {
        can_submit_collaborations: collab,
        collaborative_submissions_enabled: collab,
      });
      setRow(updated);
      setCollab(readCollabFlag(updated));
      setSaveState({ status: "success", error: null });
    } catch (err) {
      setSaveState({ status: "error", error: err });
    }
  };

  if (loadState.status === "loading") {
    return (
      <main role="main">
        <LoadingState title="Cargando usuario…" />
      </main>
    );
  }

  if (loadState.status === "error" || !row) {
    return (
      <main role="main">
        <ErrorState title="No se pudo cargar el usuario" error={loadState.error} onRetry={load} />
        <Link to="/admin/users" className="se-link">
          Volver al listado
        </Link>
      </main>
    );
  }

  const email = adminPick(row, ["email"], "—");

  return (
    <main role="main">
      <p className="se-text-body">
        <Link to="/admin/users" className="se-link">
          ← Usuarios
        </Link>
      </p>
      <h1 className="se-heading-section">Usuario</h1>
      <p className="se-text-body">
        <strong>Correo:</strong> {email}
      </p>
      <p className="se-meta">ID: {adminPick(row, ["id", "_id"], "")}</p>

      <form className="se-contact-form" onSubmit={handleSubmit} style={{ marginTop: "1.5rem", maxWidth: "28rem" }}>
        {saveState.status === "error" ? (
          <p className="se-admin-login__error" role="alert">
            {saveState.error instanceof Error ? saveState.error.message : "Error al guardar."}
          </p>
        ) : null}
        {saveState.status === "success" ? (
          <p className="se-text-body" role="status">
            Guardado.
          </p>
        ) : null}

        <label className="se-form-field" htmlFor="user-collab">
          <input id="user-collab" type="checkbox" checked={collab} onChange={(e) => setCollab(e.target.checked)} />
          <span className="se-form-label">Puede enviar colaboraciones</span>
        </label>
        <div className="se-admin-form-actions">
          <button type="submit" className="se-btn" disabled={saveState.status === "loading"}>
            {saveState.status === "loading" ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </main>
  );
};
