import { userPublicRequest, userRequest } from "../lib/userApi";

const pickTokens = (data) => {
  if (!data || typeof data !== "object") return null;
  const root = data.access_token || data.accessToken ? data : data.data ?? data.user ?? data;
  if (!root || typeof root !== "object") return null;
  const access = root.access_token ?? root.accessToken ?? data.access_token ?? data.accessToken;
  const refresh = root.refresh_token ?? root.refreshToken ?? data.refresh_token ?? data.refreshToken;
  if (!access || !refresh) return null;
  return {
    accessToken: access,
    refreshToken: refresh,
    expiresIn: root.expires_in ?? root.expiresIn ?? data.expires_in ?? data.expiresIn,
  };
};

const normalizeProfile = (raw) => {
  if (!raw || typeof raw !== "object") {
    return {
      firstName: "",
      lastName: "",
      email: "",
      isEmailVerified: false,
      age: "",
      sex: "",
      country: "",
      city: "",
      occupation: "",
      phoneNumber: "",
    };
  }
  return {
    firstName: String(raw.first_name ?? raw.firstName ?? ""),
    lastName: String(raw.last_name ?? raw.lastName ?? ""),
    email: String(raw.email ?? ""),
    isEmailVerified: Boolean(raw.is_email_verified ?? raw.email_verified ?? raw.isEmailVerified),
    age: raw.age != null ? String(raw.age) : "",
    sex: String(raw.sex ?? raw.gender ?? ""),
    country: String(raw.country ?? ""),
    city: String(raw.city ?? ""),
    occupation: String(raw.occupation ?? ""),
    phoneNumber: String(raw.phone_number ?? raw.phoneNumber ?? ""),
    photoId: raw.photo_id ?? null,
    photoUrl: raw.photo_url ?? null,
  };
};

const userFromRegisterPayload = (data) => {
  if (!data || typeof data !== "object") return null;
  const user = data.user ?? data.data?.user;
  if (!user || typeof user !== "object") return null;
  return user;
};

/**
 * @param {{
 *   email: string,
 *   password: string,
 *   firstName: string,
 *   lastName: string,
 *   age: number,
 *   sex: string,
 *   country: string,
 *   city: string,
 *   occupation: string,
 *   phoneNumber: string,
 * }} payload
 */
export const registerUser = async (payload) => {
  const { email, password, firstName, lastName } = payload;

  // Cuatro campos. Los otros seis -- edad, sexo, pais, ciudad, ocupacion y telefono --
  // eran obligatorios en el esquema del servidor y por eso el formulario no se podia
  // acortar; ya son opcionales alli y se piden en el perfil, cuando la persona tiene un
  // motivo para darlos. Ni siquiera se mandan vacios: un `""` guardado es un dato falso
  // que luego hay que distinguir de "no lo dijo".
  const json = {
    email: String(email ?? "").trim(),
    password,
    first_name: String(firstName ?? "").trim(),
    last_name: String(lastName ?? "").trim(),
  };

  const data = await userPublicRequest("/user-auth/register", {
    method: "POST",
    json,
  });
  const userRaw = userFromRegisterPayload(data);
  return {
    data,
    tokens: pickTokens(data),
    user: userRaw ? normalizeProfile(userRaw) : null,
    verification:
      data?.verification ??
      data?.data?.verification ??
      null,
  };
};

export const loginUser = async (email, password) => {
  const data = await userPublicRequest("/user-auth/login", {
    method: "POST",
    json: { email, password },
  });
  return { data, tokens: pickTokens(data) };
};

export const verifyUserEmail = async ({ email, code }) => {
  const data = await userPublicRequest("/user-auth/verify-email", {
    method: "POST",
    json: { email, code },
  });
  return { data, tokens: pickTokens(data) };
};

export const resendVerificationCode = async ({ email }) =>
  userPublicRequest("/user-auth/resend-verification-code", {
    method: "POST",
    json: { email },
  });

export const fetchMe = async () => {
  const data = await userRequest("/user-auth/me", { method: "GET" });
  return normalizeProfile(data);
};

export const logoutUserRemote = async () => {
  try {
    await userRequest("/user-auth/logout", { method: "POST", json: {} });
  } catch {
    /* endpoint optional */
  }
};

/**
 * Guarda los datos del perfil.
 *
 * Manda **solo lo que llega** y no el objeto entero: el servidor distingue "no viene el
 * campo" de "viene vacio", y son dos cosas distintas -- lo primero es no tocarlo, lo
 * segundo es borrarlo. Enviar siempre los diez convertiria cualquier guardado parcial en
 * un borrado silencioso del resto.
 */
export const actualizarMiPerfil = async (datos) => {
  const mapa = {
    firstName: "first_name",
    lastName: "last_name",
    age: "age",
    sex: "sex",
    country: "country",
    city: "city",
    occupation: "occupation",
    phoneNumber: "phone_number",
    photoId: "photo_id",
  };
  const json = {};
  for (const [nuestro, suyo] of Object.entries(mapa)) {
    if (datos[nuestro] !== undefined) json[suyo] = datos[nuestro];
  }
  return normalizeProfile(await userRequest("/user-auth/me", { method: "PATCH", json }));
};

/**
 * Si el sitio puede ofrecer «entrar con Google», y con qué Client ID.
 *
 * El Client ID lo sirve la API en vez de venir de una variable del frontend. No es un
 * secreto —el botón lo necesita en el navegador— y tenerlo en un solo sitio evita que
 * las dos configuraciones se separen: el día que cambie, cambia en un lado.
 */
export const googleDisponible = async () => {
  try {
    const d = await userPublicRequest("/user-auth/google/disponible");
    return { disponible: Boolean(d?.disponible), clientId: d?.client_id || null };
  } catch {
    // Que no se pueda preguntar no es un error que mostrar: simplemente no se ofrece.
    return { disponible: false, clientId: null };
  }
};

/**
 * Cambia el token de Google por nuestra propia sesión.
 *
 * Devuelve los tokens sin guardarlos, igual que `loginUser` y por lo mismo: quien los
 * persiste es el contexto, que además recarga el perfil. Guardarlos aquí dejaría dos
 * sitios haciendo el mismo trabajo, y uno de los dos acabaría olvidándose de un paso.
 */
export const entrarConGoogle = async (credential) => {
  const data = await userPublicRequest("/user-auth/google", {
    method: "POST",
    json: { credential },
  });
  return { data, tokens: pickTokens(data) };
};
