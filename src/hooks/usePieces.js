import { useEffect, useMemo, useRef, useState } from "react";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { elegirApertura, precargarApertura } from "../components/home/PrimeraPlana";
import { textoDeBusqueda } from "../lib/contentFilter";
import { FORMATO_META, piezasFromApi } from "../lib/pieza";
import { trasLaFoto } from "../lib/trasLaFoto";
import { getPieces, getPortadaDelHtml, soltarPortadaDelHtml } from "../services/publicContentService";

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
 *
 * Con `q` (lo escrito en el buscador) pide al servidor las que lo llevan en el título,
 * el resumen o el nombre del entrevistado, en español o en inglés (`/posts?q=`), en vez
 * de buscar solo entre las quinientas más recientes: el techo ya se pasó (en «Noticias»
 * desde mediados de octubre de 2026) y lo anterior no aparecía al buscarlo. Ver
 * `ESPERA_BUSQUEDA` y `buscando`.
 */

const PER_PAGE = 100;
const MAX_PAGES = 5;

/**
 * Lo que se espera desde la última tecla antes de preguntar al servidor: escribir
 * «petróleo» no son ocho búsquedas. Mientras tanto, y mientras llega la respuesta, se
 * sigue viendo la lista anterior filtrada aquí (`buscando` dice que viene otra). Solo
 * cuando hay una lista en pantalla, es decir, cuando se está escribiendo: la búsqueda que
 * llega en la dirección (un enlace a `/explorar?q=…`) se pide enseguida.
 */
const ESPERA_BUSQUEDA = 300;

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
const deGuardado = ({ filas, total, truncated, faltan, de }) => ({ status: "success", filas, total, truncated, faltan, error: null, de, buscando: false });

const pedirPagina = ({ format, educational, q }, page, limit = PER_PAGE) =>
  // `undefined` y no `false` (ni "") cuando no se pide: el cliente omite los nulos, y un
  // `?educational=false` en la direccion se leeria como un filtro puesto.
  getPieces({ format, educational: educational ? true : undefined, q: q || undefined, page, limit });

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

/** La primera página y, detrás, lo que se le añade de las otras cuatro (sin repetir y hasta el corte). */
const coser = (p1, fin, filas) => {
  const vistas = new Set(p1.filas.map((f) => f.id));
  const extra = filas.filter((f) => !(fin && vaDetras(f, fin)) && !vistas.has(f.id) && vistas.add(f.id));
  return [...p1.filas, ...extra.sort((a, b) => (vaDetras(a, b) ? 1 : -1))];
};

/**
 * `aplazar` (la portada en el teléfono): las listas de los formatos esperan a la foto que
 * abre la portada, porque todo eso va debajo del pliegue y le quitaba ancho de banda a
 * la foto que Google mide (ver `trasLaFoto`). En escritorio no se aplaza: la columna de
 * opinión va arriba a la derecha y sale de estas listas.
 *
 * El corte (una sola fila) y los temas del contexto de la apertura no esperan nunca: el
 * contexto va bajo la foto, también en el teléfono. En cuanto están, `alAvanzar` recibe
 * la lista con ellos, para pintarlo sin esperar a los formatos. Son las mismas filas que
 * trae después la lista completa, así que lo pintado no cambia.
 */
const pedirPortada = async (primera, vigente = () => true, { aplazar = false, alAvanzar = null } = {}) => {
  // Detrás de la primera página, como antes las otras cuatro: que nada le quite turno.
  const p1 = await primera;
  if ((p1.pages || 1) <= 1) return { filas: p1.filas, total: p1.total, truncated: false, faltan: 0 };
  // La pieza quinientos sin contar la fijada, que la API saca del orden y pone delante
  // en la primera página. Sin quinientas no hay corte: la lista entera es todo.
  const corte = pedirPagina({}, MAX_PAGES * PER_PAGE, 1).then((r) => r.filas[0] ?? null);
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
  const deTemas = Promise.all(temas.map((topic) => hastaElCorte({ topic }, corte, vigente, lasDos(topic)).catch(sinTema)));
  const conTemas = Promise.all([corte, deTemas]).then(([fin, listas]) => {
    if (temas.length && alAvanzar && vigente()) alAvanzar(coser(p1, fin, listas.flat()));
    return listas;
  });
  // Si quien pidió se va mientras se espera, que un fallo de estas no quede sin atender.
  conTemas.catch(() => {});
  if (aplazar) {
    await trasLaFoto();
    if (!vigente()) return { filas: p1.filas, total: p1.total, truncated: false, faltan: null, incompleta: true };
  }
  const deFormatos = Promise.all(formatos.map((format) => hastaElCorte({ format }, corte, vigente)));
  const [fin, filasDeTemas, filasDeFormatos] = await Promise.all([corte, conTemas, deFormatos]);
  const filas = coser(p1, fin, [...filasDeFormatos.flat(), ...filasDeTemas.flat()]);
  // La lista entera: la primera página y cuatro más de cien, o todas si no llegan a quinientas.
  const entera = fin ? p1.filas.length + (MAX_PAGES - 1) * PER_PAGE : p1.total;
  return { filas, total: p1.total, truncated: p1.pages > MAX_PAGES, faltan: Math.max(0, entera - filas.length), incompleta };
};

