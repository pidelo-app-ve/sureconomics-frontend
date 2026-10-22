/**
 * El reloj de las cuatro ciudades y sus cambios de hora. `npm run test:relojes`.
 */
import { CIUDADES, horaEn } from "./relojes.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};
const horas = (iso) => CIUDADES.map((_, i) => horaEn(i, new Date(iso)).hm);

console.log("las cuatro ciudades");
check("en orden: Caracas, Madrid, Buenos Aires, California",
  CIUDADES.map((c) => c.clave).join() === "caracas,madrid,buenosAires,california");

// El jueves 22 de octubre de 2026 a las 14:45 UTC (la imagen de la redacción).
let h = horas("2026-10-22T14:45:00Z");
check("22-oct: Caracas 10:45, Madrid 16:45, Buenos Aires 11:45, California 07:45",
  h.join() === "10:45,16:45,11:45,07:45", h);

// Domingo 25 de octubre: Madrid retrasa una hora; California todavía no.
h = horas("2026-10-26T14:45:00Z");
check("26-oct: Madrid pasa a 5 horas de Caracas (15:45)", h[1] === "15:45", h);
check("26-oct: California sigue en verano (07:45)", h[3] === "07:45", h);

// Domingo 1 de noviembre: California retrasa una hora.
h = horas("2026-11-02T14:45:00Z");
check("2-nov: California pasa al horario de invierno (06:45)", h[3] === "06:45", h);
check("Caracas y Buenos Aires no cambian nunca", h[0] === "10:45" && h[2] === "11:45", h);

const media = horaEn(0, new Date("2026-10-23T04:00:00Z"));
check("medianoche de Caracas sale 00:00, no 24:00", media.hm === "00:00" && media.ss === "00", media);

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
