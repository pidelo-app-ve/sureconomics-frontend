/**
 * Comprueba los diccionarios y busca textos en español que sigan sueltos en el código.
 *
 *   npm run i18n              (falla si hay algo que arreglar)
 *   npm run i18n -- --restos  (además lista, archivo por archivo, los textos que faltan por mover)
 *
 * Tres comprobaciones:
 * 1. **Paridad:** toda clave de `es/` existe en `en/` y al revés, ninguna está vacía, y
 *    las variables `{asi}` y las formas del plural coinciden en los dos idiomas.
 * 2. **Claves usadas:** cada `t("clave")` del código existe en el diccionario, y cada
 *    clave del diccionario se usa en algún sitio (si no, es basura que confunde al
 *    traductor). Las claves que se arman en tiempo de ejecución (`t(\`formatos.${x}\`)`)
 *    no se pueden seguir; se marcan como dinámicas con su prefijo.
 * 3. **Restos:** texto visible en español que sigue escrito en los `.jsx` públicos
 *    (entre etiquetas o en `aria-label`, `placeholder`, `title`, `alt`). Es la lista de
 *    lo que falta por traducir. Una línea se puede eximir con `// i18n:ignorar` al final
 *    o en la línea anterior: nombres propios, marcas, cosas que no se traducen.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(RAIZ, "src");
const CON_RESTOS = process.argv.includes("--restos");

// Fuera del escaneo: el panel y lo que solo usa el panel (`useAdmin*`), el juego de otro
// equipo, las pruebas y el propio motor.
const IGNORADOS = [/[\\/]admin[\\/]/, /[\\/]backoffice[\\/]/, /useAdmin[A-Za-z]*\.jsx?$/, /el-analista[\\/]el-analista\.jsx$/, /\.test\.m?js$/, /[\\/]i18n[\\/]/];

let fallos = 0;
const fallo = (m) => {
  console.log(`  X  ${m}`);
  fallos += 1;
};
const ok = (m) => console.log(`  ok ${m}`);

/* —— 1. Paridad —————————————————————————————————————————————————————— */

const aplanar = (obj, prefijo = "", salida = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const clave = prefijo ? `${prefijo}.${k}` : k;
    const esPlural = v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).every((c) => ["zero", "one", "two", "few", "many", "other"].includes(c));
    if (v && typeof v === "object" && !esPlural) aplanar(v, clave, salida);
    else salida[clave] = v;
  }
  return salida;
};

const cargar = (lang) => {
  const carpeta = join(SRC, "i18n", lang);
  const todo = {};
  for (const archivo of readdirSync(carpeta).filter((a) => a.endsWith(".json")).sort()) {
    const datos = JSON.parse(readFileSync(join(carpeta, archivo), "utf8"));
    for (const [k, v] of Object.entries(datos)) {
      if (k in todo) fallo(`${lang}/${archivo}: el apartado «${k}» ya existe en otro archivo`);
      todo[k] = v;
    }
  }
  return aplanar(todo);
};

const variablesDe = (v) => {
  const textos = typeof v === "string" ? [v] : Object.values(v ?? {});
  return [...new Set(textos.flatMap((t) => [...String(t).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1])))].sort().join(",");
};

const es = cargar("es");
const en = cargar("en");
let paridad = 0;
for (const clave of Object.keys(es)) {
  if (!(clave in en)) { fallo(`falta en inglés: ${clave}`); paridad++; continue; }
  if (es[clave] === "" || en[clave] === "") { fallo(`vacía: ${clave}`); paridad++; }
  if (variablesDe(es[clave]) !== variablesDe(en[clave])) { fallo(`variables distintas: ${clave} (es {${variablesDe(es[clave])}} / en {${variablesDe(en[clave])}})`); paridad++; }
  if ((typeof es[clave] === "object") !== (typeof en[clave] === "object")) { fallo(`una es plural y la otra no: ${clave}`); paridad++; }
}
for (const clave of Object.keys(en)) if (!(clave in es)) { fallo(`sobra en inglés (no está en español): ${clave}`); paridad++; }
if (!paridad) ok(`paridad: ${Object.keys(es).length} claves, iguales en los dos idiomas`);

/* —— 2. Claves usadas ———————————————————————————————————————————————— */

const archivos = [];
const recorrer = (dir) => {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) recorrer(ruta);
    else if (/\.(jsx|js)$/.test(nombre)) archivos.push(ruta);
  }
};
recorrer(SRC);
const publicos = archivos.filter((a) => !IGNORADOS.some((re) => re.test(a)));

