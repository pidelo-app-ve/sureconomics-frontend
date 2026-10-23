import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { Enlace } from "../Enlace";
import { formatearFecha } from "../../i18n/motor";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { LOGO_LIGA, diasParaLaFranja, equipo, escudoDe, fechaDelDia, hayJuegoVivo, horaBonita } from "../../lib/lvbp";
import { getLvbp } from "../../services/lvbpService";
import "./marcadorLvbp.css";

/**
 * El marcador de la LVBP: la franja de la portada, y las piezas que comparte con /lvbp.
 *
 * Lo que decide cómo se ve:
 * - Es **béisbol**: el visitante arriba y el local abajo, como en cualquier pizarra, y
 *   las carreras a la derecha alineadas en columna (`tabular-nums`).
 * - **Tres pintas**: el que ganó en negrita y el que perdió apagado; en vivo, un punto
 *   rojo que late y el inning; por jugar, la hora en el verde de la casa.
 * - **Se actualiza sola** mientras hay juego (cada minuto, y solo con la pestaña a la
 *   vista): `useLvbp` lo lleva, y lo comparten la franja y la página.
 * - **Fuera de temporada no existe**: sin juegos en tres días, la franja no se pinta.
 */

const CADA = 60_000;

export const useLvbp = () => {
  const [state, setState] = useState({ status: "loading", datos: null });
  const reloj = useRef(null);

  useEffect(() => {
    let vivo = true;
    const pedir = async () => {
      try {
        const datos = await getLvbp();
        if (vivo) setState({ status: "success", datos });
        return datos;
      } catch {
        if (vivo) setState((s) => (s.datos ? s : { status: "error", datos: null }));
        return null;
      }
    };
    const programar = (datos) => {
      clearTimeout(reloj.current);
      const juegos = [...(datos?.dias?.hoy ?? [])];
      if (!hayJuegoVivo(juegos)) return;
      reloj.current = setTimeout(async () => {
        if (document.visibilityState === "hidden") {
          programar(datos);
          return;
        }
        programar(await pedir());
      }, CADA);
    };
    pedir().then(programar);
    const alVolver = () => {
      if (document.visibilityState === "visible") pedir().then(programar);
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vivo = false;
      clearTimeout(reloj.current);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  return state;
};

/** El escudo de un equipo; si el archivo no carga, la sigla en una pastilla. */
export const Escudo = ({ sigla, tamano = 24 }) => {
  const [fallo, setFallo] = useState(false);
  if (fallo) {
    return (
      <span className="se-lvbp__sigla" style={{ width: tamano * 1.5, height: tamano }} aria-hidden="true">
        {sigla}
      </span>
    );
  }
  return (
    <img
      className="se-lvbp__escudo"
      src={escudoDe(sigla)}
      alt=""
      width={tamano}
      height={tamano}
      loading="lazy"
      decoding="async"
      onError={() => setFallo(true)}
    />
  );
};
Escudo.propTypes = { sigla: PropTypes.string.isRequired, tamano: PropTypes.number };
Escudo.defaultProps = { tamano: 24 };

/** La línea de estado de un juego: hora, en vivo con inning, final, suspendido… */
export const EstadoDelJuego = ({ juego }) => {
  const { t, lang } = useIdioma();
  if (juego.estado === "en_vivo") {
    const inning = juego.inning
      ? ` · ${t("lvbp.inning", { n: juego.inning })}${juego.inning_mitad ? ` ${t(`lvbp.mitad.${juego.inning_mitad}`)}` : ""}`
      : "";
    return (
      <span className="se-lvbp__estado se-lvbp__estado--vivo">
        <span className="se-lvbp__punto" aria-hidden="true" />
        {t("lvbp.estado.enVivo")}
        {inning}
      </span>
    );
  }
  if (juego.estado === "programado") {
    return <span className="se-lvbp__estado se-lvbp__estado--hora">{horaBonita(juego.hora, lang) || t("lvbp.estado.programado")}</span>;
  }
  return <span className={`se-lvbp__estado se-lvbp__estado--${juego.estado}`}>{t(`lvbp.estado.${juego.estado}`)}</span>;
};
EstadoDelJuego.propTypes = { juego: PropTypes.object.isRequired };

const Fila = ({ sigla, carreras, gano, perdio, grande }) => (
  <div className={`se-lvbp__fila${gano ? " se-lvbp__fila--gano" : ""}${perdio ? " se-lvbp__fila--perdio" : ""}`}>
    <Escudo sigla={sigla} tamano={grande ? 30 : 26} />
    <span className="se-lvbp__equipo">{grande ? equipo(sigla).nombre : equipo(sigla).corto}</span>
    {/* `key` por valor: cuando cambia el marcador la cifra se vuelve a montar y entra
        con `se-lvbp-entra`. Es el único movimiento que significa «pasó algo». */}
    <span key={carreras ?? "-"} className="se-lvbp__carreras">{carreras ?? ""}</span>
  </div>
);
Fila.propTypes = {
  sigla: PropTypes.string.isRequired,
  carreras: PropTypes.number,
  gano: PropTypes.bool,
  perdio: PropTypes.bool,
  grande: PropTypes.bool,
};
Fila.defaultProps = { carreras: null, gano: false, perdio: false, grande: false };

/** Una tarjeta de juego: visitante arriba, local abajo, el estado encima. */
export const TarjetaJuego = ({ juego, grande, children }) => {
  const terminado = juego.estado === "final";
  const enVivo = juego.estado === "en_vivo";
  const muestraCarreras = terminado || enVivo;
  return (
    <article className={`se-lvbp__juego se-lvbp__juego--${juego.estado}${grande ? " se-lvbp__juego--grande" : ""}`}>
      <EstadoDelJuego juego={juego} />
      <Fila
        sigla={juego.visitante}
        carreras={muestraCarreras ? juego.carreras_visitante : null}
        gano={terminado && juego.ganador === juego.visitante}
        perdio={terminado && juego.ganador === juego.local}
        grande={grande}
      />
      <Fila
        sigla={juego.local}
        carreras={muestraCarreras ? juego.carreras_local : null}
        gano={terminado && juego.ganador === juego.local}
        perdio={terminado && juego.ganador === juego.visitante}
        grande={grande}
      />
      {children}
    </article>
  );
};
TarjetaJuego.propTypes = { juego: PropTypes.object.isRequired, grande: PropTypes.bool, children: PropTypes.node };
TarjetaJuego.defaultProps = { grande: false, children: null };

/** La franja de la portada. Nada que enseñar → nada que pintar. */
export const MarcadorLvbp = () => {
  const { t } = useIdioma();
  const { datos } = useLvbp();
  const grupos = diasParaLaFranja(datos?.dias);
  if (!grupos.length) return null;

  return (
    <section className="se-lvbp" aria-label={t("lvbp.titulo")}>
      <div className="se-lvbp__cabeza">
        <img className="se-lvbp__liga" src={LOGO_LIGA} alt="" width="40" height="40" decoding="async" />
        <div className="se-lvbp__cabeza-texto">
          <span className="se-lvbp__nombre">LVBP</span>
          <span className="se-lvbp__temporada">{t("lvbp.temporada", { temporada: datos.temporada })}</span>
        </div>
        <Enlace to="/lvbp" className="se-lvbp__ver">
          {t("lvbp.verTabla")}
          <span aria-hidden="true"> →</span>
        </Enlace>
      </div>
      <div className="se-lvbp__dias">
        {grupos.map(([dia, juegos]) => (
          // `--juegos`: el día ocupa tanto ancho como juegos tiene, y cada juego mide lo
          // mismo en los dos días. Así el marcador queda al lado del equipo.
          <div key={dia} className={`se-lvbp__dia se-lvbp__dia--${dia}`} style={{ "--juegos": juegos.length }}>
            <span className="se-lvbp__dia-nombre">
              {t(`lvbp.dia.${dia}`)}
              <span className="se-lvbp__dia-fecha"> · {formatearFecha(fechaDelDia(datos.hoy, dia), "diaMes")}</span>
            </span>
            <div className="se-lvbp__juegos">
              {juegos.map((j) => (
                <TarjetaJuego key={j.id} juego={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MarcadorLvbp;
