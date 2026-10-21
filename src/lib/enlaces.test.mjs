/**
 * Los enlaces que se pintan. `npm run test:enlaces`.
 */
import { enlaceWeb, esDeDominio } from "./enlaces.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

console.log("enlaceWeb");
for (const raro of [
  "javascript:alert(document.domain)",
  "javascript:alert(1)//cloudflarestream.com/",
  "data:text/html,hola",
  "vbscript:x",
  "ftp://ejemplo.org/x",
  "//ejemplo.org/sin-esquema",
  "ejemplo.org/sin-esquema",
  "https://",
  "",
  null,
  undefined,
  42,
]) {
  check(`rechaza ${JSON.stringify(raro)}`, enlaceWeb(raro) === null, enlaceWeb(raro));
}
check("acepta https con ruta", enlaceWeb("https://ejemplo.org/nota?x=1#y") === "https://ejemplo.org/nota?x=1#y");
check("acepta http", enlaceWeb("http://ejemplo.org") === "http://ejemplo.org");
check("recorta espacios", enlaceWeb("  https://ejemplo.org  ") === "https://ejemplo.org");
check("una ruta del sitio pasa (así llegan las fotos de R2)", enlaceWeb("/media/image/2026/10/foto-abc.png") === "/media/image/2026/10/foto-abc.png");
check("una ruta del sitio no es de dominio", !esDeDominio("/media/x", "cloudflarestream.com"));
check("/\\otro.com no es una ruta del sitio", enlaceWeb("/\\evil.example") === null);

console.log("esDeDominio");
check("subdominio de Stream", esDeDominio("https://customer-abc.cloudflarestream.com/xyz/iframe", "cloudflarestream.com"));
check("el dominio justo", esDeDominio("https://videodelivery.net/xyz", "cloudflarestream.com", "videodelivery.net"));
check("otro dominio que lo contiene en la ruta, no", !esDeDominio("https://atacante.example/cloudflarestream.com/", "cloudflarestream.com"));
check("parecido pero distinto, no", !esDeDominio("https://cloudflarestream.com.atacante.example/", "cloudflarestream.com"));
check("javascript con el host en el texto, no", !esDeDominio("javascript:alert(1)//cloudflarestream.com/", "cloudflarestream.com"));
check("http a secas, no (va en un iframe)", !esDeDominio("http://customer-abc.cloudflarestream.com/x", "cloudflarestream.com"));

if (fallos) {
  console.error(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
