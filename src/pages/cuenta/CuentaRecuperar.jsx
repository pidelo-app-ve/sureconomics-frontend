import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Enlace, useNavegar } from "../../components/Enlace";
import { CampoDeTexto } from "../../components/cuenta/CampoDeTexto";
import { FuerzaDeClave } from "../../components/cuenta/FuerzaDeClave";
import { useUserAuth } from "../../context/UserAuthContext";
import { BRAND } from "../../data/surEconomicsMock";
import { NO_PARECE_PERSONA, useVerificacionHumana } from "../../hooks/useVerificacionHumana";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import { dispatchAdminAuthSync } from "../../lib/api";
import { persistAuth } from "../../lib/authStorage";
import { pedirCodigoDeRecuperacion, recuperarContrasena } from "../../lib/unifiedAuth";
import { persistUserAuth } from "../../lib/userAuthStorage";
import { dispatchUserAuthSync } from "../../lib/userApi";
import { leerVolver } from "../../lib/volver";
import "../../styles/cuenta.css";

/**
 * «¿Olvidó su contraseña?», en dos pasos y en la misma pantalla.
 *
 * 1. El correo: el servidor manda un código de seis cifras (si ese correo tiene cuenta;
 *    la respuesta es la misma tenga o no, para no decirlo).
 * 2. El código y la contraseña nueva: se guarda y se entra directamente, como en Entrar.
 *
 * Sirve para el equipo y los lectores, porque Entrar es una sola pantalla para los dos.
 * Ver `services/recuperar_contrasena_service.py` en el backend.
 */

const pareceCorreo = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());

const IDS = { email: "recuperar-email", codigo: "recuperar-codigo", password: "recuperar-password" };
const ID_ERROR = "recuperar-error";
const ID_AVISO = "recuperar-aviso";

