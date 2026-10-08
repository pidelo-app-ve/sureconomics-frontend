import PropTypes from "prop-types";
import { Suspense, lazy, useState } from "react";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { rutaDePieza } from "../../lib/pieza";
import "./claveDeLaPieza.css";

/**
 * La Clave al final de una pieza: la palabra que la redacción dejó en el editor, que
 * tiene que ver con lo que se acaba de leer.
 *
 * Cerrada hasta que alguien toca «Jugar»: el juego se descarga entonces, no con la
 * pieza. Quien lee y se va no paga nada; quien se queda, juega ahí mismo, sin cambiar
 * de página.
 */
const Clave = lazy(() => import("../../juegos/clave/Clave").then((m) => ({ default: m.Clave })));

export const ClaveDeLaPieza = ({ pieza }) => {
  const { t } = useIdioma();
  const [abierta, setAbierta] = useState(false);
  if (!pieza?.juegoPalabra) return null;

  return (
    <section className="se-clave-pieza" aria-labelledby="clave-pieza-titulo">
      {abierta ? (
        <Suspense fallback={<p className="se-clave-pieza__cargando">{t("juegos.clave.cargando")}</p>}>
          <Clave
            pieza={{
              palabra: pieza.juegoPalabra,
              pista: pieza.juegoPista || "",
              slug: pieza.slug,
              ruta: rutaDePieza(pieza),
            }}
          />
        </Suspense>
      ) : (
        <button type="button" className="se-clave-pieza__invitacion" onClick={() => setAbierta(true)}>
          <span className="se-clave-pieza__celdas" aria-hidden="true">
            <span className="se-clave-pieza__celda se-clave-pieza__celda--bien">C</span>
            <span className="se-clave-pieza__celda se-clave-pieza__celda--casi">L</span>
            <span className="se-clave-pieza__celda">A</span>
            <span className="se-clave-pieza__celda se-clave-pieza__celda--no">V</span>
            <span className="se-clave-pieza__celda se-clave-pieza__celda--bien">E</span>
          </span>
          <span className="se-clave-pieza__cuerpo">
            <span className="se-clave-pieza__kicker">{t("juegos.clave.pieza.kicker")}</span>
            <span id="clave-pieza-titulo" className="se-clave-pieza__titulo">
              {t("juegos.clave.pieza.titulo")}
            </span>
            <span className="se-clave-pieza__texto">{t("juegos.clave.pieza.texto")}</span>
            <span className="se-clave-pieza__boton">{t("juegos.clave.pieza.jugar")}</span>
          </span>
        </button>
      )}
    </section>
  );
};
ClaveDeLaPieza.propTypes = {
  pieza: PropTypes.shape({
    slug: PropTypes.string,
    juegoPalabra: PropTypes.string,
    juegoPista: PropTypes.string,
  }).isRequired,
};

export default ClaveDeLaPieza;
