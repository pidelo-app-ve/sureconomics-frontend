/**
 * Una carga perezosa (`import()`) que se pide una sola vez y se comparte.
 *
 * Por qué hace falta: cuando un trozo perezoso trae su propia hoja de estilos, Vite añade
 * el `<link>` de la hoja y espera a que llegue antes de dar el módulo por cargado... pero
 * solo la primera vez. Si el código vuelve a llamar al `import()` mientras la hoja sigue
 * bajando (se precargó al quedar quieta la página y el lector lo abre antes de que
 * termine), Vite ya la da por pedida y no espera: el componente se pinta sin estilos
 * hasta que la hoja llega. Con una sola promesa compartida, quien llegue tarde espera a la
 * misma carga, hoja incluida.
 *
 * Si la carga falla (sin red), se olvida, para que el siguiente intento vuelva a probar.
 *
 * @template T
 * @param {() => Promise<T>} cargar  la función con el `import()`
 * @returns {() => Promise<T>}
 */
export const cargarUnaVez = (cargar) => {
  let promesa = null;
  return () => {
    if (!promesa) {
      promesa = cargar().catch((error) => {
        promesa = null;
        throw error;
      });
    }
    return promesa;
  };
};
