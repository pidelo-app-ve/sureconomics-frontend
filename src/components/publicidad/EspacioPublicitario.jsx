import PropTypes from "prop-types";

import { enlaceDeClic } from "../../services/publicidadService";
import { useCiclo, useHueco } from "./ProveedorDePublicidad";
import { useRotacion } from "./useRotacion";

/**
 * Un hueco publicitario, pintado según el formato que le tocó.
 *
 * ## Tres reglas que este componente no negocia
 *
 * **Siempre lleva etiqueta.** «Publicidad · [Anunciante]», visible, antes del titular y
 * no debajo. Un contenido patrocinado que se confunde con una pieza de la redacción es
 * el único error de este módulo que no se arregla pidiendo perdón.
 *
 * **Si no hay nada, no hay hueco.** Devuelve `null` y el maquetado se cierra solo. Un
 * recuadro vacío con borde se lee como un error de la página, no como un espacio libre.
 *
 * **El enlace lleva `rel="sponsored noopener noreferrer"` y `target="_blank"`.**
 * `sponsored` porque es la etiqueta que los buscadores esperan en un enlace pagado, y
 * omitirla puede costarle posiciones al sitio entero. `noopener` porque una pestaña
 * nueva sin él le da al destino control sobre la que la abrió.
 *
 * El destino nunca es el del anunciante: es nuestra propia API, que cuenta el clic y
 * redirige. Ver `publicidadService`.
 */

const Etiqueta = ({ anunciante, esCasa }) => (
  <span className={`se-ad__etiqueta${esCasa ? " se-ad__etiqueta--casa" : ""}`}>
    {esCasa ? "Espacio disponible" : "Publicidad"}
    {anunciante ? <span className="se-ad__marca"> · {anunciante}</span> : null}
  </span>
);

Etiqueta.propTypes = {
  anunciante: PropTypes.string,
  esCasa: PropTypes.bool,
};

const Envoltorio = ({ hueco, className, children }) => {
  const destino = enlaceDeClic(hueco.enlace);
  if (!destino) return <div className={className}>{children}</div>;
  return (
    <a
      className={className}
      href={destino}
      target="_blank"
      rel="sponsored noopener noreferrer"
    >
      {children}
    </a>
  );
};

