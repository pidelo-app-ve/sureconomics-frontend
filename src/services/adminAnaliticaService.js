import { adminRequest } from "../lib/api";
import { readStoredAuth } from "../lib/authStorage";
import { nombreDelInforme } from "../lib/audiencia";
import { unwrapEntity } from "./adminResponseUtils";

/**
 * Los números de audiencia, solo para el panel.
 *
 * No hay equivalente público a propósito: que el número de lectores en vivo se enseñe
 * en el sitio es una decisión editorial que nadie ha tomado, y una cifra publicada no se
 * recoge después.
 *
 * ## Por qué las respuestas se normalizan aquí
 *
 * El panel y la API se despliegan por separado -- Vercel y Render, dos servicios
 * distintos --, así que hay minutos, y a veces días, en que la pantalla es más nueva que
 * el servidor que le contesta. Con la respuesta cruda eso se ve como un `undefined %`
 * escrito en una tarjeta: un fallo que parece de la medición y es de despliegue.
 *
 * Rellenar aquí los huecos hace que la pantalla enseñe «sin datos», que es lo honesto:
 * no los tiene. Las listas que faltan pasan a vacías y los conteos a cero; las cifras
 * derivadas -- páginas por visita, tiempo, porcentaje -- pasan a `null` y no a cero,
 * porque un cero ahí sería una afirmación falsa y no un hueco. El componente se queda
 * sin una sola comprobación defensiva: la forma le llega siempre completa.
 */

const numeroDe = (v, porDefecto = 0) => (typeof v === "number" && Number.isFinite(v) ? v : porDefecto);
/**
 * Igual, pero un campo ausente vale `null` y no cero.
 *
 * La diferencia importa: cero páginas por visita es una afirmación -- falsa -- y `null`
 * es «no lo sé», que es lo que pasa cuando el servidor no manda ese dato. La pantalla
 * dibuja una raya para `null` y el número para el cero de verdad.
 */
const cifraDe = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const listaDe = (v) => (Array.isArray(v) ? v : []);
/**
 * Un bloque entero que puede no venir: `null` si falta.
 *
 * Es para lo que el servidor manda vacío a propósito cuando aún no hay con qué
 * calcularlo -- la proyección del mes, la audiencia real -- y para lo que un servidor
 * más viejo no manda. En los dos casos la pantalla dice «todavía no», que es verdad.
 */
const bloqueDe = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);

/** Quién está leyendo ahora mismo y qué. */
export const getEnVivo = async () => {
  const d = unwrapEntity(await adminRequest("/admin/analitica/en-vivo")) ?? {};
  return {
    lectores: numeroDe(d.lectores),
    personas: numeroDe(d.personas),
    ventana_minutos: numeroDe(d.ventana_minutos, 5),
    paginas: listaDe(d.paginas),
  };
};

/**
 * La zona horaria de quien está mirando, en nombre IANA: «America/Caracas».
 *
 * Va al servidor porque las marcas se guardan en UTC -- que es como hay que guardarlas --
 * y agrupar por la hora UTC ponía las visitas de las ocho de la mañana a las doce del
 * mediodía. Se manda el nombre y no el desfase en minutos: un desfase fijo aplicado a
 * noventa días se equivoca en una hora en los tramos que cruzan un cambio de horario.
 */
const zonaDeAqui = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    // Si el navegador no la sabe, el servidor agrupa en UTC y lo dice en la respuesta.
    return undefined;
  }
};

