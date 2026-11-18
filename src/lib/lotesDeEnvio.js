/**
 * Cómo se juntan los avisos al servidor: la medición de audiencia y las impresiones de
 * publicidad. Sin navegador (no toca `document` ni `navigator`), y por eso tiene
 * pruebas: `npm run test:lotes`.
 *
 * ## Por qué juntar
 *
 * El servidor es un solo proceso con una CPU, y cada petición le cuesta lo mismo de
 * entrada aunque traiga poco (medido en nov-2026: unos 5 ms de CPU por petición antes de
 * mirar qué trae). Con la medición mandando un latido cada veinte segundos y una
 * petición por cada anuncio visto, el grueso de lo que llegaba eran avisos pequeños.
 * Medido con `scripts/carga/` del backend.
 *
 * ## Lo que no cambia
 *
 * Lo que se mide. Cada evento y cada ficha llegan igual que antes, solo que en menos
 * envíos; los envíos siguen siendo `text/plain` (sin la pregunta previa de CORS, que un
 * beacon no sabe hacer) y salen igual al ocultar o cerrar la pestaña.
 */

/** El tope del servidor: `registrar_lote` ignora lo que pase de veinte eventos. */
export const MAX_EVENTOS_POR_LOTE = 20;

/**
 * Lo que se manda de una vez. `sendBeacon` admite unos 64 KB **sumando todo lo que la
 * página tenga en vuelo**, y `fetch` con `keepalive` igual; se deja margen. Un lote
 * normal no llega a 2 KB, así que esto solo corta lo que no debería pasar.
 */
export const MAX_BYTES_POR_ENVIO = 48 * 1024;

/** Los topes del servidor para las impresiones (`/publicidad/vistos`): treinta fichas
 * (`MAXIMO_VISTOS_POR_ENVIO`) y 16 KB (`MAX_CUERPO_VISTOS`); lo que pase no cuenta. */
export const MAX_FICHAS_POR_ENVIO = 30;
export const MAX_BYTES_DE_FICHAS = 16 * 1024;

const bytes = (texto) => {
  try {
    return new TextEncoder().encode(texto).length;
  } catch {
    return texto.length * 3;
  }
};

/**
 * Parte los eventos pendientes en los lotes que el servidor acepta, en su orden:
 *
 * - **una visita por lote**: el servidor solo cuenta la primera visita de cada lote (un
 *   lote con varias es fabricado). Si la de la cookie cambió entre medias -- media hora
 *   sin actividad --, lo de la anterior va en su propio lote;
 * - **una salida por lote**: la segunda la tira el servidor por la misma razón;
 * - como mucho `MAX_EVENTOS_POR_LOTE` eventos y `MAX_BYTES_POR_ENVIO` bytes.
 *
 * Devuelve la lista de cuerpos ya escritos (JSON en texto). Un lote de un solo evento
 * va como el evento suelto, que es lo que el servidor siempre aceptó.
 */
export const trocearEventos = (eventos) => {
  const lotes = [];
  let actual = [];
  let tamano = 0;
  const cerrar = () => {
    if (actual.length) lotes.push(actual);
    actual = [];
    tamano = 0;
  };
  for (const e of eventos || []) {
    if (!e || typeof e !== "object") continue;
    const peso = bytes(JSON.stringify(e)) + 1;
    const otraVisita = actual.length && actual[0].session_id !== e.session_id;
    const otraSalida = e.tipo === "salida" && actual.some((x) => x.tipo === "salida");
    if (
      otraVisita ||
      otraSalida ||
      actual.length >= MAX_EVENTOS_POR_LOTE ||
      (actual.length && tamano + peso > MAX_BYTES_POR_ENVIO)
    ) {
      cerrar();
    }
    actual.push(e);
    tamano += peso;
  }
  cerrar();
  return lotes.map((l) => JSON.stringify(l.length === 1 ? l[0] : { eventos: l }));
};

/**
 * Si toca latido. El latido existe para una sola cosa: decirle al servidor que la
 * visita sigue viva, y de eso salen el contador de lectores en vivo (los vistos en los
 * últimos cinco minutos, `VENTANA_EN_VIVO` en el backend) y la última página de cada
 * visita. Cualquier envío dice lo mismo, así que si algo salió hace menos de `cada`
 * milisegundos, el latido sobra.
 */
export const tocaLatido = ({ ahora, ultimoEnvio, cada }) =>
  // Un reloj que va hacia atrás (el aparato corrigió la hora) no puede dejar la visita
  // sin latido hasta que vuelva a pasar la hora vieja: en la duda, se late.
  !ultimoEnvio || ahora < ultimoEnvio || ahora - ultimoEnvio >= cada;

/**
 * Parte las fichas de anuncio vistas en envíos de una ficha por línea, sin repetir y
 * dentro de los topes. El servidor comprueba y cuenta cada una igual que si llegara sola.
 */
export const trocearFichas = (fichas) => {
  const unicas = [...new Set((fichas || []).filter((f) => typeof f === "string" && f && !/\s/.test(f)))];
  const envios = [];
  let actual = [];
  let tamano = 0;
  for (const f of unicas) {
    const peso = bytes(f) + 1;
    if (actual.length >= MAX_FICHAS_POR_ENVIO || (actual.length && tamano + peso > MAX_BYTES_DE_FICHAS)) {
      envios.push(actual.join("\n"));
      actual = [];
      tamano = 0;
    }
    actual.push(f);
    tamano += peso;
  }
  if (actual.length) envios.push(actual.join("\n"));
  return envios;
};