/** Lo que se pinta de la primera página mientras llega el resto. */
const pintable = (p1) => ({ filas: p1.filas, total: p1.total ?? p1.filas.length, truncated: (p1.pages || 1) > MAX_PAGES });

/** La lista entera: la primera página y las siguientes, a la vez y por detrás. */
const pedirLasCinco = async (primera, filtro) => {
  const pages = primera.pages || 1;
  const resto = [];
  for (let page = 2; page <= Math.min(pages, MAX_PAGES); page += 1) resto.push(page);
  const trozos = await Promise.all(resto.map((page) => pedirPagina(filtro, page)));
  // Sin repetir: la primera puede ser la que la portada ya tenía en pantalla, y si se
  // publicó algo desde entonces las páginas corrieron.
  const vistas = new Set(primera.filas.map((f) => f.id));
  const filas = [...primera.filas, ...trozos.flatMap((t) => t.filas).filter((f) => !vistas.has(f.id))];
  return { filas, total: primera.total ?? primera.filas.length, truncated: pages > MAX_PAGES, faltan: 0 };
};

/**
 * `faltan`: cuántas piezas de la lista entera no se pidieron. `0` si está entera; con
 * `portada`, `null` mientras no se sabe.
 *
 * `buscando`: lo que se ve es la lista anterior y ya viene la de otra búsqueda (`q`).
 * Quien pinta no debe decir «sin resultados» mientras tanto.
 */
