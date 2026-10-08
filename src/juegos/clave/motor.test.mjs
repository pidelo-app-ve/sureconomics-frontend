/**
 * Las pruebas del motor de «La Clave»: `npm run test:clave`.
 */

import { acerto, cuadricula, estadoDelTeclado, evaluar, normalizar } from "./motor.js";

let fallos = 0;
const check = (nombre, ok, extra) => {
  console.log(`  ${ok ? "ok " : "FALLA"} ${nombre}${extra !== undefined ? ` (${extra})` : ""}`);
  if (!ok) fallos += 1;
};
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log("\n  Normalizar");
check("las tildes no cuentan", normalizar("Ávila") === "AVILA");
check("la Ñ es una letra más", normalizar("señal") === "SEÑAL");
check("la diéresis tampoco cuenta", normalizar("chigüire") === "CHIGUIRE");
check("fuera lo que no es letra", normalizar("calle 13!") === "CALLE");

console.log("\n  Evaluar");
check("todo en su sitio", igual(evaluar("LEONES", "leones"), ["bien", "bien", "bien", "bien", "bien", "bien"]));
check("nada", igual(evaluar("MUNDO", "AREPA"), ["no", "no", "no", "no", "no"]));
check("en otro sitio", igual(evaluar("PERLA", "PLAYA"), ["bien", "no", "no", "casi", "bien"]));
check(
  "letras repetidas: solo las que quedan se marcan como casi",
  igual(evaluar("CACAO", "CASCO"), ["bien", "bien", "casi", "no", "bien"])
);
check(
  "letras repetidas: una bien no roba a la otra",
  igual(evaluar("ARROZ", "ROSAS"), ["casi", "casi", "no", "casi", "no"])
);
check("con tilde en la solución se acierta igual", acerto("avila", "ÁVILA"));

console.log("\n  Teclado");
const teclado = estadoDelTeclado(["PERLA", "PLAZA"], "PLAYA");
check("la mejor pinta gana", teclado.P === "bien" && teclado.L === "bien" && teclado.A === "bien");
check("lo que no está se apaga", teclado.E === "no" && teclado.R === "no" && teclado.Z === "no");

console.log("\n  Cuadrícula");
check("se comparte sin la palabra", cuadricula(["PERLA", "PLAYA"], "PLAYA") === "🟩⬜⬜🟧🟩\n🟩🟩🟩🟩🟩");

console.log(fallos ? `\n  ${fallos} fallo(s)` : "\n  todo verde");
process.exit(fallos ? 1 : 0);
