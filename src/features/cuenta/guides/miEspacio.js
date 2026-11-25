/**
 * La guía del inicio de la cuenta (`features/cuenta/pages/CuentaDashboardHome.jsx`). Anclajes:
 * `[data-tour-mi-espacio="…"]`. Textos en `cuenta.guias.miEspacio.*`. Dónde está cada
 * sección lo cuenta la bienvenida (`guiaCuenta.js`, el «?» de arriba); esta explica lo
 * que hay en la propia página.
 *
 * Aquí solo los pasos: datos, sin JSX ni importaciones, porque los lee también la prueba
 * de las guías, que corre en node (`npm run test:recorrido`). La guía se arma en
 * `lib/guias/guiaMiEspacio.js`, con las demás.
 */
export const PASOS_MI_ESPACIO = [
  { titulo: "cuenta.guias.miEspacio.queHay.titulo", texto: "cuenta.guias.miEspacio.queHay.texto" },
  {
    clave: "estado",
    titulo: "cuenta.guias.miEspacio.estado.titulo",
    texto: "cuenta.guias.miEspacio.estado.texto",
    puntos: ["cuenta.guias.miEspacio.estado.p1", "cuenta.guias.miEspacio.estado.p2"],
  },
  { clave: "cifras", titulo: "cuenta.guias.miEspacio.cifras.titulo", texto: "cuenta.guias.miEspacio.cifras.texto" },
  { clave: "usos", titulo: "cuenta.guias.miEspacio.usos.titulo", texto: "cuenta.guias.miEspacio.usos.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];
