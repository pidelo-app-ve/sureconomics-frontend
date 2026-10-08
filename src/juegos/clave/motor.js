/**
 * El motor de «La Clave»: comparar un intento con la palabra, sin dibujar nada.
 *
 * Separado de React a propósito, como el de la guacamaya: se prueba en Node, y lo que
 * importa de este juego se puede afirmar en una prueba: que una letra repetida se pinta
 * bien, que las tildes no cuentan y que la Ñ sí.
 *
 * ## Las tres pintas
 *
 * - `bien`: la letra está en ese sitio.
 * - `casi`: la letra está en la palabra, pero en otro sitio.
 * - `no`: no está (o ya se contaron todas las que hay).
 *
 * Con letras repetidas se hace como en Wordle: primero se marcan las que están en su
 * sitio, y las `casi` solo se dan mientras queden letras de esa sin asignar. Así, con la
 * solución CASCO y el intento CACAO, la primera C es `bien`, la segunda C es `casi` y la
 * tercera... no hay tercera: CACAO tiene dos C y CASCO dos, las dos se reparten.
 */

export const MAX_INTENTOS = 6;

/** Cómo se compara una letra o una palabra: mayúsculas, sin tildes, con Ñ. */
export const normalizar = (texto) =>
  String(texto ?? "")
    .toUpperCase()
    .normalize("NFD")
    // Descompuesta, la Ñ es una N con una virgulilla encima: se recompone antes de
    // quitar el resto de los acentos, para que no se convierta en N.
    .replace(/Ñ/g, "Ñ")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-ZÑ]/g, "");

/** Compara `intento` con `solucion` (las dos se normalizan). Devuelve una pinta por letra. */
export const evaluar = (intento, solucion) => {
  const a = normalizar(intento).split("");
  const s = normalizar(solucion).split("");
  const pintas = a.map(() => "no");
  const quedan = {};
  for (let i = 0; i < s.length; i += 1) {
    if (a[i] === s[i]) pintas[i] = "bien";
    else quedan[s[i]] = (quedan[s[i]] ?? 0) + 1;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (pintas[i] === "bien") continue;
    if (quedan[a[i]] > 0) {
      pintas[i] = "casi";
      quedan[a[i]] -= 1;
    }
  }
  return pintas;
};

export const acerto = (intento, solucion) => normalizar(intento) === normalizar(solucion);

const PESO = { no: 1, casi: 2, bien: 3 };

/**
 * Lo que el teclado sabe de cada letra tras varios intentos: la mejor pinta que ha
 * tenido. Una letra que una vez fue `bien` no vuelve a `casi`.
 */
export const estadoDelTeclado = (intentos, solucion) => {
  const estado = {};
  for (const intento of intentos) {
    const pintas = evaluar(intento, solucion);
    normalizar(intento)
      .split("")
      .forEach((letra, i) => {
        if (!estado[letra] || PESO[pintas[i]] > PESO[estado[letra]]) estado[letra] = pintas[i];
      });
  }
  return estado;
};

const CUADRO = { bien: "🟩", casi: "🟨", no: "⬜" };

/** La cuadrícula que se comparte: dice cómo te fue sin revelar la palabra. */
export const cuadricula = (intentos, solucion) =>
  intentos.map((intento) => evaluar(intento, solucion).map((p) => CUADRO[p]).join("")).join("\n");

/** Las filas del teclado, con la Ñ en su sitio. */
export const FILAS_DEL_TECLADO = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKLÑ".split(""),
  ["ENTER", ..."ZXCVBNM".split(""), "BORRAR"],
];
