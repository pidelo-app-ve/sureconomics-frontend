import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Enlace, Redirigir, useNavegar } from "../../components/Enlace";
import { useUserAuth } from "../../context/UserAuthContext";
import { CampoDeTexto } from "../../components/cuenta/CampoDeTexto";
import { FuerzaDeClave } from "../../components/cuenta/FuerzaDeClave";
import { BotonDeGoogle } from "../../components/cuenta/BotonDeGoogle";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import { conVolver, leerVolver } from "../../lib/volver";
import { NO_PARECE_PERSONA, useVerificacionHumana } from "../../hooks/useVerificacionHumana";

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

/** El id de cada campo, en el orden en que se leen: el primero que falle se lleva el foco. */
const IDS = {
  firstName: "reg-nombre",
  lastName: "reg-apellido",
  email: "reg-correo",
  password: "reg-clave",
};
const ID_ERROR = "reg-error";

export const CuentaRegistro = () => {
  const { t } = useIdioma();
  const navigate = useNavegar();
  // Quien llegó desde algo concreto (anotar su carrera en El Analista) vuelve ahí.
  const volver = leerVolver(useLocation());
  const { isAuthenticated, isEmailVerified, register, profile, profileStatus } = useUserAuth();
  // Con sesión, hasta que llega el perfil no se sabe si el correo está confirmado. Sin
  // esperarlo, un lector ya confirmado que abría esta página acababa en «verificar correo».
  const perfilListo = !["idle", "loading"].includes(profileStatus);

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
  // Contra los robots que usan el registro para mandar correos de verificación a
  // quien no los pidió: una trampa que solo rellena un robot, y Cloudflare Turnstile.
  const [trampa, setTrampa] = useState("");
  const humano = useVerificacionHumana();
  // Tras un intento fallido el foco va a lo que hay que arreglar. Objeto nuevo en cada
  // intento, para que repetir el mismo fallo vuelva a llevarlo alli.
  const [enfocar, setEnfocar] = useState(null);

  useEffect(() => {
    if (!enfocar) return;
    document.getElementById(enfocar.id)?.focus();
  }, [enfocar]);

  useMetaPagina({
    title: t("cuenta.registro.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.registro.meta.descripcion"),
    noindex: true,
  });

  const errores = {
    firstName: campos.firstName.trim() ? "" : t("cuenta.registro.escribaNombre"),
    lastName: campos.lastName.trim() ? "" : t("cuenta.registro.escribaApellido"),
    email: !campos.email.trim()
      ? t("cuenta.comun.escribaCorreo")
      : pareceCorreo(campos.email)
        ? ""
        : t("cuenta.comun.correoIncompleto"),
    password: campos.password.length >= 8 ? "" : t("cuenta.registro.alMenosOcho"),
  };
  const valido = Object.values(errores).every((e) => !e);

  if (isAuthenticated && perfilListo && !isEmailVerified) {
    return <Redirigir to="/cuenta/verificar-email" replace state={{ email: profile?.email, volver }} />;
  }
  if (isAuthenticated && isEmailVerified) return <Redirigir to={volver ?? "/cuenta"} replace />;

  const cambiar = (campo) => (valor) => setCampos((c) => ({ ...c, [campo]: valor }));
  const marcar = (campo) => () => setTocados((t) => ({ ...t, [campo]: true }));

  const enviar = async (e) => {
    e.preventDefault();
    // El boton no se deshabilita mientras se envia (ver abajo): el doble envio se para aqui.
    if (enviando) return;
    setErrorGeneral("");
    // Al enviar se marcan todos: si algo falta, hay que verlo señalado y no en un
    // aviso general que no dice dónde.
    setTocados({ firstName: true, lastName: true, email: true, password: true });
    if (!valido) {
      const primero = Object.keys(IDS).find((campo) => errores[campo]);
      if (primero) setEnfocar({ id: IDS[primero] });
      return;
    }

    setEnviando(true);
    try {
      const turnstile = await humano.pedirToken();
      if (turnstile === null) throw Object.assign(new Error("turnstile"), { code: NO_PARECE_PERSONA });
      const { profile: nuevo } = await register({
        website: trampa,
        turnstile,
        firstName: campos.firstName.trim(),
        lastName: campos.lastName.trim(),
        email: campos.email.trim(),
        password: campos.password,
      });
      if (nuevo?.isEmailVerified) {
        navigate(volver ?? "/cuenta", { replace: true });
        return;
      }
      navigate("/cuenta/verificar-email", {
        replace: true,
        state: { email: campos.email.trim(), volver },
      });
    } catch (err) {
      humano.reiniciar();
      const estado = err?.status;
      if (err?.code === NO_PARECE_PERSONA) {
        setErrorGeneral(t("comun.antiBots.noPaso"));
      } else if (estado === 409) {
        setErrorGeneral(t("cuenta.registro.correoYaTieneCuenta"));
      } else if (estado === 429) {
        setErrorGeneral(t("cuenta.registro.demasiadosIntentos"));
      } else if (estado === 422 || err?.code === "validation_error") {
        // El mensaje del servidor llega en ingles ("Validation failed."): no se enseña.
        setErrorGeneral(t("cuenta.registro.reviseDatos"));
      } else {
        setErrorGeneral(t("cuenta.registro.fallo"));
      }
      setEnfocar({ id: ID_ERROR });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="se-blog se-entrada" role="main">
      <div className="se-entrada__caja">
        <p className="se-entrada__kicker">{t("cuenta.registro.kicker")}</p>
        <h1 className="se-entrada__titulo">{t("cuenta.registro.titulo")}</h1>
        <p className="se-entrada__lead">
          {t("cuenta.registro.lead")}
        </p>

        <form className="se-entrada__form" onSubmit={enviar} onFocus={humano.activar} noValidate>
          <div className="se-entrada__fila">
            <CampoDeTexto
              id={IDS.firstName}
              etiqueta={t("cuenta.comun.nombre")}
              valor={campos.firstName}
              onCambio={cambiar("firstName")}
              onSalir={marcar("firstName")}
              error={tocados.firstName ? errores.firstName : ""}
              autoComplete="given-name"
            />
            <CampoDeTexto
              id={IDS.lastName}
              etiqueta={t("cuenta.comun.apellido")}
              valor={campos.lastName}
              onCambio={cambiar("lastName")}
              onSalir={marcar("lastName")}
              error={tocados.lastName ? errores.lastName : ""}
              autoComplete="family-name"
            />
          </div>

          <CampoDeTexto
            id={IDS.email}
            etiqueta={t("cuenta.comun.correo")}
            tipo="email"
            valor={campos.email}
            onCambio={cambiar("email")}
            onSalir={marcar("email")}
            error={tocados.email ? errores.email : ""}
            autoComplete="email"
            ayuda={t("cuenta.registro.ayudaCorreo")}
          />

          <CampoDeTexto
            id={IDS.password}
            etiqueta={t("cuenta.comun.contrasena")}
            tipo="password"
            valor={campos.password}
            onCambio={cambiar("password")}
            onSalir={marcar("password")}
            error={tocados.password ? errores.password : ""}
            autoComplete="new-password"
          />
          <FuerzaDeClave clave={campos.password} />

          {/* La trampa: fuera de la vista, del tabulador y de los lectores de pantalla. */}
          <input
            type="text"
            name="website"
            className="se-sr-only"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            value={trampa}
            onChange={(e) => setTrampa(e.target.value)}
          />
          {humano.control}

          {/* Sin `role="alert"`: el foco llega aqui al aparecer, y eso ya lo hace leer. */}
          {errorGeneral ? (
            <p className="se-entrada__error" id={ID_ERROR} tabIndex={-1}>
              {errorGeneral}
            </p>
          ) : null}

          {/* `aria-disabled` y no `disabled`: deshabilitado, el boton soltaba el foco
              al `body` mientras se enviaba. */}
          <button
            type="submit"
            className="se-btn se-entrada__enviar"
            aria-disabled={enviando ? "true" : undefined}
          >
            {enviando ? t("cuenta.registro.creando") : t("cuenta.registro.crear")}
          </button>

          {/* Lo que falta se dice aquí y no después: quien va a firmar un artículo
              tiene que saber que hará falta más de lo que se pide ahora. */}
          <p className="se-entrada__nota">
            {t("cuenta.registro.nota")}
          </p>
        </form>

        {/* Quien se registra con Google no pasa por la pantalla del código: Google ya
            confirmó el correo, y volver a pedírselo sería repetir lo que acaba de hacer. */}
        <BotonDeGoogle texto="signup_with" onEntrado={() => navigate(volver ?? "/cuenta", { replace: true })} />

        <p className="se-entrada__pie">
          {t("cuenta.registro.yaTieneCuenta", {
            enlace: <Enlace to={conVolver("/cuenta/entrar", volver)}>{t("cuenta.registro.entrar")}</Enlace>,
          })}
        </p>
      </div>
    </main>
  );
};

export default CuentaRegistro;
