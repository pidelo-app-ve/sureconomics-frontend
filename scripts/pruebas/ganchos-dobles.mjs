/**
 * Los ganchos de `dobles.mjs`: cuando algo importa un archivo sustituido, en su lugar
 * se carga un módulo que reexporta lo que la prueba dejó en `globalThis` (el módulo
 * corre en el hilo de la prueba, así que lo ve). Las funciones se buscan al llamarlas;
 * lo demás se copia al cargar.
 */
let exportaciones = {};
let almacen = "";

export async function initialize(datos) {
  exportaciones = datos.exportaciones;
  almacen = datos.almacen;
}

export async function load(url, contexto, siguiente) {
  const nombres = exportaciones[url];
  if (!nombres) return siguiente(url, contexto);
  const lineas = [
    `const doble = globalThis[Symbol.for(${JSON.stringify(almacen)})][${JSON.stringify(url)}];`,
    ...nombres.map((n) =>
      n === "default"
        ? `export default doble.default;`
        : `export const ${n} = typeof doble.${n} === "function" ? (...a) => doble.${n}(...a) : doble.${n};`
    ),
  ];
  return { format: "module", source: lineas.join("\n"), shortCircuit: true };
}
