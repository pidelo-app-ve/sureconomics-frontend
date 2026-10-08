/**
 * El dato de cierre de los juegos, sacado de la cinta de mercado: el dólar oficial del
 * BCV. Lo usan la guacamaya y La Clave en su pantalla final: «mientras jugabas, el
 * dólar estaba en…», que es lo que lleva de vuelta a leer.
 */
export const datoDelDolar = (cinta) => {
  const fila = (cinta?.indicators ?? []).find(
    (i) => /bcv/i.test(i.label) && /usd|\$|d[oó]lar/i.test(i.label)
  );
  return fila ? fila.value : null;
};
