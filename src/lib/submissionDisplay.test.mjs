/**
 * Los estados de las propuestas de los lectores contra los del servidor. Corre con
 * `npm test` (o `node src/lib/submissionDisplay.test.mjs`).
 *
 * El servidor solo conoce cuatro: el `CHECK` de `collaborative_article_submissions.status`
 * (`models/collaborative_article_submission.py`) y las transiciones de
 * `services/submission_service.py`. La web usaba `pending` y `accepted`, que no manda
 * nunca: el lector veía «approved» sin traducir y los filtros «Pendiente» y «Aceptado»
 * del panel no encontraban nada.
 */
import { readFileSync } from "node:fs";
import { fijarIdioma, registrarDiccionario } from "../i18n/motor.js";
import { ESTADOS_DE_PROPUESTA, submissionStatusCssModifier, submissionStatusLabel } from "./submissionDisplay.js";

const DEL_SERVIDOR = ["submitted", "under_review", "approved", "rejected"];
const QUE_NO_EXISTEN = ["pending", "accepted"];

const leer = (ruta) => readFileSync(new URL(`../../${ruta}`, import.meta.url), "utf8");
const DIC = {
  es: JSON.parse(leer("src/i18n/es/cuenta.json")),
  en: JSON.parse(leer("src/i18n/en/cuenta.json")),
};

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

console.log("los estados");
check(
  "son los cuatro del servidor",
  JSON.stringify([...ESTADOS_DE_PROPUESTA].sort()) === JSON.stringify([...DEL_SERVIDOR].sort()),
  ESTADOS_DE_PROPUESTA,
);

console.log("su nombre, en los dos idiomas");
const ESPERADO = {
  es: { submitted: "Enviado", under_review: "En revisión", approved: "Aceptado", rejected: "Rechazado" },
  en: { submitted: "Submitted", under_review: "Under review", approved: "Accepted", rejected: "Rejected" },
};
for (const lang of ["es", "en"]) {
  registrarDiccionario(lang, DIC[lang]);
  fijarIdioma(lang);
  for (const estado of DEL_SERVIDOR) {
    const nombre = submissionStatusLabel(estado);
    check(`${lang}: ${estado} → «${ESPERADO[lang][estado]}»`, nombre === ESPERADO[lang][estado], nombre);
  }
  check(`${lang}: en mayúsculas también`, submissionStatusLabel("APPROVED") === ESPERADO[lang].approved);
  const claves = Object.keys(DIC[lang].cuenta.estadoEnvio).sort();
  check(`${lang}: el diccionario no nombra estados que no existen`, JSON.stringify(claves) === JSON.stringify([...DEL_SERVIDOR].sort()), claves);
}
fijarIdioma("es");
check("un estado desconocido se enseña tal cual", submissionStatusLabel("raro") === "raro");
check("sin estado, una raya", submissionStatusLabel(undefined) === "—");

console.log("su color en el panel");
const css = leer("src/styles/admin.css");
for (const estado of DEL_SERVIDOR) {
  const mod = submissionStatusCssModifier(estado);
  check(`${estado} tiene su modificador`, mod === estado, mod);
  check(`y su regla .se-admin-submissions__status--${mod}`, css.includes(`.se-admin-submissions__status--${mod} {`));
}
check("lo desconocido va a «default»", submissionStatusCssModifier("accepted") === "default");
for (const viejo of QUE_NO_EXISTEN) {
  check(`no queda regla para «${viejo}»`, !css.includes(`.se-admin-submissions__status--${viejo}`));
}

console.log("lo que el panel filtra, elige y manda");
const lista = leer("src/pages/admin/AdminSubmissionsList.jsx");
const filtros = /const STATUS_FILTERS = \[([\s\S]*?)\];/.exec(lista)?.[1] ?? "";
const valores = [...filtros.matchAll(/value:\s*"([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
check("los filtros son los cuatro estados, sin repetir", JSON.stringify([...valores].sort()) === JSON.stringify([...DEL_SERVIDOR].sort()), valores);

const ficha = leer("src/pages/admin/AdminSubmissionDetail.jsx");
// Solo el desplegable del estado (`rev-status`): la ficha tiene otro, el del tema al
// aceptar, que empieza con `<option value="">` («Elija un tema») y no es un estado.
const desplegable = /<select id="rev-status"[\s\S]*?<\/select>/.exec(ficha)?.[0] ?? "";
const opciones = [...desplegable.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]);
check("el desplegable de la ficha solo ofrece estados que existen", opciones.length > 0 && opciones.every((v) => DEL_SERVIDOR.includes(v)), opciones);

for (const ruta of [
  "src/lib/submissionDisplay.js",
  "src/pages/admin/AdminSubmissionsList.jsx",
  "src/pages/admin/AdminSubmissionDetail.jsx",
  "src/services/adminSubmissionsService.js",
]) {
  const codigo = leer(ruta);
  const quedan = QUE_NO_EXISTEN.filter((v) => codigo.includes(`"${v}"`));
  check(`${ruta} no usa «pending» ni «accepted»`, quedan.length === 0, quedan);
}

if (fallos) {
  console.log(`\nfallan ${fallos}`);
  process.exit(1);
}
console.log("\ntodo bien");
