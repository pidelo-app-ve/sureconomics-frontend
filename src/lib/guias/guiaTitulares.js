/**
 * La guía del panel «Titulares» (`pages/admin/AdminTitulares.jsx`). Anclajes:
 * `[data-tour-titulares="…"]`. Los textos son para la redacción: qué es cada cosa y
 * para qué sirve, sin jerga.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_TITULARES = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los titulares de «Última hora»: los que salen solos cada 10 minutos en la tarjeta verde de la " +
      "portada y en la sección. El sistema lee lo que publican otros medios, elige lo más importante y " +
      "lo redacta en español y en inglés. Desde aquí se corrige, se pone arriba o se quita lo que haga " +
      "falta, y se decide qué medios no deben contar.",
  },
  {
    clave: "interruptores",
    titulo: "Los dos interruptores",
    puntos: [
      "Publicación automática: si se apaga, no sale ningún titular nuevo. Lo que ya está en la web sigue.",
      "Sección en la web: ocultarla quita todos los titulares de la portada y de la sección en menos de dos minutos. Es para emergencias.",
      "Quién los cambia: solo un administrador.",
    ],
  },
  {
    clave: "gasto",
    titulo: "Lo que lleva gastado",
    texto:
      "Cuánto costó este mes redactar los titulares con inteligencia artificial, frente al tope del mes. " +
      "El gasto se reparte por días: si se acaba lo de hoy, no se redacta nada nuevo hasta mañana.",
  },
  {
    clave: "ciclo",
    titulo: "Lo que hizo la última vuelta",
    puntos: [
      "Notas agrupadas: lo que llegó de los medios y se juntó por noticia.",
      "Redactados y publicados: lo que salió de esa vuelta.",
      "Sin presupuesto: lo que no se pudo pagar en esa vuelta; se intenta en la siguiente.",
      "Falló: si alguna parte del ciclo dio error. El resto sigue funcionando; si se repite, hay que avisar.",
    ],
  },
  {
    clave: "vistas",
    titulo: "Publicados y borrados",
    puntos: [
      "Publicados: lo que está ahora en la web, de las últimas 24 horas.",
      "Borrados: lo que alguien quitó. Desde ahí se puede restaurar.",
    ],
  },
  {
    clave: "titular",
    titulo: "Cada titular",
    puntos: [
      "País, tema y puntaje: de dónde es la noticia, de qué trata y cuánto importa. Más medios contándola y medios más fiables dan más puntaje.",
      "Fuentes: cuántos medios distintos la cuentan.",
      "Editado a mano y Fijado arriba: aparecen cuando alguien lo corrigió o lo puso el primero.",
      "En inglés y fuentes: ábrelo para ver la versión en inglés y qué publicó cada medio.",
    ],
  },
  {
    clave: "acciones",
    titulo: "Qué se puede hacer con un titular",
    puntos: [
      "Editar: corregir el título o el resumen, en español y en inglés. Lo editado a mano ya no lo reescribe el sistema aunque lleguen más fuentes.",
      "Fijar arriba: lo pone el primero en la portada y en la sección durante media hora, una o dos horas.",
      "Historial: qué escribió el sistema, qué cambió alguien del equipo y quién.",
      "Borrar: lo quita de la web en menos de dos minutos y no vuelve aunque lleguen más fuentes. Pide un motivo, que sirve para ajustar los medios y las instrucciones.",
    ],
  },
  {
    clave: "fuentes",
    titulo: "Los medios que lee el sistema",
    texto:
      "Cada medio con su nivel (1 oficial, 2 agencia de noticias, 3 medio reconocido, 4 Google News o " +
      "medio pequeño) y cuántas notas mandó en las últimas 24 horas.",
    puntos: [
      "Silenciar: sus notas nuevas dejan de contar. Si quiere, borra a la vez los titulares donde era el único medio.",
      "Reactivar: vuelve a contar desde ese momento.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoTitulares = crearRecorrido("titulares", PASOS_TITULARES);
