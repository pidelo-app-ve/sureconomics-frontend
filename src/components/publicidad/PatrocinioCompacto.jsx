import PropTypes from "prop-types";
import { useMemo } from "react";

import { Envoltorio } from "./EspacioPublicitario";
import { useRotacion } from "./useRotacion";

/**
 * «Patrocinado por [marca]», en una línea. Para donde no cabe un anuncio y sí un crédito:
 * las pantallas de inicio y final del juego de /pausa.
 *
 * ## Recibe el hueco, no el espacio
 *
 * Quien lo usa ya ha pedido el espacio con `useEspacios` y lo ha leído con `useHueco`,
 * porque necesita saber si hay patrocinador para decidir qué pintar en su lugar
 * («SurEconomics»). Pedirlo aquí otra vez sería leer dos veces lo mismo. Sin hueco
 * devuelve `null` y el que llama pone lo suyo.
 *
 * ## Cuenta y redirige igual que cualquier anuncio
 *
 * La impresión sale de `useRotacion` —la mitad del crédito en pantalla, una vez por
 * pieza— y el clic del mismo `Envoltorio` que usa `EspacioPublicitario`: el salto por
 * nuestra API con su token, `sponsored` y pestaña nueva. Un patrocinio que se contara
 * con otra regla no se podría facturar al lado de los demás.
 *
 * ## La marca, no el arte
 *
 * Pinta el logotipo del anunciante (`hueco.logo`), no la imagen de la pieza: en veinte
 * píxeles de alto un arte de campaña es una mancha, y puede ser un cartel de rebajas.
 * Sin logotipo, el nombre en texto.
 */

const SIN_NADA = [];

export const PatrocinioCompacto = ({ hueco, tono = "claro", className }) => {
  // Un ciclo de una sola pieza: no rota, pero hereda el observador que decide cuándo
  // se vio. Memorizado porque un array nuevo en cada render reinicia el ciclo.
  const ciclo = useMemo(() => (hueco ? [hueco] : SIN_NADA), [hueco]);
  const { contenedor } = useRotacion(ciclo);

  if (!hueco || !(hueco.logo || hueco.anunciante)) return null;

  return (
    <div
      ref={contenedor}
      className={`se-patrocinio se-patrocinio--${tono}${className ? ` ${className}` : ""}`}
      data-espacio={hueco.espacio}
    >
      {/* El relleno de la casa no patrocina nada: se dice lo que es, igual que la
          etiqueta de `EspacioPublicitario`. */}
      <span className="se-patrocinio__etiqueta">
        {hueco.es_casa ? "Espacio disponible" : "Patrocinado por"}
      </span>
      <Envoltorio hueco={hueco} className="se-patrocinio__marca">
        {hueco.logo ? (
          <img
            className="se-patrocinio__logo"
            src={hueco.logo}
            alt={hueco.anunciante || hueco.alt || ""}
            decoding="async"
          />
        ) : (
          <span className="se-patrocinio__nombre">{hueco.anunciante}</span>
        )}
      </Envoltorio>
    </div>
  );
};

PatrocinioCompacto.propTypes = {
  /** Lo que devuelve `useHueco`. `null` no pinta nada. */
  hueco: PropTypes.object,
  /** El fondo sobre el que va: cambia el color del texto y de la línea. */
  tono: PropTypes.oneOf(["claro", "oscuro"]),
  className: PropTypes.string,
};
