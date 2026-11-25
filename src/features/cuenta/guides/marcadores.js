/**
 * La guía de «Marcadores», las piezas guardadas (`features/cuenta/pages/CuentaMarcadores.jsx`).
 * Anclajes: `[data-tour-marcadores="…"]`. Textos en `cuenta.guias.marcadores.*`.
 *
 * Aquí solo los pasos: datos, sin JSX ni importaciones, porque los lee también la prueba
 * de las guías, que corre en node (`npm run test:recorrido`). La guía se arma en
 * `lib/guias/guiaMarcadores.js`, con las demás.
 */
export const PASOS_MARCADORES = [
  { titulo: "cuenta.guias.marcadores.queHay.titulo", texto: "cuenta.guias.marcadores.queHay.texto" },
  { clave: "lista", titulo: "cuenta.guias.marcadores.lista.titulo", texto: "cuenta.guias.marcadores.lista.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];
