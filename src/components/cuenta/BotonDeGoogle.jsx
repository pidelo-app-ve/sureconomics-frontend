import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import { googleDisponible } from "../../services/userAuthService";

/**
 * El botón de «Entrar con Google».
 *
 * ## Qué hace, en orden
 *
 * Carga el script de Google Identity Services, le pide que pinte su botón, y cuando la
 * persona elige su cuenta Google devuelve **aquí** un token firmado. Ese token se manda
 * a nuestra API, que lo verifica contra las claves públicas de Google y devuelve nuestra
 * propia sesión. El token de Google no se guarda: sirve una vez, para probar quién es.
 *
 * ## Por qué el botón lo pinta Google y no nosotros
 *
 * Porque sus normas de marca lo exigen, y porque un botón propio que abra su ventana
 * tiene que replicar el manejo de bloqueadores de ventanas emergentes, el modo incógnito
 * y la cuenta ya elegida. Google lo mantiene; una copia nuestra se rompería en silencio
 * el día que cambien algo.
 *
 * ## Si no hay Client ID configurado, no se pinta nada
 *
 * Se pregunta al servidor antes. Un botón que existe y falla con un 503 es peor que no
 * tenerlo: la persona lo intenta, no funciona, y se queda sin saber si el problema es
 * suyo o del sitio.
 */

const SCRIPT = "https://accounts.google.com/gsi/client";

/** Carga el script una sola vez, aunque haya dos botones en la página. */
let cargando = null;
const cargarGoogle = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (cargando) return cargando;
  cargando = new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = ok;
    s.onerror = () => {
      // Se limpia para que un fallo de red no deje la promesa rechazada para siempre:
      // sin esto, quien recargue la sección nunca lo vuelve a intentar.
      cargando = null;
      mal(new Error("No se pudo cargar Google"));
    };
    document.head.appendChild(s);
  });
  return cargando;
};

export const BotonDeGoogle = ({ onEntrado, texto = "signin_with" }) => {
  const hueco = useRef(null);
  const { entrarConGoogle } = useUserAuth();
  const [estado, setEstado] = useState({ fase: "mirando", error: "" });
  // El callback que se le pasa a Google se registra **una vez**, al montar. Todo lo que
  // use dentro va por referencia: capturado del render de entonces, llamaría siempre a
  // la primera versión —y `onEntrado`, que es el que navega, cambia en cada render.
  const alEntrar = useRef(onEntrado);
  alEntrar.current = onEntrado;
  const entrar = useRef(entrarConGoogle);
  entrar.current = entrarConGoogle;

  useEffect(() => {
    let vivo = true;

    const montar = async () => {
      const { disponible, clientId } = await googleDisponible();
      if (!vivo) return;
      if (!disponible || !clientId) {
        setEstado({ fase: "no", error: "" });
        return;
      }

      await cargarGoogle();
      if (!vivo || !hueco.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setEstado({ fase: "entrando", error: "" });
          try {
            await entrar.current(credential);
            if (!vivo) return;
            alEntrar.current?.();
          } catch (err) {
            if (!vivo) return;
            setEstado({
              fase: "listo",
              error:
                err?.status === 403
                  ? "Google no confirma que ese correo sea suyo. Entre con su contraseña."
                  : "No se pudo entrar con Google. Inténtelo de nuevo.",
            });
          }
        },
      });
      window.google.accounts.id.renderButton(hueco.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: texto,
        locale: "es",
        width: 320,
      });
      setEstado({ fase: "listo", error: "" });
    };

    montar().catch(() => {
      if (vivo) setEstado({ fase: "no", error: "" });
    });

    return () => {
      vivo = false;
    };
  }, [texto]);

  // Ni hueco ni separador cuando no se puede ofrecer: un espacio vacío con una raya
  // encima se lee como algo que no cargó.
  if (estado.fase === "no") return null;

  return (
    <div className="se-google">
      <div className="se-google__separador">
        <span>o</span>
      </div>
      <div ref={hueco} className="se-google__hueco" />
      {estado.fase === "entrando" ? (
        <p className="se-google__aviso" role="status">
          Entrando…
        </p>
      ) : null}
      {estado.error ? (
        <p className="se-google__error" role="alert">
          {estado.error}
        </p>
      ) : null}
    </div>
  );
};

BotonDeGoogle.propTypes = {
  /** Se llama cuando la sesión ya está puesta. */
  onEntrado: PropTypes.func,
  /** `signin_with` en entrar, `signup_with` en registro: Google traduce el rótulo. */
  texto: PropTypes.oneOf(["signin_with", "signup_with", "continue_with"]),
};

export default BotonDeGoogle;
