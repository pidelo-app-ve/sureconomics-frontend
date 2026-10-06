import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
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
  const { t } = useIdioma();
  useMetaPagina({
    title: t("listados.informes.meta.titulo", { marca: BRAND.name }),
    description: t("listados.informes.meta.descripcion", { marca: BRAND.name }),
  });

  return (
    <main className="se-blog se-articles" role="main">
      <FormatListing formatoApi="informe" key="informe" />
    </main>
  );
};
