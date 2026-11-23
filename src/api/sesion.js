/**
 * La sesión: dónde se guarda el token y cómo se renueva. Hay dos, con el mismo código y
 * claves distintas: la del panel (`sureconomics_admin_*`, con el rol) y la del lector
 * (`sureconomics_user_*`). Las crean `lib/authStorage.js` + `lib/api.js` y
 * `lib/userAuthStorage.js` + `lib/userApi.js`, que siguen siendo por donde entra todo
 * el sitio.
 *
 * ## Qué pasa si renovar falla (la diferencia entre el panel y el lector)
 *
 * Con un 401, se renueva el token una vez y se repite la petición. Si eso falla:
 *
 * - **Panel** (`CERRAR_SI_LA_SESION_NO_VALE`): solo se cierra la sesión si el servidor
 *   dice que la renovación no vale (un 4xx que no sea 429). Sin red, con el limitador o
 *   con el servidor reiniciando, el error sube tal cual y la sesión se queda. Es el
 *   arreglo del 19-nov-2026: antes se echaba del panel a quien estaba escribiendo.
 * - **Lector** (`CERRAR_SIEMPRE`): se cierra con **cualquier** fallo, también sin red o si
 *   la red se cae en el reintento. Es lo de siempre y es un fallo (el mismo que se
 *   arregló en el panel): un lector en el metro pierde la sesión. Se deja así a propósito
 *   para que juntar los clientes no cambie nada; igualarlo es un cambio visible, aparte.
 * - **Descargas del lector** (`SEGUIR`): nunca se cierra; sigue con el 401 de antes y lo
 *   lanza como error.
 */

/**
 * Las claves en `sessionStorage` de una sesión: `<prefijo>_access_token`,
 * `<prefijo>_refresh_token`, `<prefijo>_access_expires_at` y, con `conRol`,
 * `<prefijo>_role`. Son las de siempre: nadie pierde la sesión al cambiar el código.
 *
 * @param {string} prefijo `sureconomics_admin` o `sureconomics_user`
 * @param {{ conRol?: boolean }} [opciones]
 */
export const crearAlmacen = (prefijo, { conRol = false } = {}) => {
  const ACCESO = `${prefijo}_access_token`;
  const RENOVAR = `${prefijo}_refresh_token`;
  const CADUCA = `${prefijo}_access_expires_at`;
  const ROL = `${prefijo}_role`;

  /** @returns {{ accessToken: string | null, refreshToken: string | null, accessExpiresAt: number | null, role?: string | null }} */
  const leer = () => {
    if (typeof sessionStorage === "undefined") {
      return conRol
        ? { accessToken: null, refreshToken: null, accessExpiresAt: null, role: null }
        : { accessToken: null, refreshToken: null, accessExpiresAt: null };
    }
    const accessToken = sessionStorage.getItem(ACCESO);
    const refreshToken = sessionStorage.getItem(RENOVAR);
    const crudo = sessionStorage.getItem(CADUCA);
    const accessExpiresAt = crudo ? Number.parseInt(crudo, 10) : null;
    const leido = {
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      accessExpiresAt: Number.isFinite(accessExpiresAt) ? accessExpiresAt : null,
    };
    if (conRol) leido.role = sessionStorage.getItem(ROL) || null;
    return leido;
  };

  /** @param {{ accessToken: string, refreshToken: string, expiresIn?: number, role?: string }} tokens */
  const guardar = ({ accessToken, refreshToken, expiresIn, role }) => {
    sessionStorage.setItem(ACCESO, accessToken);
    sessionStorage.setItem(RENOVAR, refreshToken);
    if (typeof expiresIn === "number" && expiresIn > 0) {
      sessionStorage.setItem(CADUCA, String(Date.now() + expiresIn * 1000));
    } else {
      sessionStorage.removeItem(CADUCA);
    }
    // Renovar no devuelve el rol: solo se escribe cuando llega (al entrar), para que
    // renovar no lo borre.
    if (conRol && role) sessionStorage.setItem(ROL, role);
  };

  const borrar = () => {
    sessionStorage.removeItem(ACCESO);
    sessionStorage.removeItem(RENOVAR);
    sessionStorage.removeItem(CADUCA);
    if (conRol) sessionStorage.removeItem(ROL);
  };

  return { leer, guardar, borrar };
};

