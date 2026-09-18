import PropTypes from "prop-types";

/**
 * Qué tan buena es la contraseña que se está escribiendo.
 *
 * ## Por qué mide variedad y no reglas
 *
 * No exige «una mayúscula, un número y un símbolo». Esa regla es la que produce
 * `Password1!` en todo el mundo: cumple el requisito y es de las primeras que prueba
 * cualquier ataque por diccionario. Lo que de verdad cuesta adivinar es la longitud, así
 * que la longitud pesa el doble que todo lo demás junto.
 *
 * ## Y por qué no bloquea
 *
 * El servidor pide ocho caracteres y eso es lo que se exige. Esto informa; no añade una
 * barrera nueva por encima de la que ya hay. Un medidor que impide continuar convierte
 * un consejo en un obstáculo, y quien se topa con él elige la contraseña que el medidor
 * acepta, no la que recordará.
 */

const NIVELES = [
  { hasta: 1, texto: "Muy corta", clase: "se-fuerza--mala" },
  { hasta: 2, texto: "Débil", clase: "se-fuerza--floja" },
  { hasta: 3, texto: "Aceptable", clase: "se-fuerza--media" },
  { hasta: 4, texto: "Buena", clase: "se-fuerza--buena" },
  { hasta: 5, texto: "Muy buena", clase: "se-fuerza--buena" },
];

const medir = (clave) => {
  if (!clave) return 0;
  let puntos = 0;
  // La longitud, que es lo que de verdad cuesta adivinar.
  if (clave.length >= 8) puntos += 1;
  if (clave.length >= 12) puntos += 1;
  if (clave.length >= 16) puntos += 1;
  // Y algo de variedad, que ayuda pero no sustituye a lo anterior.
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) puntos += 1;
  if (/[^A-Za-z]/.test(clave)) puntos += 1;
  return Math.min(5, puntos);
};

export const FuerzaDeClave = ({ clave }) => {
  if (!clave) return null;

  const puntos = medir(clave);
  const nivel = NIVELES.find((n) => puntos <= n.hasta) ?? NIVELES[NIVELES.length - 1];

  return (
    <div className={`se-fuerza ${nivel.clase}`}>
      <span className="se-fuerza__barra" aria-hidden="true">
        <span className="se-fuerza__llena" style={{ width: `${(puntos / 5) * 100}%` }} />
      </span>
      {/* `polite` y no `assertive`: informa mientras se teclea y no debe interrumpir
          lo que se está escribiendo. */}
      <span className="se-fuerza__texto" aria-live="polite">
        {nivel.texto}
        {puntos <= 2 ? (
          <small> · Una frase de varias palabras es más segura y más fácil de recordar.</small>
        ) : null}
      </span>
    </div>
  );
};

FuerzaDeClave.propTypes = { clave: PropTypes.string };

export default FuerzaDeClave;
