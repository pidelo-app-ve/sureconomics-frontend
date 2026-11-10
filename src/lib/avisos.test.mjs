/**
 * La lógica de «Avisos de noticias» del panel. `npm run test:avisos`.
 */
import {
  accionesDe, comprobacion, detalleDeLoComprobado, estadoDeAviso, leerAvisos, leerCandidatos, leerRevision, lineaDelDia, nombreDePais,
  pendientes, vistaInicial,
} from "./avisos.js";

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle !== undefined && !ok ? "  → " + JSON.stringify(detalle) : ""}`);
  if (!ok) fallos++;
};

console.log("lo que manda el servidor");
const dia = leerAvisos({
  activos: true, silencio: false, max_al_dia: 10, quedan: 8, motivos: ["ya_la_dimos", "poca_cosa"],
  avisos: [
    { id: 1, titulo: "Sube el dólar", pais: "VE", calor: 41.5, medios: 3, estado: "tomado", tomado_por_id: 7,
      tomado_por: "María", fuentes: [{ medio: "EFE", titulo: "El dólar sube", url: "https://efe.com/x" }] },
    { id: 2, titulo: "Baja el crudo", estado: "pendiente" },
  ],
});
check("lee el estado del día", dia.activos && dia.quedan === 8 && dia.maxAlDia === 10, dia);
check("lee quién lo tomó", dia.avisos[0].tomadoPorId === 7 && dia.avisos[0].tomadoPor === "María");
check("lee las fuentes", dia.avisos[0].fuentes[0].medio === "EFE");
check("un aviso sin fuentes trae la lista vacía", dia.avisos[1].fuentes.length === 0);
const vacio = leerAvisos(undefined);
check("sin respuesta: apagados y sin avisos", !vacio.activos && vacio.avisos.length === 0 && vacio.maxAlDia === 10, vacio);
check("sin motivos del servidor quedan los tres de siempre", vacio.motivos.length === 3, vacio.motivos);
const ahora = leerCandidatos({ candidatos: [{ cluster_id: 9, titulo: "X", venezuela: true, en_esta_pasada: true, medio_principal: "Reuters" }] });
check("lee un candidato", ahora.candidatos[0].id === 9 && ahora.candidatos[0].venezuela && ahora.candidatos[0].enEstaPasada, ahora);

console.log("cómo está cada aviso");
const [tomado, pendiente] = dia.avisos;
check("el que tomé yo", estadoDeAviso(tomado, 7).texto === "Lo tomó usted" && estadoDeAviso(tomado, 7).tono === "mio");
check("el que tomó otra persona lleva su nombre", estadoDeAviso(tomado, 3).texto === "Lo tomó María");
check("sin saber quién soy no es mío", estadoDeAviso(tomado, null).tono === null);
check("pendiente", estadoDeAviso(pendiente, 7).texto === "Pendiente");
check("descartado dice el motivo",
  estadoDeAviso({ estado: "descartado", motivo: "ya_la_dimos" }, 7).texto === "Descartado: ya la dimos");
check("un motivo que no conocemos sale tal cual",
  estadoDeAviso({ estado: "descartado", motivo: "otro" }, 7).texto === "Descartado: otro");

console.log("el país por su nombre");
check("VE es Venezuela", nombreDePais("VE") === "Venezuela", nombreDePais("VE"));
check("en minúsculas también", nombreDePais("br") === "Brasil", nombreDePais("br"));
check("sin país", nombreDePais(null) === "Sin país");
check("lo que no es de un solo país", nombreDePais("GLOBAL") === "Internacional");
check("un código que no es de un país no rompe", typeof nombreDePais("regional") === "string");

console.log("qué se puede hacer");
check("pendiente: redactar, tomar o descartar", accionesDe(pendiente, 7).join() === "redactar,tomar,descartar");
check("el mío: redactar, escribirla, soltar o descartar",
  accionesDe(tomado, 7).join() === "redactar,escribir,soltar,descartar");
check("con borrador: abrirlo", accionesDe({ estado: "redactado", piezaId: 5 }, 7).join() === "abrir");
check("publicado con pieza: abrirla", accionesDe({ estado: "publicado", piezaId: 5 }, 3).join() === "abrir");
check("el de otra persona: nada", accionesDe(tomado, 3).length === 0);
check("uno publicado sin pieza: nada", accionesDe({ estado: "publicado" }, 7).length === 0);
check("uno vencido: nada", accionesDe({ estado: "vencido" }, 7).length === 0);
check("cuenta los pendientes", pendientes(dia.avisos) === 1);

console.log("lo comprobado al redactar");
check("un aviso sin pieza no trae informe", dia.avisos[0].revision === null && leerRevision(undefined) === null);
const limpia = leerRevision({
  con_ia: true, fuentes: 3, palabras: 240, cifras: [{ texto: "11,25 %", medios: ["EFE"] }],
  leidos: [{ medio: "EFE", palabras: 400 }, { medio: "Reuters", palabras: 350 }],
  sin_leer: [{ medio: "El Pitazo", motivo: "bloqueado" }],
});
check("lee las cifras con sus medios", limpia.cifras[0].texto === "11,25 %" && limpia.cifras[0].medios[0] === "EFE");
check("lee qué artículos se leyeron y cuáles no",
  limpia.leidos.length === 2 && limpia.sinLeer[0].motivo === "bloqueado", limpia);
check("todo en las fuentes: no pide atención",
  !comprobacion(limpia).ojo &&
    comprobacion(limpia).linea === "Escrita por la IA leyendo los artículos de 2 medios: 240 palabras. Todas las cifras y las citas están en las fuentes.",
  comprobacion(limpia));
check("lo que salió bien, en pocas palabras",
  detalleDeLoComprobado(limpia) === "2 de 3 artículos leídos · 1 cifra comprobada", detalleDeLoComprobado(limpia));
const dudosa = leerRevision({
  con_ia: true, fuentes: 3, palabras: 90, nombres: ["Goldman"],
  quitadas: ["Invertirá 5.000 millones.", { frase: "«Es histórico», dijo.", motivo: "cita" }],
  copiadas: [{ frase: "La empresa prevé producir más.", medio: "EFE" }],
});
check("un informe viejo (solo la frase) cuenta como quitada por una cifra",
  dudosa.quitadas[0].motivo === "cifra" && dudosa.quitadas[1].motivo === "cita", dudosa.quitadas);
check("dos frases quitadas, una copiada y un nombre: cuatro cosas que mirar",
  comprobacion(dudosa).ojo && comprobacion(dudosa).linea.includes("Hay 4 cosas que mirar"), comprobacion(dudosa));
check("sin artículos leídos lo dice",
  comprobacion(dudosa).linea.startsWith("Escrita por la IA solo con los titulares: 90 palabras."), comprobacion(dudosa));
check("sin IA: borrador vacío",
  comprobacion(leerRevision({ con_ia: false, fuentes: 2 })).linea.startsWith("Borrador vacío, con el título y las 2 fuentes puestas"));
check("sin informe no hay nada que decir", comprobacion(null) === null);

console.log("la línea de la cabecera");
check("apagados", lineaDelDia(vacio) === "Apagados: no se crea ningún aviso");
check("encendidos, con cupo", lineaDelDia(dia) === "Quedan 8 de 10 hoy");
check("de noche", lineaDelDia({ ...dia, silencio: true }) === "Quedan 8 de 10 hoy · En silencio hasta las 6:00");
check("sin cupo", lineaDelDia({ ...dia, quedan: 0 }) === "Ya salieron los 10 de hoy");

console.log("en qué vista se abre");
check("con avisos de hoy: hoy", vistaInicial(dia) === "hoy");
check("sin avisos: lo que se avisaría", vistaInicial(vacio) === "ahora");

console.log(fallos ? `\n${fallos} fallo(s)` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
