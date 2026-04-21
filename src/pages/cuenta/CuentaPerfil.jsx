import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { applyPageMeta } from "../../lib/seo";

export const CuentaPerfil = () => {
  const { profile, isEmailVerified, profileStatus, loadProfile } = useUserAuth();

  useEffect(() => {
    applyPageMeta({
      title: "Mi perfil — Sur Economics",
      description: "Datos de su cuenta de lector.",
      noindex: true,
    });
  }, []);

  useEffect(() => {
    loadProfile().catch(() => {});
  }, [loadProfile]);

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">Mi perfil</h1>
          <p className="se-reader-page-lead">
            Debe verificar su correo para acceder al perfil y a las funciones de lector.{" "}
            <Link to="/cuenta/verificar-email" className="se-link" state={{ email: profile?.email }}>
              Verificar correo
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const fields = profile
    ? [
        {
          key: "name",
          label: "Nombre",
          value:
            [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
            "—",
        },
        { key: "email", label: "Correo", value: profile.email || "—" },
        { key: "age", label: "Edad", value: profile.age || "—" },
        { key: "sex", label: "Sexo", value: profile.sex || "—" },
        { key: "country", label: "País", value: profile.country || "—" },
        { key: "city", label: "Ciudad", value: profile.city || "—" },
        { key: "occupation", label: "Ocupación", value: profile.occupation || "—" },
        { key: "phone", label: "Teléfono", value: profile.phoneNumber || "—" },
      ]
    : [];

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-page-head">
        <h1 className="se-reader-page-title">Mi perfil</h1>
        <p className="se-reader-page-lead">Información asociada a su cuenta de lector.</p>
      </header>

      {profileStatus === "loading" && !profile ? (
        <p className="se-reader-muted" aria-live="polite">
          Cargando…
        </p>
      ) : null}

      {profile ? (
        <div className="se-reader-profile-grid">
          {fields.map((f) => (
            <div key={f.key} className="se-reader-profile-tile">
              <span className="se-reader-profile-tile__label">{f.label}</span>
              <span className="se-reader-profile-tile__value">{f.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="se-reader-page-lead">No hay datos de perfil disponibles.</p>
      )}
    </div>
  );
};
