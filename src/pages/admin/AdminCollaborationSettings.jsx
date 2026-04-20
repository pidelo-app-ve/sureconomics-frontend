import { useCallback, useEffect, useState } from "react";
import {
  getCollaborativeSubmissionsSettings,
  patchCollaborativeSubmissionsSettings,
} from "../../services/adminSettingsService";
import { ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";

const readEnabled = (data) => {
  if (!data || typeof data !== "object") return false;
  if (typeof data.enabled === "boolean") return data.enabled;
  if (typeof data.collaborative_submissions_enabled === "boolean") return data.collaborative_submissions_enabled;
  if (data.data && typeof data.data === "object") {
    return readEnabled(data.data);
  }
  return false;
};

export const AdminCollaborationSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [loadState, setLoadState] = useState({ status: "idle", error: null });
  const [saveState, setSaveState] = useState({ status: "idle", error: null });

  const load = useCallback(async () => {
    setLoadState({ status: "loading", error: null });
    try {
      const data = await getCollaborativeSubmissionsSettings();
      setEnabled(readEnabled(data));
      setLoadState({ status: "success", error: null });
    } catch (err) {
      setLoadState({ status: "error", error: err });
    }
  }, []);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Colaboración", description: "Ajustes de envíos colaborativos.", noindex: true });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveState({ status: "loading", error: null });
    try {
      await patchCollaborativeSubmissionsSettings({
        enabled,
        collaborative_submissions_enabled: enabled,
      });
      setSaveState({ status: "success", error: null });
    } catch (err) {
      setSaveState({ status: "error", error: err });
    }
  };

  if (loadState.status === "loading") {
    return (
      <main role="main">
        <LoadingState title="Cargando ajustes…" />
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main role="main">
        <ErrorState title="No se pudieron cargar los ajustes" error={loadState.error} onRetry={load} />
      </main>
    );
  }

  return (
    <main role="main">
      <h1 className="se-heading-section">Envíos colaborativos</h1>
      <p className="se-text-body">Active o desactive la posibilidad de que lectores verificados envíen propuestas.</p>

      <form className="se-contact-form" onSubmit={handleSubmit} style={{ maxWidth: "28rem", marginTop: "1rem" }}>
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

        <label className="se-form-field" htmlFor="collab-enabled">
          <input
            id="collab-enabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="se-form-label">Permitir envíos colaborativos</span>
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
