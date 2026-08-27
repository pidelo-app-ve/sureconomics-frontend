import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

/**
 * La hora de Caracas, en directo.
 *
 * Con `timeZone` y no con el reloj de la máquina: la hora que se anuncia es la de
 * la redacción, así que tiene que ser la misma para el que lee desde Bogotá, desde
 * Madrid o desde un teléfono con la zona mal puesta. Venezuela no cambia de hora,
 * pero el cálculo se lo deja a `Intl` igual -- si algún día cambia, esto no hay que
 * tocarlo.
 *
 * En 24 horas: va al lado del cintillo de mercados y ahorra dos caracteres en una
 * barra donde los enlaces ya van justos.
 */
const ZONA = "America/Caracas";

export const HoraCaracas = ({ className = "" }) => {
  const formato = useMemo(
    () =>
      new Intl.DateTimeFormat("es-VE", {
        timeZone: ZONA,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    []
  );

  // Las piezas por separado, no la cadena montada: en el escritorio estrecho la
  // navegacion necesita el ancho y los segundos se esconden por CSS. Un solo nodo de
  // texto no se puede recortar desde la hoja de estilos.
  const partes = useMemo(() => {
    const de = (fecha) => {
      const p = Object.fromEntries(
        formato.formatToParts(fecha).map(({ type, value }) => [type, value])
      );
      return { hm: `${p.hour}:${p.minute}`, ss: p.second };
    };
    return de;
  }, [formato]);

  const [hora, setHora] = useState(() => partes(new Date()));

  useEffect(() => {
    const marcar = () => setHora(partes(new Date()));

    // Se engancha al segundo redondo. Arrancando el intervalo a pelo, el reloj
    // salta a destiempo del reloj del sistema y se queda medio segundo corrido.
    let intervalo;
    const arranque = window.setTimeout(() => {
      marcar();
      intervalo = window.setInterval(marcar, 1000);
    }, 1000 - (Date.now() % 1000));

    // El navegador frena los temporizadores de una pestaña de fondo a uno por
    // minuto. Al volver, sin esto, la hora se queda atrasada hasta el siguiente
    // tic -- que es justo cuando alguien la mira.
    const alVolver = () => {
      if (document.visibilityState === "visible") marcar();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      window.clearTimeout(arranque);
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [partes]);

  return (
    // `title` porque en el escritorio estrecho el rotulo se esconde para dejarle
    // ancho a la navegacion, y una hora sin decir de donde es no dice nada.
    <div className={`se-hora ${className}`.trim()} title="Hora de Caracas, Venezuela">
      <span className="se-hora__lugar">Caracas</span>
      {/* Sin `role="timer"`: hay lectores de pantalla que lo tratan como región
          viva y leerían la hora en voz alta cada segundo. */}
      <time className="se-hora__valor" dateTime={`${hora.hm}:${hora.ss}`}>
        {hora.hm}
        <span className="se-hora__seg">:{hora.ss}</span>
      </time>
    </div>
  );
};

HoraCaracas.propTypes = { className: PropTypes.string };
