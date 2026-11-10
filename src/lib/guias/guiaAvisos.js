/**
 * La guía del panel «Avisos de noticias» (`pages/admin/AdminAvisos.jsx`). Anclajes:
 * `[data-tour-avisos="…"]`. Los textos son para la redacción: qué es cada cosa y para
 * qué sirve, sin jerga.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_AVISOS = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Las noticias que la redacción debería mirar hoy. El sistema lee lo que publican los medios, " +
      "junta las notas que cuentan lo mismo y aparta las más importantes: como mucho 10 al día, y " +
      "primero las de Venezuela. Cada aviso espera a que alguien del equipo diga «lo hago yo» o «esto no».",
  },
  {
    clave: "interruptor",
    titulo: "Encendidos o apagados",
    puntos: [
      "Apagados: no se crea ningún aviso. Se puede mirar igual qué se avisaría.",
      "Encendidos: cada 10 minutos salen hasta 2 avisos nuevos, hasta llegar a 10 en el día.",
      "De noche: de 10 de la noche a 6 de la mañana no sale ninguno.",
    ],
  },
  {
    clave: "cuenta",
    titulo: "Cuántos quedan hoy",
    texto:
      "Los avisos que todavía pueden salir hoy. Son pocos a propósito: diez que se leen sirven más " +
      "que cincuenta que nadie mira.",
  },
  {
    clave: "vistas",
    titulo: "Las dos vistas",
    puntos: [
      "De hoy: los avisos que ya salieron, con lo que pasó con cada uno.",
      "Lo que se avisaría ahora: las noticias que el sistema tiene en la mira en este momento. Es solo para mirar: no crea nada.",
    ],
  },
  {
    clave: "lista",
    titulo: "Cada noticia",
    puntos: [
      "País, puntaje y medios: de dónde es, cuánto importa y cuántos medios distintos la cuentan.",
      "Fuentes: lo que publicó cada medio, con su enlace para leerlo.",
      "Lo hago yo: el aviso queda a su nombre y nadie más lo toma. Si en dos horas no avanza, vuelve a quedar libre.",
      "Soltar: lo devuelve para que lo tome otra persona.",
      "Descartar: pide un motivo (ya la dimos, no es nuestro tema o poca cosa). Con esos motivos se afina qué merece un aviso.",
      "Saldría en la próxima pasada: en la vista de ahora, las que se convertirían en aviso dentro de unos minutos.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoAvisos = crearRecorrido("avisos", PASOS_AVISOS);