const usadas = new Set();
const prefijosDinamicos = new Set();
for (const archivo of publicos) {
  const codigo = readFileSync(archivo, "utf8");
  for (const m of codigo.matchAll(/\bt(?:Actual)?\(\s*"([^"]+)"/g)) usadas.add(m[1]);
  for (const m of codigo.matchAll(/\bt(?:Actual)?\(\s*`([^`$]+)\$\{/g)) prefijosDinamicos.add(m[1]);
  for (const m of codigo.matchAll(/labelKey:\s*"([^"]+)"/g)) usadas.add(m[1]);
}
let usoMal = 0;
for (const clave of usadas) if (!(clave in es)) { fallo(`se usa t("${clave}") y no existe en el diccionario`); usoMal++; }
const sinUso = Object.keys(es).filter((c) => !usadas.has(c) && ![...prefijosDinamicos].some((p) => c.startsWith(p)));
if (sinUso.length) {
  for (const c of sinUso) fallo(`clave sin usar: ${c}`);
  usoMal += sinUso.length;
}
if (!usoMal) ok(`claves usadas: ${usadas.size} directas, ${prefijosDinamicos.size} prefijos dinámicos, ninguna sobra ni falta`);

/* —— 3. Restos en español ————————————————————————————————————————————— */

const PALABRAS = /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]{3,}/;
const PERMITIDOS = new Set(["SurEconomics", "Sur", "Economics", "Al punto", "El Analista", "Instagram", "TikTok", "LinkedIn", "WhatsApp", "Facebook", "Telegram", "USD", "BCV", "IBC", "TradingView", "Spotify", "YouTube", "pts", "Bs", "BTC", "EUR", "Google", "Caracas"]);
const esTextoHumano = (texto) => {
  const limpio = texto.replace(/\{[^}]*\}/g, " ").replace(/&[a-z]+;/g, " ").trim();
  if (!PALABRAS.test(limpio)) return false;
  if (PERMITIDOS.has(limpio)) return false;
  // Código que se coló entre dos etiquetas de la misma línea (`/>, errorElement:`), no prosa.
  if (/[=(){};`]|&&|\|\||^\s*,/.test(limpio)) return false;
  return true;
};

const restos = [];
for (const archivo of publicos) {
  if (!archivo.endsWith(".jsx")) continue;
  const lineas = readFileSync(archivo, "utf8").split("\n");
  const encontrados = [];
  // Un comentario de bloque abierto en una línea anterior: nada de lo que diga es texto visible.
  let enComentario = false;
  lineas.forEach((lineaCruda, i) => {
    let linea = lineaCruda;
    if (enComentario) {
      if (!linea.includes("*/")) return;
      enComentario = false;
      linea = linea.slice(linea.indexOf("*/") + 2);
    }
    if (/i18n:ignorar/.test(linea) || (i > 0 && /i18n:ignorar/.test(lineas[i - 1]))) return;
    let sinComentarios = linea.replace(/\{?\/\*.*?\*\/\}?/g, "").replace(/\/\/.*$/, "");
    const abre = sinComentarios.indexOf("/*");
    if (abre >= 0) {
      sinComentarios = sinComentarios.slice(0, abre);
      enComentario = true;
    }
    // Lo que va entre <code>…</code> es código, no texto.
    const sinCodigo = sinComentarios.replace(/<code[^>]*>[^<]*<\/code>/g, "<code></code>");
    for (const m of sinCodigo.matchAll(/>([^<>{}]+)</g)) if (esTextoHumano(m[1])) encontrados.push([i + 1, m[1].trim()]);
    for (const m of sinComentarios.matchAll(/\b(aria-label|placeholder|title|alt|aria-description|label)="([^"]+)"/g)) if (esTextoHumano(m[2])) encontrados.push([i + 1, m[2]]);
    // Texto suelto en una línea de JSX: empieza por mayúscula o signo de apertura y no es código.
    // Texto suelto: al menos dos palabras. Un identificador solo (`ListingPagination,`) o
    // una clave de objeto (`A: TarjetaNativa,`) son código partido en varias líneas.
    const suelto = /^\s*([A-ZÁÉÍÓÚÑ¿¡][^<>{}=;()`"]{6,})\s*$/.exec(sinComentarios);
    if (suelto && (!/\s/.test(suelto[1].trim()) || /^[A-Za-z_][A-Za-z0-9_]*:\s/.test(suelto[1].trim()))) suelto[1] = "";
    if (suelto && !/^(const|let|return|export|import|function|if|else|case)\b/.test(suelto[1]) && esTextoHumano(suelto[1])) encontrados.push([i + 1, suelto[1].trim()]);
  });
  if (encontrados.length) restos.push([relative(RAIZ, archivo), encontrados]);
}
const totalRestos = restos.reduce((n, [, e]) => n + e.length, 0);
if (totalRestos) {
  fallo(`restos: ${totalRestos} textos en ${restos.length} archivos siguen en el código`);
  restos.sort((a, b) => b[1].length - a[1].length);
  for (const [archivo, encontrados] of restos) {
    console.log(`     ${String(encontrados.length).padStart(3)}  ${archivo}`);
    if (CON_RESTOS) for (const [linea, texto] of encontrados) console.log(`          ${String(linea).padStart(4)}: ${texto.slice(0, 90)}`);
  }
} else ok("restos: ningún texto en español suelto en el código público");

console.log(fallos ? `\n  ${fallos} cosa(s) que arreglar` : "\n  todo verde");
process.exit(fallos ? 1 : 0);
