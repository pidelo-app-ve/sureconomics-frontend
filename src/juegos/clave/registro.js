/**
 * Lo que «La Clave» recuerda de quien juega: cada partida (para no repetirla ni
 * perderla al recargar), la racha y las estadísticas.
 *
 * Solo en este navegador (`localStorage`), sin cuenta y sin nada que viaje al servidor,
 * como la guacamaya. Todo acceso va en try/catch: con el almacenamiento bloqueado se
 * juega igual, solo que sin memoria.
 *
 * ```
 * { v: 1,
 *   categoria: "deportes",                          // la última elegida
 *   partidas: { "dia|2026-10-08|deportes": { intentos: [...], estado: "jugando|gano|perdio" } },
 *   stats: { jugadas, ganadas, racha, mejorRacha, ultimoDia, ultimoDiaGanado, distribucion: {1..6} } }
 * ```
 *
 * La racha cuenta **días seguidos con la palabra del día acertada** (cualquier
 * categoría). Las partidas de las piezas suman a jugadas y ganadas, pero no a la racha:
 * son un extra, no el reto diario.
 */

const CLAVE = "se_clave";
const MAX_PARTIDAS = 120;

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

const statsBase = () => ({
  jugadas: 0,
  ganadas: 0,
  racha: 0,
  mejorRacha: 0,
  ultimoDia: null,
  ultimoDiaGanado: null,
  distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
});

/** El identificador de una partida: la del día de una categoría, o la de una pieza. */
export const idDePartida = ({ dia, categoria, slug }) => (slug ? `pieza|${slug}` : `dia|${dia}|${categoria}`);

export const leerPartida = (id) => {
  const p = leer().partidas?.[id];
  return p && Array.isArray(p.intentos) ? p : { intentos: [], estado: "jugando" };
};

export const guardarPartida = (id, partida) => {
  const r = leer();
  const partidas = { ...(r.partidas ?? {}), [id]: partida };
  // Que no crezca sin fin: se quedan las últimas.
  const claves = Object.keys(partidas);
  if (claves.length > MAX_PARTIDAS) {
    for (const k of claves.slice(0, claves.length - MAX_PARTIDAS)) delete partidas[k];
  }
  escribir({ ...r, v: 1, partidas });
};

export const categoriaPreferida = () => leer().categoria || null;
export const recordarCategoria = (categoria) => escribir({ ...leer(), v: 1, categoria });

/** Las estadísticas, con la racha ya interpretada para hoy. */
export const estadisticas = (hoy) => {
  const s = { ...statsBase(), ...(leer().stats ?? {}) };
  // La racha sigue viva si se acertó hoy o ayer; si no, se rompió.
  const viva = s.ultimoDiaGanado === hoy || s.ultimoDiaGanado === ayerDe(hoy);
  return { ...s, racha: viva ? s.racha : 0 };
};

/**
 * Apunta una partida terminada. `esDelDia` dice si cuenta para la racha. Devuelve las
 * estadísticas nuevas y si la racha subió.
 */
export const apuntar = ({ hoy, gano, intentos, esDelDia }) => {
  const r = leer();
  const s = { ...statsBase(), ...(r.stats ?? {}) };
  s.distribucion = { ...statsBase().distribucion, ...(s.distribucion ?? {}) };
  s.jugadas += 1;
  let rachaSubio = false;
  if (gano) {
    s.ganadas += 1;
    s.distribucion[intentos] = (s.distribucion[intentos] ?? 0) + 1;
  }
  if (esDelDia) {
    if (gano) {
      if (s.ultimoDiaGanado !== hoy) {
        s.racha = s.ultimoDiaGanado === ayerDe(hoy) ? s.racha + 1 : 1;
        s.ultimoDiaGanado = hoy;
        rachaSubio = true;
      }
    } else if (s.ultimoDiaGanado !== hoy) {
      s.racha = 0;
    }
    s.ultimoDia = hoy;
  }
  s.mejorRacha = Math.max(s.mejorRacha, s.racha);
  escribir({ ...r, v: 1, stats: s });
  return { stats: s, rachaSubio };
};
