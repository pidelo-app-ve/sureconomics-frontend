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
 * { v: 2,
 *   dia, racha, record, mejorHoy,           // lo de siempre (el récord es el de Caracas)
 *   ultimo: "zulia",                        // el último vuelo que se jugó, por clave
 *   vuelos: { caracas: { record, mejorHoy, dia, estrellas, llego }, ... } }
 * ```
 *
 * **Por clave y no por número.** Hasta octubre de 2026 se guardaba por número de vuelo
 * (`niveles: { 1: …, 6: … }`), y el número cambió: la loma pasó del 7 al 6 y Canaima al
 * último. Con números, las estrellas de Canaima habrían aparecido en la loma. Lo que
 * estaba guardado con números se convierte la primera vez que se lee (`migrar`), con
 * el orden que tenían entonces.
 *
 * La racha es una sola para todo el juego: cuenta los días seguidos que se jugó, sea
 * el vuelo que sea.
 */

import { diaDeCaracas } from "./motor.js";
import { NIVELES, nivelDe } from "./niveles.js";

const CLAVE = "se_pausa_guacamaya";

/** El orden de los vuelos cuando el progreso se guardaba por número (hasta octubre de 2026). */
const CLAVES_ANTIGUAS = { 1: "caracas", 2: "barquisimeto", 3: "margarita", 4: "zulia", 5: "laguaira", 6: "canaima", 7: "loma" };

/** Pasa lo guardado con números a lo guardado con claves. Lo nuevo no se toca. */
export const migrar = (r) => {
  if (!r || typeof r !== "object" || r.v === 2) return r ?? {};
  const vuelos = {};
  for (const [num, datos] of Object.entries(r.niveles ?? {})) {
    const clave = CLAVES_ANTIGUAS[num];
    if (clave && datos && typeof datos === "object") vuelos[clave] = datos;
  }
  const resto = { ...r };
  delete resto.niveles;
  return {
    ...resto,
    v: 2,
    ultimo: typeof r.ultimo === "number" || /^\d+$/.test(String(r.ultimo ?? "")) ? CLAVES_ANTIGUAS[r.ultimo] ?? null : r.ultimo ?? null,
    vuelos,
  };
};

const leer = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLAVE) || "null");
    return v && typeof v === "object" ? migrar(v) : {};
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

/** Lo guardado de un vuelo, con el récord antiguo como récord de Caracas. */
const deVuelo = (r, clave) => {
  const g = r.vuelos?.[clave];
  if (g) return g;
  return clave === "caracas" && r.record ? { record: Number(r.record) || 0, mejorHoy: 0, dia: null, estrellas: 0, llego: false } : {};
};

/** Lo que hay guardado de un vuelo (por su número de hoy), ya interpretado para hoy. */
export const resumen = (hoy = diaDeCaracas(), nivel = 1) => {
  const r = leer();
  const jugoHoy = r.dia === hoy;
  // La racha sigue viva si jugó hoy o ayer; si el último día fue antes, se rompió.
  const viva = jugoHoy || r.dia === ayerDe(hoy);
  const g = deVuelo(r, nivelDe(nivel).clave);
  return {
    record: Number(g.record) || 0,
    mejorHoy: g.dia === hoy ? Number(g.mejorHoy) || 0 : 0,
    racha: viva ? Number(r.racha) || 0 : 0,
    jugoHoy,
    estrellas: Number(g.estrellas) || 0,
    llego: Boolean(g.llego),
  };
};

/**
 * Cómo va cada vuelo, por su número de hoy: estrellas, si ya se llegó y si está
 * abierto. El primero siempre lo está; los demás, llegando a casa en el anterior. Uno
 * que ya se jugó queda abierto aunque el orden haya cambiado después: nadie pierde un
 * vuelo que ya había ganado.
 */
export const progreso = () => {
  const r = leer();
  const porNivel = {};
  let anteriorLlego = true;
  for (const n of NIVELES) {
    const g = deVuelo(r, n.clave);
    const llego = Boolean(g.llego);
    const record = Number(g.record) || 0;
    porNivel[n.id] = {
      estrellas: Number(g.estrellas) || 0,
      llego,
      record,
      abierto: anteriorLlego || llego || record > 0,
    };
    anteriorLlego = llego;
  }
  return porNivel;
};

/**
 * A qué vuelo lleva el botón «Volar»: el último que se jugó si sigue abierto y no se ha
 * logrado; si no, el primero abierto que todavía no se ha logrado.
 */
export const vueloParaSeguir = () => {
  const p = progreso();
  const r = leer();
  const ultimo = NIVELES.find((n) => n.clave === r.ultimo)?.id;
  if (ultimo && p[ultimo]?.abierto && !p[ultimo].llego) return ultimo;
  const pendiente = NIVELES.find((n) => p[n.id].abierto && !p[n.id].llego);
  if (pendiente) return pendiente.id;
  return ultimo && p[ultimo]?.abierto ? ultimo : 1;
};

/**
 * Apunta un vuelo terminado. Devuelve lo que la pantalla final necesita: si batió su
 * récord, las estrellas (y si mejoró), si abrió el siguiente vuelo y la racha ya
 * actualizada.
 */
export const apuntar = (puntos, { nivel = 1, llego = false, estrellas = 0 } = {}, hoy = diaDeCaracas()) => {
  const r = leer();
  const clave = nivelDe(nivel).clave;
  const antes = resumen(hoy, nivel);
  let racha = antes.racha;
  if (!antes.jugoHoy) racha = r.dia === ayerDe(hoy) ? (Number(r.racha) || 0) + 1 : 1;
  const previo = deVuelo(r, clave);
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
    v: 2,
    dia: hoy,
    racha,
    ultimo: clave,
    vuelos: { ...(r.vuelos ?? {}), [clave]: nuevo },
  };
  // El récord de siempre sigue siendo el de Caracas: así no se pierde al volver atrás.
  guardado.record = clave === "caracas" ? nuevo.record : Number(r.record) || 0;
  guardado.mejorHoy = clave === "caracas" ? nuevo.mejorHoy : Number(r.mejorHoy) || 0;
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

/** El mejor resultado de todos los vuelos, para la invitación por WhatsApp. */
export const mejorResultado = () => {
  const r = leer();
  let mejor = null;
  for (const n of NIVELES) {
    const g = deVuelo(r, n.clave);
    const record = Number(g.record) || 0;
    if (record > (mejor?.record ?? 0)) mejor = { record, nivel: n.id, clave: n.clave };
  }
  return mejor;
};
