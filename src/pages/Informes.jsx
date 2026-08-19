import { useEffect } from "react";
import { BRAND } from "../data/surEconomicsMock";
import { applyPageMeta } from "../lib/seo";
import { FormatListing } from "./Articulos";

/**
 * Informes listing.
 *
 * Its own route because the menu links here directly and the URL predates the
 * redesign, but not its own implementation: this is the same listing as every other
 * format, and the two copies that used to exist would have drifted apart on the
 * first change to either.
 *
 * The gated download lives on each report's own page, not here — the report page is
 * public and complete, and only the file asks for registration.
 */
export const Informes = () => {
  useEffect(() => {
    applyPageMeta({
      title: `Informes — ${BRAND.name}`,
      description: `Informes y reportes de ${BRAND.name}.`,
    });
  }, []);

  return (
    <main className="se-blog se-articles" role="main">
      <FormatListing formatoApi="informe" key="informe" />
    </main>
  );
};
