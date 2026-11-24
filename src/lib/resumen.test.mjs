/**
 * La foto del resumen diario (`fotoDelResumen`, `sizesDelResumen`). `node src/lib/resumen.test.mjs`.
 *
 * Lo que se vigila: que la foto se vea igual que cuando se pintaba la original (su CSS la deja
 * a su tamaño natural, y con `srcset` ese tamaño pasa a ser el de `sizes`: tiene que ser el
 * menor entre la foto y la columna, al píxel), y que sin ancho guardado, de menos de 640, SVG
 * o GIF siga saliendo la original.
 */
import { anchoDeSizes, tallaElegida } from "../../scripts/pruebas/anchoDeSizes.mjs";
import { fotoDelResumen, sizesDelResumen } from "./resumen.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

/** La columna del resumen según el CSS: `.se-container.se-res__caja`, 720 px de tope con
 *  los márgenes dentro (24 px a cada lado; 32 desde 768; 40 desde 1024). */
const columna = (ventana) => {
  const margen = ventana >= 1024 ? 40 : ventana >= 768 ? 32 : 24;
  return Math.min(ventana, 720) - 2 * margen;
};

console.log("sizesDelResumen");
{
  const VENTANAS = [320, 360, 390, 412, 600, 640, 647, 648, 688, 689, 700, 719, 720, 767, 768, 900, 1023, 1024, 1440, 1920];
  for (const foto of [599, 640, 656, 700, 900, 1536]) {
    const sizes = sizesDelResumen(foto);
    const fuera = VENTANAS.filter((v) => anchoDeSizes(sizes, v) !== Math.min(foto, columna(v)));
    check(`una foto de ${foto} px se ve al mismo ancho que antes`, fuera.length === 0,
      fuera.map((v) => `${v}: antes ${Math.min(foto, columna(v))}, ahora ${anchoDeSizes(sizes, v)}`));
  }
  check("los tramos iguales van juntos",
    sizesDelResumen(599) === "(max-width: 647px) calc(100vw - 48px), 599px", sizesDelResumen(599));
}

console.log("fotoDelResumen");
{
  const BANCO = { url: "/media/image/2026/11/banco-de-venezuela-27e65ae58ec6.jpg", ancho: 900, alto: 506 };
  const foto = fotoDelResumen(BANCO);
  check("una de 900: la original de src y las tallas en srcset",
    foto.src === BANCO.url &&
      foto.srcSet === "/media/image/2026/11/banco-de-venezuela-27e65ae58ec6-640.jpg 640w, /media/image/2026/11/banco-de-venezuela-27e65ae58ec6.jpg 900w" &&
      foto.sizes === sizesDelResumen(900),
    foto);
  check("escritorio a 1x: la talla de 640 (la columna mide 640)",
    tallaElegida(foto.srcSet, foto.sizes, 1440, 1).w === 640);
  check("teléfono de 390 a 3x: la original, como antes (pide 1026)",
    tallaElegida(foto.srcSet, foto.sizes, 390, 3).w === 900);

  const png = fotoDelResumen({ url: "/media/image/2026/11/p.png", ancho: 1536, alto: 1024 });
  check("el PNG de 1.536: nunca la original (la de 1400 basta)", !png.srcSet.includes("p.png 1536w"), png);
  check("el PNG en un teléfono de 390 a 3x: la de 1100 (pide 1026)",
    tallaElegida(png.srcSet, png.sizes, 390, 3).w === 1100);

  const sinTallas = (imagen) => {
    const f = fotoDelResumen(imagen);
    return f.src === imagen.url && f.srcSet === undefined && f.sizes === undefined;
  };
  check("sin ancho guardado: la original, sin srcset", sinTallas({ url: "/media/image/2026/10/vieja.jpg" }));
  check("ancho que no es un número: la original", sinTallas({ url: "/media/image/2026/10/vieja.jpg", ancho: "900" }));
  check("de 599 px: la original (sus tallas, de 160 y 320, se verían borrosas)",
    sinTallas({ url: "/media/image/2026/11/donald-trump-2c0996951c9a.jpg", ancho: 599, alto: 399 }));
  check("SVG y GIF: la original",
    sinTallas({ url: "/media/image/2026/11/grafico.svg", ancho: 1200 }) && sinTallas({ url: "/media/image/2026/11/a.gif", ancho: 1200 }));
  check("sin imagen: nada que pintar", fotoDelResumen(null).src === undefined && fotoDelResumen(undefined).src === undefined);
}

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