export const usePieces = ({ format, educational, q, portada = false, aplazar = false } = {}) => {
  const { lang } = useIdioma();
  // La portada no busca en el servidor: su buscador filtra lo que ya tiene (ver `Home`).
  const busca = portada ? "" : textoDeBusqueda(q);
  const base = `${format ?? ""}|${educational ? 1 : 0}`;
  const entera = `${base}|${busca}`;
  const clave = portada ? "portada" : entera;
  // La primera página que la portada tiene en pantalla. Al completar la lista se sigue
  // con esa y no con una más nueva: abrir el buscador no cambia lo que se está leyendo.
  const primeraEnPantalla = useRef(null);
  // Lo último pintado, para saber en el efecto si se está escribiendo sobre una lista.
  const pintado = useRef(null);
  // La primera página de la portada, si vino con el HTML (`api/portada.js`): se pinta en el
  // primer render, sin pedirla y sin pasar por «Cargando…»; lo demás se pide detrás, como
  // siempre. Si es vieja (la portada de antes que sirve el borde si la función falla, o un
  // reloj adelantado), se pinta igual y se pide la de ahora, que la reemplaza al llegar: lo
  // que ya se ve no desaparece. Se lee al montar y vale una vez (ver `soltarPortadaDelHtml`).
  const [delHtml] = useState(() => (portada ? getPortadaDelHtml() : null));
  const [state, setState] = useState(() => {
    const previo = guardadoPara(portada, entera);
    if (previo) return deGuardado(previo);
    if (delHtml) return { ...pintable(delHtml), status: "success", faltan: null, error: null, de: "portada", buscando: false };
    return { status: "loading", filas: [], total: 0, truncated: false, faltan: 0, error: null, de: null, buscando: false };
  });

  useEffect(() => {
    let alive = true;
    const filtro = { format, educational, q: busca };
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
    // Otra búsqueda en la misma lista (o quitar la que había): tampoco se vacía la
    // pantalla. Se ve la anterior, filtrada por quien pinta, hasta que llega la nueva; si
    // no, el campo de búsqueda desaparecería a cada tecla mientras «carga».
    const otraBusqueda = (s) => !portada && s.status === "success" && String(s?.de).startsWith(`${base}|`);
    const escribiendo = Boolean(busca) && otraBusqueda(pintado.current);
    setState((s) => {
      if (sigue(s)) return s;
      return otraBusqueda(s) ? { ...s, buscando: true } : { ...s, status: "loading", error: null };
    });

    const pedir = async () => {
      // La primera, sola: es la que dice cuántas páginas hay. Y en cuanto llega, se
      // pinta. Antes la portada esperaba las cinco, una detrás de otra, para enseñar
      // las veintitantas piezas de arriba que ya venían en la primera.
      const reusada = !portada && !busca && primeraEnPantalla.current;
      const yaVino = portada ? delHtml : null;
      const sirve = yaVino && !yaVino.vieja ? yaVino : null;
      const primera = (reusada || sirve ? Promise.resolve(reusada || sirve) : pedirPagina(filtro, 1)).then((p1) => {
        if (alive && yaVino) soltarPortadaDelHtml();
        if (alive && portada) {
          // La del HTML es tan vieja como el HTML: cuenta desde que se armó, no desde ahora.
          primeraEnPantalla.current = { ...p1, en: p1 === sirve ? sirve.generada : Date.now() };
          // La foto de la apertura, pedida ya: antes de que React pinte la portada entera.
          precargarApertura(piezasFromApi(p1.filas));
        }
        if (alive) {
          // La vieja del HTML se reemplaza por la de ahora en cuanto llega.
          setState((s) =>
            sigue(s) && !yaVino?.vieja
              ? s
              : { ...pintable(p1), status: "success", faltan: portada ? null : 0, error: null, de: clave, buscando: false },
          );
        }
        return p1;
      });

      // El resto por detrás: completan el buscador y los contadores de los filtros sin
      // que nadie mire una pantalla vacía mientras tanto.
      // Lo que llega antes que el resto (el contexto de la apertura) se pinta sobre la
      // primera página, si es esa la que está en pantalla.
      const alAvanzar = (filas) => setState((s) => (s.de === clave && s.status === "success" ? { ...s, filas } : s));
      const lista = await (portada
        ? pedirPortada(primera, () => alive, { aplazar, alAvanzar })
        : primera.then((p1) => pedirLasCinco(p1, filtro)));
      if (!alive) return;
      // Hecha sobre la primera página que la portada tenía en pantalla, la lista es tan
      // vieja como ella: con la hora de ahora, Explorar la tomaría por recién pedida.
      // Las búsquedas no se guardan: cada una es una entrada nueva y el guardado no se
      // vaciaría nunca (el servidor ya las guarda un minuto).
      if (!lista.incompleta && !busca) {
        guardado.set(clave, { ...lista, de: clave, primera: portada ? primeraEnPantalla.current : null, en: reusada ? reusada.en : sirve ? sirve.generada : Date.now() });
      }
      setState({ ...lista, status: "success", error: null, de: clave, buscando: false });
    };

    const correr = () =>
      pedir().catch((error) => {
        if (alive) {
          // Si la primera llegó y falla una de las siguientes, se queda lo que hay: mejor
          // la portada con cien piezas que una pantalla de error.
          setState((s) =>
            s.filas.length
              ? { ...s, status: "success", buscando: false }
              : { status: "error", filas: [], total: 0, truncated: false, faltan: 0, error, de: null, buscando: false },
          );
        }
      });
    // Una búsqueda escrita sobre una lista espera a que se deje de escribir
    // (`ESPERA_BUSQUEDA`); lo demás, no.
    const espera = escribiendo ? setTimeout(correr, ESPERA_BUSQUEDA) : null;
    if (!escribiendo) correr();

    return () => {
      alive = false;
      clearTimeout(espera);
    };
  }, [clave, entera, base, busca, portada, format, educational, aplazar, delHtml]);

  // `lang` en las dependencias aunque no se use dentro: es lo que hace que las piezas
  // se vuelvan a convertir cuando cambia el idioma (`piezaFromApi` lo lee del motor).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => piezasFromApi(state.filas), [state.filas, lang]);
  pintado.current = state;
  return {
    status: state.status,
    items,
    total: state.total,
    truncated: state.truncated,
    error: state.error,
    faltan: state.faltan,
    buscando: Boolean(state.buscando),
  };
};
