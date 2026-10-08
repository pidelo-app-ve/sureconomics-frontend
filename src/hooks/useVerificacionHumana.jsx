import { useCallback, useEffect, useRef } from "react";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { userPublicRequest } from "../lib/userApi";

/**
 * «¿Es una persona?» -- Cloudflare Turnstile en los formularios públicos que crean algo
 * (el registro y el boletín).
 *
 * ## Cómo se usa
 *
 * ```jsx
 * const humano = useVerificacionHumana();
 * <form onFocus={humano.activar} …>
 *   …
 *   {humano.control}
 * </form>
 * // al enviar:
 * const turnstile = await humano.pedirToken(); // "" si no hay control; null si no pasó
 * …y después del envío, `humano.reiniciar()`: cada token vale una sola vez.
 * ```
 *
 * ## Las decisiones
 *
 * - **El script de Cloudflare se carga al tocar el formulario** (`activar`, en el
 *   `onFocus` del `<form>`), no al pintar la página: el boletín está en el pie de todas
 *   las vistas, y cargar un script de terceros en cada visita para los pocos que se
 *   suscriben sería pagar el coste en todas.
 * - **Casi siempre es invisible** (`appearance: "interaction-only"`): el control solo
 *   aparece si Cloudflare necesita que la persona marque algo.
 * - **Sin claves en el servidor no hace nada.** La configuración sale de
 *   `/anti-bots/turnstile`; si dice que no está activo, `pedirToken` devuelve `""` y el
 *   formulario funciona como antes.
 */

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const ESPERA_MS = 12000;

let configuracion = null;
const leerConfiguracion = () => {
  if (!configuracion) {
    configuracion = userPublicRequest("/anti-bots/turnstile")
      .then((d) => ({ activo: Boolean(d?.activo && d?.site_key), clave: d?.site_key ?? null }))
      .catch(() => {
        configuracion = null; // que el próximo intento vuelva a preguntar
        return { activo: false, clave: null };
      });
  }
  return configuracion;
};

let script = null;
const cargarScript = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!script) {
    script = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = SCRIPT;
      el.async = true;
      el.defer = true;
      el.onload = () => resolve(window.turnstile);
      el.onerror = () => {
        script = null;
        reject(new Error("turnstile"));
      };
      document.head.appendChild(el);
    });
  }
  return script;
};

export const useVerificacionHumana = () => {
  const { lang } = useIdioma();
  const caja = useRef(null);
  const widget = useRef(null);
  const token = useRef(null);
  const esperando = useRef([]);
  const arranque = useRef(null);

  const avisar = (valor) => {
    token.current = valor;
    const pendientes = esperando.current;
    esperando.current = [];
    pendientes.forEach((resolver) => resolver(valor));
  };

  /** Pinta el control la primera vez que se toca el formulario. Devuelve si está activo. */
  const activar = useCallback(() => {
    if (!arranque.current) {
      arranque.current = (async () => {
        const { activo, clave } = await leerConfiguracion();
        if (!activo) return false;
        try {
          const turnstile = await cargarScript();
          if (!caja.current || widget.current != null) return true;
          widget.current = turnstile.render(caja.current, {
            sitekey: clave,
            appearance: "interaction-only",
            language: lang === "en" ? "en" : "es",
            size: "flexible",
            callback: (t) => avisar(t),
            "expired-callback": () => avisar(null),
            "error-callback": () => {
              avisar(null);
              return true;
            },
          });
        } catch {
          // Sin el script no hay token; el servidor decidirá (y dirá) qué pasa.
        }
        return true;
      })();
    }
    return arranque.current;
  }, [lang]);

  /**
   * El token para mandar con el formulario: `""` si no hay control que pedir, el token
   * si ya está, o espera a que llegue. `null` si no llega a tiempo.
   */
  const pedirToken = useCallback(async () => {
    const activo = await activar();
    if (!activo) return "";
    if (token.current) return token.current;
    return new Promise((resolve) => {
      const reloj = window.setTimeout(() => {
        esperando.current = esperando.current.filter((r) => r !== listo);
        resolve(null);
      }, ESPERA_MS);
      const listo = (valor) => {
        window.clearTimeout(reloj);
        resolve(valor || null);
      };
      esperando.current.push(listo);
    });
  }, [activar]);

  /** Después de cada envío: el token ya se gastó. */
  const reiniciar = useCallback(() => {
    token.current = null;
    if (widget.current != null && window.turnstile) {
      try {
        window.turnstile.reset(widget.current);
      } catch {
        /* nada que reiniciar */
      }
    }
  }, []);

  useEffect(
    () => () => {
      if (widget.current != null && window.turnstile) {
        try {
          window.turnstile.remove(widget.current);
        } catch {
          /* ya no estaba */
        }
      }
    },
    []
  );

  const control = <div ref={caja} className="se-verificacion-humana" />;

  return { activar, pedirToken, reiniciar, control };
};

/** El código con que el servidor dice «no parece una persona». */
export const NO_PARECE_PERSONA = "human_check_failed";

export default useVerificacionHumana;
