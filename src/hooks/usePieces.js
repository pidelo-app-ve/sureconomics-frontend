import { useEffect, useMemo, useRef, useState } from "react";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { elegirApertura } from "../components/home/PrimeraPlana";
import { FORMATO_META, piezasFromApi } from "../lib/pieza";
import { getPieces } from "../services/publicContentService";

/**
 * Every published piece of one format, or of all of them.
 *
 * Fetched whole rather than page by page, because the filter panel shows a count
 * next to every option and those counts have to agree with the list below them —
 * which they only do when both are computed from the same set. Server-side counts
 * would mean two code paths that have to stay in step, and the day they drift an
 * option promises a number the page cannot deliver.
 *
 * The trade is a ceiling. The API pages at 100, so this follows pages up to
 * `MAX_PAGES` and reports whether it stopped short. At five pages that is 500
 * pieces of one format; the site launches empty and the day a format passes that,
 * the filtering has to move to the server and the counts with it.
 *
 * Se guardan las filas tal como llegan y se convierten al pintar, con el idioma de la
 * página: `/` y `/en` montan la misma vista, React la conserva al cambiar de idioma, y
 * unas piezas convertidas al descargarlas se quedaban en el idioma anterior (titulares
 * y fechas en inglés en la portada española). Convertir es barato; volver a pedir
 * quinientas piezas por cada cambio de idioma, no.
 *
 * Con `portada` (sin formato) trae solo lo que pinta la portada: ver `pedirPortada`.
 */

const PER_PAGE = 100;
const MAX_PAGES = 5;

/**
 * Lo ya descargado, por formato, durante un minuto.
 *
 * La portada, Artículos y Al punto piden el mismo listado; ir y volver lo pedía otra vez
 * entero cada vez. Un minuto basta para navegar sin esperas y es lo mismo que guarda el
 * servidor (`cache_publico`), así que no enseña nada más viejo de lo que ya enseñaría.
 */
const GUARDADO_MS = 60_000;
const guardado = new Map();
const fresco = (clave) => {
  const previo = guardado.get(clave);
  return previo && Date.now() - previo.en < GUARDADO_MS ? previo : null;
};
/** A la portada le sirve también la lista entera, si está guardada. */
const guardadoPara = (portada, entera) => (portada && fresco(entera)) || fresco(portada ? "portada" : entera);
const deGuardado = ({ filas, total, truncated, faltan, de }) => ({ status: "success", filas, total, truncated, faltan, error: null, de });

const pedirPagina = (format, educational, page, limit = PER_PAGE) =>
  // `undefined` y no `false` cuando no se pide: el cliente omite los nulos, y un
  // `?educational=false` en la direccion se leeria como un filtro puesto.
  getPieces({ format, educational: educational ? true : undefined, page, limit });

/**
 * La portada, sin pedir las quinientas.
 *
 * Pinta la primera página (la que manda, Última hora, las noticias) y unas pocas piezas
 * de cada uno de los otros formatos, que en la lista mezclada van desperdigadas por las
 * cinco páginas: de cien, noventa y tantas son noticias. Y pinta las cuentas de «Cargar
 * más», que salen de las quinientas. Para pintar exactamente lo mismo bastan la primera
 * página, la pieza que cierra la quinta (el corte) y, de cada formato que no es noticia,
 * sus piezas hasta ese corte. Lo que falta de la lista entera son noticias de las páginas
 * dos a cinco, y cuántas sale de restar (`faltan`). Cuándo se piden: ver `Home`.
 *
 * Una excepción: bajo la que manda, `PrimeraPlana` pone las dos primeras piezas de su
 * tema (y lo mismo con las que rotan con ella). Si en la primera página no hay dos, las
 * de ese tema también se piden hasta el corte, como un formato, pero parando en cuanto
 * salen las dos: casi siempre una petición pequeña, y no cuatro páginas. Si falla, la
 * portada sale sin ese contexto.
 *
 * Si todo cabe en la primera página, no se pide nada más: ya es la lista entera.
 */
const POR_FORMATO = 30;

