/**
 * Por dónde llegó una visita, visto desde el navegador. `npm run test:llegada`.
 */
import { MAX_ETIQUETA, aparatoDe, bloqueDeLlegada, etiquetaDeCampana, sitioDeOrigen } from "./llegada.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log("el sitio de origen");
const PROPIO = "www.sureconomics.com";
let r = sitioDeOrigen("https://www.google.com/search?q=dolar+hoy+venezuela", PROPIO);
check("de una búsqueda sale el dominio, nunca lo buscado", r === "www.google.com", r);
r = sitioDeOrigen("https://l.facebook.com/l.php?u=https%3A%2F%2Fsureconomics.com&h=AT0x", PROPIO);
check("de un enlace de Facebook, solo el dominio", r === "l.facebook.com", r);
r = sitioDeOrigen("android-app://com.whatsapp/", PROPIO);
check("Android dice la aplicación", r === "app:com.whatsapp", r);
r = sitioDeOrigen("android-app://com.Google.Android.gm/https/mail.google.com", PROPIO);
check("y va en minúsculas y sin el resto", r === "app:com.google.android.gm", r);
check("venir del propio sitio no es llegar de fuera",
  sitioDeOrigen("https://www.sureconomics.com/noticias/el-cobre", PROPIO) === null);
check("tampoco con o sin www",
  sitioDeOrigen("https://sureconomics.com/", PROPIO) === null &&
  sitioDeOrigen("https://www.sureconomics.com/", "sureconomics.com") === null);
r = sitioDeOrigen("https://sureconomics.com.ve/", PROPIO);
check("un dominio que solo se le parece sí es de fuera", r === "sureconomics.com.ve", r);
check("sin página anterior no hay sitio",
  sitioDeOrigen("", PROPIO) === null && sitioDeOrigen(null, PROPIO) === null && sitioDeOrigen(undefined) === null);
check("lo que no es una dirección no rompe nada",
  sitioDeOrigen("no es una dirección", PROPIO) === null && sitioDeOrigen(12345, PROPIO) === null);
check("solo páginas web: ni archivos ni otros esquemas",
  sitioDeOrigen("file:///C:/Users/alguien/nota.html", PROPIO) === null &&
  sitioDeOrigen("ios-app://544007664/vnd.youtube", PROPIO) === null);

console.log("la etiqueta de campaña");
r = etiquetaDeCampana("?utm_source=boletin&utm_medium=email", "utm_source");
check("se lee de la dirección con la que se entró", r === "boletin", r);
r = etiquetaDeCampana("?utm_source=boletin&utm_medium=email", "utm_medium");
check("cada una por su nombre", r === "email", r);
check("si no está, nada",
  etiquetaDeCampana("?q=dolar", "utm_source") === null && etiquetaDeCampana("", "utm_source") === null &&
  etiquetaDeCampana(undefined, "utm_source") === null);
check("vacía o en blanco, nada",
  etiquetaDeCampana("?utm_source=", "utm_source") === null && etiquetaDeCampana("?utm_source=%20%20", "utm_source") === null);
r = etiquetaDeCampana("?utm_source=" + "a".repeat(500), "utm_source");
check("no viaja más larga de la cuenta", r.length === MAX_ETIQUETA, r.length);

console.log("el aparato");
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";
const CASOS = [
  ["iPhone", { agente: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148", toques: 5 }, "movil"],
  ["Android de bolsillo", { agente: "Mozilla/5.0 (Linux; Android 14; SM-A546B) Chrome/130.0 Mobile Safari/537.36", toques: 5 }, "movil"],
  ["tableta Android", { agente: "Mozilla/5.0 (Linux; Android 13; SM-X200) Chrome/130.0 Safari/537.36", toques: 5 }, "tableta"],
  ["iPad de los de antes", { agente: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148", toques: 5 }, "tableta"],
  ["iPad que dice ser un Mac", { agente: MAC, toques: 5 }, "tableta"],
  ["un Mac de verdad", { agente: MAC, toques: 0 }, "computadora"],
  ["Windows", { agente: WINDOWS }, "computadora"],
  ["Windows con pantalla táctil", { agente: WINDOWS, toques: 10 }, "computadora"],
  ["el viejo «Tablet PC» era de escritorio", { agente: "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; Tablet PC 2.0; rv:11.0) like Gecko" }, "computadora"],
  ["Firefox en una tableta", { agente: "Mozilla/5.0 (Android 14; Tablet; rv:130.0) Gecko/130.0 Firefox/130.0", toques: 5 }, "tableta"],
  ["lo que diga el navegador, si lo dice", { agente: "Mozilla/5.0 (Linux; K) AppleWebKit/537.36", movil: true }, "movil"],
  ["sin agente", {}, "computadora"],
];
for (const [nombre, datos, esperado] of CASOS) {
  r = aparatoDe(datos);
  check(nombre, r === esperado, r);
}
check("sin argumentos no rompe", aparatoDe() === "computadora" && aparatoDe({ agente: null }) === "computadora");

console.log("el bloque que viaja");
const ORIGEN = { ref: "www.google.com", utm_source: null, utm_medium: null };
r = bloqueDeLlegada({ origen: ORIGEN, esLaDeLlegada: true, zona: "America/Caracas", dispositivo: "movil" });
check("la visita de llegada lleva el sitio de origen, y los huecos no viajan",
  igual(r, { ref: "www.google.com", zona: "America/Caracas", dispositivo: "movil" }), r);
r = bloqueDeLlegada({ origen: ORIGEN, esLaDeLlegada: false, zona: "America/Caracas", dispositivo: "movil" });
check("la que empieza después, con la pestaña ya abierta, no llegó desde ahí",
  igual(r, { zona: "America/Caracas", dispositivo: "movil" }), r);
r = bloqueDeLlegada({ origen: { ref: null, utm_source: "boletin", utm_medium: "email" }, esLaDeLlegada: true });
check("la campaña va con la visita de llegada", igual(r, { utm_source: "boletin", utm_medium: "email" }), r);
check("sin nada que decir, un bloque vacío", igual(bloqueDeLlegada(), {}));
const claves = Object.keys(bloqueDeLlegada({
  origen: { ref: "t.co", utm_source: "x", utm_medium: "social" }, esLaDeLlegada: true, zona: "Europe/Madrid", dispositivo: "tableta",
})).sort().join();
check("y nunca lleva más que esas cinco cosas", claves === "dispositivo,ref,utm_medium,utm_source,zona", claves);

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
