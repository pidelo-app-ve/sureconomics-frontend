import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Enlace, Redirigir, useNavegar } from "../../components/Enlace";
import { useUserAuth } from "../../context/UserAuthContext";
import { useAuth } from "../../context/AuthContext";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import { conVolver, leerVolver } from "../../lib/volver";
import { CampoDeTexto } from "../../components/cuenta/CampoDeTexto";
import { BotonDeGoogle } from "../../components/cuenta/BotonDeGoogle";
import { loginUnified } from "../../lib/unifiedAuth";
import { persistAuth } from "../../lib/authStorage";
import { dispatchAdminAuthSync } from "../../lib/api";
import { persistUserAuth } from "../../lib/userAuthStorage";
import { dispatchUserAuthSync } from "../../lib/userApi";

/** Un correo con forma de correo, con el mismo criterio que el registro. */
const pareceCorreo = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());

const validarCorreo = (valor, t) => {
  if (!valor.trim()) return t("cuenta.comun.escribaCorreo");
  if (!pareceCorreo(valor)) return t("cuenta.comun.correoIncompleto");
  return "";
};

const validarClave = (valor, t) => (valor ? "" : t("cuenta.entrar.escribaContrasena"));

/**
 * Lo que dice el servidor, dicho en castellano y para el lector.
 *
 * La API contesta en ingles y para programadores -- "Invalid email or password.",
 * "Validation failed." -- y antes eso salia tal cual en la pantalla. Se traduce por
 * `code`, que es estable; el texto del servidor no se muestra nunca, porque es justo
 * lo que cambia sin avisar. Lo que llega con `details` por campo se devuelve aparte
 * para pintarlo debajo de su propio recuadro.
 */
const traducirError = (err, t) => {
  const code = err?.code;
  const status = err?.status;
  if (code === "validation_error" || status === 422 || status === 400) {
    const detalles = err?.details && typeof err.details === "object" ? err.details : {};
    const campos = {
      email: detalles.email ? t("cuenta.entrar.correoNoValido") : "",
      password: detalles.password ? t("cuenta.entrar.escribaContrasena") : "",
    };
    return {
      general: campos.email || campos.password ? "" : t("cuenta.entrar.reviseDatos"),
      campos,
    };
  }
  if (code === "invalid_credentials" || status === 401) {
    return { general: t("cuenta.entrar.credenciales") };
  }
  if (code === "login_throttled" || status === 429) {
    return { general: t("cuenta.entrar.demasiadosIntentos") };
  }
  if (code === "account_disabled" || status === 403) {
    return { general: t("cuenta.entrar.cuentaDesactivada") };
  }
  // `fetch` rechaza con un TypeError cuando no hay red: no hay respuesta que traducir.
  if (err instanceof TypeError || status === 0) {
    return { general: t("cuenta.entrar.sinConexion") };
  }
  return { general: t("cuenta.entrar.fallo") };
};

const ID_CORREO = "cuenta-email";
const ID_CLAVE = "cuenta-password";
const ID_ERROR = "cuenta-entrar-error";

