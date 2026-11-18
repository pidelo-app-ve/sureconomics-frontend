/**
 * Lo que la portada puede pedir después: cuando ya llegó la foto que la abre.
 *
 * En el teléfono, lo que Google mide como LCP es esa foto, y la conexión es estrecha:
 * todo lo que se pide a la vez que ella le quita ancho de banda. Por eso lo que no se ve
 * en la primera pantalla espera a que la foto haya cargado y el navegador esté desocupado
 * (auditoría 17-nov-2026, B-03): en el teléfono, el resto de formatos de la portada y
 * «Lo más leído»; siempre, el béisbol, el código del buscador y la siguiente foto de la
 * rotación. Lo de arriba del pliegue (las piezas de la primera página, el contexto de la
 * apertura, Última hora, las monedas, la publicidad) no pasa por aquí.
 *
 * - `fotoPrincipalLista()` la llama quien pinta la apertura: al cargar la foto, si falla,
 *   o en seguida si la apertura no lleva foto. Una vez basta; las demás no hacen nada.
 * - `trasLaFoto()` es la espera: la foto y luego un rato libre (`requestIdleCallback`,
 *   o un `setTimeout` donde no existe, como en Safari). Nunca más de `TOPE_MS`: si la
 *   foto no llega nunca (sin red, una portada sin noticias), lo de abajo no se queda sin
 *   pedir.
 * - `alLlegarLaFoto(hacer)`: solo la foto, sin tope ni calma; para recoger lo que sirve
 *   hasta entonces (la precarga de la foto, en `PrimeraPlana`).
 *
 * Es de toda la página y no de cada visita a la portada: al volver a ella por dentro del
 * sitio la foto ya llegó una vez y nada espera. Sin importaciones, para probarlo con
 * `node` solo (`trasLaFoto.test.mjs`).
 */

/** Lo más que espera lo de abajo, aunque la foto no haya llegado. */
export const TOPE_MS = 3000;

/** Cuánto deja `requestIdleCallback` esperar al rato libre antes de dar paso igual. */
const CALMA_MS = 1000;

let avisar = () => {};
const fotoLista = new Promise((resolver) => {
  avisar = resolver;
});

/** La foto que abre la página ya está (o no va a estar). */
export const fotoPrincipalLista = () => avisar();

/** Hace algo cuando la foto llega (o se sabe que no va a llegar), sin tope ni espera de calma. */
export const alLlegarLaFoto = (hacer) => {
  fotoLista.then(() => hacer());
};

const enCalma = (hacer) => {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(hacer, { timeout: CALMA_MS });
  } else {
    setTimeout(hacer, 1);
  }
};

/** Una promesa que se cumple cuando ya se puede pedir lo de debajo del pliegue. */
export const trasLaFoto = (tope = TOPE_MS) =>
  new Promise((resolver) => {
    const reloj = setTimeout(resolver, tope);
    fotoLista.then(() =>
      enCalma(() => {
        clearTimeout(reloj);
        resolver();
      })
    );
  });
