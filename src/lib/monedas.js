import { formatearNumero } from "../i18n/motor";

/**
 * Cuánto vale un dólar en una moneda, escrito para leerse: dos decimales a partir de
 * 100 y cuatro por debajo (0,8333 no se lee con dos). Lo usan la página /monedas y la
 * franja de la portada, para que la misma cifra se escriba igual en los dos sitios.
 */
export const porDolar = (valor, lang) => {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "";
  const decimales = n >= 100 ? 2 : 4;
  return formatearNumero(n, lang, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    useGrouping: "always",
  });
};
