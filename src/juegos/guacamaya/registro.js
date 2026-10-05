/**
 * Lo que el juego recuerda de quien juega: el récord, lo mejor de hoy y la racha.
 *
 * Solo en este navegador (`localStorage`), sin cuenta y sin nada que viaje al servidor:
 * no es dato de medición y no necesita el aviso de cookies. Todo acceso va en
 * try/catch, porque en una ventana privada o con el almacenamiento bloqueado el juego
 * tiene que funcionar igual, solo que sin memoria.
 */

import { diaDeCaracas } from "./motor";

const CLAVE = "se_pausa_guacamaya";

const leer = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLAVE) || "null");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const escribir = (v) => {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(v));
  } catch {
    /* sin memoria, se juega igual */
  }
};

const ayerDe = (dia) => {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** Lo que hay guardado, ya interpretado para hoy. */
export const resumen = (hoy = diaDeCaracas()) => {
  const r = leer();
  const jugoHoy = r.dia === hoy;
  // La racha sigue viva si jugó hoy o ayer; si el último día fue antes, se rompió.
  const viva = jugoHoy || r.dia === ayerDe(hoy);
  return {
    record: Number(r.record) || 0,
    mejorHoy: jugoHoy ? Number(r.mejorHoy) || 0 : 0,
    racha: viva ? Number(r.racha) || 0 : 0,
    jugoHoy,
  };
};

/**
 * Apunta una partida terminada. Devuelve lo que la pantalla final necesita: si batió
 * su récord o su mejor de hoy, y la racha ya actualizada.
 */
export const apuntar = (puntos, hoy = diaDeCaracas()) => {
  const r = leer();
  const antes = resumen(hoy);
  let racha = antes.racha;
  if (!antes.jugoHoy) racha = r.dia === ayerDe(hoy) ? (Number(r.racha) || 0) + 1 : 1;
  const nuevo = {
    dia: hoy,
    racha,
    record: Math.max(antes.record, puntos),
    mejorHoy: Math.max(antes.mejorHoy, puntos),
  };
  escribir(nuevo);
  return {
    racha,
    record: nuevo.record,
    mejorHoy: nuevo.mejorHoy,
    nuevoRecord: puntos > antes.record && antes.record > 0,
    primeraVez: antes.record === 0,
  };
};
