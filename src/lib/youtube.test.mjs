/**
 * Los enlaces de YouTube y la duración en reloj. `npm run test:youtube`.
 */
import { duracionReloj, esShort, idDeYoutube, urlReproductor, urlVistaPrevia } from "./youtube.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

console.log("idDeYoutube");
for (const [url, id] of [
  ["https://www.youtube.com/watch?v=XH7XySD6nDs", "XH7XySD6nDs"],
  ["https://www.youtube.com/watch?feature=share&v=XH7XySD6nDs&t=3", "XH7XySD6nDs"],
  ["https://youtu.be/XH7XySD6nDs?si=abc", "XH7XySD6nDs"],
  ["https://www.youtube.com/embed/XH7XySD6nDs", "XH7XySD6nDs"],
  ["https://www.youtube-nocookie.com/embed/XH7XySD6nDs", "XH7XySD6nDs"],
  ["https://www.youtube.com/shorts/XH7XySD6nDs", "XH7XySD6nDs"],
  ["https://youtube.com/shorts/XH7XySD6nDs?feature=share", "XH7XySD6nDs"],
  ["https://www.youtube.com/live/XH7XySD6nDs", "XH7XySD6nDs"],
  ["https://vimeo.com/123456", null],
  ["https://www.youtube.com/@EfectoCocuyo", null],
  ["", null],
  [null, null],
]) check(String(url), idDeYoutube(url) === id, idDeYoutube(url));

console.log("esShort");
check("shorts", esShort("https://www.youtube.com/shorts/XH7XySD6nDs"));
check("watch no", !esShort("https://www.youtube.com/watch?v=XH7XySD6nDs"));
check("vacío no", !esShort(undefined));

console.log("duracionReloj");
for (const [s, texto] of [[54, "0:54"], [65, "1:05"], [727, "12:07"], [3750, "1:02:30"], [0, "0:00"], [null, null], [undefined, null]]) {
  check(`${s} → ${texto}`, duracionReloj(s) === texto, duracionReloj(s));
}

console.log("direcciones");
const previa = urlVistaPrevia("XH7XySD6nDs");
check("vista previa desde youtube-nocookie", previa.startsWith("https://www.youtube-nocookie.com/embed/XH7XySD6nDs?"));
check("vista previa muda y sin controles", previa.includes("mute=1") && previa.includes("controls=0"));
check("vista previa sin bucle (sin ⏮ ⏭)", !previa.includes("loop=") && !previa.includes("playlist="));
check("la ventana se puede pausar por mensaje", urlReproductor("XH7XySD6nDs").includes("enablejsapi=1"));

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
