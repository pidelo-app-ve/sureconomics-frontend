import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";

/** Las variantes con rótulo propio en el diccionario (`portada.relleno.*`). */
const VARIANTES = ["chart", "building", "growth"];

export const PlaceholderImage = ({ variant = "chart", className = "", hero = false }) => {
  const { t } = useIdioma();
  const label = VARIANTES.includes(variant)
    ? t(`portada.relleno.${variant}`)
    : t("portada.relleno.articulo");
  const classes = [
    "se-placeholder",
    hero ? "se-placeholder--hero" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-hidden="true">
      {label}
    </div>
  );
};

PlaceholderImage.propTypes = {
  variant: PropTypes.oneOf(["chart", "building", "growth"]),
  className: PropTypes.string,
  hero: PropTypes.bool,
};
