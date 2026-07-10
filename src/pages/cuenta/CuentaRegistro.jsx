import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { PhonePrefixSelect } from "../../components/PhonePrefixSelect";
import {
  DEFAULT_PHONE_PREFIX_ISO2,
  PHONE_COUNTRY_PREFIXES,
  getPhonePrefixByIso2,
} from "../../data/phoneCountryPrefixes";
import { applyPageMeta } from "../../lib/seo";

const SEX_OPTIONS = [
  { value: "female", label: "Femenino" },
  { value: "male", label: "Masculino" },
  { value: "other", label: "Otro" },
];

export const CuentaRegistro = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isEmailVerified, register, profile } = useUserAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("female");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phoneIso, setPhoneIso] = useState(DEFAULT_PHONE_PREFIX_ISO2);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    applyPageMeta({
      title: "Registro — SurEconomics",
      description: "Cree una cuenta de lector.",
      noindex: true,
    });
  }, []);

  const selectedPhonePrefix = useMemo(() => {
    return (
      getPhonePrefixByIso2(phoneIso) ??
      getPhonePrefixByIso2(DEFAULT_PHONE_PREFIX_ISO2) ??
      PHONE_COUNTRY_PREFIXES[0]
    );
  }, [phoneIso]);

  if (isAuthenticated && !isEmailVerified) {
    return (
      <Navigate to="/cuenta/verificar-email" replace state={{ email: profile?.email }} />
    );
  }

  if (isAuthenticated && isEmailVerified) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedCountry = country.trim();
    const trimmedCity = city.trim();
    const trimmedOccupation = occupation.trim();
    const nationalDigits = phoneLocal.replace(/\D/g, "");
    const fullPhone = `${selectedPhonePrefix.dial}${nationalDigits}`;
    const ageNum = Number.parseInt(String(age).trim(), 10);

    if (password.length < 8 || password.length > 4096) {
      setErrorMessage("La contraseña debe tener entre 8 y 4096 caracteres.");
      return;
    }
    if (!trimmedFirstName || !trimmedLastName) {
      setErrorMessage("Nombre y apellido son obligatorios.");
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 150) {
      setErrorMessage("Indique una edad válida (0 a 150).");
      return;
    }
    if (!sex.trim()) {
      setErrorMessage("Seleccione una opción en el campo sexo.");
      return;
    }
    if (!trimmedCountry || !trimmedCity || !trimmedOccupation) {
      setErrorMessage("País, ciudad, ocupación y teléfono son obligatorios.");
      return;
    }
    if (nationalDigits.length < 6) {
      setErrorMessage("Introduzca al menos 6 dígitos en el número local (sin el prefijo).");
      return;
    }
    if (fullPhone.length > 40) {
      setErrorMessage("El teléfono completo supera la longitud permitida. Acorte el número.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { profile: registrationProfile } = await register({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password,
        age: ageNum,
        sex: sex.trim(),
        country: trimmedCountry,
        city: trimmedCity,
        occupation: trimmedOccupation,
        phoneNumber: fullPhone,
      });
      if (registrationProfile?.isEmailVerified) {
        navigate("/", { replace: true });
        return;
      }
      navigate("/cuenta/verificar-email", {
        replace: true,
        state: { email: trimmedEmail },
      });
    } catch (err) {
      const status = err?.status;
      if (status === 409) {
        setErrorMessage("Ese correo ya está registrado.");
      } else if (status === 422) {
        setErrorMessage(
          err instanceof Error ? err.message : "Revise los datos del formulario."
        );
      } else if (status === 429) {
        setErrorMessage("Demasiadas solicitudes. Espere unos minutos e inténtelo de nuevo.");
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "No se pudo completar el registro."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorId = "cuenta-registro-error";

  return (
    <main className="se-blog se-reader-auth" role="main">
      <div className="se-reader-auth__shell">
        <div className="se-container se-container--narrow">
          <header className="se-reader-auth__header">
            <h1 className="se-heading-section">Registro</h1>
            <p className="se-text-small se-reader-auth__subtitle">
              Cree una cuenta para comentar y guardar artículos. Tras registrarse le enviaremos un
              código por correo para verificar su dirección.
            </p>
          </header>

          <form className="se-contact-form" onSubmit={handleSubmit} noValidate>
            {errorMessage ? (
              <p className="se-reader-auth__error" role="alert" id={errorId}>
                {errorMessage}
              </p>
            ) : null}

            <div className="se-form-grid">
              <label className="se-form-field" htmlFor="registro-first-name">
                <span className="se-form-label">Nombre</span>
                <input
                  id="registro-first-name"
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  className="se-form-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={120}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? errorId : undefined}
                />
              </label>

              <label className="se-form-field" htmlFor="registro-last-name">
                <span className="se-form-label">Apellido</span>
                <input
                  id="registro-last-name"
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  className="se-form-control"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={120}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? errorId : undefined}
                />
              </label>
            </div>

            <label className="se-form-field" htmlFor="registro-email">
              <span className="se-form-label">Correo electrónico</span>
              <input
                id="registro-email"
                type="email"
                name="email"
                autoComplete="email"
                className="se-form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
              />
            </label>

            <label className="se-form-field" htmlFor="registro-password">
              <span className="se-form-label">Contraseña (8 a 4096 caracteres)</span>
              <input
                id="registro-password"
                type="password"
                name="password"
                autoComplete="new-password"
                className="se-form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={4096}
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
              />
            </label>

            <label className="se-form-field" htmlFor="registro-age">
              <span className="se-form-label">Edad</span>
              <input
                id="registro-age"
                type="number"
                name="age"
                className="se-form-control"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min={0}
                max={150}
                step={1}
                inputMode="numeric"
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
              />
            </label>

            <label className="se-form-field" htmlFor="registro-sex">
              <span className="se-form-label">Sexo</span>
              <select
                id="registro-sex"
                name="sex"
                className="se-form-control"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
              >
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="se-form-field" htmlFor="registro-country">
              <span className="se-form-label">País</span>
              <input
                id="registro-country"
                type="text"
                name="country"
                autoComplete="country-name"
                className="se-form-control"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                maxLength={120}
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
              />
            </label>

            <label className="se-form-field" htmlFor="registro-city">
              <span className="se-form-label">Ciudad</span>
              <input
                id="registro-city"
                type="text"
                name="city"
                autoComplete="address-level2"
                className="se-form-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                maxLength={120}
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
              />
            </label>

            <label className="se-form-field" htmlFor="registro-occupation">
              <span className="se-form-label">Ocupación</span>
              <input
                id="registro-occupation"
                type="text"
                name="occupation"
                autoComplete="organization-title"
                className="se-form-control"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                required
                maxLength={200}
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
              />
            </label>

            <div className="se-form-field se-phone-field">
              <span className="se-form-label" id="registro-phone-label">
                Teléfono
              </span>
              <div className="se-phone-field__row">
                <PhonePrefixSelect
                  id="registro-phone-prefix"
                  value={phoneIso}
                  onChange={setPhoneIso}
                  disabled={isSubmitting}
                  aria-labelledby="registro-phone-label"
                />
                <input
                  id="registro-phone"
                  type="tel"
                  name="phoneLocal"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="se-form-control se-phone-field__number"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value)}
                  required
                  maxLength={24}
                  disabled={isSubmitting}
                  aria-labelledby="registro-phone-label"
                  aria-describedby={errorMessage ? errorId : undefined}
                  aria-invalid={Boolean(errorMessage)}
                />
              </div>
            </div>

            <button type="submit" className="se-btn" disabled={isSubmitting}>
              {isSubmitting ? "Creando cuenta…" : "Registrarse"}
            </button>
          </form>

          <p className="se-text-body se-reader-auth__footer">
            ¿Ya tiene cuenta?{" "}
            <Link to="/cuenta/entrar" className="se-link">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
