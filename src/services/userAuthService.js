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
  const {
    email,
    password,
    firstName,
    lastName,
    age,
    sex,
    country,
    city,
    occupation,
    phoneNumber,
  } = payload;

  const json = {
    email: String(email ?? "").trim(),
    password,
    first_name: String(firstName ?? "").trim(),
    last_name: String(lastName ?? "").trim(),
    age: Number(age),
    sex: String(sex ?? "").trim(),
    country: String(country ?? "").trim(),
    city: String(city ?? "").trim(),
    occupation: String(occupation ?? "").trim(),
    phone_number: String(phoneNumber ?? "").trim(),
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
