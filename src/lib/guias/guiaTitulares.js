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
      "falta, y se decide qué medios cuentan y cuáles no. En la web, debajo de los titulares, una línea " +
      "avisa al lector de que están redactados automáticamente con inteligencia artificial a partir de " +
      "las fuentes citadas.",
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
      "La IA no respondió: si en una vuelta entera la inteligencia artificial no contesta, la redacción descansa unos 20 minutos y se retoma sola a la hora que dice el aviso. No hay que hacer nada; si se repite muchas veces, avise.",
      "Notas de medios nuevos descartadas: llegaron de medios que nadie ha activado todavía y no contaron. «Ver esos medios» lleva a la lista para revisarlos.",
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
      "Historial: qué escribió el sistema, qué cambió alguien del equipo y quién. En cada versión del sistema, «De dónde salió» enseña las notas que leyó (medio, enlace y el trozo que vio) y con qué inteligencia artificial se escribió: sirve para comprobar un dato o contestar un reclamo.",
      "Borrar: lo quita de la web en menos de dos minutos y no vuelve aunque lleguen más fuentes. Pide un motivo, que sirve para ajustar los medios y las instrucciones.",
    ],
  },
  {
    clave: "fuentes",
    titulo: "Los medios que lee el sistema",
    abrirFuentes: true,
    texto:
      "Cada medio con su nivel (1 oficial, 2 agencia de noticias, 3 medio reconocido, 4 Google News o " +
      "medio pequeño) y cuántas notas mandó en las últimas 24 horas.",
    puntos: [
      "Silenciar: sus notas nuevas dejan de contar. Si quiere, borra a la vez los titulares donde era el único medio.",
      "Reactivar: vuelve a contar desde ese momento. Antes pregunta el nivel, por si hay que corregirlo.",
      "Cambiar nivel: en los medios que ya cuentan, corrige su nivel sin silenciarlos.",
    ],
  },
  {
    clave: "fuentes-nuevas",
    titulo: "Medios nuevos, sin activar",
    abrirFuentes: true,
    texto:
      "Cuando el sistema empieza a leer un medio que no conocía, llega silenciado: sus notas no sirven " +
      "para elegir ni redactar titulares hasta que alguien del equipo lo revisa y lo activa. Así no se " +
      "cuela un medio dudoso sin que nadie lo vea.",
    puntos: [
      "Nuevo, sin activar: la marca de esos medios. Salen los primeros de la lista y el título plegado dice cuántos esperan.",
      "Enseñar: deja ver solo los nuevos, los silenciados o los que cuentan.",
      "Activar: compruebe antes que es un medio serio. Si no lo es, déjelo como está.",
    ],
  },
  {
    clave: "fuentes-nivel",
    titulo: "El nivel de cada medio",
    abrirFuentes: true,
    texto:
      "Al activar o reactivar un medio se elige su nivel, y con «Cambiar nivel» se corrige el de uno que ya " +
      "cuenta. Dice cuánto se fía el sistema de él: cuanto más bajo el número, más pesa al elegir qué sale y " +
      "antes se publica. Un medio nuevo llega como mucho con el 3; el 1 y el 2 solo los pone un administrador, " +
      "porque con ellos un medio basta solo para publicar, también lo delicado.",
    puntos: [
      "1, oficial: bancos centrales, gobiernos y organismos públicos. Basta él solo para publicar.",
      "2, agencia de noticias: EFE, Reuters, AFP. Basta él solo para publicar.",
      "3, medio reconocido: diarios nacionales. Basta solo para una noticia normal; una delicada pide otro medio.",
      "4, Google News o medio pequeño: nunca basta solo; hacen falta tres medios distintos (dos si es de Venezuela).",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoTitulares = crearRecorrido("titulares", PASOS_TITULARES);