/** Si `a` va detrás de `b` en el listado: más vieja o, con la misma fecha, de id menor. */
const vaDetras = (a, b) => {
  const [fa, fb] = [Date.parse(a.published_at ?? "") || 0, Date.parse(b.published_at ?? "") || 0];
  return fa < fb || (fa === fb && a.id < b.id);
};

/**
 * Las piezas de un formato (o de un tema) hasta el corte, o todas si no lo hay, o hasta
 * que `basta`. Y mientras sea `vigente`: quien sale de la portada no se queda pidiendo.
 */
const hastaElCorte = async (filtro, corte, vigente, basta = () => false) => {
  const filas = [];
  for (let page = 1; vigente(); page += 1) {
    const trozo = await getPieces({ ...filtro, page, limit: POR_FORMATO });
    filas.push(...trozo.filas);
    const fin = await corte;
    if (!trozo.filas.length || page >= trozo.pages || basta(filas) || (fin && vaDetras(filas[filas.length - 1], fin))) return filas;
  }
  return filas;
};

const pedirPortada = async (primera, vigente = () => true) => {
  // Detrás de la primera página, como antes las otras cuatro: que nada le quite turno.
  const p1 = await primera;
  if ((p1.pages || 1) <= 1) return { filas: p1.filas, total: p1.total, truncated: false, faltan: 0 };
  // La pieza quinientos sin contar la fijada, que la API saca del orden y pone delante
  // en la primera página. Sin quinientas no hay corte: la lista entera es todo.
  const corte = pedirPagina(undefined, false, MAX_PAGES * PER_PAGE, 1).then((r) => r.filas[0] ?? null);
  const formatos = Object.keys(FORMATO_META).filter((format) => format !== "noticia");
  const piezas = piezasFromApi(p1.filas);
  // Las de arriba cuyo tema no tiene dos piezas más en la primera página (el contexto se
  // elige entre las que no están arriba).
  const { principal, secundarias } = elegirApertura(piezas);
  const arriba = [principal, ...secundarias].filter(Boolean);
  const temas = [...new Set(arriba.map((p) => p.temaSlug))].filter(
    (topic) => topic && piezas.filter((p) => p.temaSlug === topic && !arriba.includes(p)).length < 2
  );
  // De un tema bastan sus dos primeras: las que lo llevan de principal y no están arriba
  // (las de arriba ya convertidas, con la id en texto; las filas, en número).
  const lasDos = (topic) => (filas) =>
    filas.filter((f) => f.topics?.[0]?.slug === topic && !arriba.some((p) => p.id === String(f.id))).length >= 2;
  // Un tema solo da contexto: si falla, lo demás sigue, y la portada no se guarda para
  // volver a probar en la próxima visita (como cuando fallaba una de las cinco páginas).
  let incompleta = false;
  const sinTema = () => {
    incompleta = true;
    return [];
  };
  const listas = Promise.all([
    ...formatos.map((format) => hastaElCorte({ format }, corte, vigente)),
    ...temas.map((topic) => hastaElCorte({ topic }, corte, vigente, lasDos(topic)).catch(sinTema)),
  ]);
  const [fin, filasDe] = await Promise.all([corte, listas]);
  const vistas = new Set(p1.filas.map((f) => f.id));
  const extra = filasDe.flat().filter((f) => !(fin && vaDetras(f, fin)) && !vistas.has(f.id) && vistas.add(f.id));
  const filas = [...p1.filas, ...extra.sort((a, b) => (vaDetras(a, b) ? 1 : -1))];
  // La lista entera: la primera página y cuatro más de cien, o todas si no llegan a quinientas.
  const entera = fin ? p1.filas.length + (MAX_PAGES - 1) * PER_PAGE : p1.total;
  return { filas, total: p1.total, truncated: p1.pages > MAX_PAGES, faltan: Math.max(0, entera - filas.length), incompleta };
};

/** La lista entera: la primera página y las siguientes, a la vez y por detrás. */
const pedirLasCinco = async (primera, format, educational) => {
  const pages = primera.pages || 1;
  const resto = [];
  for (let page = 2; page <= Math.min(pages, MAX_PAGES); page += 1) resto.push(page);
  const trozos = await Promise.all(resto.map((page) => pedirPagina(format, educational, page)));
  // Sin repetir: la primera puede ser la que la portada ya tenía en pantalla, y si se
  // publicó algo desde entonces las páginas corrieron.
  const vistas = new Set(primera.filas.map((f) => f.id));
  const filas = [...primera.filas, ...trozos.flatMap((t) => t.filas).filter((f) => !vistas.has(f.id))];
  return { filas, total: primera.total ?? primera.filas.length, truncated: pages > MAX_PAGES, faltan: 0 };
};

