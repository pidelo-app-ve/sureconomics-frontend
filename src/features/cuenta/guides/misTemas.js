/**
 * La guía de «Mis temas» (`features/cuenta/pages/CuentaTemas.jsx`). Anclajes:
 * `[data-tour-mis-temas="…"]`. Textos en `cuenta.guias.misTemas.*`. El nombre no es
 * «temas»: ese es el de la guía de Temas del panel (`guiaTemas.js`).
 *
 * Aquí solo los pasos: datos, sin JSX ni importaciones, porque los lee también la prueba
 * de las guías, que corre en node (`npm run test:recorrido`). La guía se arma en
 * `lib/guias/guiaMisTemas.js`, con las demás.
 */
export const PASOS_MIS_TEMAS = [
  { titulo: "cuenta.guias.misTemas.queHay.titulo", texto: "cuenta.guias.misTemas.queHay.texto" },
  { clave: "siguiendo", titulo: "cuenta.guias.misTemas.siguiendo.titulo", texto: "cuenta.guias.misTemas.siguiendo.texto" },
  { clave: "otros", titulo: "cuenta.guias.misTemas.otros.titulo", texto: "cuenta.guias.misTemas.otros.texto" },
  { clave: "nuevo", titulo: "cuenta.guias.misTemas.nuevo.titulo", texto: "cuenta.guias.misTemas.nuevo.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];
