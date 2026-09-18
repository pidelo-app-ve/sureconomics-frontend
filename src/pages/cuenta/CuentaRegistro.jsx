import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { CampoDeTexto } from "../../components/cuenta/CampoDeTexto";
import { FuerzaDeClave } from "../../components/cuenta/FuerzaDeClave";
import { BotonDeGoogle } from "../../components/cuenta/BotonDeGoogle";
import { applyPageMeta } from "../../lib/seo";

/**
 * Crear una cuenta. Cuatro campos.
 *
 * ## Por qué era largo, y de quién era la culpa
 *
 * Pedía diez datos: nombre, apellido, correo, contraseña, edad, sexo, país, ciudad,
 * ocupación y teléfono. Para guardar un artículo. Y no era un capricho de esta
 * pantalla — el esquema del servidor los exigía **todos**, así que el formulario no se
 * podía acortar sin tocar la API. Ya son opcionales allí, y aquí se piden en el perfil,
 * cuando la persona ya tiene un motivo para darlos: firmar lo que envía.
 *
 * El dato no se pierde por moverlo. Se pierde por pedirlo antes de haber dado nada a
 * cambio, que es cuando la gente cierra la pestaña.
 *
 * ## Lo que se corrigió del formulario en sí
 *
 * **«Sexo» venía con «Femenino» preseleccionado.** Eso no es un valor por defecto: es
 * una suposición guardada como si fuera un dato declarado.
 *
 * **La etiqueta decía «Contraseña (8 a 4096 caracteres)».** 4096 es el tope que impone
 * la librería de cifrado; no significa nada para quien está creando una cuenta.
 *
 * **Los errores sólo aparecían al enviar**, todos a la vez y en una sola frase arriba.
 * Ahora cada campo avisa cuando se sale de él, que es cuando se puede corregir sin
 * perder el hilo.
 */

/** Un correo con forma de correo. No valida que exista — eso lo hace el código. */
const pareceCorreo = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());

export const CuentaRegistro = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isEmailVerified, register, profile } = useUserAuth();

  const [campos, setCampos] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  // Qué campos ha tocado ya. Un error que aparece antes de escribir nada regaña por
  // algo que nadie ha hecho todavía.
  const [tocados, setTocados] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    applyPageMeta({
      title: "Crear una cuenta — SurEconomics",
      description: "Cree una cuenta de lector.",
      noindex: true,
    });
  }, []);

  const errores = {
    firstName: campos.firstName.trim() ? "" : "Escriba su nombre.",
    lastName: campos.lastName.trim() ? "" : "Escriba su apellido.",
    email: !campos.email.trim()
      ? "Escriba su correo."
      : pareceCorreo(campos.email)
        ? ""
        : "Ese correo no parece completo. Revise que lleve @ y dominio.",
    password: campos.password.length >= 8 ? "" : "Al menos ocho caracteres.",
  };
  const valido = Object.values(errores).every((e) => !e);

  if (isAuthenticated && !isEmailVerified) {
    return <Navigate to="/cuenta/verificar-email" replace state={{ email: profile?.email }} />;
  }
  if (isAuthenticated && isEmailVerified) return <Navigate to="/cuenta" replace />;

  const cambiar = (campo) => (valor) => setCampos((c) => ({ ...c, [campo]: valor }));
  const marcar = (campo) => () => setTocados((t) => ({ ...t, [campo]: true }));

  const enviar = async (e) => {
    e.preventDefault();
    setErrorGeneral("");
    // Al enviar se marcan todos: si algo falta, hay que verlo señalado y no en un
    // aviso general que no dice dónde.
    setTocados({ firstName: true, lastName: true, email: true, password: true });
    if (!valido) return;

    setEnviando(true);
    try {
      const { profile: nuevo } = await register({
        firstName: campos.firstName.trim(),
        lastName: campos.lastName.trim(),
        email: campos.email.trim(),
        password: campos.password,
      });
      if (nuevo?.isEmailVerified) {
        navigate("/cuenta", { replace: true });
        return;
      }
      navigate("/cuenta/verificar-email", {
        replace: true,
        state: { email: campos.email.trim() },
      });
    } catch (err) {
      const estado = err?.status;
      if (estado === 409) {
        setErrorGeneral(
          "Ese correo ya tiene cuenta. Si es la suya, entre en vez de registrarse.",
        );
      } else if (estado === 429) {
        setErrorGeneral("Demasiados intentos. Espere unos minutos.");
      } else if (estado === 422) {
        setErrorGeneral(err?.message || "Revise los datos.");
      } else {
        setErrorGeneral("No se pudo crear la cuenta. Inténtelo de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="se-blog se-entrada" role="main">
      <div className="se-entrada__caja">
        <p className="se-entrada__kicker">Crear una cuenta</p>
        <h1 className="se-entrada__titulo">Su espacio en SurEconomics</h1>
        <p className="se-entrada__lead">
          Guarde artículos para después, proponga piezas a la redacción y acceda a los
          módulos de Educación que compre. Le enviaremos un código para confirmar el
          correo.
        </p>

        <form className="se-entrada__form" onSubmit={enviar} noValidate>
          <div className="se-entrada__fila">
            <CampoDeTexto
              id="reg-nombre"
              etiqueta="Nombre"
              valor={campos.firstName}
              onCambio={cambiar("firstName")}
              onSalir={marcar("firstName")}
              error={tocados.firstName ? errores.firstName : ""}
              autoComplete="given-name"
            />
            <CampoDeTexto
              id="reg-apellido"
              etiqueta="Apellido"
              valor={campos.lastName}
              onCambio={cambiar("lastName")}
              onSalir={marcar("lastName")}
              error={tocados.lastName ? errores.lastName : ""}
              autoComplete="family-name"
            />
          </div>

          <CampoDeTexto
            id="reg-correo"
            etiqueta="Correo electrónico"
            tipo="email"
            valor={campos.email}
            onCambio={cambiar("email")}
            onSalir={marcar("email")}
            error={tocados.email ? errores.email : ""}
            autoComplete="email"
            ayuda="Ahí llega el código para confirmar la cuenta."
          />

          <CampoDeTexto
            id="reg-clave"
            etiqueta="Contraseña"
            tipo="password"
            valor={campos.password}
            onCambio={cambiar("password")}
            onSalir={marcar("password")}
            error={tocados.password ? errores.password : ""}
            autoComplete="new-password"
          />
          <FuerzaDeClave clave={campos.password} />

          {errorGeneral ? (
            <p className="se-entrada__error" role="alert">
              {errorGeneral}
            </p>
          ) : null}

          <button type="submit" className="se-btn se-entrada__enviar" disabled={enviando}>
            {enviando ? "Creando su cuenta…" : "Crear mi cuenta"}
          </button>

          {/* Lo que falta se dice aquí y no después: quien va a firmar un artículo
              tiene que saber que hará falta más de lo que se pide ahora. */}
          <p className="se-entrada__nota">
            Después podrá completar su perfil y subir una foto — hace falta para firmar
            lo que publique.
          </p>
        </form>

        {/* Quien se registra con Google no pasa por la pantalla del código: Google ya
            confirmó el correo, y volver a pedírselo sería repetir lo que acaba de hacer. */}
        <BotonDeGoogle texto="signup_with" onEntrado={() => navigate("/cuenta", { replace: true })} />

        <p className="se-entrada__pie">
          ¿Ya tiene cuenta? <Link to="/cuenta/entrar">Entrar</Link>
        </p>
      </div>
    </main>
  );
};

export default CuentaRegistro;
