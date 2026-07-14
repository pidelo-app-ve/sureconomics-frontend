import { useCallback, useEffect, useState } from "react";
import {
  createAdminStaff,
  deleteAdminStaff,
  listAdminStaff,
  updateAdminStaffRole,
} from "../../services/adminStaffService";
import { EmptyState, ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useAuth } from "../../context/AuthContext";

const ROLE_OPTIONS = [
  { value: "escritor", label: "Escritor" },
  { value: "publicador", label: "Publicador" },
  { value: "admin", label: "Admin" },
];

const emptyForm = { name: "", email: "", password: "", role: "escritor" };

export const AdminStaffList = () => {
  const { role } = useAuth();
  const [state, setState] = useState({ status: "idle", items: [], error: null });
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [roleBusyId, setRoleBusyId] = useState(null);
  const [roleActionError, setRoleActionError] = useState("");
  const { confirm, ConfirmDialog } = useAdminConfirm();

  useEffect(() => {
    applyPageMeta({
      title: "Admin — Personal",
      description: "Cuentas de escritor, publicador y admin del backoffice.",
      noindex: true,
    });
  }, []);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const items = await listAdminStaff();
      setState({ status: "success", items: Array.isArray(items) ? items : [], error: null });
    } catch (err) {
      setState({ status: "error", items: [], error: err });
    }
  }, []);

  useEffect(() => {
    if (role === "admin") load();
  }, [role, load]);

  if (role !== "admin") {
    return (
      <EmptyState
        title="Sin acceso"
        description="Solo una cuenta con rol admin puede gestionar el personal del backoffice."
      />
    );
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsCreating(true);
    try {
      await createAdminStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    setRoleBusyId(id);
    setRoleActionError("");
    try {
      await updateAdminStaffRole(id, newRole);
      await load();
    } catch (err) {
      setRoleActionError(err instanceof Error ? err.message : "No se pudo cambiar el rol.");
    } finally {
      setRoleBusyId(null);
    }
  };

  const handleDelete = async (id, name) => {
    await confirm({
      title: "Eliminar cuenta",
      description: `¿Eliminar la cuenta de «${name}» de forma permanente?`,
      confirmLabel: "Eliminar cuenta",
      onConfirm: async () => {
        await deleteAdminStaff(id);
        await load();
      },
    });
  };

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          Personal
        </h1>
      </header>

      <form
        className="se-contact-form"
        onSubmit={handleCreate}
        style={{ marginBottom: "2rem", maxWidth: 480 }}
        noValidate
      >
        <h2 className="se-heading-section" style={{ fontSize: "1.15rem", margin: "0 0 0.5rem" }}>
          Crear cuenta
        </h2>
        {formError ? (
          <p className="se-admin-login__error" role="alert">
            {formError}
          </p>
        ) : null}
        <label className="se-form-field" htmlFor="staff-name">
          <span className="se-form-label">Nombre</span>
          <input
            id="staff-name"
            type="text"
            className="se-form-control"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            disabled={isCreating}
          />
        </label>
        <label className="se-form-field" htmlFor="staff-email">
          <span className="se-form-label">Correo electrónico</span>
          <input
            id="staff-email"
            type="email"
            autoComplete="off"
            className="se-form-control"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            disabled={isCreating}
          />
        </label>
        <label className="se-form-field" htmlFor="staff-password">
          <span className="se-form-label">Contraseña</span>
          <input
            id="staff-password"
            type="password"
            autoComplete="new-password"
            className="se-form-control"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
            disabled={isCreating}
          />
        </label>
        <label className="se-form-field" htmlFor="staff-role">
          <span className="se-form-label">Rol</span>
          <select
            id="staff-role"
            className="se-form-control"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            disabled={isCreating}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="se-btn" disabled={isCreating}>
          {isCreating ? "Creando…" : "Crear cuenta"}
        </button>
      </form>

      {roleActionError ? (
        <p className="se-admin-login__error" role="alert">
          {roleActionError}
        </p>
      ) : null}

      {state.status === "loading" ? <LoadingState title="Cargando personal…" /> : null}
      {state.status === "error" ? (
        <ErrorState title="No se pudo cargar el personal" error={state.error} onRetry={load} />
      ) : null}
      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState title="Sin cuentas" description="Todavía no hay escritores ni publicadores." />
      ) : null}

      {state.status === "success" && state.items.length > 0 ? (
        <div className="se-admin-table-wrap">
          <table className="se-admin-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Nombre</th>
                <th scope="col">Correo</th>
                <th scope="col">Rol</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>
                    <select
                      className="se-form-control"
                      value={row.role}
                      disabled={roleBusyId === row.id}
                      onChange={(e) => handleRoleChange(row.id, e.target.value)}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="se-admin-table__actions">
                    <button
                      type="button"
                      className="se-link se-header__nav-link--button"
                      onClick={() => handleDelete(row.id, row.name)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ConfirmDialog />
    </main>
  );
};
