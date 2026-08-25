import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/**
 * The formats and the two filter axes.
 *
 * Note the shape of what is here and what is not. Formats and topics have no
 * create and no delete: a format is nearer to schema than to data — posts point
 * at its slug and two publish-time constraints name it — and the fourteen topics
 * are the editorial line, agreed once. Only places can grow, because a country
 * the region did not have is a real gap. The panel offers exactly the operations
 * the backend allows, so nothing on screen promises something the API refuses.
 */

const listOf = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.data)) return raw.data;
  return [];
};

// —— Formats ——

export const listAdminFormats = async () => listOf(await adminRequest("/admin/formats"));

export const patchAdminFormat = async (slug, body) =>
  unwrapEntity(
    await adminRequest(`/admin/formats/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      json: body,
    })
  );

// —— Topics ——

export const listAdminTopics = async () => listOf(await adminRequest("/admin/topics"));

export const patchAdminTopic = async (id, body) =>
  unwrapEntity(
    await adminRequest(`/admin/topics/${encodeURIComponent(id)}`, {
      method: "PATCH",
      json: body,
    })
  );

// —— Places ——

export const listAdminPlaces = async () => listOf(await adminRequest("/admin/places"));

export const createAdminPlace = async (body) =>
  unwrapEntity(await adminRequest("/admin/places", { method: "POST", json: body }));

export const patchAdminPlace = async (id, body) =>
  unwrapEntity(
    await adminRequest(`/admin/places/${encodeURIComponent(id)}`, {
      method: "PATCH",
      json: body,
    })
  );

export const deleteAdminPlace = async (id) =>
  adminRequest(`/admin/places/${encodeURIComponent(id)}`, { method: "DELETE" });

/**
 * Rebuild the parent/child shape from the flat admin rows.
 *
 * The admin endpoint returns them flat with `parent_id` because the screen is a
 * table, but the editor's picker needs countries grouped under their region.
 */
/**
 * The place rows, arranged the two ways the panel needs them.
 *
 * `filas` is the whole tree in reading order with each row's depth, which is all
 * the Lugares table wants. `groups` is every node that holds countries directly --
 * the five regions, and any continent carrying a country with no region between --
 * which is what the pickers render.
 *
 * Grouping is by parent id rather than by level. Selecting `level === "region"`
 * was the same thing while every country sat under a region, and became a quiet
 * omission the moment one did not: China hangs off Asia, and would simply not have
 * appeared in the editor, with no error to notice.
 */
export const groupPlaces = (rows) => {
  const byId = new Map(rows.map((row) => [row.id, row]));

  const hijos = new Map();
  rows.forEach((row) => {
    const key = row.parent_id ?? null;
    if (!hijos.has(key)) hijos.set(key, []);
    hijos.get(key).push(row);
  });
  hijos.forEach((lista) =>
    lista.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
  );

  const root = rows.find((row) => row.level === "global") ?? null;

  const filas = [];
  const walk = (node, nivel) => {
    filas.push({ ...node, nivel });
    (hijos.get(node.id) ?? []).forEach((hijo) => walk(hijo, nivel + 1));
  };
  if (root) walk(root, 0);

  const groups = filas
    .filter((node) => (hijos.get(node.id) ?? []).some((h) => h.level === "country"))
    .map((node) => ({
      ...node,
      children: (hijos.get(node.id) ?? []).filter((h) => h.level === "country"),
    }));

  return { root, filas, groups, byId };
};
