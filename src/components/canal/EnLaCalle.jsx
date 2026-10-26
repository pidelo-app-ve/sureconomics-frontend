import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCanal } from "../../hooks/useCanal";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { EVENTO_CONSENTIMIENTO, consentimiento } from "../../lib/analitica";
import { duracionReloj, urlVistaPrevia } from "../../lib/youtube";
import { IconoPausa } from "../comun/IconoPausa";
import { VisorDeShorts } from "./VisorDeShorts";
import "./enLaCalle.css";

/**
 * «En la calle»: los shorts del canal de YouTube de la casa, en una fila de tarjetas
 * verticales en la portada. Tocar una abre el visor (`VisorDeShorts`).
 *
 * **La vista previa, y cuándo no.** Una tarjeta puede ponerse en movimiento sola, muda,
 * para que se vea qué hay dentro. Solo una a la vez, y solo si:
 *  - el lector **aceptó las cookies** (el reproductor de YouTube guarda datos al
 *    arrancar; sin ese sí, las portadas se quedan quietas, que son copias nuestras);
 *  - no pidió «movimiento reducido» ni tiene el ahorro de datos encendido;
 *  - la fila está a la vista y la pestaña también;
 *  - no la pausó con el botón de la cabecera (se recuerda en este navegador).
 * En el ordenador se asoma la que tiene el ratón encima o el foco, tras un momento; en
 * el teléfono, la que queda al centro cuando la fila se detiene.
 *
 * Sin canal elegido en el panel, o sin shorts, no se pinta nada.
 */

const SIN_PREVIAS = "se_calle_previas";
const ESPERA_RATON = 350;
const ESPERA_TACTIL = 500;
/** YouTube enseña su carátula, su rueda y sus mandos al arrancar: se espera a que ya
 *  corra limpio para fundirlo sobre la portada. */
const ESPERA_LIMPIO = 2600;
/** Una vista previa es un asomo, no el video: a los 20 s vuelve la portada. */
const DURA_PREVIA = 20000;

const esClicSencillo = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

const leerPausa = () => {
  try {
    return window.localStorage.getItem(SIN_PREVIAS) === "no";
  } catch {
    return false;
  }
};

const consulta = (q) => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(q) : null);

/** Si este lector puede ver vistas previas: cookies aceptadas, movimiento y datos. */
const usePuedePrevisualizar = () => {
  const [acepto, setAcepto] = useState(() => consentimiento() === "si");
  const [quieto, setQuieto] = useState(() => Boolean(consulta("(prefers-reduced-motion: reduce)")?.matches));
  useEffect(() => {
    const mirar = () => setAcepto(consentimiento() === "si");
    window.addEventListener(EVENTO_CONSENTIMIENTO, mirar);
    const mq = consulta("(prefers-reduced-motion: reduce)");
    const alCambiar = () => setQuieto(Boolean(mq?.matches));
    mq?.addEventListener?.("change", alCambiar);
    return () => {
      window.removeEventListener(EVENTO_CONSENTIMIENTO, mirar);
      mq?.removeEventListener?.("change", alCambiar);
    };
  }, []);
  const ahorro = typeof navigator !== "undefined" && navigator.connection?.saveData === true;
  return acepto && !quieto && !ahorro;
};

