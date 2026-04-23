import { adminPick } from "./adminPick";
import { formatSubmissionDate } from "./submissionDisplay";
import { stripApiDataLayers } from "./unwrapApiData";

/**
 * API may return `{ success, data: { ...fields } }` or the inner object only.
 * Does not treat a model's own `data` JSON field as an envelope when entity fields exist at the top level.
 * @param {unknown} raw
 * @returns {Record<string, unknown> | null}
 */
export const unwrapEnvelope = (raw) => {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
  const out = stripApiDataLayers(/** @type {Record<string, unknown>} */ (raw));
  return out && typeof out === "object" ? out : null;
};

/**
 * Read a scalar field from the first object that defines it (supports numeric 0).
 * @param {(Record<string, unknown>|null|undefined)[]} sources
 * @param {string[]} keys
 */
const firstScalarFromSources = (sources, keys) => {
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const k of keys) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      const v = src[k];
      if (v === undefined || v === null) continue;
      if (typeof v === "string" && v.trim() === "") continue;
      return String(v).trim();
    }
  }
  return "";
};

const asObjects = (submissionRow, profile) =>
  [profile, submissionRow?.user, submissionRow?.author, submissionRow?.submitter, submissionRow].filter(
    (x) => x && typeof x === "object"
  );

const pickChain = (submissionRow, profile, keys) => {
  for (const src of asObjects(submissionRow, profile)) {
    const v = adminPick(src, keys, "");
    if (v !== "" && v !== "—") return String(v).trim();
  }
  return "";
};

const readCollab = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const v =
    obj.can_submit_collaborations ??
    obj.collaborative_submissions_enabled ??
    obj.collaborative ??
    obj.is_collaborator ??
    obj.can_submit_collaborative_articles;
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (v === 1 || v === "1" || v === "true") return "Sí";
  if (v === 0 || v === "0" || v === "false") return "No";
  return "";
};

const resolveUserId = (submissionRow, profile) => {
  const flat = pickChain(submissionRow, profile, ["user_id", "userId", "submitter_id", "author_id", "consumer_id"]);
  if (flat) return flat;
  const nested =
    adminPick(submissionRow?.user, ["user_id", "userId", "id"], "") ||
    adminPick(submissionRow?.author, ["user_id", "userId", "id"], "") ||
    adminPick(submissionRow?.submitter, ["user_id", "userId", "id"], "");
  if (nested && nested !== "—") return String(nested).trim();
  if (profile && typeof profile === "object") {
    const id = adminPick(profile, ["id"], "");
    if (id && id !== "—") return String(id).trim();
  }
  return "";
};

/**
 * Same user id resolution as the author board, for fetching `/admin/users/:id`.
 * @param {Record<string, unknown>|null|undefined} submissionNorm already-unwrapped submission row
 * @param {Record<string, unknown>|null|undefined} profileNorm already-unwrapped profile (optional)
 */
export const resolveSubmissionAuthorUserIdFromNormalized = (submissionNorm, profileNorm) => {
  if (!submissionNorm || typeof submissionNorm !== "object") return "";
  const prof = profileNorm && typeof profileNorm === "object" ? profileNorm : null;
  return resolveUserId(submissionNorm, prof);
};

/**
 * @param {Record<string, unknown>|null} submissionRow
 * @param {Record<string, unknown>|null} profile
 * @returns {{ userId: string, displayName: string, initials: string, adminUserHref: string | null, rows: { label: string, value: string }[] }}
 */
