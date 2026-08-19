import { adminRequest } from "../lib/api";
import { createApiClient } from "./apiClient";
import { unwrapEntity } from "./adminResponseUtils";

/**
 * The market strip.
 *
 * Read publicly, written from the panel. There is no market feed: these are figures
 * the newsroom types in, which is why the caption travels with them — a row of
 * numbers with no stamp saying which close they belong to reads as live data.
 */

const defaultClient = (() => {
  try {
    return createApiClient();
  } catch {
    return null;
  }
})();

const client = () => defaultClient ?? createApiClient();

const normalize = (raw) => ({
  caption: raw?.caption ?? null,
  sourceUrl: raw?.source_url ?? null,
  indicators: (raw?.indicators ?? []).map((item) => ({
    label: String(item.label ?? ""),
    value: String(item.value ?? ""),
    direction: ["up", "down", "flat"].includes(item.direction) ? item.direction : "flat",
  })),
  updatedAt: raw?.updated_at ?? null,
});

export const getMarketTicker = async () => {
  const payload = await client().request("/market-ticker");
  return normalize(payload);
};

export const getAdminMarketTicker = async () =>
  normalize(unwrapEntity(await adminRequest("/admin/settings/market-ticker")));

/** Replace the whole strip. Anything left out is gone — that is the point. */
export const putAdminMarketTicker = async ({ caption, sourceUrl, indicators }) =>
  normalize(
    unwrapEntity(
      await adminRequest("/admin/settings/market-ticker", {
        method: "PUT",
        json: {
          caption: caption?.trim() || null,
          source_url: sourceUrl?.trim() || null,
          indicators: (indicators ?? [])
            .map((item) => ({
              label: item.label?.trim() ?? "",
              value: item.value?.trim() ?? "",
              direction: item.direction || "flat",
            }))
            .filter((item) => item.label && item.value),
        },
      })
    )
  );
