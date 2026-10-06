/**
 * El motor de idiomas: los diccionarios, la función `t()` y la dirección de cada idioma.
 *
 * Sin librerías a propósito: lo que el sitio necesita cabe en este archivo y así no se
 * paga ni se aprende nada de más. Tres reglas lo gobiernan:
 *
 * 1. **El idioma vive en la dirección.** Español sin prefijo (`/noticias/...`), inglés
 *    bajo `/en` (`/en/noticias/...`). Nada de cookies ni `?lang=`: Google indexa cada
 *    idioma por separado y un enlace copiado lleva al idioma en que se copió.
 * 2. **Los textos viven en JSON, no en el código.** Uno por zona y por idioma, en
 *    `es/` y `en/`. Cambiar un texto es editar una línea. Las claves van por nombre
 *    (`cuenta.entrar.titulo`) y no por el texto en español: si el español cambia, el
 *    inglés sigue enganchado.
 * 3. **El inglés no pesa en el español.** Los JSON en español entran en el paquete
 *    (sustituyen a los textos sueltos que había: peso neto cero); los de inglés se
 *    descargan solo al entrar en `/en`, antes de pintar (ver el `loader` en `routes.jsx`).
 *
 * Este archivo no importa ningún diccionario: `diccionarios.js` los registra. Así las
 * pruebas (`motor.test.mjs`) lo cargan en Node con diccionarios de mentira.
 *
 * Fuera de React (formatear una fecha, mapear una pieza de la API) se usa
 * `idiomaActual()`: el idioma del documento, que `ProveedorIdioma` fija antes de pintar.
 * Es un valor global a propósito: una página está en un solo idioma a la vez.
 */

export const IDIOMAS = ["es", "en"];
export const IDIOMA_BASE = "es";

/** Nombre de cada idioma en su propio idioma: lo que se lee en el conmutador. */
export const NOMBRE_DEL_IDIOMA = { es: "Español", en: "English" };

/** La región que se usa para fechas y cifras. `es` a secas da «1 ago 2026», que es lo que ya imprimían las tarjetas. */
export const REGION = { es: "es", en: "en-US" };

const diccionarios = { es: null, en: null };
let actual = IDIOMA_BASE;
let cargarEn = null;

export const idiomaActual = () => actual;

/** Lo llama `ProveedorIdioma` al montar y al cambiar de ruta. */
export const fijarIdioma = (lang) => {
  actual = IDIOMAS.includes(lang) ? lang : IDIOMA_BASE;
};

export const registrarDiccionario = (lang, dic) => {
  diccionarios[lang] = dic;
};

/** `diccionarios.js` deja aquí cómo descargar el inglés; el motor no sabe de archivos. */
export const registrarCargador = (lang, cargador) => {
  if (lang === "en") cargarEn = cargador;
};

/** Descarga el diccionario de un idioma si aún no está. El español ya viene. */
export const cargarIdioma = async (lang) => {
  if (lang === IDIOMA_BASE || diccionarios[lang]) return;
  if (!cargarEn) throw new Error("[i18n] nadie registró cómo cargar el inglés: importa i18n/diccionarios antes de las rutas");
  diccionarios[lang] = await cargarEn();
};

export const diccionarioCargado = (lang) => Boolean(diccionarios[lang]);

const buscar = (dic, clave) => {
  if (!dic) return undefined;
  // Primero la clave entera (las hay con puntos dentro); después por tramos.
  if (Object.prototype.hasOwnProperty.call(dic, clave)) return dic[clave];
  let nodo = dic;
  for (const tramo of clave.split(".")) {
    if (nodo == null || typeof nodo !== "object") return undefined;
    nodo = nodo[tramo];
  }
  return nodo;
};

const reglasPlural = {};
const categoria = (lang, n) => {
  if (!reglasPlural[lang]) reglasPlural[lang] = new Intl.PluralRules(REGION[lang] ?? lang);
  return reglasPlural[lang].select(n);
};

/** `{nombre}` → vars.nombre. Si algún valor no es texto (un elemento de React), devuelve una lista de trozos. */
const rellenar = (texto, vars) => {
  if (!vars) return texto;
  const trozos = String(texto).split(/(\{[a-zA-Z0-9_]+\})/g);
  let hayNodos = false;
  const partes = trozos.map((trozo, i) => {
    const m = /^\{([a-zA-Z0-9_]+)\}$/.exec(trozo);
    if (!m) return trozo;
    const valor = vars[m[1]];
    if (valor === undefined) return trozo;
    if (typeof valor === "object" && valor !== null) {
      hayNodos = true;
      // Un elemento de React necesita `key` dentro de una lista; se clona con una.
      return valor.$$typeof ? { ...valor, key: valor.key ?? `v${i}` } : valor;
    }
    return String(valor);
  });
  if (!hayNodos) return partes.join("");
  return partes.filter((p) => p !== "");
};