Envoltorio.propTypes = {
  hueco: PropTypes.object.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

const Logo = ({ hueco, className }) =>
  hueco.imagen ? (
    <img className={className} src={hueco.imagen} alt={hueco.alt || hueco.anunciante || ""} loading="lazy" />
  ) : null;

Logo.propTypes = { hueco: PropTypes.object.isRequired, className: PropTypes.string };

/* ------------------------------------------------------------------ formatos */

/**
 * El montaje: el cuerpo común de todos los formatos.
 *
 * ## La pieza **es** la imagen
 *
 * El anunciante entrega su arte ya compuesto —con su tipografía, su mensaje y su
 * llamada dentro— y el sitio no le escribe nada al lado. Antes cada formato pintaba un
 * logotipo pequeño centrado sobre una placa y le ponía encima un titular nuestro, y eso
 * tenía dos problemas: el anuncio se veía pobre al lado de una imagen editorial, y el
 * titular competía con el mensaje que el propio arte ya traía.
 *
 * ## Lo único que pone el sitio es la etiqueta
 *
 * «Publicidad · [Anunciante]», sobrepuesta en una esquina y sobre placa propia, porque
 * el arte puede ser de cualquier color y sin placa desaparece sobre la mitad de ellos.
 * Va sobrepuesta y no encima del recuadro para no robarle alto al arte. No es
 * negociable: es lo que separa un anuncio de una pieza de la redacción.
 *
 * ## `contain` y no `cover`
 *
 * Un arte hecho a la medida del hueco lo llena igual de lado a lado. Uno que llega con
 * otra proporción queda entero con franjas, en vez de recortado por la mitad —que es lo
 * que pasa con `cover`, y siempre por donde peor: el logotipo.
 *
 * La proporción la fija el CSS de cada hueco, no la imagen, para que el recuadro ocupe
 * su sitio antes de que la imagen cargue y la página no dé el salto que corre todo lo
 * que hay debajo.
 */
const Montaje = ({ hueco, modificador }) => {
  // La cinta primero y el logotipo de respaldo: una campaña antigua que solo trae
  // logotipo sigue pintando algo —centrado y con franjas— en vez de dejar el hueco en
  // blanco mientras la redacción sube los artes nuevos.
  const arte = hueco.cinta || hueco.imagen;
  if (!arte) return null;

  return (
    <Envoltorio hueco={hueco} className={`se-ad se-ad--montaje se-ad--${modificador}`}>
      <div className="se-ad__cinta">
        <img
          className="se-ad__cinta-img"
          src={arte}
          alt={hueco.alt || hueco.anunciante || ""}
          loading="lazy"
        />
        <span className="se-ad__cinta-sello">
          <Etiqueta anunciante={hueco.anunciante} esCasa={hueco.es_casa} />
        </span>
      </div>
    </Envoltorio>
  );
};

Montaje.propTypes = {
  hueco: PropTypes.object.isRequired,
  /** Decide la proporción del recuadro. Ver el bloque `--montaje` en la hoja. */
  modificador: PropTypes.string.isRequired,
};

/**
 * A — tarjeta nativa. Tres variantes según dónde caiga.
 *
 * `tarjeta` es la que va **dentro** de una rejilla de contenido, con la misma retícula
 * que una pieza: imagen arriba en 16/9, cuerpo debajo. Así lo pedía el formato A de la
 * maqueta, y es lo que hace que la rejilla no se rompa — una franja ancha metida entre
 * tarjetas parte la fila y se lee como un error de maquetado.
 *
 * Que comparta retícula con una pieza es justo lo que obliga a que la etiqueta sea
 * inequívoca. Por eso en esta variante «Publicidad» va **sobre la imagen**, no bajo
 * ella: es lo primero que se ve, antes que el logotipo y antes que el titular.
 *
 * `lista` es la franja horizontal ancha; `cuerpo`, la del interior de un artículo.
 */
const TarjetaNativa = ({ hueco, variante }) => {
  if (variante === "tarjeta") {
    return (
      <Envoltorio hueco={hueco} className="se-ad se-ad--ficha">
        <div className="se-ad__ficha-media">
          <Etiqueta anunciante={hueco.anunciante} esCasa={hueco.es_casa} />
          <Logo hueco={hueco} className="se-ad__logo se-ad__logo--ficha" />
        </div>
        <div className="se-ad__ficha-cuerpo">
          <h3 className="se-ad__titular">{hueco.titular_corto || hueco.titular}</h3>
          {hueco.pie ? <p className="se-ad__pie">{hueco.pie}</p> : null}
          <span className="se-ad__cta">
            {hueco.es_casa ? "Ver tarifas →" : "Conocer más →"}
          </span>
        </div>
      </Envoltorio>
    );
  }

  // `lista` y `cuerpo` son franjas anchas: ahí la pieza es la cinta. La de la rejilla
  // no, porque comparte retícula con las tarjetas de contenido que tiene al lado.
  return <Montaje hueco={hueco} modificador={`franja se-ad--franja-${variante}`} />;
};

TarjetaNativa.propTypes = {
  hueco: PropTypes.object.isRequired,
  variante: PropTypes.oneOf(["tarjeta", "lista", "cuerpo"]),
};

/**
 * B — banner / billboard. El único con trato de imagen montada.
 *
 * Es el hueco grande y el que se vende caro: ahí el anunciante entrega su arte
 * compuesto y el sitio no le escribe nada al lado. Los demás formatos siguen con
 * logotipo y titular, que es como están pautados.
 */
const Banner = ({ hueco }) => <Montaje hueco={hueco} modificador="banner" />;
Banner.propTypes = { hueco: PropTypes.object.isRequired };

/** C — patrocinio de tema o país. Cinta fina sobre el listado filtrado. */
const Patrocinio = ({ hueco }) => <Montaje hueco={hueco} modificador="patrocinio" />;
Patrocinio.propTypes = { hueco: PropTypes.object.isRequired };

/** D — patrocinio del boletín. Cinta dentro de la tarjeta del boletín. */
const Boletin = ({ hueco }) => <Montaje hueco={hueco} modificador="boletin" />;
Boletin.propTypes = { hueco: PropTypes.object.isRequired };

/** I — rail lateral del artículo. */
const Rail = ({ hueco }) => (
  <Envoltorio hueco={hueco} className="se-ad se-ad--rail">
    <div className="se-ad__media se-ad__media--rail">
      <Logo hueco={hueco} className="se-ad__logo" />
    </div>
    <Etiqueta anunciante={hueco.anunciante} esCasa={hueco.es_casa} />
    <h3 className="se-ad__titular">{hueco.titular_corto || hueco.titular}</h3>
    <span className="se-ad__cta">Conocer más →</span>
  </Envoltorio>
);

Rail.propTypes = { hueco: PropTypes.object.isRequired };

/**
 * F — cintillo. El único que sigue siendo texto, y a propósito.
 *
 * Comparte fila con las cifras del cierre, en una franja de unos veinte píxeles de alto.
 * Ahí no cabe una imagen montada: cualquier arte quedaría en una tira ilegible. Lo que
 * se vende aquí es la mención, no el arte.
 */
const Cintillo = ({ hueco }) => (
  <Envoltorio hueco={hueco} className="se-ad se-ad--cintillo">
    <span className="se-ad__cintillo-tag">
      {hueco.es_casa ? "Espacio disponible" : "Cifras presentadas por"}
    </span>
    <span className="se-ad__cintillo-marca">{hueco.anunciante}</span>
  </Envoltorio>
);

Cintillo.propTypes = { hueco: PropTypes.object.isRequired };

/**
 * Los pintores de cada formato, expuestos para que el panel pueda enseñar una pieza
 * montada tal y como se verá en el sitio.
 *
 * Se exporta el mismo mapa que usa el sitio y no una copia "de vista previa": una
 * previsualización que se dibuja con código distinto del que publica deja de ser una
 * previsualización el primer día que uno de los dos cambie -- y lo hace en silencio,
 * que es lo peor, porque justo entonces nadie vuelve a comprobar.
 */
export const POR_FORMATO = {
  A: TarjetaNativa,
  B: Banner,
  C: Patrocinio,
  D: Boletin,
  F: Cintillo,
  I: Rail,
};

/**
 * Si este hueco va a pintar algo.
 *
 * Existe para que quien **envuelve** un hueco pueda decidirlo antes de dibujar el
 * envoltorio. En la portada el banner va dentro de una `<section>` con su aire, y esa
 * sección se pintaba siempre: sin campaña quedaba una banda vacía de 96 px en mitad de
 * la página. El hueco desaparecía; su marco no.
 *
 * Los formatos de cinta no pintan nada sin arte, así que para ellos no basta con que
 * haya campaña. Los demás se sostienen con el titular aunque falte el logotipo.
 */
const FORMATOS_DE_CINTA = new Set(["B", "C", "D"]);

export const pintaAlgo = (hueco, variante) => {
  if (!hueco) return false;
  const esCinta =
    FORMATOS_DE_CINTA.has(hueco.formato) ||
    (hueco.formato === "A" && variante && variante !== "tarjeta");
  return esCinta ? Boolean(hueco.cinta || hueco.imagen) : true;
};

/**
 * Si este hueco va a pintar algo, para quien necesita saberlo **antes** de montarlo.
 *
 * La rejilla lo necesita porque el anuncio le quita el sitio a una pieza: con anuncio
 * son cinco noticias y una tarjeta de publicidad, sin anuncio son seis noticias. Sin
 * preguntar antes, la rejilla descontaba la pieza igual y el bloque se quedaba en cinco
 * con un hueco que nadie llenaba -- que es exactamente lo que pasa en producción, donde
 * todavía no hay campañas.
 */
export const useHayAnuncio = (espacio, variante = "tarjeta") =>
  pintaAlgo(useHueco(espacio), variante);

/**
 * Un hueco con su propia sección: el marco solo existe si hay anuncio.
 *
 * Se usa donde el anuncio va suelto entre dos bloques y necesita aire propio. Donde
 * cae dentro de una rejilla no hace falta: ahí el hueco es una celda más y la rejilla
 * se cierra sola.
 */
export const FilaDeAnuncio = ({ espacio }) => {
  const hueco = useHueco(espacio);
  if (!pintaAlgo(hueco)) return null;
  return (
    <section className="se-section se-ad-fila">
      <div className="se-container">
        <EspacioPublicitario espacio={espacio} />
      </div>
    </section>
  );
};

FilaDeAnuncio.propTypes = { espacio: PropTypes.string.isRequired };

/* -------------------------------------------------------------------- público */

export const EspacioPublicitario = ({ espacio, variante = "tarjeta", className }) => {
  const ciclo = useCiclo(espacio);
  const { contenedor, indice, entrando, pausa, saliente, pieza } = useRotacion(ciclo);

  if (!pieza) return null;

  const Pieza = POR_FORMATO[pieza.formato];
  // La H (barra fija) tiene componente propio porque se posiciona sobre la página
  // entera, y la E todavía no se sirve. Un formato sin pintor no pinta nada: es lo
  // correcto el día que se añada uno nuevo en el backend antes que aquí.
  if (!Pieza) return null;

  // `key` con el índice para que React monte un nodo nuevo en cada turno. Sin eso
  // reusaría el mismo y la animación de entrada no volvería a dispararse — el anuncio
  // cambiaría de contenido sin que nada se moviera, que es lo contrario de lo pedido.
  return (
    <div
      ref={contenedor}
      className={`se-ad-hueco${entrando ? " se-ad-hueco--cambia" : ""}${
        className ? ` ${className}` : ""
      }`}
      data-espacio={espacio}
      data-turno={ciclo.length > 1 ? `${indice + 1}/${ciclo.length}` : undefined}
      {...pausa}
    >
      <Pieza key={indice} hueco={pieza} variante={variante} />
      {/* La que se va, encima y solo mientras dura la animación. `aria-hidden` porque
          para un lector de pantalla hay un anuncio, no dos; e `inert` para que el
          tabulador no pueda caer en un enlace que está desapareciendo. */}
      {saliente ? (
        <div className="se-ad-hueco__saliente" aria-hidden="true" inert="">
          <Pieza hueco={saliente} variante={variante} />
        </div>
      ) : null}
    </div>
  );
};

EspacioPublicitario.propTypes = {
  espacio: PropTypes.string.isRequired,
  variante: PropTypes.oneOf(["tarjeta", "lista", "cuerpo"]),
  className: PropTypes.string,
};
