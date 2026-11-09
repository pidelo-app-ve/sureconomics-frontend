/**
 * La bienvenida a la cuenta del lector (`pages/cuenta/CuentaDashboardLayout.jsx`): salta
 * sola la primera vez (la marca «ya la vio» vive en el servidor, `recorridos_vistos`) y
 * se repite desde el botón «?» de la barra de arriba. Anclajes: `[data-tour-cuenta="…"]`
 * en cada enlace del menú. Los pasos con `abrirMenu` abren el menú lateral en el
 * teléfono, donde está plegado.
 *
 * Los textos son claves de `cuenta.guias.cuenta.*` (la cuenta se lee en dos idiomas).
 */
import { crearRecorrido } from "../recorridoVista.js";

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

export const recorridoCuenta = crearRecorrido("cuenta", PASOS_CUENTA, { traducir: true });