export const CuentaEntrar = () => {
  const { t } = useIdioma();
  const navigate = useNavegar();
  // El panel de administración no existe bajo `/en`: a él se va sin prefijo de idioma.
  const irAlPanel = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isEmailVerified, loadProfile, profile, profileStatus } = useUserAuth();
  // Con sesión, hasta que llega el perfil no se sabe si el correo está confirmado. Sin
  // esperarlo, un lector ya confirmado que abría esta página acababa en «verificar correo».
  const perfilListo = !["idle", "loading"].includes(profileStatus);
  const { isAuthenticated: isAdminAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errores, setErrores] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A donde va el foco tras un intento fallido. Un objeto nuevo en cada intento, para
  // que dos fallos seguidos en el mismo campo vuelvan a llevar el foco alli.
  const [enfocar, setEnfocar] = useState(null);

  useEffect(() => {
    if (!enfocar) return;
    document.getElementById(enfocar.id)?.focus();
  }, [enfocar]);

  useMetaPagina({
    title: t("cuenta.entrar.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.entrar.meta.descripcion"),
    noindex: true,
  });

  if (isAdminAuthenticated) {
    return <Navigate to="/admin/posts" replace />;
  }

  if (isAuthenticated && perfilListo && !isEmailVerified) {
    return <Redirigir to="/cuenta/verificar-email" replace state={{ email: profile?.email, volver: leerVolver(location) }} />;
  }

  if (isAuthenticated && isEmailVerified) {
    const to = leerVolver(location) ?? "/";
    return <Redirigir to={to} replace />;
  }

  // Al corregir un campo marcado, su aviso se revisa con cada tecla: se va en cuanto
  // deja de ser cierto. Un campo sin aviso no se riñe mientras se escribe.
  const cambiarCorreo = (valor) => {
    setEmail(valor);
    setErrores((prev) => (prev.email ? { ...prev, email: validarCorreo(valor, t) } : prev));
  };
  const cambiarClave = (valor) => {
    setPassword(valor);
    setErrores((prev) => (prev.password ? { ...prev, password: validarClave(valor, t) } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // El boton no se deshabilita mientras se envia (ver abajo), asi que el doble
    // envio se para aqui.
    if (isSubmitting) return;
    setErrorMessage("");

    // Antes de molestar al servidor: un correo vacio o sin @ no puede entrar, y el
    // aviso tiene que salir debajo de su campo, no en una frase general.
    const locales = { email: validarCorreo(email, t), password: validarClave(password, t) };
    setErrores(locales);
    if (locales.email || locales.password) {
      setEnfocar({ id: locales.email ? ID_CORREO : ID_CLAVE });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginUnified(email, password);

      if (result.actor === "admin") {
        persistAuth({ ...result.tokens, role: result.role });
        dispatchAdminAuthSync();
        irAlPanel("/admin/posts", { replace: true });
        return;
      }

      persistUserAuth(result.tokens);
      dispatchUserAuthSync();
      let freshProfile = null;
      try {
        freshProfile = await loadProfile();
      } catch {
        /* handled by the isEmailVerified redirect above on next render */
      }
      if (freshProfile?.isEmailVerified) {
        const to = leerVolver(location) ?? "/";
        navigate(to, { replace: true });
      } else {
        navigate("/cuenta/verificar-email", { replace: true, state: { email, volver: leerVolver(location) } });
      }
    } catch (err) {
      const { general, campos } = traducirError(err, t);
      if (campos) setErrores(campos);
      setErrorMessage(general);
      // El foco va a lo que hay que arreglar: el campo que el servidor rechazo, o el
      // aviso general, que se lee entero al recibirlo.
      if (campos?.email) setEnfocar({ id: ID_CORREO });
      else if (campos?.password) setEnfocar({ id: ID_CLAVE });
      else setEnfocar({ id: ID_ERROR });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="se-blog se-entrada" role="main">
      <div className="se-entrada__caja">
        <p className="se-entrada__kicker">{t("cuenta.entrar.kicker")}</p>
        <h1 className="se-entrada__titulo">{t("cuenta.entrar.titulo")}</h1>
        <p className="se-entrada__lead">
          {t("cuenta.entrar.lead")}
        </p>

        <form className="se-entrada__form" onSubmit={handleSubmit} noValidate>
          <CampoDeTexto
            id={ID_CORREO}
            etiqueta={t("cuenta.comun.correo")}
            tipo="email"
            valor={email}
            onCambio={cambiarCorreo}
            error={errores.email}
            autoComplete="email"
          />
          <CampoDeTexto
            id={ID_CLAVE}
            etiqueta={t("cuenta.comun.contrasena")}
            tipo="password"
            valor={password}
            onCambio={cambiarClave}
            error={errores.password}
            autoComplete="current-password"
          />

          {/* Sin `role="alert"`: el foco llega aqui en cuanto aparece, y eso ya hace
              que se lea. Con los dos, el lector lo diria dos veces. */}
          {errorMessage ? (
            <p className="se-entrada__error" id={ID_ERROR} tabIndex={-1}>
              {errorMessage}
            </p>
          ) : null}

          {/* `aria-disabled` y no `disabled` mientras se envia: un boton deshabilitado
              suelta el foco, que caia al `body`, y quien usa teclado tenia que volver a
              buscar el formulario desde arriba. Asi el foco se queda en el boton hasta
              que hay algo que decir. */}
          <button
            type="submit"
            className="se-btn se-entrada__enviar"
            aria-disabled={isSubmitting ? "true" : undefined}
          >
            {isSubmitting ? t("cuenta.entrar.entrando") : t("cuenta.entrar.entrar")}
          </button>
        </form>

        <BotonDeGoogle
          texto="signin_with"
          onEntrado={() => {
            navigate(leerVolver(location) ?? "/", { replace: true });
          }}
        />

        <p className="se-entrada__pie">
          {t("cuenta.entrar.sinCuenta", {
            enlace: (
              <Enlace to={conVolver("/cuenta/registro", leerVolver(location))}>{t("cuenta.entrar.crearUna")}</Enlace>
            ),
          })}
        </p>
      </div>
    </main>
  );
};

export default CuentaEntrar;