/** Lo de los últimos días: visitas, quién vuelve y cuánto se lee cada cosa. */
export const getResumen = async (dias = 7) => {
  const d =
    unwrapEntity(
      await adminRequest("/admin/analitica/resumen", {
        query: { dias, zona: zonaDeAqui() },
      })
    ) ?? {};
  return {
    dias: numeroDe(d.dias, dias),
    // La zona en la que el servidor ha agrupado. Puede no ser la pedida: si el nombre no
    // se reconoce, contesta en UTC y lo dice aqui, que es lo que la pantalla avisa.
    zona: typeof d.zona === "string" ? d.zona : null,
    sesiones: numeroDe(d.sesiones),
    personas: numeroDe(d.personas),
    recurrentes: numeroDe(d.recurrentes),
    paginas_por_visita: cifraDe(d.paginas_por_visita),
    segundos_por_visita: cifraDe(d.segundos_por_visita),
    una_pagina: cifraDe(d.una_pagina),
    anterior: {
      sesiones: numeroDe(d.anterior?.sesiones),
      personas: numeroDe(d.anterior?.personas),
    },
    // Si el cambio frente al periodo anterior es de fiar o puede ser casualidad.
    comparacion: {
      sesiones: bloqueDe(d.comparacion?.sesiones),
      personas: bloqueDe(d.comparacion?.personas),
    },
    serie: listaDe(d.serie),
    horas: listaDe(d.horas),
    profundidad: listaDe(d.profundidad),
    formatos: listaDe(d.formatos),
    piezas: listaDe(d.piezas),
    salidas: listaDe(d.salidas),
    // De las lecturas de texto, en cuántas el tiempo dio para leer la pieza entera.
    completas: {
      lecturas: numeroDe(d.completas?.lecturas),
      enteras: numeroDe(d.completas?.enteras),
      porcentaje: cifraDe(d.completas?.porcentaje),
    },
    // De quienes vinieron una semana, cuántos volvieron la siguiente.
    retorno: {
      semanas: listaDe(d.retorno?.semanas),
      personas: numeroDe(d.retorno?.personas),
      volvieron: numeroDe(d.retorno?.volvieron),
      porcentaje: cifraDe(d.retorno?.porcentaje),
    },
    // «A este ritmo, el mes cierra en…». `null` mientras no haya dos semanas medidas.
    proyeccion: bloqueDe(d.proyeccion),
    // Por dónde llegan, desde qué país y con qué aparato. Solo desde nov-2026.
    origen: {
      con_dato: numeroDe(d.origen?.con_dato),
      sin_dato: numeroDe(d.origen?.sin_dato),
      canales: listaDe(d.origen?.canales),
      fuentes: listaDe(d.origen?.fuentes),
    },
    paises: {
      con_dato: numeroDe(d.paises?.con_dato),
      lista: listaDe(d.paises?.lista),
    },
    dispositivos: listaDe(d.dispositivos),
    // Cuánta gente hay contando a quien no aceptó las cookies: un rango. `null`
    // mientras el contador de páginas no tenga datos.
    audiencia_real: bloqueDe(d.audiencia_real),
    boletin: {
      altas: numeroDe(d.boletin?.altas),
      medidas: numeroDe(d.boletin?.medidas),
      por_canal: listaDe(d.boletin?.por_canal),
    },
  };
};

/**
 * Cuántos aceptaron y cuántos rechazaron el aviso de cookies, por día y en total.
 *
 * Sin zona: el día se fijó al contar, en la hora editorial, y el servidor dice cuál. La
 * tasa viene `null` -- y no cero -- cuando nadie ha contestado, por lo mismo que las
 * cifras derivadas del resumen.
 */
export const getConsentimiento = async (dias = 30) => {
  const d =
    unwrapEntity(
      await adminRequest("/admin/analitica/consentimiento", { query: { dias } })
    ) ?? {};
  return {
    dias: numeroDe(d.dias, dias),
    zona: typeof d.zona === "string" ? d.zona : null,
    si: numeroDe(d.si),
    no: numeroDe(d.no),
    tasa_aceptacion: cifraDe(d.tasa_aceptacion),
    serie: listaDe(d.serie),
  };
};

/**
 * Descarga el informe del periodo en una hoja de cálculo (`.xlsx`).
 *
 * Lleva lo mismo que la pantalla sin recortar -- todas las piezas, todas las fuentes --
 * y admite hasta lo que el servidor conserva, que es más de lo que la pantalla deja
 * elegir. Es para trabajar con los datos fuera del panel o pasárselos a un tercero.
 *
 * Va igual que la descarga de la lista del boletín (`downloadNewsletterCsv`), y por
 * lo mismo: el endpoint pide la cabecera `Authorization`, que un enlace normal no
 * manda. Una petición mínima por `adminRequest` antes, solo para que refresque el
 * token si estaba a punto de caducar; después los bytes a memoria y de ahí al
 * navegador como descarga.
 */
export const descargarInforme = async (dias = 30) => {
  await adminRequest("/admin/analitica/en-vivo");

  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const consulta = new URLSearchParams({ dias: String(dias) });
  const zona = zonaDeAqui();
  if (zona) consulta.set("zona", zona);
  const res = await fetch(`${base}/admin/analitica/informe?${consulta}`, {
    headers: { Authorization: `Bearer ${readStoredAuth().accessToken || ""}` },
  });
  if (!res.ok) {
    const detalle = await res.json().catch(() => ({}));
    throw new Error(detalle?.error?.message || "No se pudo descargar el informe.");
  }

  const blob = await res.blob();
  const objeto = URL.createObjectURL(blob);
  try {
    const enlace = document.createElement("a");
    enlace.href = objeto;
    enlace.download = nombreDelInforme(dias);
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  } finally {
    // Sin esto el blob se queda en memoria hasta que se recargue la página.
    URL.revokeObjectURL(objeto);
  }
};
