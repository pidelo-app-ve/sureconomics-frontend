import { useEffect, useState } from "react";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { getTitulares, getVersionTitulares } from "../services/titularesService";

/**
 * Los titulares en caliente, al día sin recargar la página.
 *
 * Carga la lista una vez y después pregunta cada minuto la versión (una respuesta
 * mínima y en caché); solo si cambió pide lo nuevo con `since`, lo mezcla por `id` y
 * quita lo que el servidor diga en `removed_ids`. Así un titular nuevo aparece poco
 * después de cada ciclo de 10 minutos, y uno que borra la redacción desaparece de una
 * pestaña abierta en menos de dos minutos. Con la pestaña oculta no pregunta, y al
 * volver a ella pregunta enseguida.
 *
 * Un solo almacén por idioma, compartido: la tarjeta de la portada y la sección piden
 * lo mismo, y pasar de una a otra no vuelve a bajar la lista.
 */

const CADA_MS = 60_000;
const MAX_EN_MEMORIA = 60;
const almacenes = new Map();

const ordenar = (items) => [...items].sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));

const almacen = (lang) => {
  let a = almacenes.get(lang);
  if (!a) {
    a = {
      estado: { status: "loading", items: [], version: null, error: null },
      oyentes: new Set(),
      temporizador: null,
      enVuelo: null,
      ultima: 0,
    };
    almacenes.set(lang, a);
  }
  return a;
};

const avisar = (a) => a.oyentes.forEach((f) => f(a.estado));

const cargarTodo = async (lang) => {
  const a = almacen(lang);
  try {
    const d = await getTitulares({ lang });
    a.estado = {
      status: "success",
      items: ordenar(d?.items ?? []),
      version: d?.version ?? 0,
      error: null,
    };
  } catch (error) {
    if (!a.estado.items.length) a.estado = { ...a.estado, status: "error", error };
  }
  a.ultima = Date.now();
  avisar(a);
};

const revisar = async (lang) => {
  const a = almacen(lang);
  if (a.estado.version == null) return cargarTodo(lang);
  a.ultima = Date.now();
  try {
    const v = await getVersionTitulares();
    if (v?.version === a.estado.version) return undefined;
    const d = await getTitulares({ lang, since: a.estado.version });
    const quitar = new Set(d?.removed_ids ?? []);
    const porId = new Map(a.estado.items.filter((i) => !quitar.has(i.id)).map((i) => [i.id, i]));
    for (const i of d?.items ?? []) porId.set(i.id, i);
    a.estado = {
      status: "success",
      items: ordenar([...porId.values()]).slice(0, MAX_EN_MEMORIA),
      version: d?.version ?? a.estado.version,
      error: null,
    };
    avisar(a);
  } catch {
    // Se intenta otra vez en la vuelta siguiente: lo que ya se ve se queda.
  }
  return undefined;
};

const arrancar = (lang) => {
  const a = almacen(lang);
  if (a.estado.version == null) {
    if (!a.enVuelo) a.enVuelo = cargarTodo(lang).finally(() => { a.enVuelo = null; });
  } else if (Date.now() - a.ultima > CADA_MS) {
    revisar(lang);
  }
  if (!a.temporizador) {
    a.temporizador = setInterval(() => {
      if (document.visibilityState === "visible") revisar(lang);
    }, CADA_MS);
  }
};

const parar = (lang) => {
  const a = almacen(lang);
  if (a.oyentes.size === 0 && a.temporizador) {
    clearInterval(a.temporizador);
    a.temporizador = null;
  }
};

export const useHeadlines = () => {
  const { lang } = useIdioma();
  const [estado, setEstado] = useState(() => almacen(lang).estado);

  useEffect(() => {
    const a = almacen(lang);
    setEstado(a.estado);
    a.oyentes.add(setEstado);
    arrancar(lang);
    const alVolver = () => {
      if (document.visibilityState === "visible" && Date.now() - a.ultima > CADA_MS / 2) revisar(lang);
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      a.oyentes.delete(setEstado);
      document.removeEventListener("visibilitychange", alVolver);
      parar(lang);
    };
  }, [lang]);

  return estado;
};

/** «Hace 4 min», «Hace 2 h»: cuánto hace que se publicó, en el idioma de la página. */
export const haceCuanto = (iso, t, ahora = Date.now()) => {
  const momento = Date.parse(iso || "");
  if (Number.isNaN(momento)) return "";
  const minutos = Math.max(0, Math.floor((ahora - momento) / 60_000));
  if (minutos < 1) return t("titulares.hace.ahora");
  if (minutos < 60) return t("titulares.hace.minutos", { n: minutos });
  return t("titulares.hace.horas", { n: Math.floor(minutos / 60) });
};
