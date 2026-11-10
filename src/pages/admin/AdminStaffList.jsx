import { useCallback, useEffect, useState } from "react";
import {
  createAdminStaff,
  deleteAdminStaff,
  listAdminStaff,
  setAdminStaffActive,
  updateAdminStaffRole,
} from "../../services/adminStaffService";
import { EmptyState, ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useAuth } from "../../context/AuthContext";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";

const ROLE_OPTIONS = [
  { value: "escritor", label: "Escritor" },
  { value: "publicador", label: "Publicador" },
  { value: "admin", label: "Admin" },
];

/** Lo que puede hacer cada rol, dicho al confirmar un cambio. */
const QUE_PUEDE = {
  escritor: "Podrá escribir y guardar piezas, pero no publicarlas ni borrarlas.",
  publicador: "Podrá publicar y borrar piezas, y llevar la publicidad, el boletín y lo automático.",
  admin: "Podrá hacerlo todo, también crear y eliminar cuentas del panel.",
};

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

  // Un desplegable en la fila cambiaba permisos con un clic equivocado: ahora se
  // pregunta, diciendo qué podrá hacer la persona con el rol nuevo. Si se cancela, el
  // desplegable vuelve solo a su valor (lo manda `row.role`).
  const handleRoleChange = async (row, newRole) => {
    if (newRole === row.role) return;
    const nombre = (r) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r;
    await confirm({
      title: "Cambiar el rol",
      description: `«${row.name}» pasa de ${nombre(row.role)} a ${nombre(newRole)}. ${QUE_PUEDE[newRole] ?? ""}`,
      confirmLabel: `Cambiar a ${nombre(newRole)}`,
      warning: null,
      onConfirm: async () => {
        setRoleBusyId(row.id);
        setRoleActionError("");
        try {
          await updateAdminStaffRole(row.id, newRole);
          await load();
        } catch (err) {
          setRoleActionError(err instanceof Error ? err.message : "No se pudo cambiar el rol.");
        } finally {
          setRoleBusyId(null);
        }
      },
    });
  };

  // Para quien deja el equipo. Eliminar no se puede si firmó piezas; desactivar sí, y
  // corta el acceso en la petición siguiente sin tocar lo que firmó.
  const handleActive = async (row) => {
    const activar = row.is_active === false;
    await confirm({
      title: activar ? "Reactivar cuenta" : "Desactivar cuenta",
      description: activar
        ? `«${row.name}» podrá volver a entrar al panel con su contraseña.`
        : `«${row.name}» no podrá entrar al panel y su sesión abierta se cierra. Sus piezas siguen firmadas por esta cuenta. Se puede reactivar cuando quiera.`,
      confirmLabel: activar ? "Reactivar" : "Desactivar",
      onConfirm: async () => {
        setRoleActionError("");
        try {
          await setAdminStaffActive(row.id, activar);
          await load();
        } catch (err) {
          setRoleActionError(err instanceof Error ? err.message : "No se pudo cambiar la cuenta.");
        }
      },
    });
  };

  const handleDelete = async (id, name) => {
    await confirm({
      title: "Eliminar cuenta",
      description: `¿Eliminar la cuenta de «${name}» de forma permanente?`,
      confirmLabel: "Eliminar cuenta",
      onConfirm: async () => {
        setRoleActionError("");
        try {
          await deleteAdminStaff(id);
          await load();
        } catch (err) {
          // El servidor explica el caso típico: firma piezas, hay que desactivarla.
          setRoleActionError(err instanceof Error ? err.message : "No se pudo eliminar la cuenta.");
        }
      },
    });
  };

  return (
    <main role="main">
      <CabeceraDePagina
        titulo="Personal"
      />

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
                  <td>
                    {row.name}
                    {row.is_active === false ? (
                      <span className="se-admin-meta-hint" style={{ display: "block" }}>
                        Desactivada: no puede entrar
                      </span>
                    ) : null}
                  </td>
                  <td>{row.email}</td>
                  <td>
                    <select
                      className="se-form-control"
                      value={row.role}
                      disabled={roleBusyId === row.id}
                      onChange={(e) => handleRoleChange(row, e.target.value)}
                      aria-label={`Rol de ${row.name}`}
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
                      onClick={() => handleActive(row)}
                    >
                      {row.is_active === false ? "Reactivar" : "Desactivar"}
                    </button>
                    <button
                      type="button"
                      className="se-admin-table__eliminar"
                      onClick={() => handleDelete(row.id, row.name)}
                      aria-label={`Eliminar la cuenta de ${row.name}`}
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
