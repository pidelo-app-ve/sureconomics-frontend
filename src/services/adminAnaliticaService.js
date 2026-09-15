import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/**
 * Los números de audiencia, solo para el panel.
 *
 * No hay equivalente público a propósito: que el número de lectores en vivo se enseñe
 * en el sitio es una decisión editorial que nadie ha tomado, y una cifra publicada no se
 * recoge después.
 *
 * ## Por qué las respuestas se normalizan aquí
 *
 * El panel y la API se despliegan por separado -- Vercel y Render, dos servicios
 * distintos --, así que hay minutos, y a veces días, en que la pantalla es más nueva que
 * el servidor que le contesta. Con la respuesta cruda eso se ve como un `undefined %`
 * escrito en una tarjeta: un fallo que parece de la medición y es de despliegue.
 *
 * Rellenar aquí los huecos hace que la pantalla enseñe «sin datos», que es lo honesto:
 * no los tiene. Las listas que faltan pasan a vacías y los conteos a cero; las cifras
 * derivadas -- páginas por visita, tiempo, porcentaje -- pasan a `null` y no a cero,
 * porque un cero ahí sería una afirmación falsa y no un hueco. El componente se queda
 * sin una sola comprobación defensiva: la forma le llega siempre completa.
 */

const numeroDe = (v, porDefecto = 0) => (typeof v === "number" && Number.isFinite(v) ? v : porDefecto);
/**
 * Igual, pero un campo ausente vale `null` y no cero.
 *
 * La diferencia importa: cero páginas por visita es una afirmación -- falsa -- y `null`
 * es «no lo sé», que es lo que pasa cuando el servidor no manda ese dato. La pantalla
 * dibuja una raya para `null` y el número para el cero de verdad.
 */
const cifraDe = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const listaDe = (v) => (Array.isArray(v) ? v : []);

/** Quién está leyendo ahora mismo y qué. */
export const getEnVivo = async () => {
  const d = unwrapEntity(await adminRequest("/admin/analitica/en-vivo")) ?? {};
  return {
    lectores: numeroDe(d.lectores),
    personas: numeroDe(d.personas),
    ventana_minutos: numeroDe(d.ventana_minutos, 5),
    paginas: listaDe(d.paginas),
  };
};

/** Lo de los últimos días: visitas, quién vuelve y cuánto se lee cada cosa. */
export const getResumen = async (dias = 7) => {
  const d =
    unwrapEntity(await adminRequest("/admin/analitica/resumen", { query: { dias } })) ?? {};
  return {
    dias: numeroDe(d.dias, dias),
    sesiones: numeroDe(d.sesiones),
    personas: numeroDe(d.personas),
    recurrentes: numeroDe(d.recurrentes),
    paginas_por_visita: cifraDe(d.paginas_por_visita),
    segundos_por_visita: cifraDe(d.segundos_por_visita),
    una_pagina: cifraDe(d.una_pagina),
    anterior: {
      sesiones: numeroDe(d.anterior?.sesiones),
      personas: numeroDe(d.anterior?.personas),
    },
    serie: listaDe(d.serie),
    horas: listaDe(d.horas),
    profundidad: listaDe(d.profundidad),
    formatos: listaDe(d.formatos),
    piezas: listaDe(d.piezas),
    salidas: listaDe(d.salidas),
  };
};
