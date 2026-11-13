/**
 * La guía de «Traducciones» (`pages/admin/AdminTraducciones.jsx`). Anclajes:
 * `[data-tour-traducciones="…"]`. Textos para la redacción: qué hace cada cosa y lo que
 * cuesta, sin jerga.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_TRADUCCIONES = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Desde aquí se traducen al inglés, de una sola vez, todas las piezas publicadas que todavía no tienen " +
      "versión en inglés. Las nuevas no hace falta traerlas aquí, y las que llegaron como propuestas de " +
      "lectores no entran: unas y otras se traducen una a una desde el editor. Lo " +
      "traducido aquí sale en la parte en inglés del sitio con un aviso de traducción automática; para " +
      "corregir una, se abre en el editor, se revisa el inglés y se guarda.",
  },
  {
    clave: "pendientes",
    titulo: "Lo que falta por traducir",
    puntos: [
      "Pendientes: cuántas piezas publicadas siguen sin inglés y, más o menos, cuánto costaría traducirlas.",
      "Traducir el archivo: las pone todas a traducir. Antes dice cuántas son y cuánto costará, y pide confirmación. El crédito que se gaste no se recupera.",
      "Traducir las que faltan: sale cuando ya se tradujo antes. Se ocupa solo de las que siguen sin inglés, también de las que fallaron.",
      "Cancelar: mientras va, deja de mandar piezas. Lo ya traducido se queda, y se puede seguir más tarde con «Traducir las que faltan».",
      "Aviso de que falta la clave: el servicio de traducción no está conectado en el servidor y no se puede traducir. Hay que pedírselo a quien lleva el sistema.",
    ],
  },
  {
    clave: "avance",
    titulo: "Cómo va",
    texto:
      "Aparece desde la primera vez que se traduce. Mientras va, se pone al día sola cada 15 segundos. Se " +
      "puede cerrar la página: el trabajo sigue solo.",
    puntos: [
      "Traducidas: ya tienen su versión en inglés.",
      "Fallidas: no se pudieron traducir. En «Piezas que fallaron» se ve cuáles y por qué; «Traducir las que faltan» las vuelve a intentar.",
      "Saltadas: alguien las tradujo a mano, las despublicó o las borró mientras tanto. No se tocan.",
      "Esperando turno: las que todavía no se han mandado a traducir.",
      "Último problema: si el servicio de traducción dio un error. Se vuelve a intentar solo cada minuto.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoTraducciones = crearRecorrido("traducciones", PASOS_TRADUCCIONES);
