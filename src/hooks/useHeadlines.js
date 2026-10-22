import { useEffect, useState } from "react";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { getTitulares, getVersionTitulares } from "../services/titularesService";

/**
 * Los titulares en caliente, al día sin recargar la página.
 *
 * Carga la lista una vez y después pregunta cada minuto la versión (una respuesta
 * mínima y en caché); si cambió, **vuelve a pedir la lista entera y la reemplaza**. Así
 * un titular nuevo aparece poco después de cada ciclo de 10 minutos, y uno que borra la
 * redacción desaparece de una pestaña abierta en menos de dos minutos. Con la pestaña
 * oculta no pregunta, y al volver a ella pregunta enseguida.
 *
 * Antes pedía solo lo cambiado (`since`) y lo mezclaba con lo que tenía. Eso fallaba
 * justo en la emergencia: «Ocultar sección» llegaba como «nada cambió» y la pestaña
 * seguía enseñando el titular falso; al volver a enseñarla, algunas quedaban vacías; y
 * el orden se iba desviando, porque solo se recalculaba el de lo que había cambiado
 * (revisión del 22-oct-2026, 1.1 y 3.1). La lista entera son como mucho 40 titulares, la
 * misma copia en caché para todos los lectores de esa versión: no cuesta nada.
 *
 * Un solo almacén por idioma, compartido: la tarjeta de la portada y la sección piden
 * lo mismo, y pasar de una a otra no vuelve a bajar la lista.
 */

const CADA_MS = 60_000;
const almacenes = new Map();

// El orden del backend: lo fijado arriba y después lo más reciente (la redacción, 22-oct-2026).
const cuando = (i) => Date.parse(i.published_at || "") || 0;
const ordenar = (items) => [...items].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
  || cuando(b) - cuando(a));

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

const cargarTodo = async (lang, version) => {
  const a = almacen(lang);
  try {
    const d = await getTitulares({ lang, version });
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
    // Cambió algo: la lista entera de esa versión, para reemplazar (ver la cabecera).
    await cargarTodo(lang, v?.version);
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
