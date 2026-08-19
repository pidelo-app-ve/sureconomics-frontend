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
export const groupPlacesByRegion = (rows) => {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const regions = rows
    .filter((row) => row.level === "region")
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .map((region) => ({ ...region, children: [] }));
  const byRegionId = new Map(regions.map((region) => [region.id, region]));

  rows
    .filter((row) => row.level === "country")
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .forEach((country) => {
      const region = byRegionId.get(country.parent_id);
      if (region) region.children.push(country);
    });

  return {
    root: rows.find((row) => row.level === "global") ?? null,
    regions,
    byId,
  };
};
