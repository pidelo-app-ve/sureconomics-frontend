/**
 * La guía de «Béisbol LVBP» (`pages/admin/AdminLvbp.jsx`). Anclajes:
 * `[data-tour-lvbp="…"]`. Textos para la redacción: qué es cada cosa y para qué sirve.
 *
 * Lo que dice de la API sale de `lvbp_service.py` en el backend: el plan gratuito solo da
 * ayer, hoy y mañana, y la tabla de posiciones se calcula con los juegos finales.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_LVBP = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los juegos de la Liga Venezolana de Béisbol Profesional que salen en el sitio, con su marcador, y " +
      "de los que se saca la tabla de posiciones. Llegan solos de un servicio de resultados deportivos " +
      "(API-Sports), pero ese servicio solo da los juegos de ayer, hoy y mañana. Esta página es para lo " +
      "que no trae, como un juego de hace varios días, y para corregir lo que trae mal.",
  },
  {
    clave: "sync",
    titulo: "La conexión con los resultados",
    puntos: [
      "Clave configurada o Sin clave: sin la clave del servicio no llega nada solo, y todo se carga a mano.",
      "Consultas hoy: el servicio gratuito da un número de consultas al día. Si se acaban, no llega nada más hasta mañana.",
      "Última vez y último error: cuándo llegó lo último y, si falló, por qué.",
      "Sincronizar ahora: pide ya los juegos de ayer, hoy y mañana (gasta tres consultas). Solo aparece con la clave puesta.",
    ],
  },
  {
    clave: "cargar",
    titulo: "Cargar un juego a mano",
    texto: "Para un juego que el servicio ya no da o que no trajo nunca.",
    puntos: [
      "Visitante y Local, cada uno con sus carreras: el marcador. Un juego terminado necesita las carreras de los dos; uno por jugar las lleva vacías.",
      "Estado: por jugar, en vivo, final, suspendido, pospuesto o cancelado. Solo los finales cuentan para la tabla de posiciones.",
      "Estadio: si se deja vacío, el del equipo local.",
      "Bloqueado: un juego cargado a mano queda bloqueado. Si después el servicio trae ese mismo juego, no lo duplica ni lo cambia.",
    ],
  },
  {
    clave: "fechas",
    titulo: "Qué fechas se ven",
    texto:
      "Desde y Hasta eligen qué juegos salen en la lista de abajo. Al abrir la página, las dos últimas " +
      "semanas y la próxima.",
  },
  {
    clave: "juegos",
    titulo: "Los juegos",
    puntos: [
      "Marcador: visitante – local. En un juego en vivo, también la entrada que va.",
      "Origen: API si llegó solo, Manual si se cargó aquí. «Bloqueado» quiere decir que el servicio ya no lo toca.",
      "Corregir: cambia el marcador, el estado, la fecha, los equipos o el estadio. Al guardar queda bloqueado; para que el servicio vuelva a ponerlo al día, se desmarca «Bloqueado» en esa misma ventana.",
      "Borrar: lo quita de la lista y, si era final, de la tabla de posiciones. Si es de ayer, hoy o mañana y el servicio está conectado, vuelve en la siguiente pasada; si es más viejo, solo vuelve cargándolo otra vez a mano.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoLvbp = crearRecorrido("lvbp", PASOS_LVBP);
