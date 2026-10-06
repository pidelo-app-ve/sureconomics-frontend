/**
 * Lo que el juego recuerda de quien juega: el récord de cada vuelo, las estrellas, hasta
 * dónde ha llegado y la racha.
 *
 * Solo en este navegador (`localStorage`), sin cuenta y sin nada que viaje al servidor:
 * no es dato de medición y no necesita el aviso de cookies. Todo acceso va en
 * try/catch, porque en una ventana privada o con el almacenamiento bloqueado el juego
 * tiene que funcionar igual, solo que sin memoria.
 *
 * ## Lo guardado
 *
 * ```
 * { dia, racha, record, mejorHoy,           // lo de siempre (el récord es el del vuelo 1)
 *   ultimo,                                 // el último vuelo que se jugó
 *   niveles: { 1: { record, mejorHoy, dia, estrellas, llego }, ... } }
 * ```
 *
 * Los campos de arriba son los que ya existían: quien jugaba antes de que hubiera niveles
 * conserva su récord, que pasa a ser el del primer vuelo. La racha es una sola para todo
 * el juego: cuenta los días seguidos que se jugó, sea el vuelo que sea.
 */

import { diaDeCaracas } from "./motor.js";
import { NIVELES } from "./niveles.js";

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

/** Lo guardado de un vuelo, con el récord antiguo como récord del primero. */
const deNivel = (r, nivel) => {
  const g = r.niveles?.[nivel];
  if (g) return g;
  return nivel === 1 && r.record ? { record: Number(r.record) || 0, mejorHoy: 0, dia: null, estrellas: 0, llego: false } : {};
};

/** Lo que hay guardado de un vuelo, ya interpretado para hoy. */
export const resumen = (hoy = diaDeCaracas(), nivel = 1) => {
  const r = leer();
  const jugoHoy = r.dia === hoy;
  // La racha sigue viva si jugó hoy o ayer; si el último día fue antes, se rompió.
  const viva = jugoHoy || r.dia === ayerDe(hoy);
  const g = deNivel(r, nivel);
  return {
    record: Number(g.record) || 0,
    mejorHoy: g.dia === hoy ? Number(g.mejorHoy) || 0 : 0,
    racha: viva ? Number(r.racha) || 0 : 0,
    jugoHoy,
    estrellas: Number(g.estrellas) || 0,
    llego: Boolean(g.llego),
  };
};

/** Cómo va cada vuelo: estrellas, si ya se llegó y si está abierto. El primero siempre lo está. */
export const progreso = () => {
  const r = leer();
  const porNivel = {};
  let abierto = true;
  for (const n of NIVELES) {
    const g = deNivel(r, n.id);
    porNivel[n.id] = {
      estrellas: Number(g.estrellas) || 0,
      llego: Boolean(g.llego),
      record: Number(g.record) || 0,
      abierto,
    };
    // El siguiente se abre llegando a este.
    abierto = Boolean(g.llego);
  }
  return porNivel;
};

/**
 * A qué vuelo lleva el botón «Volar»: el último que se jugó si sigue abierto; si no, el
 * primero que todavía no se ha logrado, que es donde toca seguir.
 */
export const vueloParaSeguir = () => {
  const p = progreso();
  const r = leer();
  const ultimo = Number(r.ultimo);
  if (p[ultimo]?.abierto && !p[ultimo].llego) return ultimo;
  const pendiente = NIVELES.find((n) => p[n.id].abierto && !p[n.id].llego);
  return pendiente ? pendiente.id : (p[ultimo]?.abierto ? ultimo : 1);
};

/**
 * Apunta un vuelo terminado. Devuelve lo que la pantalla final necesita: si batió su
 * récord, las estrellas (y si mejoró), si abrió el siguiente vuelo y la racha ya
 * actualizada.
 */
export const apuntar = (puntos, { nivel = 1, llego = false, estrellas = 0 } = {}, hoy = diaDeCaracas()) => {
  const r = leer();
  const antes = resumen(hoy, nivel);
  let racha = antes.racha;
  if (!antes.jugoHoy) racha = r.dia === ayerDe(hoy) ? (Number(r.racha) || 0) + 1 : 1;
  const previo = deNivel(r, nivel);
  const abiertoAntes = progreso();
  const nuevo = {
    record: Math.max(antes.record, puntos),
    mejorHoy: Math.max(antes.mejorHoy, puntos),
    dia: hoy,
    estrellas: Math.max(Number(previo.estrellas) || 0, estrellas),
    llego: Boolean(previo.llego) || llego,
  };
  const guardado = {
    ...r,
    dia: hoy,
    racha,
    ultimo: nivel,
    niveles: { ...(r.niveles ?? {}), [nivel]: nuevo },
  };
  // El récord de siempre sigue siendo el del primer vuelo: así no se pierde si se vuelve atrás.
  guardado.record = nivel === 1 ? nuevo.record : Number(r.record) || 0;
  guardado.mejorHoy = nivel === 1 ? nuevo.mejorHoy : Number(r.mejorHoy) || 0;
  escribir(guardado);
  const despues = progreso();
  const siguiente = NIVELES.find((n) => n.id === nivel + 1);
  return {
    racha,
    record: nuevo.record,
    mejorHoy: nuevo.mejorHoy,
    nuevoRecord: puntos > antes.record && antes.record > 0,
    primeraVez: antes.record === 0,
    estrellas: nuevo.estrellas,
    estrellasNuevas: Math.max(0, nuevo.estrellas - (Number(previo.estrellas) || 0)),
    abrio: siguiente && !abiertoAntes[siguiente.id].abierto && despues[siguiente.id].abierto ? siguiente.id : null,
  };
};