export const buildSubmissionAuthorBoard = (submissionRow, profile) => {
  const submissionNorm = unwrapEnvelope(submissionRow) ?? submissionRow;
  const profileNorm = unwrapEnvelope(profile) ?? profile;

  if (!submissionNorm || typeof submissionNorm !== "object") {
    return { userId: "", displayName: "", initials: "?", adminUserHref: null, rows: [] };
  }

  const userId = resolveSubmissionAuthorUserIdFromNormalized(submissionNorm, profileNorm);

  const first = pickChain(submissionNorm, profileNorm, ["first_name", "firstName"]);
  const last = pickChain(submissionNorm, profileNorm, ["last_name", "lastName"]);
  const combined = [first, last].filter(Boolean).join(" ").trim();
  const displayName =
    combined ||
    pickChain(submissionNorm, profileNorm, ["author_name", "submitter_name", "submitter_display_name"]) ||
    pickChain(submissionNorm, profileNorm, ["name", "full_name", "fullName", "display_name", "displayName"]) ||
    pickChain(submissionNorm, profileNorm, ["username", "user_name"]) ||
    pickChain(submissionNorm, profileNorm, ["email", "mail"]) ||
    "";

  const initialsSource = combined || displayName || "?";
  const parts = initialsSource.split(/\s+/).filter(Boolean);
  const initials = (parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : initialsSource.slice(0, 2) || "?").toUpperCase();

  const rows = [];

  if (displayName) rows.push({ label: "Nombre", value: displayName });

  const email = pickChain(submissionNorm, profileNorm, ["email", "mail"]);
  if (email) rows.push({ label: "Correo", value: email });

  const username = pickChain(submissionNorm, profileNorm, ["username", "user_name"]);
  if (username) rows.push({ label: "Usuario", value: username });

  const authorSources = [
    profileNorm,
    submissionNorm?.user,
    submissionNorm?.author,
    submissionNorm?.submitter,
    submissionNorm,
  ].filter((x) => x && typeof x === "object");

  const age = firstScalarFromSources(authorSources, ["age", "Age"]);
  if (age !== "") rows.push({ label: "Edad", value: age });

  const sex = firstScalarFromSources(authorSources, ["sex", "gender", "Gender"]);
  if (sex !== "") rows.push({ label: "Sexo", value: sex });

  const country = firstScalarFromSources(authorSources, ["country", "Country"]);
  if (country !== "") rows.push({ label: "País", value: country });

  const city = firstScalarFromSources(authorSources, ["city", "City"]);
  if (city !== "") rows.push({ label: "Ciudad", value: city });

  const occupation = firstScalarFromSources(authorSources, [
    "occupation",
    "Occupation",
    "job",
    "job_title",
    "profession",
    "profession_title",
  ]);
  if (occupation !== "") rows.push({ label: "Ocupación", value: occupation });

  const phone = firstScalarFromSources(authorSources, ["phone_number", "phoneNumber", "phone", "telephone"]);
  if (phone !== "") rows.push({ label: "Teléfono", value: phone });

  for (const src of asObjects(submissionNorm, profileNorm)) {
    const collab = readCollab(src);
    if (collab) {
      rows.push({ label: "Colaboraciones", value: collab });
      break;
    }
  }

  if (profileNorm && typeof profileNorm === "object") {
    const ca = adminPick(profileNorm, ["created_at", "createdAt"], "");
    if (ca && ca !== "—") {
      rows.push({ label: "Registro del usuario", value: formatSubmissionDate(ca) });
    }
  }

  const lastLogin =
    profileNorm && typeof profileNorm === "object"
      ? adminPick(profileNorm, ["last_login_at", "lastLoginAt", "last_seen_at"], "")
      : "";
  if (lastLogin && lastLogin !== "—") {
    rows.push({ label: "Último acceso", value: formatSubmissionDate(lastLogin) });
  }

  if (profileNorm && typeof profileNorm === "object") {
    const role = adminPick(profileNorm, ["role", "roles"], "");
    if (role && role !== "—") rows.push({ label: "Rol", value: role });
  }

  const dedup = [];
  const seen = new Set();
  for (const r of rows) {
    const k = `${r.label}:${r.value}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(r);
  }

  const adminUserHref = userId ? `/admin/users/${encodeURIComponent(userId)}` : null;

  return { userId, displayName, initials, adminUserHref, rows: dedup };
};
