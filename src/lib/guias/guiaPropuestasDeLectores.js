/**
 * Las guías de «Propuestas de lectores»: el listado (`pages/admin/AdminSubmissionsList.jsx`,
 * anclajes `[data-tour-propuestas="…"]`) y la revisión de una
 * (`pages/admin/AdminSubmissionDetail.jsx`, anclajes `[data-tour-revisar-propuesta="…"]`).
 * Dos guías porque son dos páginas, cada una con su botón «Guía». La de «Proponer una
 * pieza», la que ve el lector en su cuenta, es otra (`guiaPropuesta.js`).
 */
import { crearRecorrido } from "../recorridoVista.js";

const VOLVER = {
  clave: "guia",
  titulo: "Vuelva aquí cuando quiera",
  texto: "Este botón abre esta guía otra vez.",
};

export const PASOS_PROPUESTAS = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Las piezas que mandan los lectores desde su cuenta para que se publiquen en SurEconomics. Cada una se " +
      "abre, se lee, se le pueden dejar notas al autor y se decide si se acepta o no.",
  },
  {
    clave: "recibir",
    titulo: "Recibir propuestas",
    texto:
      "Abre o cierra la puerta. Con «Propuestas cerradas», ningún lector puede mandar una nueva; las que ya " +
      "llegaron siguen aquí. El cambio se guarda al pulsarlo.",
  },
  {
    clave: "estados",
    titulo: "Filtrar por estado",
    puntos: [
      "Todos: todas las propuestas.",
      "Enviado: recién llegadas; nadie ha decidido nada todavía.",
      "En revisión: alguien del equipo avisó de que la está mirando.",
      "Aceptado: ya se publicó en el sitio.",
      "Rechazado: no se publica.",
    ],
  },
  {
    clave: "lista",
    titulo: "Cada propuesta",
    texto:
      "Veinte por página, de la más nueva a la más vieja. Si ninguna coincide con el filtro, en su lugar sale " +
      "un aviso.",
    puntos: [
      "Número y título: el título abre la propuesta.",
      "Resumen: el resumen que escribió el lector, cortado si es largo.",
      "Estado y fecha: cómo va y cuándo la mandó.",
      "Revisar: abre la propuesta entera para leerla y decidir.",
    ],
  },
  VOLVER,
];

export const recorridoPropuestas = crearRecorrido("propuestas", PASOS_PROPUESTAS);

export const PASOS_REVISAR_PROPUESTA = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Una propuesta de un lector, entera, para leerla y decidir. Arriba, quién la manda; después, la pieza tal " +
      "como la escribió y la decisión; al final, las notas para el autor.",
  },
  {
    clave: "autor",
    titulo: "Quién la manda",
    texto:
      "El nombre del lector y los datos de contacto de su cuenta. «Ver ficha de usuario», si sale, abre su " +
      "ficha en el panel.",
  },
  {
    clave: "pieza",
    titulo: "La propuesta",
    texto:
      "El título, el número, cómo va y cuándo llegó; la foto que propuso, si mandó una; el resumen y el texto. " +
      "Si se acepta, se publica esto tal cual.",
  },
  {
    clave: "decision",
    titulo: "La decisión",
    texto:
      "Se elige el estado y se pulsa «Aplicar estado». El autor ve en su cuenta cómo va. Una propuesta " +
      "aceptada o rechazada ya no puede cambiar de estado.",
    puntos: [
      "En revisión: avisa de que alguien la está mirando. Solo mientras siga como «Enviado».",
      "Aceptado: la publica en el sitio en ese momento, tal como está. Después se puede retocar desde «Contenido», como cualquier otra pieza.",
      "Rechazado: no se publica.",
      "Enviado y Pendiente: son estados de llegada; no se aplican a mano.",
    ],
  },
  {
    clave: "notas",
    titulo: "Las notas para el autor",
    texto:
      "Lo que el equipo quiere decirle al autor sobre su propuesta: qué falta, qué cambiar o por qué no sale. " +
      "El autor las lee en su cuenta, junto a la propuesta.",
    puntos: [
      "Publicar nota: la guarda, y el autor ya la puede leer.",
      "Editar: corrige una nota ya puesta.",
      "Eliminar: la borra del todo y el autor deja de verla. Pide confirmación.",
    ],
  },
  VOLVER,
];

export const recorridoRevisarPropuesta = crearRecorrido("revisar-propuesta", PASOS_REVISAR_PROPUESTA);
