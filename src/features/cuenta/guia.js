/**
 * Los pasos de las nueve guías de la cuenta del lector: la bienvenida (el «?» de arriba)
 * y la de cada página («Guía»). Los textos son claves de `cuenta.guias.*` (la cuenta se
 * lee en dos idiomas): qué es cada cosa y para qué sirve, sin jerga.
 *
 * Las guías en sí (`crearRecorrido`, con `{ traducir: true }`) siguen en `lib/guias/`, con
 * las demás: allí las encuentran el botón «Guía» y la prueba de todas las guías. Los
 * pasos viven aquí para que quien cambie una página de la cuenta tenga sus textos al lado.
 *
 * Solo datos, sin JSX ni importaciones: los lee también la prueba de las guías, que corre
 * en node sin compilar nada (`npm run test:recorrido`). Por eso las guías los importan de
 * este archivo y no de `index.js` (ver `src/arquitectura.test.mjs`).
 */

/**
 * La bienvenida a la cuenta del lector (`features/cuenta/pages/CuentaDashboardLayout.jsx`): salta
 * sola la primera vez (la marca «ya la vio» vive en el servidor, `recorridos_vistos`) y
 * se repite desde el botón «?» de la barra de arriba. Anclajes: `[data-tour-cuenta="…"]`
 * en cada enlace del menú. Los pasos con `abrirMenu` abren el menú lateral en el
 * teléfono, donde está plegado. Textos en `cuenta.guias.cuenta.*`.
 *
 * Se arma en `lib/guias/guiaCuenta.js`.
 */
export const PASOS_CUENTA = [
  { titulo: "cuenta.guias.cuenta.bienvenida.titulo", texto: "cuenta.guias.cuenta.bienvenida.texto" },
  { clave: "inicio", abrirMenu: true, titulo: "cuenta.guias.cuenta.inicio.titulo", texto: "cuenta.guias.cuenta.inicio.texto" },
  { clave: "lo-mio", abrirMenu: true, titulo: "cuenta.guias.cuenta.loMio.titulo", texto: "cuenta.guias.cuenta.loMio.texto" },
  { clave: "marcadores", abrirMenu: true, titulo: "cuenta.guias.cuenta.marcadores.titulo", texto: "cuenta.guias.cuenta.marcadores.texto" },
  { clave: "temas", abrirMenu: true, titulo: "cuenta.guias.cuenta.temas.titulo", texto: "cuenta.guias.cuenta.temas.texto" },
  { clave: "propuestas", abrirMenu: true, titulo: "cuenta.guias.cuenta.propuestas.titulo", texto: "cuenta.guias.cuenta.propuestas.texto" },
  { clave: "perfil", abrirMenu: true, titulo: "cuenta.guias.cuenta.perfil.titulo", texto: "cuenta.guias.cuenta.perfil.texto" },
  { clave: "ayuda", titulo: "cuenta.guias.cuenta.ayuda.titulo", texto: "cuenta.guias.cuenta.ayuda.texto" },
];

/**
 * La guía del inicio de la cuenta (`features/cuenta/pages/CuentaDashboardHome.jsx`). Anclajes:
 * `[data-tour-mi-espacio="…"]`. Textos en `cuenta.guias.miEspacio.*`. Dónde está cada
 * sección lo cuenta la bienvenida (`guiaCuenta.js`, el «?» de arriba); esta explica lo
 * que hay en la propia página.
 *
 * Se arma en `lib/guias/guiaMiEspacio.js`.
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

/**
 * La guía de «Mi perfil» (`features/cuenta/pages/CuentaPerfil.jsx`). Anclajes:
 * `[data-tour-perfil="…"]`. Textos en `cuenta.guias.perfil.*`.
 *
 * Se arma en `lib/guias/guiaPerfil.js`.
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

/**
 * La guía de «Lo mío», los módulos comprados (`features/cuenta/pages/CuentaLoMio.jsx`). Anclajes:
 * `[data-tour-lo-mio="…"]`. Textos en `cuenta.guias.loMio.*`. Con la lista vacía (aún no
 * ha comprado nada) los pasos de los módulos oscurecen todo y el texto vale solo.
 *
 * Se arma en `lib/guias/guiaLoMio.js`.
 */
