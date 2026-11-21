/**
 * Las palabras con que la pantalla de audiencia escribe sus números.
 * `npm run test:audiencia`.
 */
import {
  DIAS_GUARDADOS,
  canalesConAltas,
  duracion,
  leerComparacion,
  nombreDeCanal,
  nombreDeFuente,
  nombreDelInforme,
  nombreDelMes,
  numero,
  porciento,
  rango,
  rangoCorto,
} from "./audiencia.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log("números y duraciones");
check("los segundos sueltos", duracion(45) === "45 s", duracion(45));
check("minutos y segundos", duracion(95) === "1 min 35 s", duracion(95));
check("minutos justos", duracion(120) === "2 min", duracion(120));
check("un vacío es cero y no un fallo", duracion(null) === "0 s" && numero(undefined) === "0");
check("el porcentaje que falta es un hueco, no un cero", porciento(null) === null && porciento(0) === "0 %");
let r = rango(1200, 1900);
check("un rango dice sus dos puntas", /^entre 1.?200 y 1.?900$/.test(r), r);
r = rango(1200, 1200.2);
check("y si coinciden no se repite", /^unas 1.?200$/.test(r), r);
r = rangoCorto(1200, 1900);
check("en una ficha, el rango sin palabras", /^1.?200 – 1.?900$/.test(r), r);
check("y una sola cifra si coinciden", /^1.?200$/.test(rangoCorto(1200, 1200)), rangoCorto(1200, 1200));
check("el mes va con su nombre", nombreDelMes("2026-11") === "noviembre", nombreDelMes("2026-11"));

console.log("canales y fuentes");
check("un canal conocido", nombreDeCanal("buscador") === "Buscadores");
check("uno que no se conoce se enseña tal cual", nombreDeCanal("radio") === "radio");
check("sin canal, «sin dato»", nombreDeCanal(null) === "Sin dato");
check("una fuente conocida va con su nombre", nombreDeFuente("chatgpt", "ia") === "ChatGPT");
check("un dominio, tal cual", nombreDeFuente("elpais.com", "otros") === "elpais.com");
check("sin fuente, el nombre del canal", nombreDeFuente(null, "directo") === "Directo");

console.log("cambio real o azar");
r = leerComparacion({ media: 120, media_anterior: 100, cambio: 20, margen: 9, veredicto: "sube" });
check("una subida que se sale del margen va en verde", r.clase === "sube", r);
check("con su signo escrito", r.cambio.startsWith("+20 %"), r.cambio);
check("y dice cuánto es el vaivén", r.veredicto === "Sube de verdad: el vaivén normal es de ±9 %.", r.veredicto);
r = leerComparacion({ cambio: -15, margen: 6, veredicto: "baja" });
check("una bajada, con su signo", r.clase === "baja" && r.cambio.startsWith("−15 %"), r);
r = leerComparacion({ cambio: 4, margen: 9, veredicto: "normal" });
check("un cambio dentro del margen no se pinta", r.clase === "igual", r);
check("y se dice que puede ser casualidad", r.veredicto.startsWith("Puede ser casualidad"), r.veredicto);
r = leerComparacion({ cambio: 0, margen: 9, veredicto: "normal" });
check("el cero no lleva signo", r.cambio.startsWith("0 %"), r.cambio);
r = leerComparacion({ cambio: null, margen: null, veredicto: "sin_datos" });
check("con pocos días se dice que no se sabe", r.clase === "nuevo" && r.cambio === null, r);
check("un periodo anterior vacío no da frase", leerComparacion({ cambio: null, margen: null, veredicto: "sube" }) === null);
check("ni un servidor que no manda la comparación", leerComparacion(undefined) === null && leerComparacion({}) === null);

console.log("las altas al boletín, por canal");
r = canalesConAltas(
  [
    { canal: "buscador", sesiones: 30, porcentaje: 75 },
    { canal: "redes", sesiones: 10, porcentaje: 25 },
  ],
  [
    { canal: "buscador", altas: 2 },
    { canal: "correo", altas: 1 },
    { canal: "sin-dato", altas: 3 },
  ]
);
check("cada canal lleva sus altas", igual(r.filas[0], { canal: "buscador", sesiones: 30, porcentaje: 75, altas: 2 }), r.filas[0]);
check("y cero si no tuvo", r.filas[1].altas === 0, r.filas[1]);
check("un canal con altas y sin visitas no se pierde",
  igual(r.filas[2], { canal: "correo", sesiones: 0, porcentaje: null, altas: 1 }), r.filas[2]);
check("las altas sin dato van aparte", r.altasSinDato === 3 && r.filas.length === 3, r);
r = canalesConAltas(undefined, undefined);
check("sin datos no rompe", igual(r, { filas: [], altasSinDato: 0 }), r);

console.log("el nombre del informe");
const hoy = new Date(2026, 10, 12, 15, 30);
r = nombreDelInforme(30, hoy);
check("hoy y los 29 días de antes", r === "sureconomics-audiencia-2026-10-14-a-2026-11-12.xlsx", r);
r = nombreDelInforme(1, hoy);
check("un solo día empieza y acaba hoy", r === "sureconomics-audiencia-2026-11-12-a-2026-11-12.xlsx", r);
check("no pide más de lo que se guarda", nombreDelInforme(9999, hoy) === nombreDelInforme(DIAS_GUARDADOS, hoy));
check("y un periodo sin sentido son 30 días", nombreDelInforme("muchos", hoy) === nombreDelInforme(30, hoy));

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
