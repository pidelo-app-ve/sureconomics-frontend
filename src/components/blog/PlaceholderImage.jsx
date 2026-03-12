import PropTypes from "prop-types";

const PLACEHOLDER_LABELS = {
  chart: "Gráfico",
  building: "Mercados",
  growth: "Crecimiento",
};

export const PlaceholderImage = ({ variant = "chart", className = "", hero = false }) => {
  const label = PLACEHOLDER_LABELS[variant] ?? "Artículo";
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
