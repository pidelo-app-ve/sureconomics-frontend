/**
 * La guía de «Mi perfil» (`features/cuenta/pages/CuentaPerfil.jsx`). Anclajes:
 * `[data-tour-perfil="…"]`. Textos en `cuenta.guias.perfil.*`.
 *
 * Aquí solo los pasos: datos, sin JSX ni importaciones, porque los lee también la prueba
 * de las guías, que corre en node (`npm run test:recorrido`). La guía se arma en
 * `lib/guias/guiaPerfil.js`, con las demás.
 */
export const PASOS_PERFIL = [
  { titulo: "cuenta.guias.perfil.queHay.titulo", texto: "cuenta.guias.perfil.queHay.texto" },
  { clave: "retrato", titulo: "cuenta.guias.perfil.retrato.titulo", texto: "cuenta.guias.perfil.retrato.texto" },
  { clave: "nombre", titulo: "cuenta.guias.perfil.nombre.titulo", texto: "cuenta.guias.perfil.nombre.texto" },
  { clave: "datos", titulo: "cuenta.guias.perfil.datos.titulo", texto: "cuenta.guias.perfil.datos.texto" },
  { clave: "guardar", titulo: "cuenta.guias.perfil.guardar.titulo", texto: "cuenta.guias.perfil.guardar.texto" },
  { clave: "sesiones", titulo: "cuenta.guias.perfil.sesiones.titulo", texto: "cuenta.guias.perfil.sesiones.texto" },
  { clave: "guia", titulo: "cuenta.guias.perfil.guia.titulo", texto: "cuenta.guias.perfil.guia.texto" },
];
