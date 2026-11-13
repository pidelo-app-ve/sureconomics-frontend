import { useCallback, useEffect, useState } from "react";
import { changeAdminMyPassword, getAdminMe, updateAdminMe } from "../../services/adminMeService";
import { ErrorState, LoadingState } from "../../components/content";
import { dispatchAdminAuthSync } from "../../lib/api";
import { persistAuth } from "../../lib/authStorage";
import { applyPageMeta } from "../../lib/seo";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { recorridoMiPerfil } from "../../lib/guias/guiaMiPerfil";

/** `584121234567` → `+584121234567`, como se escribe un teléfono. */
const conMas = (telefono) => (telefono ? `+${telefono}` : "");

const { ancla } = recorridoMiPerfil;

const ROLE_LABELS = {
  escritor: "Escritor",
  publicador: "Editor",
  admin: "Admin",
};

export const AdminMiPerfil = () => {
  const [state, setState] = useState({ status: "idle", data: null, error: null });
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileState, setProfileState] = useState({ status: "idle", error: null, message: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [passwordState, setPasswordState] = useState({ status: "idle", error: null, message: "" });

  useEffect(() => {
    applyPageMeta({ title: "Admin — Mi perfil", description: "Datos de tu cuenta de backoffice.", noindex: true });
  }, []);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const data = await getAdminMe();
      setState({ status: "success", data, error: null });
      setProfileForm({ name: data?.name ?? "", email: data?.email ?? "", telefono: conMas(data?.telefono) });
    } catch (err) {
      setState({ status: "error", data: null, error: err });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileState({ status: "loading", error: null, message: "" });
    try {
      const data = await updateAdminMe({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        telefono: (profileForm.telefono ?? "").trim(),
      });
      setState((s) => ({ ...s, data }));
      setProfileForm((f) => ({ ...f, telefono: conMas(data?.telefono) }));
      setProfileState({ status: "success", error: null, message: "Datos actualizados correctamente." });
    } catch (err) {
      setProfileState({ status: "error", error: err, message: "" });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordState({ status: "idle", error: null, message: "" });
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordState({ status: "error", error: new Error("Las contraseñas nuevas no coinciden."), message: "" });
      return;
    }
    setPasswordState({ status: "loading", error: null, message: "" });
    try {
      const respuesta = await changeAdminMyPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      // Cambiar la contraseña cierra todas las sesiones, también esta: el servidor
      // devuelve un par de tokens nuevo y se guarda, o la siguiente petición daría 401.
      const tokens = respuesta?.data ?? respuesta;
      if (tokens?.access_token && tokens?.refresh_token) {
        persistAuth({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
        });
        dispatchAdminAuthSync();
      }
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordState({ status: "success", error: null, message: "Contraseña actualizada correctamente." });
    } catch (err) {
      setPasswordState({ status: "error", error: err, message: "" });
    }
  };

  if (state.status === "loading" || state.status === "idle") {
    return <LoadingState title="Cargando tu perfil…" />;
  }

  if (state.status === "error") {
    return <ErrorState title="No se pudo cargar tu perfil" error={state.error} onRetry={load} />;
  }

  return (
    <main role="main">
      <CabeceraDePagina
        titulo="Mi perfil"
        dato={
          <>
            Rol: {ROLE_LABELS[state.data?.role] ?? state.data?.role ?? "—"}
          </>
        }
        guia={recorridoMiPerfil}
      />

      <form
        className="se-contact-form"
        onSubmit={handleProfileSubmit}
        style={{ marginBottom: "2.5rem", maxWidth: 480 }}
        noValidate
        {...ancla("datos")}
      >
        <h2 className="se-heading-section" style={{ fontSize: "1.15rem", margin: "0 0 0.5rem" }}>
          Datos de la cuenta
        </h2>
        {profileState.status === "error" ? (
          <p className="se-admin-login__error" role="alert">
            {profileState.error instanceof Error ? profileState.error.message : "No se pudo actualizar."}
          </p>
        ) : null}
        {profileState.status === "success" ? (
          <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
            {profileState.message}
          </p>
        ) : null}

        <label className="se-form-field" htmlFor="me-name">
          <span className="se-form-label">Nombre</span>
          <input
            id="me-name"
            type="text"
            className="se-form-control"
            value={profileForm.name}
            onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
            required
            disabled={profileState.status === "loading"}
          />
        </label>
        <label className="se-form-field" htmlFor="me-email">
          <span className="se-form-label">Correo electrónico</span>
          <input
            id="me-email"
            type="email"
            autoComplete="email"
            className="se-form-control"
            value={profileForm.email}
            onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
            required
            disabled={profileState.status === "loading"}
          />
        </label>
        <label className="se-form-field" htmlFor="me-telefono">
          <span className="se-form-label">Celular</span>
          <input
            id="me-telefono"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className="se-form-control"
            placeholder="+58 412 1234567"
            value={profileForm.telefono ?? ""}
            onChange={(e) => setProfileForm((f) => ({ ...f, telefono: e.target.value }))}
            disabled={profileState.status === "loading"}
          />
          <span className="se-admin-meta-hint">
            El mismo con el que usa Telegram: así lo reconoce el bot de la redacción.
          </span>
        </label>
        <button type="submit" className="se-btn" disabled={profileState.status === "loading"}>
          {profileState.status === "loading" ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <form
        className="se-contact-form"
        onSubmit={handlePasswordSubmit}
        style={{ maxWidth: 480 }}
        noValidate
        {...ancla("contrasena")}
      >
        <h2 className="se-heading-section" style={{ fontSize: "1.15rem", margin: "0 0 0.5rem" }}>
          Cambiar contraseña
        </h2>
        {passwordState.status === "error" ? (
          <p className="se-admin-login__error" role="alert">
            {passwordState.error instanceof Error ? passwordState.error.message : "No se pudo cambiar la contraseña."}
          </p>
        ) : null}
        {passwordState.status === "success" ? (
          <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
            {passwordState.message}
          </p>
        ) : null}

        <label className="se-form-field" htmlFor="me-current-password">
          <span className="se-form-label">Contraseña actual</span>
          <input
            id="me-current-password"
            type="password"
            autoComplete="current-password"
            className="se-form-control"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
            required
            disabled={passwordState.status === "loading"}
          />
        </label>
        <label className="se-form-field" htmlFor="me-new-password">
          <span className="se-form-label">Contraseña nueva</span>
          <input
            id="me-new-password"
            type="password"
            autoComplete="new-password"
            className="se-form-control"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
            required
            minLength={8}
            disabled={passwordState.status === "loading"}
          />
        </label>
        <label className="se-form-field" htmlFor="me-confirm-password">
          <span className="se-form-label">Confirmar contraseña nueva</span>
          <input
            id="me-confirm-password"
            type="password"
            autoComplete="new-password"
            className="se-form-control"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))}
            required
            minLength={8}
            disabled={passwordState.status === "loading"}
          />
        </label>
        <button type="submit" className="se-btn" disabled={passwordState.status === "loading"}>
          {passwordState.status === "loading" ? "Cambiando…" : "Cambiar contraseña"}
        </button>
      </form>

      <RecorridoVista recorrido={recorridoMiPerfil} />
    </main>
  );
};
