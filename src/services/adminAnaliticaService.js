import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/**
 * Los números de audiencia, solo para el panel.
 *
 * No hay equivalente público a propósito: que el número de lectores en vivo se enseñe
 * en el sitio es una decisión editorial que nadie ha tomado, y una cifra publicada no se
 * recoge después.
 */

/** Quién está leyendo ahora mismo y qué. */
export const getEnVivo = async () =>
  unwrapEntity(await adminRequest("/admin/analitica/en-vivo")) ?? {
    lectores: 0,
    personas: 0,
    ventana_minutos: 5,
    paginas: [],
  };

/** Lo de los últimos días: visitas, quién vuelve y cuánto se lee cada cosa. */
export const getResumen = async (dias = 7) =>
  unwrapEntity(await adminRequest("/admin/analitica/resumen", { query: { dias } })) ?? {
    dias,
    sesiones: 0,
    personas: 0,
    recurrentes: 0,
    formatos: [],
    piezas: [],
  };
