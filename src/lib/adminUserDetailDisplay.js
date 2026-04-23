/**
 * Labels and formatting for admin user detail (`GET /admin/users/:id`).
 * Unknown keys fall back to a readable title from the property name.
 */

const LABELS = {
  id: "ID",
  _id: "ID interno",
  email: "Correo",
  first_name: "Nombre",
  firstName: "Nombre",
  last_name: "Apellido",
  lastName: "Apellido",
  name: "Nombre completo",
  display_name: "Nombre para mostrar",
  displayName: "Nombre para mostrar",
  username: "Usuario",
  uuid: "UUID",
  role: "Rol",
  roles: "Roles",
  status: "Estado",
  state: "Estado",
  is_email_verified: "Correo verificado",
  email_verified: "Correo verificado",
  isEmailVerified: "Correo verificado",
  email_verified_at: "Verificación del correo",
  can_submit_collaborations: "Puede enviar colaboraciones",
  collaborative_submissions_enabled: "Colaboraciones habilitadas",
  collaborative: "Colaborativo",
  is_collaborator: "Es colaborador",
  created_at: "Alta",
  createdAt: "Alta",
  updated_at: "Última actualización",
  updatedAt: "Última actualización",
  last_login_at: "Último acceso",
  lastLoginAt: "Último acceso",
  last_seen_at: "Última actividad",
  age: "Edad",
  sex: "Sexo",
  gender: "Género",
  country: "País",
  city: "Ciudad",
  occupation: "Ocupación",
  phone_number: "Teléfono",
  phoneNumber: "Teléfono",
  avatar_url: "Avatar (URL)",
  avatarUrl: "Avatar (URL)",
  photo_url: "Foto (URL)",
  image_url: "Imagen (URL)",
  bio: "Biografía",
  notes: "Notas",
  settings: "Ajustes",
  metadata: "Metadatos",
  user_id: "ID de usuario",
  userId: "ID de usuario",
};

const DATE_KEY_HINT =
  /(^|_)(at|date|time)$|_at$|^created|^updated|^deleted|^verified|^published|^submitted/i;

const PRIORITY_KEYS = [
  "id",
  "_id",
  "email",
  "first_name",
  "firstName",
  "last_name",
  "lastName",
  "name",
  "display_name",
  "displayName",
  "username",
  "is_email_verified",
  "email_verified",
  "isEmailVerified",
  "email_verified_at",
  "can_submit_collaborations",
  "collaborative_submissions_enabled",
  "collaborative",
  "is_collaborator",
  "role",
  "roles",
  "status",
  "state",
  "created_at",
  "createdAt",
  "updated_at",
  "updatedAt",
  "last_login_at",
  "lastLoginAt",
  "uuid",
  "age",
  "sex",
  "gender",
  "country",
  "city",
  "occupation",
  "phone_number",
  "phoneNumber",
  "avatar_url",
  "avatarUrl",
  "photo_url",
  "bio",
];

/**
 * @param {string} key
 * @returns {string}
 */
export const labelForAdminUserField = (key) => {
  if (LABELS[key]) return LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
};

/**
 * @param {unknown} row
 * @returns {string[]}
 */
export const sortedAdminUserKeys = (row) => {
  if (!row || typeof row !== "object") return [];
  const keys = Object.keys(row).filter((k) => k !== "__proto__" && k !== "constructor");
  const seen = new Set();
  const out = [];
  for (const k of PRIORITY_KEYS) {
    if (keys.includes(k) && !seen.has(k)) {
      out.push(k);
      seen.add(k);
    }
  }
  for (const k of [...keys].sort((a, b) => a.localeCompare(b))) {
    if (!seen.has(k)) {
      out.push(k);
      seen.add(k);
    }
  }
  return out;
};

/**
 * @param {string} key
 * @param {unknown} value
 * @param {(iso: string) => string} formatDate
 * @returns {string}
 */
const formatPrimitive = (key, value, formatDate) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return "—";
    const looksIso = /^\d{4}-\d{2}-\d{2}/.test(t) && t.length >= 10;
    if (looksIso && DATE_KEY_HINT.test(key)) {
      const formatted = formatDate(t);
      return formatted || t;
    }
    return t;
  }
  return String(value);
};

/**
 * @param {string} key
 * @param {unknown} value
 * @param {(iso: string) => string} formatDate
 * @returns {{ kind: "text" | "json"; text: string }}
 */
export const formatAdminUserFieldPresentation = (key, value, formatDate) => {
  if (value === null || value === undefined) {
    return { kind: "text", text: "—" };
  }
  if (typeof value === "object") {
    try {
      return { kind: "json", text: JSON.stringify(value, null, 2) };
    } catch {
      return { kind: "text", text: String(value) };
    }
  }
  return { kind: "text", text: formatPrimitive(key, value, formatDate) };
};

/**
 * @param {unknown} row
 * @returns {string}
 */
export const adminUserDisplayInitials = (row) => {
  if (!row || typeof row !== "object") return "?";
  const first = String(row.first_name ?? row.firstName ?? "").trim();
  const last = String(row.last_name ?? row.lastName ?? "").trim();
  const a = first.charAt(0).toUpperCase();
  const b = last.charAt(0).toUpperCase();
  if (a && b) return `${a}${b}`;
  if (a) return a + (first.charAt(1) || "").toUpperCase();
  const email = String(row.email ?? "").trim();
  if (email.length >= 2) return email.slice(0, 2).toUpperCase();
  const id = row.id ?? row._id;
  if (id != null && String(id).length) return String(id).slice(0, 2).toUpperCase();
  return "?";
};

/**
 * @param {unknown} row
 * @returns {string}
 */
export const adminUserDisplayName = (row) => {
  if (!row || typeof row !== "object") return "";
  const dn = String(row.display_name ?? row.displayName ?? row.name ?? "").trim();
  if (dn) return dn;
  const first = String(row.first_name ?? row.firstName ?? "").trim();
  const last = String(row.last_name ?? row.lastName ?? "").trim();
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full;
};
