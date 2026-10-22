import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { Bandera } from "./Bandera";
import { CIUDADES, horaEn } from "../lib/relojes";

/**
 * La hora de cuatro ciudades: Caracas, Madrid, Buenos Aires y California.
 *
 * En la cabecera rotan, una cada 5 segundos, con la misma caída y entrada que la
 * tarjeta de «Última hora»: la que estaba cae y se borra, la nueva entra desde arriba
 * y se asienta. En el cajón del teléfono, donde sobra sitio, van las cuatro a la vez.
 *
 * - **Con `timeZone`, nunca con el reloj de la máquina:** la hora tiene que ser la misma
 *   para quien lee desde Bogotá o con el teléfono mal configurado. Y los cambios de hora
 *   (Madrid el último domingo de octubre, California el primero de noviembre) los
 *   aplica `Intl` solo: aquí no hay ninguna diferencia horaria escrita a mano.
 * - **No empuja la cabecera:** las cuatro ciudades se apilan invisibles en la misma
 *   celda, así el bloque mide siempre lo de la más larga y no baila al rotar.
 * - **Se para** con el cursor encima (para leerla tranquilo) y no rota con «reducir
 *   movimiento»: ahí se queda en Caracas, que es la hora de la redacción.
 * - En 24 horas: ahorra dos caracteres en una barra donde los enlaces van justos.
 * - Con su bandera al lado (components/Bandera.jsx), para ver de un vistazo de qué país
 *   es cada hora.
 */

const CADA_MS = 5000;
/** Lo que dura la caída de la que sale; tiene que coincidir con `se-hora-cae` en el CSS. */
const CAIDA_MS = 300;

const prefiereQuieto = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Un tic por segundo, enganchado al segundo redondo, y al día al volver a la pestaña. */
const useAhora = () => {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const marcar = () => setAhora(new Date());
    // Arrancando el intervalo a pelo, el reloj salta a destiempo del del sistema y
    // se queda medio segundo corrido.
    let intervalo;
    const arranque = window.setTimeout(() => {
      marcar();
      intervalo = window.setInterval(marcar, 1000);
    }, 1000 - (Date.now() % 1000));
    // El navegador frena los temporizadores de una pestaña de fondo a uno por minuto:
    // al volver, la hora se quedaría atrasada justo cuando alguien la mira.
    const alVolver = () => {
      if (document.visibilityState === "visible") marcar();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.clearTimeout(arranque);
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);
  return ahora;
};

const Ciudad = ({ indice, ahora, t, className = "", oculta = false }) => {
  const c = CIUDADES[indice];
  const { hm, ss } = horaEn(indice, ahora);
  return (
    <div className={className} aria-hidden={oculta || undefined}>
      <Bandera pais={c.pais} className="se-hora__bandera" />
      <span className="se-hora__texto">
        <span className="se-hora__lugar">{t(`nav.relojes.${c.clave}`)}</span>
        {/* Sin `role="timer"`: hay lectores de pantalla que lo tratan como región viva
            y leerían la hora en voz alta cada segundo. */}
        <time className="se-hora__valor" dateTime={`${hm}:${ss}`}>
          {hm}
          <span className="se-hora__seg">:{ss}</span>
        </time>
      </span>
    </div>
  );
};

Ciudad.propTypes = {
  indice: PropTypes.number.isRequired,
  ahora: PropTypes.instanceOf(Date).isRequired,
  t: PropTypes.func.isRequired,
  className: PropTypes.string,
  oculta: PropTypes.bool,
};

/** En la cabecera: una ciudad a la vez, rotando. */
export const Relojes = ({ className = "" }) => {
  const { t } = useIdioma();
  const ahora = useAhora();
  const [quieto] = useState(prefiereQuieto);
  const [indice, setIndice] = useState(0);
  const [saliente, setSaliente] = useState(null);
  const [encima, setEncima] = useState(false);
  const indiceRef = useRef(indice);
  indiceRef.current = indice;

  const parado = quieto || encima;

  useEffect(() => {
    if (parado) return undefined;
    const id = window.setInterval(() => {
      const i = indiceRef.current;
      setSaliente(i);
      setIndice((i + 1) % CIUDADES.length);
    }, CADA_MS);
    return () => window.clearInterval(id);
  }, [parado]);

  useEffect(() => {
    if (saliente === null) return undefined;
    const id = window.setTimeout(() => setSaliente(null), CAIDA_MS);
    return () => window.clearTimeout(id);
  }, [saliente]);

  const titulo = useMemo(() => CIUDADES.map((c) => t(`nav.relojesTitulo.${c.clave}`)).join(" · "), [t]);

  return (
    // `title` con las cuatro: quien pasa el cursor las ve todas sin esperar la rotación.
    <div
      className={`se-hora se-hora--rota ${className}`.trim()}
      title={titulo}
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
    >
      <div className="se-hora__pila">
        {/* Las cuatro, invisibles: dan al bloque el ancho de la más larga. */}
        {CIUDADES.map((c, i) => (
          <Ciudad key={`molde-${c.clave}`} indice={i} ahora={ahora} t={t} className="se-hora__molde" oculta />
        ))}
        <Ciudad key={CIUDADES[indice].clave} indice={indice} ahora={ahora} t={t} className="se-hora__ciudad se-hora__ciudad--entra" />
        {saliente !== null && saliente !== indice ? (
          <Ciudad key={`sale-${CIUDADES[saliente].clave}`} indice={saliente} ahora={ahora} t={t}
            className="se-hora__ciudad se-hora__ciudad--sale" oculta />
        ) : null}
      </div>
    </div>
  );
};

Relojes.propTypes = { className: PropTypes.string };

/** En el cajón del teléfono: las cuatro a la vez. */
export const RelojesEnLista = ({ className = "" }) => {
  const { t } = useIdioma();
  const ahora = useAhora();
  return (
    <ul className={`se-hora se-hora--lista ${className}`.trim()}>
      {CIUDADES.map((c, i) => (
        <li key={c.clave} title={t(`nav.relojesTitulo.${c.clave}`)}>
          <Ciudad indice={i} ahora={ahora} t={t} className="se-hora__ciudad" />
        </li>
      ))}
    </ul>
  );
};

RelojesEnLista.propTypes = { className: PropTypes.string };
