/**
 * La guía de «Educación» (`pages/admin/AdminEducacion.jsx`). Anclajes:
 * `[data-tour-educacion="…"]`; los de un módulo y una lección, solo en el primero de la
 * lista. Los pasos con `abrirModulo` despliegan ese módulo, y el de `abrirLeccion`
 * también su primera lección, para que se vea lo que explican.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_EDUCACION = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los cursos de Educación. Cada módulo es un curso que se vende entero, con sus lecciones en orden. " +
      "La primera lección es gratis para quien tenga cuenta con el correo verificado: es la que convence " +
      "de comprar, así que conviene que sea la mejor. No hay un «Guardar» general: cada botón hace su " +
      "cambio en el momento.",
  },
  {
    clave: "cifras",
    titulo: "Cómo se vende",
    texto: "Lo de los últimos 30 días, de todos los módulos juntos.",
    puntos: [
      "Ingresos: lo cobrado en las compras pagadas.",
      "Módulos vendidos y clases abiertas: cuántas compras hubo y cuántas veces se abrió alguna lección.",
      "De la clase gratis a la compra: por módulo, cuántas veces se abrió la lección gratis y cuántas compras salieron. Si muchos la abren y pocos compran, la clase no convence; si casi nadie la abre, falta que llegue gente.",
      "Aperturas, no personas: quien abre la misma clase dos veces suma dos.",
    ],
  },
  {
    clave: "nuevo",
    titulo: "Nuevo módulo",
    texto:
      "Escriba el título y pulse «Nuevo módulo». Sale el primero de la lista, gratis y en borrador: " +
      "nadie lo ve en el sitio hasta que lo publique.",
  },
  {
    clave: "modulo",
    titulo: "Cada módulo",
    puntos: [
      "El título: abre y cierra el módulo. Debajo, su dirección en el sitio, cuántas lecciones tiene, el precio y cuántas veces se vendió.",
      "Publicado o Borrador: un borrador no se ve en el sitio. Mientras siga así, tampoco puede abrirlo quien ya lo compró.",
      "Publicar: lo pone en el catálogo. Si le falta algo (una lección, contenido en la primera o el resumen), no lo publica: abre el módulo y enseña qué falta.",
      "Pasar a borrador: lo retira del sitio sin borrar nada.",
      "Ver en el sitio: solo en los publicados. Lo abre como lo ve un lector, en otra pestaña.",
    ],
  },
  {
    clave: "ficha",
    abrirModulo: true,
    titulo: "Los datos del módulo",
    texto:
      "Al abrir un módulo salen sus datos. Si le falta algo para publicarse, arriba aparece la lista " +
      "«Antes de publicar» con lo que falta y lo que conviene añadir.",
    puntos: [
      "Título y resumen: lo que se lee en la tarjeta del catálogo. Sin resumen no se puede publicar.",
      "Portada: la imagen de la tarjeta. Sin ella funciona igual, pero con ella destaca.",
      "Nivel: inicial, intermedio o avanzado. Orienta; no le cierra el módulo a nadie.",
      "Precio y moneda: lo que cuesta el módulo entero. Con cero es gratis y no pasa por caja. La moneda va en tres letras, como USD.",
    ],
  },
  {
    clave: "guardar",
    abrirModulo: true,
    titulo: "Guardar o borrar el módulo",
    puntos: [
      "Guardar el módulo: los datos de arriba no cambian en el sitio hasta pulsarlo. Las lecciones tienen su propio botón.",
      "Borrar el módulo: lo borra con todas sus lecciones y no se puede deshacer. Si alguien lo tiene comprado con el acceso activo, no deja. Para sacarlo del catálogo sin perderlo basta con «Pasar a borrador».",
    ],
  },
  {
    clave: "lecciones",
    abrirModulo: true,
    titulo: "Las lecciones",
    texto: "En el orden en que las ve el alumno.",
    puntos: [
      "El número y las flechas: suben o bajan la lección un puesto. La que queda la primera es la gratis y lleva el sello «Puerta de entrada».",
      "El título: abre la lección para editarla. Debajo, su tipo, los minutos que dura (o «sin medir») y si es gratis.",
      "Quitar: borra la lección. No se puede deshacer.",
      "Añadir lección: debajo de la lista. Con el título basta: entra la última, como lección de texto.",
    ],
  },
  {
    clave: "leccion",
    abrirModulo: true,
    abrirLeccion: true,
    titulo: "Editar una lección",
    puntos: [
      "Tipo: texto, video, audio o PDF. Video, audio y PDF piden su archivo; el video se puede subir o se pega un enlace de YouTube o Vimeo. Si se cambia el tipo, el archivo que ya no sirve se suelta, pero sigue en «Archivos».",
      "Duración: los minutos que dura. Mientras falte en alguna lección, el catálogo no dice cuánto dura el módulo.",
      "Gratis: la abre sin comprar cualquiera con cuenta y correo verificado. La primera lo es siempre.",
      "El texto de la clase: se escribe como en cualquier procesador de textos. En las de video, audio o PDF es la introducción que se lee antes.",
      "Guardar la lección: nada de lo anterior cambia en el sitio hasta pulsarlo.",
    ],
  },
  {
    clave: "compras",
    abrirModulo: true,
    titulo: "Quién lo compró",
    texto:
      "Sale solo en los módulos con ventas. Su botón trae la lista: el correo, cuándo pagó, cuánto y " +
      "por dónde, y si tiene el acceso activo. Los reembolsos hechos desde la plataforma de pago " +
      "quitan el acceso solos.",
    puntos: [
      "Quitar acceso: para un reembolso hecho por fuera o un fraude. Deja de poder abrir las lecciones de pago. Se puede devolver.",
      "Devolver acceso: se lo abre otra vez; por ejemplo, si se gana una reclamación.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoEducacion = crearRecorrido("educacion", PASOS_EDUCACION);
