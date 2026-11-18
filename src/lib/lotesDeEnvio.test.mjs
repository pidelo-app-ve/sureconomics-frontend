/**
 * Cómo se juntan los avisos al servidor. `npm run test:lotes`.
 */
import {
  MAX_BYTES_DE_FICHAS,
  MAX_BYTES_POR_ENVIO,
  MAX_EVENTOS_POR_LOTE,
  MAX_FICHAS_POR_ENVIO,
  tocaLatido,
  trocearEventos,
  trocearFichas,
} from "./lotesDeEnvio.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

const A = { user_id: "u", session_id: "sesion-a" };
const B = { user_id: "u", session_id: "sesion-b" };
const ev = (tipo, quien = A, extra = {}) => ({ tipo, ruta: "/", ...quien, ...extra });

console.log("los lotes de la medición");
let r = trocearEventos([ev("vista")]);
check("un evento solo va suelto, como siempre", r.length === 1 && JSON.parse(r[0]).tipo === "vista", r);

r = trocearEventos([ev("salida", A, { segundos: 30 }), ev("vista")]);
check("salida y vista de un cambio de página van juntas", r.length === 1 && JSON.parse(r[0]).eventos.length === 2, r);

r = trocearEventos([ev("salida"), ev("vista"), ev("salida"), ev("vista")]);
check("dos salidas no van en el mismo lote (el servidor tiraría la segunda)",
  r.length === 2 && r.every((c) => JSON.parse(c).eventos.filter((e) => e.tipo === "salida").length === 1), r);

r = trocearEventos([ev("alta", A), ev("latido", B)]);
check("cada visita en su lote (el servidor solo cuenta la primera de cada uno)",
  r.length === 2 && JSON.parse(r[0]).session_id === "sesion-a" && JSON.parse(r[1]).session_id === "sesion-b", r);

r = trocearEventos(Array.from({ length: 45 }, () => ev("latido")));
check("nunca más de veinte eventos por lote",
  r.length === 3 && JSON.parse(r[0]).eventos.length === MAX_EVENTOS_POR_LOTE, r.map((c) => c.length));

const largo = "/" + "x".repeat(499);
r = trocearEventos(Array.from({ length: 19 }, () => ev("latido", A, { ruta: largo, relleno: "y".repeat(3000) })));
check("ni más bytes de los que un beacon admite", r.length > 1 && r.every((c) => c.length <= MAX_BYTES_POR_ENVIO), r.map((c) => c.length));

r = trocearEventos([ev("vista"), null, "basura", ev("latido")]);
check("lo que no es un evento no viaja", r.length === 1 && JSON.parse(r[0]).eventos.length === 2, r);
check("sin eventos no hay envío", trocearEventos([]).length === 0 && trocearEventos(undefined).length === 0);

console.log("\nel latido");
check("sin nada enviado, toca", tocaLatido({ ahora: 1000, ultimoEnvio: 0, cada: 60000 }));
check("si algo salió hace menos de un latido, sobra", !tocaLatido({ ahora: 30000, ultimoEnvio: 1000, cada: 60000 }));
check("pasado el plazo, toca", tocaLatido({ ahora: 61000, ultimoEnvio: 1000, cada: 60000 }));
check("si el reloj del aparato va hacia atrás, toca (no se queda sin latir)",
  tocaLatido({ ahora: 5000, ultimoEnvio: 900000, cada: 60000 }));

console.log("\nlas impresiones");
r = trocearFichas(["a.b.c", "d.e.f", "a.b.c"]);
check("una por línea y sin repetir", r.length === 1 && r[0] === "a.b.c\nd.e.f", r);
r = trocearFichas(Array.from({ length: 65 }, (_, i) => `ficha.${i}.firma`));
check("como mucho treinta por envío (el tope del servidor)",
  r.length === 3 && r[0].split("\n").length === MAX_FICHAS_POR_ENVIO, r.map((c) => c.split("\n").length));
r = trocearFichas(["", null, "con espacio", "con\nsalto", "buena"]);
check("una ficha con espacios no es una ficha (partiría el envío)", r.length === 1 && r[0] === "buena", r);
check("sin fichas no hay envío", trocearFichas([]).length === 0);
r = trocearFichas(Array.from({ length: 25 }, (_, i) => `${i}.`.padEnd(1000, "x")));
check("ni más de 16 KB por envío (el tope del servidor)",
  r.length === 2 && r.every((c) => new TextEncoder().encode(c).length <= MAX_BYTES_DE_FICHAS), r.map((c) => c.length));

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
