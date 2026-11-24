/**
 * Las tallas que se piden de una foto de nuestro bucket. `node src/lib/fotoDePieza.test.mjs`.
 *
 * Lo que se vigila: que nunca se pida una talla que el backend no genera (un 404 deja la
 * tarjeta sin foto), que las pequeñas solo salgan donde se piden y de un JPEG, y que con
 * ellas vaya la original para quien necesite más.
 */
import { fotoPequena, imagenSrcSet, tallasHastaLaOriginal, tallasPequenas } from "./fotoDePieza.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

const FOTO = "/media/image/2026/11/foto-abc.jpg";

console.log("imagenSrcSet");
check("las de siempre, sin cambios",
  imagenSrcSet(FOTO, [400], 1920) ===
    "/media/image/2026/11/foto-abc-640.jpg 640w, /media/image/2026/11/foto-abc-1100.jpg 1100w, /media/image/2026/11/foto-abc-1400.jpg 1400w",
  imagenSrcSet(FOTO, [400], 1920));
check("una foto de menos de 640 no tiene tallas", imagenSrcSet(FOTO, [400], 600) === null);
check("con las pequeñas y la original, la de 600 se sirve a 160, 320 o entera",
  imagenSrcSet(FOTO, [400], 600, { pequenas: true, original: true }) ===
    "/media/image/2026/11/foto-abc-160.jpg 160w, /media/image/2026/11/foto-abc-320.jpg 320w, /media/image/2026/11/foto-abc.jpg 600w",
  imagenSrcSet(FOTO, [400], 600, { pequenas: true, original: true }));
check("las pequeñas solo de un JPEG (un PNG o un WebP de antes no las tiene)",
  imagenSrcSet("/media/image/2026/10/portada.png", [400], 1536, { pequenas: true }) ===
    imagenSrcSet("/media/image/2026/10/portada.png", [400], 1536));
check("la tira de un anuncio lleva la original al final",
  imagenSrcSet("/media/image/2026/09/tira.jpg", null, 2912, { original: true })
    .endsWith(", /media/image/2026/09/tira.jpg 2912w"));
check("un SVG no tiene tallas", imagenSrcSet("/media/image/2026/11/banner.svg", null, 2912, { original: true }) === null);
check("un GIF tampoco: si es animado no se le hacen", imagenSrcSet("/media/image/2026/11/anim.gif", [400], 1200) === null);
check("Cloudinary sigue como estaba",
  imagenSrcSet("https://res.cloudinary.com/x/image/upload/v1/a.jpg", [400], null, { pequenas: true, original: true }) ===
    "https://res.cloudinary.com/x/image/upload/f_auto,q_auto,c_fill,w_400/v1/a.jpg 400w");

console.log("fotoPequena");
check("el retrato de 553 px pide su talla de 320 (a 56 px en una pantalla 3x, la de 160 no llega)",
  fotoPequena("/media/image/2026/11/leonardo-abc.jpg", 553) === "/media/image/2026/11/leonardo-abc-320.jpg");
check("uno de 300 px, la de 160, que es la que tiene", fotoPequena(FOTO, 300) === "/media/image/2026/11/foto-abc-160.jpg");
check("sin ancho, o de 160 o menos, la original", fotoPequena(FOTO, null) === null && fotoPequena(FOTO, 160) === null);
check("de fuera o de otro formato, nada",
  fotoPequena("https://otro.example/a.jpg", 900) === null && fotoPequena("/media/image/a.png", 900) === null);

console.log("tallasPequenas");
check("el retrato de 553 px ofrece la de 160 y la de 320, y el navegador elige",
  tallasPequenas("/media/image/2026/11/leonardo-abc.jpg", 553) ===
    "/media/image/2026/11/leonardo-abc-160.jpg 160w, /media/image/2026/11/leonardo-abc-320.jpg 320w");
check("uno de 300 px, solo la de 160 (la de 320 no existe)",
  tallasPequenas(FOTO, 300) === "/media/image/2026/11/foto-abc-160.jpg 160w");
check("sin ancho, de fuera o de otro formato, nada (va la original, como en fotoPequena)",
  tallasPequenas(FOTO, null) === null && tallasPequenas("https://otro.example/a.jpg", 900) === null &&
    tallasPequenas("/media/image/a.png", 900) === null);

console.log("tallasHastaLaOriginal");
check("una de 900: la de 640 y la original, para quien necesite más",
  tallasHastaLaOriginal(FOTO, 900) === "/media/image/2026/11/foto-abc-640.jpg 640w, /media/image/2026/11/foto-abc.jpg 900w");
check("una de 1400: hasta la de 1100 y la original",
  tallasHastaLaOriginal(FOTO, 1400) ===
    "/media/image/2026/11/foto-abc-640.jpg 640w, /media/image/2026/11/foto-abc-1100.jpg 1100w, /media/image/2026/11/foto-abc.jpg 1400w");
check("el PNG de 1.536 de la redacción: sin la original (la de 1400 basta)",
  tallasHastaLaOriginal("/media/image/2026/11/p.png", 1536) ===
    "/media/image/2026/11/p-640.png 640w, /media/image/2026/11/p-1100.png 1100w, /media/image/2026/11/p-1400.png 1400w");
check("sin ancho guardado (pieza vieja): nada, la original como antes",
  tallasHastaLaOriginal(FOTO, null) === null && tallasHastaLaOriginal(FOTO, undefined) === null && tallasHastaLaOriginal(FOTO, 0) === null);
check("de menos de 640, SVG, GIF o de fuera: nada",
  tallasHastaLaOriginal(FOTO, 599) === null && tallasHastaLaOriginal("/media/image/2026/11/g.svg", 1200) === null &&
    tallasHastaLaOriginal("/media/image/2026/11/a.gif", 1200) === null && tallasHastaLaOriginal("https://otro.example/a.jpg", 1200) === null);
check("sin URL: nada", tallasHastaLaOriginal(null, 900) === null && tallasHastaLaOriginal("", 900) === null);

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