/**
 * Traduce `clave` en `lang`. Si falta, cae al español y avisa en desarrollo; si tampoco
 * está en español, devuelve la clave: se ve y se arregla, en vez de un hueco mudo.
 *
 * Un valor puede ser un objeto de plurales (`{ "one": "...", "other": "..." }`): se
 * elige según `vars.n` con las reglas del idioma, y `{n}` sale ya formateado.
 */
export const traducir = (lang, clave, vars) => {
  let valor = buscar(diccionarios[lang], clave);
  if (valor === undefined && lang !== IDIOMA_BASE) {
    if (import.meta.env?.DEV && diccionarios[lang]) {
      console.warn(`[i18n] falta la clave «${clave}» en ${lang}`);
    }
    valor = buscar(diccionarios[IDIOMA_BASE], clave);
  }
  if (valor === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] no existe la clave «${clave}»`);
    return clave;
  }
  if (valor !== null && typeof valor === "object") {
    const n = Number(vars?.n ?? 0);
    const forma = valor[categoria(lang, n)] ?? valor.other ?? Object.values(valor)[0];
    return rellenar(forma, { ...vars, n: formatearNumero(n, lang) });
  }
  return rellenar(valor, vars);
};

/** Para código fuera de React: traduce en el idioma del documento. */
export const tActual = (clave, vars) => traducir(idiomaActual(), clave, vars);

/* —— Direcciones ———————————————————————————————————————————————————————— */

/** `/en/noticias/x` → "en"; `/noticias/x` → "es". */
export const idiomaDeRuta = (pathname) =>
  pathname === "/en" || pathname.startsWith("/en/") ? "en" : "es";

/** Quita el prefijo de idioma: `/en/noticias/x` → `/noticias/x`; `/en` → `/`. */
export const sinPrefijo = (pathname) => {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
};

/**
 * La misma ruta en `lang`. Acepta rutas con consulta (`/articulos?formato=noticias`).
 * Las rutas que no son del sitio (http…, mailto:, #ancla) se devuelven tal cual.
 */
export const rutaEnIdioma = (ruta, lang) => {
  if (typeof ruta !== "string" || !ruta.startsWith("/")) return ruta;
  const [camino, ...resto] = ruta.split(/(?=[?#])/);
  const base = sinPrefijo(camino);
  const nuevo = lang === IDIOMA_BASE ? base : base === "/" ? "/en" : `/en${base}`;
  return nuevo + resto.join("");
};

/* —— Fechas y cifras ———————————————————————————————————————————————————— */

const formateadores = {};
const formateador = (lang, opciones) => {
  const clave = `${lang}|${JSON.stringify(opciones)}`;
  if (!formateadores[clave]) formateadores[clave] = new Intl.DateTimeFormat(REGION[lang] ?? lang, opciones);
  return formateadores[clave];
};

export const ESTILOS_DE_FECHA = {
  /** `1 ago 2026` / `Aug 1, 2026`: el de las tarjetas. */
  corta: { day: "numeric", month: "short", year: "numeric" },
  /** `1 de agosto de 2026` / `August 1, 2026`. */
  larga: { day: "numeric", month: "long", year: "numeric" },
  /** `1 ago` / `Aug 1`. */
  diaMes: { day: "numeric", month: "short" },
  /** `1 de agosto` / `August 1`. */
  diaMesLargo: { day: "numeric", month: "long" },
  /** `1 ago, 9:21` / `Aug 1, 9:21 AM`. */
  conHora: { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" },
  /** `9:21` / `9:21 AM`. */
  hora: { hour: "numeric", minute: "2-digit" },
};

/**
 * Una fecha en el idioma del documento (o en `lang`). `valor` puede ser un ISO, un
 * `Date` o un `YYYY-MM-DD`; este último se lee a mediodía UTC para que no cambie de día
 * según la zona horaria. Devuelve "" si no es una fecha.
 */
export const formatearFecha = (valor, estilo = "corta", lang = idiomaActual(), extra = {}) => {
  if (!valor) return "";
  const soloDia = typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const fecha = valor instanceof Date ? valor : new Date(soloDia ? `${valor}T12:00:00Z` : valor);
  if (Number.isNaN(fecha.getTime())) return "";
  const opciones = { ...(ESTILOS_DE_FECHA[estilo] ?? ESTILOS_DE_FECHA.corta), ...extra };
  if (soloDia) opciones.timeZone = "UTC";
  // Intl pone «sept» en español donde las tarjetas siempre dijeron «sep».
  return formateador(lang, opciones).format(fecha).replace(/\bsept\b/, "sep");
};

export const formatearNumero = (n, lang = idiomaActual(), opciones = {}) =>
  new Intl.NumberFormat(REGION[lang] ?? lang, opciones).format(n);
