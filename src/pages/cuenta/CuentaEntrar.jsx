import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { useAuth } from "../../context/AuthContext";
import { applyPageMeta } from "../../lib/seo";
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

const validarCorreo = (valor) => {
  if (!valor.trim()) return "Escriba su correo.";
  if (!pareceCorreo(valor)) return "Ese correo no parece completo. Revise que lleve @ y dominio.";
  return "";
};

const validarClave = (valor) => (valor ? "" : "Escriba su contraseña.");

/**
 * Lo que dice el servidor, dicho en castellano y para el lector.
 *
 * La API contesta en ingles y para programadores -- "Invalid email or password.",
 * "Validation failed." -- y antes eso salia tal cual en la pantalla. Se traduce por
 * `code`, que es estable; el texto del servidor no se muestra nunca, porque es justo
 * lo que cambia sin avisar. Lo que llega con `details` por campo se devuelve aparte
 * para pintarlo debajo de su propio recuadro.
 */
const traducirError = (err) => {
  const code = err?.code;
  const status = err?.status;
  if (code === "validation_error" || status === 422 || status === 400) {
    const detalles = err?.details && typeof err.details === "object" ? err.details : {};
    const campos = {
      email: detalles.email ? "Ese correo no parece válido." : "",
      password: detalles.password ? "Escriba su contraseña." : "",
    };
    return {
      general: campos.email || campos.password ? "" : "Revise los datos e inténtelo de nuevo.",
      campos,
    };
  }
  if (code === "invalid_credentials" || status === 401) {
    return { general: "El correo o la contraseña no son correctos." };
  }
  if (code === "login_throttled" || status === 429) {
    return { general: "Demasiados intentos seguidos. Espere unos minutos y vuelva a probar." };
  }
  if (code === "account_disabled" || status === 403) {
    return { general: "Esta cuenta está desactivada. Escríbanos si cree que es un error." };
  }
  // `fetch` rechaza con un TypeError cuando no hay red: no hay respuesta que traducir.
  if (err instanceof TypeError || status === 0) {
    return { general: "No se pudo conectar. Revise su conexión e inténtelo de nuevo." };
  }
  return { general: "No se pudo iniciar sesión. Inténtelo de nuevo en un momento." };
};

const ID_CORREO = "cuenta-email";
const ID_CLAVE = "cuenta-password";
const ID_ERROR = "cuenta-entrar-error";

export const CuentaEntrar = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    applyPageMeta({
      title: "Entrar — SurEconomics",
      description: "Acceso para lectores y equipo editorial.",
      noindex: true,
    });
  }, []);

  if (isAdminAuthenticated) {
    return <Navigate to="/admin/posts" replace />;
  }

  if (isAuthenticated && perfilListo && !isEmailVerified) {
    return <Navigate to="/cuenta/verificar-email" replace state={{ email: profile?.email, volver: leerVolver(location) }} />;
  }

  if (isAuthenticated && isEmailVerified) {
    const to = leerVolver(location) ?? "/";
    return <Navigate to={to} replace />;
  }

  // Al corregir un campo marcado, su aviso se revisa con cada tecla: se va en cuanto
  // deja de ser cierto. Un campo sin aviso no se riñe mientras se escribe.
  const cambiarCorreo = (valor) => {
    setEmail(valor);
    setErrores((prev) => (prev.email ? { ...prev, email: validarCorreo(valor) } : prev));
  };
  const cambiarClave = (valor) => {
    setPassword(valor);
    setErrores((prev) => (prev.password ? { ...prev, password: validarClave(valor) } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // El boton no se deshabilita mientras se envia (ver abajo), asi que el doble
    // envio se para aqui.
    if (isSubmitting) return;
    setErrorMessage("");

    // Antes de molestar al servidor: un correo vacio o sin @ no puede entrar, y el
    // aviso tiene que salir debajo de su campo, no en una frase general.
    const locales = { email: validarCorreo(email), password: validarClave(password) };
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
        navigate("/admin/posts", { replace: true });
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
      const { general, campos } = traducirError(err);
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
        <p className="se-entrada__kicker">Entrar</p>
        <h1 className="se-entrada__titulo">Su cuenta de SurEconomics</h1>
        <p className="se-entrada__lead">
          Sus artículos guardados, sus envíos y los módulos que haya comprado.
        </p>

        <form className="se-entrada__form" onSubmit={handleSubmit} noValidate>
          <CampoDeTexto
            id={ID_CORREO}
            etiqueta="Correo electrónico"
            tipo="email"
            valor={email}
            onCambio={cambiarCorreo}
            error={errores.email}
            autoComplete="email"
          />
          <CampoDeTexto
            id={ID_CLAVE}
            etiqueta="Contraseña"
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
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <BotonDeGoogle
          texto="signin_with"
          onEntrado={() => {
            navigate(leerVolver(location) ?? "/", { replace: true });
          }}
        />

        <p className="se-entrada__pie">
          ¿No tiene cuenta? <Link to={conVolver("/cuenta/registro", leerVolver(location))}>Crear una</Link>
        </p>
      </div>
    </main>
  );
};

export default CuentaEntrar;