/* ─── Qué hacer si renovar (o el reintento) falla ────────────────────────── */

/** Panel: cerrar solo si el servidor dice que la sesión no vale (4xx menos 429); si no, lanzar. */
export const CERRAR_SI_LA_SESION_NO_VALE = (err) => {
  const status = err?.status;
  return status >= 400 && status < 500 && status !== 429 ? "cerrar" : "lanzar";
};
/** Lector: cerrar con cualquier fallo (ver arriba: es un fallo conocido). */
export const CERRAR_SIEMPRE = () => "cerrar";
/** Descargas del lector: seguir con la respuesta 401 que había. */
export const SEGUIR = () => "seguir";

/**
 * Una sesión: renovar el token, renovarlo si está a punto de caducar y repetir una
 * petición tras un 401. `pedir` y `abrir` son los del cliente (cómo pide y cómo lee la
 * respuesta: su error y su forma de desenvolverla).
 *
 * @param {{
 *   almacen: { leer: Function, guardar: Function, borrar: Function },
 *   evento: string,
 *   rutaDeRenovar: string,
 *   pedir: (ruta: string, opciones: object) => Promise<{ res: Response, payload: any }>,
 *   abrir: (respuesta: { res: Response, payload: any }) => any,
 *   sinRenovacion: () => Error,
 *   renovacionInvalida: () => Error,
 * }} config
 */
export const crearSesion = ({ almacen, evento, rutaDeRenovar, pedir, abrir, sinRenovacion, renovacionInvalida }) => {
  /** Avisa a la pantalla (los contextos de sesión) de que el token cambió o se borró. */
  const avisar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(evento));
    }
  };

  const cerrar = () => {
    almacen.borrar();
    avisar();
  };

  /** Pide un token nuevo con el de renovación, lo guarda y avisa. */
  const renovar = async () => {
    const { refreshToken } = almacen.leer();
    if (!refreshToken) throw sinRenovacion();
    // `abrir` es la del cliente: lanza su error si la respuesta no fue bien y si no la desenvuelve.
    const data = abrir(await pedir(rutaDeRenovar, { method: "POST", json: { refresh_token: refreshToken } }));
    if (!data || typeof data !== "object" || !data.access_token) throw renovacionInvalida();
    almacen.guardar({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresIn: data.expires_in,
    });
    avisar();
    return data;
  };

  /**
   * Si al token le quedan menos de 5 s, se renueva antes de pedir. Si no se puede, se
   * sigue: el que hay aún puede valer. `soloConAcceso`: además, solo si hay token de acceso.
   */
  const renovarSiVaACaducar = async ({ soloConAcceso = false } = {}) => {
    const { refreshToken, accessExpiresAt, accessToken } = almacen.leer();
    if (soloConAcceso && !accessToken) return;
    if (refreshToken && accessExpiresAt && Date.now() >= accessExpiresAt - 5000) {
      try {
        await renovar();
      } catch {
        // Se sigue con el token que hay.
      }
    }
  };

  /**
   * Hace la petición (`hacer`, que devuelve `{ res, … }`); con un 401 y token de
   * renovación, renueva y la repite una vez. Si renovar o repetir falla, `siFalla(err)`
   * decide: "cerrar" (se cierra la sesión y se lanza `errorCaducada()`), "lanzar" (sube el
   * error tal cual) o "seguir" (con la respuesta de antes).
   */
  const conRenovacion = async (hacer, { siFalla, errorCaducada }) => {
    let respuesta = await hacer();
    if (respuesta.res.status === 401 && almacen.leer().refreshToken) {
      try {
        await renovar();
        respuesta = await hacer();
      } catch (err) {
        const decision = siFalla(err);
        if (decision === "cerrar") {
          cerrar();
          throw errorCaducada();
        }
        if (decision !== "seguir") throw err;
      }
    }
    return respuesta;
  };

  return { leer: almacen.leer, avisar, cerrar, renovar, renovarSiVaACaducar, conRenovacion };
};
