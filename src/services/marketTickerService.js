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
    // La variacion y de donde sale la cifra. Solo vienen por la via automatica: lo
    // escrito a mano no las tiene, y ahi quedan nulas en vez de inventadas.
    change: typeof item.change === "number" ? item.change : null,
    source: item.source ?? null,
  })),
  updatedAt: raw?.updated_at ?? null,
  /** El cierre al que pertenecen las cifras. Nulo en lo escrito a mano. */
  effectiveDate: raw?.effective_date ?? null,
  /** Si lo que se ve lo escribio la redaccion en vez de leerse de las fuentes. */
  manual: Boolean(raw?.manual),
  sources: raw?.sources ?? [],
});

/**
 * El cintillo que se pinta en la portada.
 *
 * Pide `/cinta` y no `/market-ticker`, y la diferencia importa: `/cinta` es el endpoint
 * fusionado -- lee el BCV y la Bolsa solo, y lo que la redaccion escriba a mano gana
 * sobre eso. `/market-ticker` sigue existiendo y sirve solo lo manual, para lo que
 * apunte ahi desde antes.
 *
 * Y `/cinta` **calla los datos de mas de dos dias**. Eso es lo que arregla el problema
 * de fondo: el cintillo anterior llevaba seis semanas publicando el cierre del 21 de
 * julio con fecha de hoy.
 */
export const getMarketTicker = async () => {
  const payload = await client().request("/cinta");
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
