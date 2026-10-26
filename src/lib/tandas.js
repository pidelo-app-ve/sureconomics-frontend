/**
 * Una lista partida en las tandas en que se fue cargando: la primera del tamaño de la
 * entrada y las siguientes de `paso` en `paso`. Con «Cargar más», cada tanda se pinta
 * por su lado y lleva su anuncio delante (ver `AnuncioEntreTandas`), para que la
 * publicidad crezca con lo que se lee y no se quede arriba del todo.
 *
 * @param {Array} items lo que hay a la vista
 * @param {number} primera cuántas trae la entrada
 * @param {number} paso cuántas trae cada «Cargar más»
 * @returns {Array<Array>} las tandas, en orden; nunca vacías
 */
export const enTandas = (items, primera, paso) => {
  const lista = items ?? [];
  const tandas = [lista.slice(0, primera)];
  for (let i = primera; i < lista.length; i += paso) tandas.push(lista.slice(i, i + paso));
  return tandas.filter((t) => t.length);
};
