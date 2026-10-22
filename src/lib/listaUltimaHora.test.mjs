/**
 * Cuándo entra lo nuevo en la página «Última hora». `npm run test:ultimahora`.
 */
import { nuevosEn, queHacer } from "./listaUltimaHora.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};
const seis = [1, 2, 3, 4, 5, 6];

console.log("sin cambios");
check("la misma lista: nada", queHacer({ enPantalla: seis, objetivo: seis, arriba: false }) === "nada");

console.log("entra uno nuevo arriba y sale el más antiguo");
const conNuevo = [7, 1, 2, 3, 4, 5];
check("al principio de la lista: se pone", queHacer({ enPantalla: seis, objetivo: conNuevo, arriba: true }) === "poner");
check("leyendo más abajo: el botón", queHacer({ enPantalla: seis, objetivo: conNuevo, arriba: false }) === "boton");
check("cuenta uno nuevo", nuevosEn(seis, conNuevo).join() === "7", nuevosEn(seis, conNuevo));
check("dos de golpe cuentan dos", nuevosEn(seis, [8, 7, 1, 2, 3, 4]).join() === "8,7");

console.log("la redacción borra uno");
const sinTres = [1, 2, 4, 5, 6];
check("el séptimo entra por el final sin mover nada: se pone aunque esté leyendo",
  queHacer({ enPantalla: sinTres, objetivo: [1, 2, 4, 5, 6, 9], arriba: false }) === "poner");
check("y no cuenta como nuevo", nuevosEn(sinTres, [1, 2, 4, 5, 6, 9]).length === 0);
check("si no queda ninguno para entrar, nada", queHacer({ enPantalla: sinTres, objetivo: sinTres, arriba: false }) === "nada");

console.log("solo cambia el orden (un titular fijado arriba)");
const fijado = [4, 1, 2, 3, 5, 6];
check("leyendo más abajo: espera, sin botón", queHacer({ enPantalla: seis, objetivo: fijado, arriba: false }) === "esperar");
check("al subir: se pone", queHacer({ enPantalla: seis, objetivo: fijado, arriba: true }) === "poner");

console.log("lista vacía (sección oculta y vuelta a enseñar)");
check("de nada a seis: se pone", queHacer({ enPantalla: [], objetivo: seis, arriba: false }) === "poner");
check("todo borrado u oculto: no queda nada que poner", queHacer({ enPantalla: [], objetivo: [], arriba: false }) === "nada");

console.log(fallos ? `\n${fallos} fallo(s)` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
