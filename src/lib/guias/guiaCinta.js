/**
 * La guía de «Cinta de mercado» (`pages/admin/AdminMarketTicker.jsx`). Anclajes:
 * `[data-tour-cinta="…"]`. Textos para la redacción: qué es cada cosa y para qué sirve.
 *
 * La cinta del sitio se llena sola (`GET /cinta`, ver `cinta_service.py` en el backend):
 * lo que se guarde en esta página la sustituye entera mientras tenga alguna cifra, y
 * vaciarla devuelve la automática. La guía lo dice así aunque la página aún hable de
 * «no hay conexión con ningún mercado».
 *
 * Abajo, las monedas de la región (`dominios/monedas/panel/componentes/MonedasDelPanel.jsx`):
 * lo que se publica de cada una, las cotizaciones que no cuadraron y esperan a una persona, y
 * las ocultas (con quién y cuándo, y «Deshacer»). Sus pasos se escriben junto a ese panel
 * (`dominios/monedas/guias/pasosDelPanel.js`) y aquí se intercalan.
 */
import { PASOS_MONEDAS_DEL_PANEL } from "../../dominios/monedas/guias/pasosDelPanel.js";
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_CINTA = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "La cinta de mercado es la franja que corre arriba del todo en el sitio, con cifras de cierre. " +
      "Normalmente se llena sola: el dólar y el euro del BCV, el índice de la Bolsa de Caracas y las " +
      "monedas de la región, que salen de sus bancos centrales o, si un banco no responde, de un servicio " +
      "de respaldo. Una cifra de hace más de dos días hábiles " +
      "no sale. Esta página es para el día en que haga falta fijar las cifras a mano, por ejemplo con una " +
      "devaluación: lo que se guarde aquí sustituye a toda la parte automática.",
    puntos: [
      "Los mercados del mundo: el petróleo, el oro y los demás que acompañan a la cinta no dependen de esta página.",
    ],
  },
  {
    clave: "sello",
    titulo: "El sello",
    texto:
      "La nota pequeña que acompaña a las cifras escritas a mano. Dice de qué cierre son y de dónde salen, " +
      "para que nadie las lea como datos en vivo. Solo se ve mientras la cinta va a mano.",
    puntos: [
      "Texto del sello: por ejemplo, «Al cierre · 19 ago · Rendivalores».",
      "Enlace de la fuente: opcional. Si se pone, el sello lleva a esa página.",
    ],
  },
  {
    clave: "cifras",
    titulo: "Las cifras",
    texto: "Cada fila es una cifra de la cinta, en el orden en que va a pasar.",
    puntos: [
      "Qué es: el nombre corto que se lee en la cinta, como USD/VES.",
      "Cuánto marca: la cifra tal como debe leerse, con su coma.",
      "Cómo se movió: si subió, bajó o quedó igual. Se guarda con la cifra, aunque hoy la cinta del sitio no dibuja la flecha de las cifras escritas a mano.",
      "Flechas ↑ y ↓: cambian el orden.",
      "Quitar: saca la fila de la tabla.",
      "Añadir una cifra: una fila nueva al final.",
      "Filas a medias: las que no tienen nombre o cifra no se guardan.",
    ],
  },
  {
    clave: "guardar",
    titulo: "Guardar la cinta",
    texto:
      "Nada de lo de arriba cambia el sitio hasta pulsar aquí. Al guardar, la cinta entera pasa a ser lo " +
      "que hay en la tabla: lo que no está, desaparece. Los lectores lo ven en cuanto cargan una página, " +
      "en un minuto como mucho.",
    puntos: ["Volver a la cinta automática: quitar todas las filas (o dejarlas vacías) y guardar."],
  },
  // Las monedas de la región: sus pasos viven con su panel (`dominios/monedas`).
  ...PASOS_MONEDAS_DEL_PANEL,
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoCinta = crearRecorrido("cinta", PASOS_CINTA);
