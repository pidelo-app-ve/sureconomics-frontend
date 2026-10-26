import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useCanal } from "../../hooks/useCanal";
import { usePuedePrevisualizar } from "../../hooks/useVistaPrevia";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { imagenAncho } from "../../lib/pieza";
import { duracionReloj } from "../../lib/youtube";
import { VisorDeShorts } from "./VisorDeShorts";
import { IconoPlay, VistaPrevia } from "./VistaPrevia";
import "./aperturaShort.css";

/**
 * La apertura de la portada cuando su video es un short: vertical, con el titular al
 * lado, como abren los diarios financieros una pieza que se cuenta en video.
 *
 * El short lo pone la redacción como el video de la pieza (el mismo campo que el de una
 * entrevista: un enlace `youtube.com/shorts/…`). La foto es la copia del short si es de
 * nuestro canal (ya está en nuestro almacenamiento); si no, la de la pieza.
 *
 * Se mueve sola, muda, con las mismas reglas que «En la calle» (cookies aceptadas, sin
 * movimiento reducido ni ahorro de datos, a la vista, 20 s). Al tocarla se abre el visor
 * con sonido; el titular sigue llevando a la pieza.
 */
const esClicSencillo = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export const AperturaShort = ({ pieza, id }) => {
  const { t } = useIdioma();
  const canal = useCanal();
  const puede = usePuedePrevisualizar();
  const marco = useRef(null);
  const [enPantalla, setEnPantalla] = useState(false);
  const [pestana, setPestana] = useState(true);
  const [agotada, setAgotada] = useState(false);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    const el = marco.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const ojo = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), { threshold: 0.5 });
    ojo.observe(el);
    const alCambiar = () => setPestana(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", alCambiar);
    return () => {
      ojo.disconnect();
      document.removeEventListener("visibilitychange", alCambiar);
    };
  }, []);

  const delCanal = canal?.shorts?.find((s) => s.id === id) ?? null;
  const portada = delCanal?.portada || (pieza.imagenUrl ? imagenAncho(pieza.imagenUrl, 800) : null);
  const dura = duracionReloj(pieza.duracionSegundos ?? delCanal?.duracion);
  const previa = puede && enPantalla && pestana && !agotada && !abierto;
  const corto = {
    id,
    titulo: pieza.titulo,
    enlace: pieza.videoUrl,
    publicado: pieza.fechaIso ?? null,
    vistas: delCanal?.vistas ?? null,
  };

  return (
    <div className="se-apertura-short">
      <a
        ref={marco}
        href={pieza.videoUrl}
        className="se-apertura-short__marco"
        onClick={(e) => {
          if (!esClicSencillo(e)) return;
          e.preventDefault();
          const r = e.currentTarget.getBoundingClientRect();
          setAbierto({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }}
        aria-label={dura ? t("portada.calle.abrirConDuracion", { titulo: pieza.titulo, duracion: dura }) : t("portada.calle.abrir", { titulo: pieza.titulo })}
      >
        {portada ? (
          <img className="se-apertura-short__foto" src={portada} alt="" decoding="async" />
        ) : null}
        {previa ? (
          <VistaPrevia id={id} titulo={pieza.titulo} className="se-apertura-short__previa" onAgotada={() => setAgotada(true)} />
        ) : null}
        <span className="se-marca-video" aria-hidden="true">
          <IconoPlay tamano={20} />
          {dura}
        </span>
      </a>
      {abierto ? (
        <VisorDeShorts shorts={[corto]} inicio={0} canal={canal?.canal ?? null} origen={abierto} onCerrar={() => setAbierto(null)} />
      ) : null}
    </div>
  );
};

AperturaShort.propTypes = {
  pieza: PropTypes.shape({
    titulo: PropTypes.string,
    videoUrl: PropTypes.string.isRequired,
    imagenUrl: PropTypes.string,
    fechaIso: PropTypes.string,
    duracionSegundos: PropTypes.number,
  }).isRequired,
  id: PropTypes.string.isRequired,
};

export default AperturaShort;
