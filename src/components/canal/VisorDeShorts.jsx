import PropTypes from "prop-types";
import { useEffect, useState } from "react";

/**
 * El visor de los shorts (`VisorDeShortsAbierto`), que se descarga aparte: solo sale al
 * tocar un short, así que no viaja con el resto del sitio.
 *
 * Baja cuando la página terminó de cargar y queda quieta, o antes donde un short se ve
 * nada más llegar (`precargarVisor`: el fijado arriba, la fila de «En la calle» a la
 * vista). Así el toque lo encuentra y lo abre en el acto, dentro del mismo gesto: es el
 * que deja al navegador arrancar el video con sonido (abierto después, fuera del gesto,
 * el iPhone puede dejarlo mudo). Quien se adelante aun así lo ve abrirse al llegar; si
 * no llega (sin red), el toque no abre nada y la tarjeta sigue como estaba.
 */
let Visor = null;
const cargar = () =>
  import("./VisorDeShortsAbierto").then((m) => {
    Visor = m.VisorDeShorts;
  });

export const precargarVisor = () => {
  if (!Visor) cargar().catch(() => {});
};

if (typeof window !== "undefined") {
  const bajar = () => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(precargarVisor, { timeout: 2500 });
    else window.setTimeout(precargarVisor, 1200);
  };
  if (document.readyState === "complete") bajar();
  else window.addEventListener("load", bajar, { once: true });
}

export const VisorDeShorts = (props) => {
  const [listo, setListo] = useState(Boolean(Visor));
  const { onCerrar } = props;
  useEffect(() => {
    if (!listo) cargar().then(() => setListo(true), onCerrar);
  }, [listo, onCerrar]);
  return listo ? <Visor {...props} /> : null;
};

VisorDeShorts.propTypes = {
  onCerrar: PropTypes.func.isRequired,
};