const Tarjeta = ({ v, indice, previa, onAbrir, onAsomar, onRetirar, onAgotada }) => {
  const { t } = useIdioma();
  const [lista, setLista] = useState(false);
  const relojes = useRef([]);
  useEffect(() => {
    if (!previa) setLista(false);
    return () => relojes.current.forEach((r) => window.clearTimeout(r));
  }, [previa]);
  const alCargar = () => {
    relojes.current = [
      window.setTimeout(() => setLista(true), ESPERA_LIMPIO),
      window.setTimeout(() => onAgotada(indice), ESPERA_LIMPIO + DURA_PREVIA),
    ];
  };
  const dura = duracionReloj(v.duracion);
  return (
    <li className="se-calle__item">
      <a
        className="se-calle__tarjeta"
        href={v.enlace}
        onClick={(e) => {
          if (!esClicSencillo(e)) return;
          e.preventDefault();
          onAbrir(indice, e.currentTarget);
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && onAsomar(indice)}
        onPointerLeave={(e) => e.pointerType === "mouse" && onRetirar(indice)}
        onFocus={() => onAsomar(indice)}
        onBlur={() => onRetirar(indice)}
        aria-label={dura ? t("portada.calle.abrirConDuracion", { titulo: v.titulo, duracion: dura }) : t("portada.calle.abrir", { titulo: v.titulo })}
      >
        <img className="se-calle__foto" src={v.portada} alt="" width="640" height="1138" loading="lazy" decoding="async" />
        {previa ? (
          <iframe
            className={`se-calle__previa${lista ? " is-lista" : ""}`}
            src={urlVistaPrevia(v.id)}
            title={t("portada.calle.vistaPrevia", { titulo: v.titulo })}
            tabIndex={-1}
            aria-hidden="true"
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={alCargar}
          />
        ) : null}
        <span className="se-calle__texto">
          <span className="se-calle__dura">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 8.2l6 3.8-6 3.8Z" fill="currentColor" />
            </svg>
            {dura}
          </span>
          <span className="se-calle__titulo">{v.titulo}</span>
        </span>
      </a>
    </li>
  );
};

Tarjeta.propTypes = {
  v: PropTypes.shape({
    id: PropTypes.string.isRequired,
    titulo: PropTypes.string,
    portada: PropTypes.string,
    enlace: PropTypes.string.isRequired,
    duracion: PropTypes.number,
  }).isRequired,
  indice: PropTypes.number.isRequired,
  previa: PropTypes.bool,
  onAbrir: PropTypes.func.isRequired,
  onAsomar: PropTypes.func.isRequired,
  onRetirar: PropTypes.func.isRequired,
  /** La vista previa cumplió su tiempo. */
  onAgotada: PropTypes.func.isRequired,
};

export const EnLaCalle = () => {
  const { t } = useIdioma();
  const datos = useCanal();
  const puede = usePuedePrevisualizar();
  const [pausado, setPausado] = useState(leerPausa);
  const [enPantalla, setEnPantalla] = useState(false);
  const [visible, setVisible] = useState(true);
  const [candidata, setCandidata] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [bordes, setBordes] = useState({ inicio: true, fin: false });
  const seccion = useRef(null);
  const pista = useRef(null);
  const reloj = useRef(null);
  const fino = Boolean(consulta("(hover: hover) and (pointer: fine)")?.matches);
  const shorts = datos?.shorts ?? [];
  const hay = Boolean(datos?.canal && shorts.length);

  const programar = useCallback((indice, espera) => {
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setCandidata(indice), espera);
  }, []);
  useEffect(() => () => window.clearTimeout(reloj.current), []);

  // ¿Está la fila a la vista? ¿Y la pestaña?
  useEffect(() => {
    const el = seccion.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const ojo = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), { threshold: 0.55 });
    ojo.observe(el);
    const alCambiar = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", alCambiar);
    return () => {
      ojo.disconnect();
      document.removeEventListener("visibilitychange", alCambiar);
    };
  }, [hay]);

  // Hasta dónde se ha desplazado la fila (para las flechas) y, en el teléfono, cuál
  // quedó al centro cuando se detiene.
  useEffect(() => {
    const p = pista.current;
    if (!p) return undefined;
    let quieta = null;
    const medir = () => {
      const fin = p.scrollWidth - p.clientWidth;
      setBordes({ inicio: p.scrollLeft <= 4, fin: p.scrollLeft >= fin - 4 });
      if (fino) return;
      window.clearTimeout(quieta);
      quieta = window.setTimeout(() => {
        const centro = p.getBoundingClientRect().left + p.clientWidth / 2;
        let mejor = null;
        let distancia = Infinity;
        p.querySelectorAll(".se-calle__tarjeta").forEach((tarjeta, i) => {
          const r = tarjeta.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - centro);
          if (d < distancia) {
            distancia = d;
            mejor = i;
          }
        });
        programar(mejor, ESPERA_TACTIL);
      }, 160);
    };
    medir();
    p.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      window.clearTimeout(quieta);
      p.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [hay, fino, programar]);

  if (!hay) return null;

  const previa = puede && !pausado && enPantalla && visible && abierto === null ? candidata : null;

  const alternarPausa = () => {
    const nuevo = !pausado;
    setPausado(nuevo);
    try {
      if (nuevo) window.localStorage.setItem(SIN_PREVIAS, "no");
      else window.localStorage.removeItem(SIN_PREVIAS);
    } catch {
      /* sin almacenamiento, la pausa dura lo que dure la página */
    }
  };

  const mover = (sentido) => {
    const p = pista.current;
    if (p) p.scrollBy({ left: sentido * p.clientWidth * 0.85, behavior: "smooth" });
  };

  const abrir = (indice, tarjeta) => {
    const r = tarjeta.getBoundingClientRect();
    setAbierto({ indice, origen: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
  };

  return (
    <section className="se-section se-format se-calle" aria-labelledby="se-calle-titulo" ref={seccion}>
      <div className="se-container">
        <div className="se-format__head se-calle__cabeza">
          <h2 id="se-calle-titulo" className="se-heading-section se-format__title">
            {t("portada.calle.titulo")}
          </h2>
          <div className="se-calle__mandos">
            {puede ? (
              <button type="button" className="se-calle__pausa" aria-pressed={pausado} onClick={alternarPausa}>
                <IconoPausa pausado={pausado} />
                {pausado ? t("portada.calle.reanudar") : t("portada.calle.pausar")}
              </button>
            ) : null}
            <button type="button" className="se-calle__flecha" onClick={() => mover(-1)} disabled={bordes.inicio}
              aria-label={t("portada.calle.anteriores")}>
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" className="se-calle__flecha" onClick={() => mover(1)} disabled={bordes.fin}
              aria-label={t("portada.calle.siguientes")}>
              <span aria-hidden="true">→</span>
            </button>
            <a className="se-format__more" href={datos.canal.url} target="_blank" rel="noopener noreferrer">
              {t("portada.calle.verCanal")}
              <span className="se-sr-only"> {t("comun.nuevaPestana")}</span>
            </a>
          </div>
        </div>

        <ul className="se-calle__pista" ref={pista}>
          {shorts.map((v, i) => (
            <Tarjeta
              key={v.id}
              v={v}
              indice={i}
              previa={previa === i}
              onAbrir={abrir}
              onAsomar={(n) => programar(n, ESPERA_RATON)}
              onRetirar={(n) => {
                window.clearTimeout(reloj.current);
                setCandidata((actual) => (actual === n && fino ? null : actual));
              }}
              onAgotada={(n) => setCandidata((actual) => (actual === n ? null : actual))}
            />
          ))}
          <li className="se-calle__item se-calle__fin">
            <p className="se-calle__fin-titulo">{t("portada.calle.finTitulo")}</p>
            <p className="se-calle__fin-texto">{datos.canal.nombre}</p>
            <a className="se-calle__suscribir" href={datos.canal.suscribirse} target="_blank" rel="noopener noreferrer">
              {t("portada.calle.suscribirse")}
              <span className="se-sr-only"> {t("comun.nuevaPestana")}</span>
            </a>
          </li>
        </ul>
      </div>

      {abierto ? (
        <VisorDeShorts
          shorts={shorts}
          inicio={abierto.indice}
          canal={datos.canal}
          origen={abierto.origen}
          onCerrar={() => setAbierto(null)}
        />
      ) : null}
    </section>
  );
};

export default EnLaCalle;
