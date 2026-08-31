/**
 * Claves de idempotencia, para que reintentar no duplique.
 *
 * El caso real no es el doble clic -- los formularios se deshabilitan mientras envían
 * -- sino el que se come la respuesta: la petición llega, la pieza se crea, y la
 * respuesta se pierde por el camino. Quien envió no puede distinguir eso de un fallo,
 * vuelve a pulsar, y sin clave acaba con dos.
 *
 * De ahí la única regla que importa: **la clave tiene que sobrevivir al reintento**.
 * Una clave nueva en cada llamada no sirve para nada, porque el servidor la ve como
 * una petición distinta. Por eso vive en un `ref` del formulario y solo se renueva
 * cuando el envío sale bien.
 */

/** Una clave nueva. `randomUUID` no existe en contextos no seguros ni en navegadores viejos. */
export const nuevaClave = () => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    // Se cae al respaldo de abajo.
  }
  // Último recurso. Peor entropía, pero una clave débil solo arriesga colisionar
  // consigo misma; el ámbito del servidor ya separa por ruta y por actor.
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};