export const PASOS_LO_MIO = [
  { titulo: "cuenta.guias.loMio.queHay.titulo", texto: "cuenta.guias.loMio.queHay.texto" },
  { clave: "modulos", titulo: "cuenta.guias.loMio.modulos.titulo", texto: "cuenta.guias.loMio.modulos.texto" },
  { clave: "recibo", titulo: "cuenta.guias.loMio.recibo.titulo", texto: "cuenta.guias.loMio.recibo.texto" },
  {
    clave: "abrir",
    titulo: "cuenta.guias.loMio.abrir.titulo",
    puntos: ["cuenta.guias.loMio.abrir.p1", "cuenta.guias.loMio.abrir.p2", "cuenta.guias.loMio.abrir.p3"],
  },
  { clave: "pendientes", titulo: "cuenta.guias.loMio.pendientes.titulo", texto: "cuenta.guias.loMio.pendientes.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

/**
 * La guía de «Marcadores», las piezas guardadas (`features/cuenta/pages/CuentaMarcadores.jsx`).
 * Anclajes: `[data-tour-marcadores="…"]`. Textos en `cuenta.guias.marcadores.*`.
 *
 * Se arma en `lib/guias/guiaMarcadores.js`.
 */
export const PASOS_MARCADORES = [
  { titulo: "cuenta.guias.marcadores.queHay.titulo", texto: "cuenta.guias.marcadores.queHay.texto" },
  { clave: "lista", titulo: "cuenta.guias.marcadores.lista.titulo", texto: "cuenta.guias.marcadores.lista.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

/**
 * La guía de «Mis temas» (`features/cuenta/pages/CuentaTemas.jsx`). Anclajes:
 * `[data-tour-mis-temas="…"]`. Textos en `cuenta.guias.misTemas.*`. El nombre no es
 * «temas»: ese es el de la guía de Temas del panel (`guiaTemas.js`).
 *
 * Se arma en `lib/guias/guiaMisTemas.js`.
 */
export const PASOS_MIS_TEMAS = [
  { titulo: "cuenta.guias.misTemas.queHay.titulo", texto: "cuenta.guias.misTemas.queHay.texto" },
  { clave: "siguiendo", titulo: "cuenta.guias.misTemas.siguiendo.titulo", texto: "cuenta.guias.misTemas.siguiendo.texto" },
  { clave: "otros", titulo: "cuenta.guias.misTemas.otros.titulo", texto: "cuenta.guias.misTemas.otros.texto" },
  { clave: "nuevo", titulo: "cuenta.guias.misTemas.nuevo.titulo", texto: "cuenta.guias.misTemas.nuevo.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

/**
 * Las guías de «Mis propuestas» en la cuenta del lector: la lista
 * (`features/cuenta/pages/CuentaEnviosList.jsx`, anclajes `[data-tour-mis-propuestas="…"]`) y una
 * propuesta (`features/cuenta/pages/CuentaEnvioDetail.jsx`, anclajes `[data-tour-mi-propuesta="…"]`).
 * Dos guías porque son dos páginas, cada una con su botón «Guía». La del formulario para
 * proponer o corregir una es `guiaPropuesta.js`; la de la redacción, que las revisa,
 * `guiaPropuestasDeLectores.js`. Textos en `cuenta.guias.misPropuestas.*` y
 * `cuenta.guias.miPropuesta.*`; los estados, en `cuenta.guias.estados.*`, los mismos en
 * las dos.
 *
 * Se arma en `lib/guias/guiaMisPropuestas.js`.
 */
export const PASOS_MIS_PROPUESTAS = [
  { titulo: "cuenta.guias.misPropuestas.queHay.titulo", texto: "cuenta.guias.misPropuestas.queHay.texto" },
  { clave: "nueva", titulo: "cuenta.guias.misPropuestas.nueva.titulo", texto: "cuenta.guias.misPropuestas.nueva.texto" },
  { clave: "lista", titulo: "cuenta.guias.misPropuestas.lista.titulo", texto: "cuenta.guias.misPropuestas.lista.texto" },
  {
    clave: "estado",
    titulo: "cuenta.guias.estados.titulo",
    puntos: [
      "cuenta.guias.estados.enviado",
      "cuenta.guias.estados.enRevision",
      "cuenta.guias.estados.aceptado",
      "cuenta.guias.estados.rechazado",
    ],
  },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

export const PASOS_MI_PROPUESTA = [
  { titulo: "cuenta.guias.miPropuesta.queHay.titulo", texto: "cuenta.guias.miPropuesta.queHay.texto" },
  {
    clave: "estado",
    titulo: "cuenta.guias.estados.titulo",
    puntos: [
      "cuenta.guias.estados.enviado",
      "cuenta.guias.estados.enRevision",
      "cuenta.guias.estados.aceptado",
      "cuenta.guias.estados.rechazado",
    ],
  },
  { clave: "editar", titulo: "cuenta.guias.miPropuesta.editar.titulo", texto: "cuenta.guias.miPropuesta.editar.texto" },
  { clave: "foto", titulo: "cuenta.guias.miPropuesta.foto.titulo", texto: "cuenta.guias.miPropuesta.foto.texto" },
  { clave: "texto", titulo: "cuenta.guias.miPropuesta.texto.titulo", texto: "cuenta.guias.miPropuesta.texto.texto" },
  { clave: "notas", titulo: "cuenta.guias.miPropuesta.notas.titulo", texto: "cuenta.guias.miPropuesta.notas.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

/**
 * La guía de «Proponer una pieza» y de su edición (`features/cuenta/components/SubmissionForm.jsx`).
 * Anclajes: `[data-tour-propuesta="…"]`. Textos en `cuenta.guias.propuesta.*`.
 *
 * Se arma en `lib/guias/guiaPropuesta.js`.
 */
export const PASOS_PROPUESTA = [
  { titulo: "cuenta.guias.propuesta.queHay.titulo", texto: "cuenta.guias.propuesta.queHay.texto" },
  { clave: "aviso", titulo: "cuenta.guias.propuesta.aviso.titulo", texto: "cuenta.guias.propuesta.aviso.texto" },
  { clave: "formato", titulo: "cuenta.guias.propuesta.formato.titulo", puntos: ["cuenta.guias.propuesta.formato.p1", "cuenta.guias.propuesta.formato.p2"] },
  { clave: "titulo", titulo: "cuenta.guias.propuesta.titulo.titulo", texto: "cuenta.guias.propuesta.titulo.texto" },
  { clave: "resumen", titulo: "cuenta.guias.propuesta.resumen.titulo", texto: "cuenta.guias.propuesta.resumen.texto" },
  { clave: "contenido", titulo: "cuenta.guias.propuesta.contenido.titulo", texto: "cuenta.guias.propuesta.contenido.texto" },
  { clave: "foto", titulo: "cuenta.guias.propuesta.foto.titulo", texto: "cuenta.guias.propuesta.foto.texto" },
  {
    clave: "acciones",
    titulo: "cuenta.guias.propuesta.acciones.titulo",
    puntos: ["cuenta.guias.propuesta.acciones.p1", "cuenta.guias.propuesta.acciones.p2", "cuenta.guias.propuesta.acciones.p3"],
  },
  { clave: "guia", titulo: "cuenta.guias.propuesta.guia.titulo", texto: "cuenta.guias.propuesta.guia.texto" },
];
