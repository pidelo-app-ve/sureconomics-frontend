/**
 * El juez de los titulares en el panel: los nombres de sus modos y de los problemas que
 * señala, en palabras de la redacción. El juez es el mismo modelo que redacta, que lee
 * cada titular antes de publicarlo y dice si afirma algo que las notas no dicen (ver
 * `titulares_ia.juzgar` y `titulares_ciclo._redactar` en el backend). Lo usan la página
 * de Titulares y el historial de cada titular.
 */

/** Los modos (`titulares_ajustes.JUEZ_MODOS`), en el orden en que se ofrecen. */
export const MODOS_DEL_JUEZ = {
  bloquear: {
    nombre: "Bloquear",
    texto: "Lee cada titular antes de publicarlo: si afirma algo que las notas no dicen, no sale.",
  },
  observar: {
    nombre: "Observar",
    texto: "Lo lee y anota lo que habría frenado, pero el titular sale igual.",
  },
  apagado: {
    nombre: "Apagado",
    texto: "No se usa el juez: sale lo que pase las demás reglas.",
  },
};

/** Los tipos de problema (`titulares_ia.TIPOS_DE_PROBLEMA`). */
const PROBLEMAS_DEL_JUEZ = {
  cifra: "Cifra",
  unidad: "Unidad",
  sujeto: "Sujeto",
  pais: "País",
  fecha: "Fecha",
  persona: "Persona",
  atribucion: "Atribución",
  tiempo_verbal: "Tiempo verbal",
  judicial: "Judicial",
  exageracion: "Exageración",
  otro: "Otro",
};

/** «Cifra», o el tipo tal cual si el backend trae uno nuevo. */
export const nombreDelProblema = (tipo) => PROBLEMAS_DEL_JUEZ[tipo] || tipo || "Otro";

/** Lo que pasó con un titular ante el juez (`estado` de cada veredicto). */
export const VEREDICTOS = {
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  fallo: "No pudo revisarlo: la IA no respondió",
  sin_saldo: "No lo revisó: no quedaba saldo del día",
};
