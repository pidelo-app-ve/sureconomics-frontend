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
      "junta las notas que cuentan lo mismo y aparta las importantes, sin tope, y " +
      "primero las de Venezuela. Cada aviso espera a que alguien del equipo diga «lo hago yo» o «esto no».",
  },
  {
    clave: "interruptor",
    titulo: "Encendidos o apagados",
    puntos: [
      "Apagados: no se crea ningún aviso. Se puede mirar igual qué se avisaría.",
      "Encendidos: cada 10 minutos salen los avisos nuevos, todos los que lo merezcan. La redacción decide cuáles suben.",
      "De noche: de 10 de la noche a 6 de la mañana no sale ninguno.",
    ],
  },
  {
    clave: "cuenta",
    titulo: "Cuántos van hoy",
    texto:
      "Los avisos que salieron hoy. No hay tope: sale todo lo importante y la redacción decide qué " +
      "se convierte en pieza y qué se descarta.",
  },
  {
    clave: "bot",
    titulo: "El bot de Telegram",
    texto:
      "Los mismos avisos, en el chat del jefe editorial, con sus botones: Redactar, Lo hago yo, Ver fuentes " +
      "y No interesa. La noticia redactada le llega entera al chat y desde ahí la termina y la publica.",
    puntos: [
      "Vincularse: abrir el bot, escribir /start y pulsar «Compartir mi número». Tiene que ser el mismo celular de «Mi perfil».",
      "Quién recibe las noticias: el administrador marca aquí a quién le llegan los avisos. A los demás vinculados no les llega ninguno.",
      "En el chat, con cada noticia: elegir el titular entre varios, ponerle el tema, mandarle la foto y su crédito, publicarla y, si hace falta, despublicarla.",
      "Mandar noticia: quien esté vinculado le pega al bot el enlace de algo que cree que hay que contar (o varios del mismo hecho). El bot lee esos artículos y devuelve la noticia redactada, con lo mismo comprobado.",
      "Conectar el bot: lo hace el administrador una vez, para que Telegram sepa adónde llamar.",
      "Pausar avisos: desde el menú del propio bot, quien los recibe los pausa y los reanuda.",
    ],
  },
  {
    clave: "marketing",
    titulo: "Marketing: lo de Instagram",
    texto:
      "Es otro camino, aparte. Cada vez que una pieza sale publicada en la página (desde el bot, desde el panel " +
      "o programada), a cada persona de esta lista le llega sola por Telegram, con su enlace y su foto, para que " +
      "la revise y monte la publicación de Instagram. Nadie tiene que mandársela, y cada pieza llega una sola vez. " +
      "Si la van a subir, tocan «Hacer la lámina» y el bot les devuelve la imagen de 1080×1350 con la plantilla " +
      "del medio y el texto del pie, listo para copiar; pueden pedir otro titular, escribir el suyo o cambiar la foto.",
    puntos: [
      "Agregar: el nombre y el celular de la persona. No necesita cuenta en el panel.",
      "Vincularse: ella abre el bot, escribe /start y comparte su número. Hasta entonces sale «falta que abra el bot» y no le llega nada.",
      "Quitar: deja de recibir. No borra nada de lo que ya se le mandó.",
    ],
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
      "Redactar: el sistema lee el artículo de cada medio y la IA escribe una noticia completa, en borrador. El aviso queda a su nombre. Puede tardar medio minuto.",
      "Lo hago yo: el aviso queda a su nombre y nadie más lo toma. Si en dos horas no avanza, vuelve a quedar libre.",
      "Escribirla yo: abre un borrador vacío con el título y las fuentes ya puestas.",
      "Soltar: lo devuelve para que lo tome otra persona.",
      "Descartar: pide un motivo (ya la dimos, no es nuestro tema o poca cosa). Con esos motivos se afina qué merece un aviso.",
      "Saldría en la próxima pasada: en la vista de ahora, las que se convertirían en aviso dentro de unos minutos.",
    ],
  },
  {
    titulo: "Lo que se comprueba del borrador",
    texto:
      "Cuando la IA redacta, el sistema revisa el texto antes de guardarlo y lo enseña en la tarjeta del aviso. " +
      "Nada sale publicado desde aquí: siempre es un borrador que hay que leer.",
    puntos: [
      "De dónde salió el texto: de qué medios se leyó el artículo entero y de cuáles solo el titular, y por qué. Si no se pudo leer ninguno, sale una nota breve.",
      "Cifras: cada número del borrador, con el medio que lo da.",
      "Frases quitadas: las que traían una cifra que no está en las fuentes, o una cita entre comillas que no está palabra por palabra en ningún artículo.",
      "Frases casi iguales a las del medio: hay que reescribirlas con palabras propias.",
      "Nombres: los que no se vieron escritos igual en las fuentes, para que los compruebe.",
      "Abrir el borrador: lleva al editor, con el tema y el lugar sugeridos. Ahí se corrige, se pone la foto y se publica.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoAvisos = crearRecorrido("avisos", PASOS_AVISOS);