/**
 * `faltan`: cuántas piezas de la lista entera no se pidieron. `0` si está entera; con
 * `portada`, `null` mientras no se sabe.
 */
export const usePieces = ({ format, educational, portada = false } = {}) => {
  const { lang } = useIdioma();
  const entera = `${format ?? ""}|${educational ? 1 : 0}`;
  const clave = portada ? "portada" : entera;
  // La primera página que la portada tiene en pantalla. Al completar la lista se sigue
  // con esa y no con una más nueva: abrir el buscador no cambia lo que se está leyendo.
  const primeraEnPantalla = useRef(null);
  const [state, setState] = useState(() => {
    const previo = guardadoPara(portada, entera);
    if (previo) return deGuardado(previo);
    return { status: "loading", filas: [], total: 0, truncated: false, faltan: 0, error: null, de: null };
  });

  useEffect(() => {
    let alive = true;
    const previo = guardadoPara(portada, entera);
    if (previo) {
      if (previo.primera) primeraEnPantalla.current = previo.primera;
      setState(deGuardado(previo));
      return () => {
        alive = false;
      };
    }
    // Lo que ya se ve se queda mientras llega el resto si es esta misma lista o la
    // portada que se completa. Otra lista, en cambio, enseña que carga.
    const sigue = (s) => s.de === clave || s.de === "portada";
    setState((s) => (sigue(s) ? s : { ...s, status: "loading", error: null }));

    (async () => {
      // La primera, sola: es la que dice cuántas páginas hay. Y en cuanto llega, se
      // pinta. Antes la portada esperaba las cinco, una detrás de otra, para enseñar
      // las veintitantas piezas de arriba que ya venían en la primera.
      const reusada = !portada && primeraEnPantalla.current;
      const primera = (reusada ? Promise.resolve(reusada) : pedirPagina(format, educational, 1)).then((p1) => {
        if (alive && portada) primeraEnPantalla.current = { ...p1, en: Date.now() };
        if (alive) {
          const pinta = { filas: p1.filas, total: p1.total ?? p1.filas.length, truncated: (p1.pages || 1) > MAX_PAGES };
          setState((s) => (sigue(s) ? s : { ...pinta, status: "success", faltan: portada ? null : 0, error: null, de: clave }));
        }
        return p1;
      });

      // El resto por detrás: completan el buscador y los contadores de los filtros sin
      // que nadie mire una pantalla vacía mientras tanto.
      const lista = await (portada ? pedirPortada(primera, () => alive) : primera.then((p1) => pedirLasCinco(p1, format, educational)));
      if (!alive) return;
      // Hecha sobre la primera página que la portada tenía en pantalla, la lista es tan
      // vieja como ella: con la hora de ahora, Explorar la tomaría por recién pedida.
      if (!lista.incompleta) {
        guardado.set(clave, { ...lista, de: clave, primera: portada ? primeraEnPantalla.current : null, en: reusada ? reusada.en : Date.now() });
      }
      setState({ ...lista, status: "success", error: null, de: clave });
    })().catch((error) => {
      if (alive) {
        // Si la primera llegó y falla una de las siguientes, se queda lo que hay: mejor
        // la portada con cien piezas que una pantalla de error.
        setState((s) =>
          s.filas.length
            ? { ...s, status: "success" }
            : { status: "error", filas: [], total: 0, truncated: false, faltan: 0, error, de: null },
        );
      }
    });

    return () => {
      alive = false;
    };
  }, [clave, entera, portada, format, educational]);

  // `lang` en las dependencias aunque no se use dentro: es lo que hace que las piezas
  // se vuelvan a convertir cuando cambia el idioma (`piezaFromApi` lo lee del motor).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => piezasFromApi(state.filas), [state.filas, lang]);
  return { status: state.status, items, total: state.total, truncated: state.truncated, error: state.error, faltan: state.faltan };
};
