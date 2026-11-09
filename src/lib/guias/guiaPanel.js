/**
 * La bienvenida al panel (`pages/admin/AdminLayout.jsx`): salta sola la primera vez
 * (la marca «ya la vio» vive en el servidor, `admin_users.recorridos_vistos`) y se
 * repite desde el botón «?» del menú. Anclajes: `[data-tour-panel="…"]`.
 *
 * Los pasos de cada grupo del menú solo salen si ese rol ve el grupo
 * (`recorridoPanelPara`). Los que llevan `abrirMenu` abren el menú en el teléfono.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { menuPara } from "../menuDelPanel.js";

const TEXTO_DEL_GRUPO = {
  redaccion: "El día a día: el listado de piezas, crear una nueva, los archivos (fotos, PDF, audios), las traducciones, los comentarios y las propuestas que mandan los lectores.",
  automatico: "Lo que llega solo y aquí se revisa: titulares en caliente, el resumen diario, la cinta de mercado, el canal de YouTube, las redes y el béisbol.",
  comercial: "Lo que se vende: la publicidad (con el mapa de dónde sale cada anuncio), el boletín Entorno en Viñetas y su lista, y los cursos de Educación.",
  lectores: "Quién lee y cómo participa: la audiencia, las cuentas de lectores y los juegos.",
  sistema: "Temas y lugares con que se clasifica todo, los ajustes de las propuestas, las cuentas del equipo y su perfil.",
};

const pasosPara = (role) => [
  {
    titulo: "Le damos la bienvenida al panel",
    texto:
      "Desde aquí se escribe y publica SurEconomics, se revisa lo que llega solo y se gestiona lo comercial. " +
      "En un minuto le enseñamos dónde está cada cosa.",
  },
  {
    clave: "buscar",
    abrirMenu: true,
    titulo: "Buscar",
    texto:
      "El camino más corto: escriba el nombre de una página o el título de una pieza y pulse Enter. " +
      "Se abre también con Ctrl+K (⌘K en Mac) desde cualquier pantalla.",
  },
  ...menuPara(role).map((g) => ({
    clave: `grupo-${g.clave}`,
    abrirMenu: true,
    titulo: g.nombre,
    texto: TEXTO_DEL_GRUPO[g.clave] ?? g.explica,
  })),
  {
    clave: "ayuda",
    abrirMenu: true,
    titulo: "Vuelva aquí cuando quiera",
    texto:
      "Este botón repite esta visita. Además, las páginas con más cosas (Contenido, el editor, Archivos, " +
      "Publicidad, el boletín…) tienen su botón «Guía» arriba a la derecha.",
  },
];

const porRol = new Map();

/** La bienvenida de este rol: una por rol, para no crear la guía en cada pintada. */
export const recorridoPanelPara = (role) => {
  const clave = role ?? "sin-rol";
  if (!porRol.has(clave)) porRol.set(clave, crearRecorrido("panel", pasosPara(role)));
  return porRol.get(clave);
};

export const PASOS_PANEL_ADMIN = pasosPara("admin");
