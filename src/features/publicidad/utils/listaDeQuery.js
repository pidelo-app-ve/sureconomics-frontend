/**
 * Una lista de valores (tema, país) tal como viaja en la dirección: `a,b,c`, o `null`
 * si no hay nada que mandar. Sin dependencias: `npm run test:publicidad`.
 */
export const listaDeQuery = (valor) => {
  if (!valor) return null;
  // También un `Set`: la selección del lector en los listados viaja así
  // (`useContentFilter`), y con `[valor]` un Set se escribía `[object Object]` en la
  // dirección, así que el patrocinio por tema o país nunca coincidía.
  const lista = valor instanceof Set ? [...valor] : Array.isArray(valor) ? valor : [valor];
  const partes = lista.map((v) => String(v ?? "").trim()).filter(Boolean);
  return partes.length ? partes.join(",") : null;
};
