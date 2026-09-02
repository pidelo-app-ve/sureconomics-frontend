import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { BRAND } from "../../brand/publicBrandLogos";

/**
 * La firma de una pieza, como la define el brandbook.
 *
 * "POR" en cobre, el nombre en grueso, una regla vertical y la fecha con su icono.
 *
 * **Con retrato, y esto invierte lo que aquí decía antes.** Durante un tiempo esta
 * firma se dibujó a propósito sin foto: el brandbook la pedía, pero se juzgó que
 * conseguir y mantener un retrato por firmante costaba más de lo que aportaba.
 *
 * Ese cálculo daba por supuesto que la foto se ataría a la cuenta de quien escribe --
 * una subida por persona y por pieza, y alguien vigilando que no se descuadraran. Lo
 * que cambió no es el criterio sino el diseño: la foto se ata **a la pieza** y sale de
 * una biblioteca compartida, así que una sola subida sirve para las cien piezas que
 * firme esa persona. Desaparecido el coste, desaparece el motivo de la decisión, y la
 * firma puede llevar la cara que el brandbook siempre dibujó.
 *
 * Sin foto va un icono de persona. Es un caso normal y no un error: exigir retrato
 * bloquearía publicar por no tener uno a mano.
 *
 * Cuando firma la casa va el isotipo, que es un archivo y no cien -- nunca un retrato
 * ni una silueta anónima, que ahí sería un paso atrás.
 *
 * El editorial firma siempre como la casa: es la posición del medio, no la de una
 * persona, y ese es justamente el rasgo que lo distingue de un análisis firmado.
 */
const ES_LA_CASA = /redacci[oó]n|sureconomics/i;

const IconoFecha = () => (
  <svg
    className="se-firma__cal"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <circle cx="8" cy="14" r=".9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14" r=".9" fill="currentColor" stroke="none" />
    <circle cx="16" cy="14" r=".9" fill="currentColor" stroke="none" />
    <circle cx="8" cy="17.5" r=".9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="17.5" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

/** Lo que va cuando firma una persona de la que no hay retrato. */
const IconoPersona = () => (
  <svg
    viewBox="0 0 24 24"
    width="34"
    height="34"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20.5c0-3.6 3.36-6 7.5-6s7.5 2.4 7.5 6" strokeLinecap="round" />
  </svg>
);

export const PieceByline = ({ autor, autorFoto, fecha, unidad, esEditorial }) => {
  // Una foto que no carga dejaría el hueco vacío y la firma descuadrada. Al fallar se
  // cae a la silueta, que es justamente el estado previsto para "no hay retrato".
  //
  // Los dos hooks van **antes** de la salida temprana de abajo, y no es cosmético: una
  // pieza que pasa de tener firma a no tenerla cambiaría el número de hooks entre dos
  // renders y React se rompe. El linter lo cazó.
  const [fotoRota, setFotoRota] = useState(false);
  useEffect(() => {
    setFotoRota(false);
  }, [autorFoto]);

  // Sin firma y sin fecha no hay bloque que dibujar. Una pieza puede publicarse sin
  // firma a propósito -- así se decidió cuando la firma dejó de salir de la cuenta.
  if (!autor && !fecha && !unidad) return null;

  const nombre = esEditorial ? "Redacción SurEconomics" : autor;
  const laCasa = esEditorial || (nombre ? ES_LA_CASA.test(nombre) : false);

  // El retrato es de personas. Sobre la casa va el isotipo y nada más.
  const retrato = !laCasa && nombre && autorFoto && !fotoRota ? autorFoto : null;
  const silueta = !laCasa && Boolean(nombre) && !retrato;

  return (
    <div className="se-firma">
      {laCasa ? (
        <img className="se-firma__marca" src={BRAND.isotipo} alt="" width="56" height="56" />
      ) : null}

      {retrato ? (
        <img
          className="se-firma__retrato"
          src={retrato}
          // Vacío a propósito: el nombre va escrito justo al lado, así que describir la
          // foto haría que un lector de pantalla dijera la misma persona dos veces.
          alt=""
          width="56"
          height="56"
          loading="lazy"
          onError={() => setFotoRota(true)}
        />
      ) : null}

      {silueta ? (
        <span className="se-firma__silueta">
          <IconoPersona />
        </span>
      ) : null}

      {nombre ? (
        <div className="se-firma__quien">
          <span className="se-firma__por">Por</span>
          <span className="se-firma__nombre">{nombre}</span>
          {unidad ? (
            <span className="se-firma__rol">Investigación de {unidad}</span>
          ) : null}
        </div>
      ) : null}

      {fecha ? (
        <div className="se-firma__cuando">
          <IconoFecha />
          <time>{fecha}</time>
        </div>
      ) : null}
    </div>
  );
};

PieceByline.propTypes = {
  autor: PropTypes.string,
  /** La dirección del retrato. Nulo es el caso normal: entonces va la silueta. */
  autorFoto: PropTypes.string,
  fecha: PropTypes.string,
  unidad: PropTypes.string,
  esEditorial: PropTypes.bool,
};

PieceByline.defaultProps = {
  autor: null,
  autorFoto: null,
  fecha: null,
  unidad: null,
  esEditorial: false,
};
