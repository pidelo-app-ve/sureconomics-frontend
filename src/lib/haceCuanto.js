/**
 * «hace 12 minutos», «hace 3 horas»: cuándo llegó lo último de una sincronización. Para
 * el panel (en español, de ahí que no pase por el i18n): «En redes» y «Canal de YouTube».
 *
 * No es la `haceCuanto` de los titulares (`features/titulares/useHeadlines.js`), que va
 * por el i18n y escribe corto («Hace 4 min», sin días). Juntarlas cambiaría lo que se lee
 * en una de las dos: por eso son dos.
 */
export const haceCuanto = (iso) => {
  if (!iso) return "nunca";
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} ${min === 1 ? "minuto" : "minutos"}`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} ${h === 1 ? "hora" : "horas"}`;
  return `hace ${Math.round(h / 24)} días`;
};
