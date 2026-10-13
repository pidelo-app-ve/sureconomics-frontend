import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";

/**
 * El titular de una pieza en una tarjeta o una lista, en el idioma en que está.
 *
 * En `/en`, una pieza sin versión en inglés enseña su titular en español: se marca con
 * `lang="es"` (para que un lector de pantalla no lo pronuncie en inglés) y con una
 * etiqueta discreta «ES», para que quien lee en inglés sepa antes de abrirla que el
 * texto está en español. En español, y en las piezas traducidas, es el titular sin más.
 *
 * Va dentro del enlace o del encabezado que ya tenía cada tarjeta: no cambia la maqueta.
 */
export const TituloDePieza = ({ pieza }) => {
  const { t, lang } = useIdioma();
  if (lang !== "en" || pieza.tieneIngles) return pieza.titulo;
  return (
    <>
      <span lang="es">{pieza.titulo}</span>{" "}
      <abbr className="se-marca-idioma" title={t("idioma.marcaEspanolTitulo")}>
        {t("idioma.marcaEspanol")}
      </abbr>
    </>
  );
};

TituloDePieza.propTypes = {
  pieza: PropTypes.shape({
    titulo: PropTypes.string,
    tieneIngles: PropTypes.bool,
  }).isRequired,
};

export default TituloDePieza;
