import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminUser, patchAdminUser } from "../../services/adminUsersService";
import { EmptyState, ErrorState, LoadingState } from "../../components/content";
import { useAuth } from "../../context/AuthContext";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import { formatSubmissionDate } from "../../lib/submissionDisplay";
import {
  adminUserDisplayInitials,
  adminUserDisplayName,
  formatAdminUserFieldPresentation,
  labelForAdminUserField,
  sortedAdminUserKeys,
} from "../../lib/adminUserDetailDisplay";

const readCollabFlag = (row) => {
  if (!row || typeof row !== "object") return false;
  const v = row.can_submit_collaborations ?? row.collaborative_submissions_enabled ?? row.collaborative ?? row.is_collaborator;
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  return false;
};

const readEmailVerified = (row) => {
  if (!row || typeof row !== "object") return null;
  const v = row.is_email_verified ?? row.email_verified ?? row.isEmailVerified;
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  if (v === 0 || v === "0" || v === "false") return false;
  return null;
};

const pickAvatarUrl = (row) => {
  if (!row || typeof row !== "object") return "";
  const u = row.avatar_url ?? row.avatarUrl ?? row.photo_url ?? row.image_url ?? row.picture;
  return typeof u === "string" && u.trim() ? u.trim() : "";
};

export const AdminUserDetail = () => {
  const { role } = useAuth();
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [collab, setCollab] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
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
      setFirstName(adminPick(data, ["first_name", "firstName"], ""));
      setLastName(adminPick(data, ["last_name", "lastName"], ""));
      setAvatarFailed(false);
      setLoadState({ status: "success", error: null });
    } catch (err) {
      setLoadState({ status: "error", error: err });
    }
  }, [numericId]);

  useEffect(() => {
    if (role === "admin") load();
  }, [role, load]);

  useEffect(() => {
    applyPageMeta({ title: `Admin — Usuario #${id ?? ""}`, description: "Detalle de usuario.", noindex: true });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numericId) return;
    setSaveState({ status: "loading", error: null });
    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const updated = await patchAdminUser(numericId, {
        can_submit_collaborations: collab,
        collaborative_submissions_enabled: collab,
        first_name: trimmedFirst || undefined,
        last_name: trimmedLast || undefined,
      });
      const merged = row && typeof row === "object" ? { ...row, ...updated } : updated;
      setRow(merged);
      setCollab(readCollabFlag(merged));
      setFirstName(adminPick(merged, ["first_name", "firstName"], trimmedFirst));
      setLastName(adminPick(merged, ["last_name", "lastName"], trimmedLast));
      setSaveState({ status: "success", error: null });
    } catch (err) {
      setSaveState({ status: "error", error: err });
    }
  };

  const detailKeys = useMemo(() => sortedAdminUserKeys(row), [row]);

  if (role !== "admin") {
    return <EmptyState title="Sin acceso" description="Solo una cuenta con rol admin puede ver a los usuarios y colaboradores." />;
  }

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

  const email = adminPick(row, ["email"], "");
  const uid = adminPick(row, ["id", "_id"], "");
  const displayName = adminUserDisplayName(row) || "Sin nombre";
  const initials = adminUserDisplayInitials(row);
  const verified = readEmailVerified(row);
  const avatarUrl = pickAvatarUrl(row);
  const createdRaw = adminPick(row, ["created_at", "createdAt"], "");
  const createdLabel = createdRaw && createdRaw !== "—" ? formatSubmissionDate(createdRaw) : "";

  return (
    <main role="main" className="se-admin-user-detail">
      <Link to="/admin/users" className="se-link se-admin-user-detail__back">
        ← Usuarios
      </Link>

      <header className="se-admin-user-detail__hero" aria-labelledby="admin-user-heading">
        <div className="se-admin-user-detail__hero-main">
          <div className="se-admin-user-detail__identity">
            {avatarUrl && !avatarFailed ? (
              <div className="se-admin-user-detail__photo">
                <img src={avatarUrl} alt="" loading="lazy" decoding="async" onError={() => setAvatarFailed(true)} />
              </div>
            ) : (
              <div className="se-admin-user-detail__avatar" aria-hidden="true">
                {initials}
              </div>
            )}
            <div className="se-admin-user-detail__intro">
              <p className="se-admin-user-detail__kicker">Cuenta pública</p>
              <h1 id="admin-user-heading" className="se-admin-user-detail__title">
                {displayName}
              </h1>
              <div className="se-admin-user-detail__chips">
                {uid && uid !== "—" ? (
                  <span className="se-admin-user-detail__chip se-admin-user-detail__chip--id">
                    ID {uid}
                  </span>
                ) : null}
                {verified === true ? (
                  <span className="se-admin-user-detail__chip se-admin-user-detail__chip--ok">Correo verificado</span>
                ) : null}
                {verified === false ? (
                  <span className="se-admin-user-detail__chip se-admin-user-detail__chip--pending">Correo sin verificar</span>
                ) : null}
                <span
                  className={`se-admin-user-detail__chip${readCollabFlag(row) ? " se-admin-user-detail__chip--ok" : ""}`}
                >
                  Colaboraciones: {readCollabFlag(row) ? "Sí" : "No"}
                </span>
              </div>
              {email && email !== "—" ? (
                <p className="se-admin-user-detail__email">
                  <a href={`mailto:${email}`} className="se-link">
                    {email}
                  </a>
                </p>
              ) : (
                <p className="se-admin-user-detail__email se-admin-user-detail__email--muted">Sin correo en la respuesta.</p>
              )}
            </div>
          </div>
          {(createdLabel || adminPick(row, ["role", "roles"], "") !== "—") ? (
            <dl className="se-admin-user-detail__stats">
              {createdLabel ? (
                <div className="se-admin-user-detail__stat">
                  <dt>Alta</dt>
                  <dd>{createdLabel}</dd>
                </div>
              ) : null}
              {adminPick(row, ["role", "roles"], "") !== "—" ? (
                <div className="se-admin-user-detail__stat">
                  <dt>Rol</dt>
                  <dd>{adminPick(row, ["role", "roles"], "—")}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </header>

      <div className="se-admin-user-detail__grid">
        <div className="se-admin-user-detail__column se-admin-user-detail__column--wide">
          <section className="se-admin-user-detail__surface" aria-labelledby="admin-user-api-heading">
            <div className="se-admin-user-detail__section-head">
              <h2 id="admin-user-api-heading" className="se-admin-user-detail__panel-title">
                Respuesta del servidor
              </h2>
              <p className="se-admin-user-detail__panel-lead">
                Todos los datos disponibles de este usuario. Los campos con varias líneas se muestran
                expandidos para facilitar la lectura.
              </p>
            </div>
            <dl className="se-admin-user-detail__spec">
              {detailKeys.map((key) => {
                const raw = row[key];
                const pres = formatAdminUserFieldPresentation(key, raw, formatSubmissionDate);
                const label = labelForAdminUserField(key);
                return (
                  <div key={key} className="se-admin-user-detail__spec-row">
                    <dt>{label}</dt>
                    <dd>
                      {pres.kind === "json" ? (
                        <pre className="se-admin-user-detail__json" tabIndex={0}>
                          {pres.text}
                        </pre>
                      ) : (
                        pres.text
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </div>

        <aside className="se-admin-user-detail__column se-admin-user-detail__column--side" aria-label="Edición de usuario">
          <div className="se-admin-user-detail__surface se-admin-user-detail__surface--sticky">
            <h2 className="se-admin-user-detail__panel-title">Editar</h2>
            <p className="se-admin-user-detail__panel-lead">
              Los cambios se guardan automáticamente al enviar el formulario. El resto de campos son de solo lectura desde esta vista.
            </p>

            <form className="se-contact-form se-admin-user-detail__form" onSubmit={handleSubmit}>
              {saveState.status === "error" ? (
                <p className="se-admin-login__error" role="alert">
                  {saveState.error instanceof Error ? saveState.error.message : "Error al guardar."}
                </p>
              ) : null}
              {saveState.status === "success" ? (
                <p className="se-text-body" role="status">
                  Guardado correctamente.
                </p>
              ) : null}

              <div className="se-form-grid">
                <label className="se-form-field" htmlFor="user-first-name">
                  <span className="se-form-label">Nombre</span>
                  <input
                    id="user-first-name"
                    type="text"
                    className="se-form-control"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={120}
                    autoComplete="given-name"
                  />
                </label>
                <label className="se-form-field" htmlFor="user-last-name">
                  <span className="se-form-label">Apellido</span>
                  <input
                    id="user-last-name"
                    type="text"
                    className="se-form-control"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={120}
                    autoComplete="family-name"
                  />
                </label>
              </div>

              <label className="se-form-field se-admin-user-detail__toggle" htmlFor="user-collab">
                <input id="user-collab" type="checkbox" checked={collab} onChange={(e) => setCollab(e.target.checked)} />
                <span className="se-form-label">Puede enviar colaboraciones</span>
              </label>

              <div className="se-admin-form-actions">
                <button type="submit" className="se-btn" disabled={saveState.status === "loading"}>
                  {saveState.status === "loading" ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </main>
  );
};
