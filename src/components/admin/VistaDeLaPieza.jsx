import PropTypes from "prop-types";
import { POR_FORMATO } from "../publicidad/EspacioPublicitario";

/**
 * La pieza montada, tal y como saldrá en el sitio.
 *
 * ## Por qué con el componente real y no con una maqueta
 *
 * Se importa el mismo mapa de formatos que usa el sitio publicado. Una previsualización
 * dibujada con código propio deja de previsualizar nada el primer día que uno de los dos
 * cambie, y deja de hacerlo **en silencio** — que es lo grave, porque es justo entonces
 * cuando nadie vuelve a comprobar si coinciden.
 *
 * ## El enlace, desactivado
 *
 * El componente real envuelve la pieza en un `<a>` que cuenta el clic y redirige. Aquí
 * eso no puede ocurrir: quien revisa su propia campaña no puede sumarle clics a la
 * factura de su cliente. Se le pasa un hueco sin `enlace`, que es la señal que el
 * componente ya entiende para pintarse en un `<div>`.
 *
 * ## Lo que se ve es el borrador, no lo guardado
 *
 * Recibe lo que hay escrito en el formulario ahora mismo. Así el titular que se acaba de
 * teclear se ve antes de guardar, que es cuando sirve de algo mirarlo.
 */

/** Cómo se llama cada variante de la tarjeta nativa, para poder elegirla. */
const VARIANTES = [
  { valor: "tarjeta", etiqueta: "En la rejilla" },
  { valor: "lista", etiqueta: "Franja ancha" },
  { valor: "cuerpo", etiqueta: "Dentro del artículo" },
];

export const VistaDeLaPieza = ({ pieza, anunciante, variante, onVariante }) => {
  const Pintor = POR_FORMATO[pieza.formato];

  if (!Pintor) {
    return (
      <div className="se-vista se-vista--sin">
        <p>
          El formato <strong>{pieza.formato}</strong> todavía no tiene cómo pintarse. La
          barra fija tiene componente propio y la mención pre-roll aún no se sirve.
        </p>
      </div>
    );
  }

  // Lo mismo que sirve el decisor, armado con lo que hay en el formulario. Sin
  // `enlace`, para que no se pueda hacer clic desde aquí.
  const hueco = {
    formato: pieza.formato,
    anunciante: anunciante?.nombre ?? "Anunciante",
    es_casa: Boolean(anunciante?.es_casa),
    titular: pieza.titular,
    titular_corto: pieza.titular_corto,
    pie: pieza.pie,
    alt: pieza.alt,
    imagen: pieza.imagen ?? null,
    enlace: null,
  };

  const faltaTitular = !pieza.titular && !pieza.titular_corto;

  return (
    <div className="se-vista">
      <div className="se-vista__cabeza">
        <span className="se-vista__etiqueta">Así se verá</span>
        {pieza.formato === "A" ? (
          <span className="se-vista__variantes">
            {VARIANTES.map((v) => (
              <button
                key={v.valor}
                type="button"
                className={`se-vista__variante${
                  variante === v.valor ? " se-vista__variante--on" : ""
                }`}
                onClick={() => onVariante?.(v.valor)}
              >
                {v.etiqueta}
              </button>
            ))}
          </span>
        ) : null}
      </div>

      {/* El lienzo imita el fondo del sitio, no el del panel: una tarjeta blanca sobre
          un panel blanco parece no tener borde, y ese borde es justo lo que separa un
          anuncio de una pieza de la redacción. */}
      <div className="se-vista__lienzo">
        <Pintor hueco={hueco} variante={variante} />
      </div>

      {faltaTitular ? (
        <p className="se-vista__aviso">
          Sin titular la pieza sale vacía. Es lo único que el lector lee de un anuncio
          nativo.
        </p>
      ) : null}
    </div>
  );
};

VistaDeLaPieza.propTypes = {
  /** El borrador del formulario, no lo guardado: se mira antes de guardar. */
  pieza: PropTypes.object.isRequired,
  anunciante: PropTypes.object,
  variante: PropTypes.oneOf(["tarjeta", "lista", "cuerpo"]),
  onVariante: PropTypes.func,
};

VistaDeLaPieza.defaultProps = { variante: "tarjeta" };

export default VistaDeLaPieza;