export const CuentaRecuperar = () => {
  const { t } = useIdioma();
  const navigate = useNavegar();
  // El panel no existe bajo `/en`: a él se va sin prefijo de idioma (como en Entrar).
  const irAlPanel = useNavigate();
  const location = useLocation();
  const { loadProfile } = useUserAuth();

  const [paso, setPaso] = useState("correo");
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [errores, setErrores] = useState({ email: "", codigo: "", password: "" });
  const [errorGeneral, setErrorGeneral] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enfocar, setEnfocar] = useState(null);
  // Las defensas del registro: pedir el código manda un correo a quien se diga.
  const [trampa, setTrampa] = useState("");
  const humano = useVerificacionHumana();

  useMetaPagina({
    title: t("cuenta.recuperar.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.recuperar.meta.descripcion"),
    noindex: true,
  });

  useEffect(() => {
    if (!enfocar) return;
    document.getElementById(enfocar.id)?.focus();
  }, [enfocar]);

  const fallar = (mensaje, id = ID_ERROR) => {
    setErrorGeneral(mensaje);
    setEnfocar({ id });
  };

  const errorDeRed = (err) =>
    err instanceof TypeError || err?.status === 0 ? t("cuenta.entrar.sinConexion") : t("cuenta.recuperar.fallo");

  const pedir = async () => {
    if (enviando) return;
    setErrorGeneral("");
    setAviso("");
    const errorCorreo = !email.trim()
      ? t("cuenta.comun.escribaCorreo")
      : pareceCorreo(email)
        ? ""
        : t("cuenta.comun.correoIncompleto");
    setErrores((prev) => ({ ...prev, email: errorCorreo }));
    if (errorCorreo) {
      setPaso("correo");
      setEnfocar({ id: IDS.email });
      return;
    }
    setEnviando(true);
    try {
      const turnstile = await humano.pedirToken();
      if (turnstile === null) throw Object.assign(new Error("turnstile"), { code: NO_PARECE_PERSONA });
      await pedirCodigoDeRecuperacion({ email: email.trim(), website: trampa, turnstile });
      setCodigo("");
      setPaso("codigo");
      setAviso(t("cuenta.recuperar.enviado"));
      setEnfocar({ id: IDS.codigo });
    } catch (err) {
      if (err?.code === NO_PARECE_PERSONA) fallar(t("comun.antiBots.noPaso"));
      else if (err?.status === 429) fallar(t("cuenta.comun.demasiadasSolicitudes"));
      else if (err?.details?.email) {
        setErrores((prev) => ({ ...prev, email: t("cuenta.entrar.correoNoValido") }));
        setPaso("correo");
        setEnfocar({ id: IDS.email });
      } else fallar(errorDeRed(err));
    } finally {
      humano.reiniciar();
      setEnviando(false);
    }
  };

  const confirmar = async () => {
    if (enviando) return;
    setErrorGeneral("");
    const limpio = codigo.replace(/\D/g, "");
    const locales = {
      email: "",
      codigo: !limpio ? t("cuenta.recuperar.escribaCodigo") : limpio.length !== 6 ? t("cuenta.recuperar.codigoIncompleto") : "",
      password: clave.length >= 8 ? "" : t("cuenta.registro.alMenosOcho"),
    };
    setErrores(locales);
    if (locales.codigo || locales.password) {
      setEnfocar({ id: locales.codigo ? IDS.codigo : IDS.password });
      return;
    }
    setEnviando(true);
    try {
      const sesion = await recuperarContrasena({ email: email.trim(), code: limpio, password: clave });
      if (sesion.actor === "admin") {
        persistAuth({ ...sesion.tokens, role: sesion.role });
        dispatchAdminAuthSync();
        irAlPanel("/admin/posts", { replace: true });
        return;
      }
      persistUserAuth(sesion.tokens);
      dispatchUserAuthSync();
      try {
        await loadProfile();
      } catch {
        /* el perfil se vuelve a pedir al llegar; entrar ya entró */
      }
      navigate(leerVolver(location) ?? "/", { replace: true });
    } catch (err) {
      if (err?.code === "invalid_verification_code") {
        setErrores((prev) => ({ ...prev, codigo: t("cuenta.recuperar.codigoMalo") }));
        setEnfocar({ id: IDS.codigo });
      } else if (err?.details?.password) {
        setErrores((prev) => ({ ...prev, password: t("cuenta.registro.alMenosOcho") }));
        setEnfocar({ id: IDS.password });
      } else if (err?.status === 429) fallar(t("cuenta.comun.demasiadasSolicitudes"));
      else fallar(errorDeRed(err));
    } finally {
      setEnviando(false);
    }
  };

  const alEnviar = (e) => {
    e.preventDefault();
    if (paso === "correo") pedir();
    else confirmar();
  };

  const cambiar = (campo, poner) => (valor) => {
    poner(valor);
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: "" } : prev));
  };

  return (
    <main className="se-blog se-entrada" role="main">
      <div className="se-entrada__caja">
        <h1 className="se-entrada__titulo">{t("cuenta.recuperar.titulo")}</h1>
        <p className="se-entrada__lead">
          {paso === "correo"
            ? t("cuenta.recuperar.leadCorreo")
            : t("cuenta.recuperar.leadCodigo", { correo: email.trim() })}
        </p>

        <form className="se-entrada__form" onSubmit={alEnviar} onFocus={humano.activar} noValidate>
          {paso === "correo" ? (
            <CampoDeTexto
              id={IDS.email}
              etiqueta={t("cuenta.comun.correo")}
              tipo="email"
              valor={email}
              onCambio={cambiar("email", setEmail)}
              error={errores.email}
              autoComplete="email"
            />
          ) : (
            <>
              {aviso ? (
                <p className="se-entrada__aviso" id={ID_AVISO} role="status">
                  {aviso}
                </p>
              ) : null}
              <CampoDeTexto
                id={IDS.codigo}
                etiqueta={t("cuenta.recuperar.codigo")}
                valor={codigo}
                onCambio={cambiar("codigo", setCodigo)}
                error={errores.codigo}
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
              />
              <CampoDeTexto
                id={IDS.password}
                etiqueta={t("cuenta.recuperar.nueva")}
                tipo="password"
                valor={clave}
                onCambio={cambiar("password", setClave)}
                error={errores.password}
                autoComplete="new-password"
              />
              <FuerzaDeClave clave={clave} />
            </>
          )}

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

          {errorGeneral ? (
            <p className="se-entrada__error" id={ID_ERROR} tabIndex={-1}>
              {errorGeneral}
            </p>
          ) : null}

          <button type="submit" className="se-btn se-entrada__enviar" aria-disabled={enviando ? "true" : undefined}>
            {paso === "correo"
              ? enviando
                ? t("cuenta.comun.enviando")
                : t("cuenta.recuperar.enviarCodigo")
              : enviando
                ? t("cuenta.recuperar.guardando")
                : t("cuenta.recuperar.guardar")}
          </button>

          {paso === "codigo" ? (
            <>
              <button type="button" className="se-entrada__vuelta" onClick={pedir}>
                {t("cuenta.recuperar.pedirOtro")}
              </button>
              <button
                type="button"
                className="se-entrada__vuelta"
                onClick={() => {
                  setPaso("correo");
                  setAviso("");
                  setErrorGeneral("");
                  setEnfocar({ id: IDS.email });
                }}
              >
                {t("cuenta.recuperar.otroCorreo")}
              </button>
            </>
          ) : null}
        </form>

        <p className="se-entrada__pie">
          <Enlace to="/cuenta/entrar" state={{ volver: leerVolver(location) }}>
            {t("cuenta.recuperar.volverAEntrar")}
          </Enlace>
        </p>
      </div>
    </main>
  );
};

export default CuentaRecuperar;
