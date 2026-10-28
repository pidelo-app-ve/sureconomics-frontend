import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useCanal } from "../../hooks/useCanal";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha } from "../../i18n/motor";
import { EVENTO_MEDIO, avisarMedio, duracionReloj, pausar, urlReproductor, vistasCortas } from "../../lib/youtube";
import { IconoPlay } from "./VistaPrevia";
import "./nuestroCanal.css";

/**
 * «Nuestro canal»: el último video largo del canal de YouTube de la casa, en la primera
 * plana, con los anteriores a un lado (flechas y puntos; en el teléfono, deslizando).
 *
 * **No arranca solo.** Se pulsa y suena, con sonido: es un video entero, no un asomo, y
 * lo pide quien lo pulsa (por eso no espera al «sí» de las cookies, igual que el video
 * de una entrevista).
 *
 * **Si se baja mientras suena, se despega.** El reproductor sale a una esquina y sigue
 * sonando; al volver arriba, regresa a su sitio. Es el mismo `iframe` -- solo cambia su
 * posición, así que no se recarga ni vuelve a empezar --. Desde la esquina: «Volver» lo
 * trae, la ✕ lo cierra, y un tirón (hacia un lado o hacia abajo) también lo cierra: cuenta
 * la distancia o la velocidad, no hay que arrastrarlo hasta un punto.
 *
 * **Un video a la vez.** Si se abre el visor de «En la calle», este se pausa.
 */

const QUIEN = "nuestro-canal";
const DISTANCIA = 80;
const VELOCIDAD = 0.11;

const Reproductor = ({ v, onCerrar }) => {
  const { t } = useIdioma();
  const hueco = useRef(null);
  const caja = useRef(null);
  const marco = useRef(null);
  const gesto = useRef(null);
  const [flota, setFlota] = useState(false);

  // Arranca: los demás se callan; si arranca otro, este se pausa.
  useEffect(() => {
    avisarMedio(QUIEN);
    const alOtro = (e) => {
      if (e.detail !== QUIEN) pausar(marco.current);
    };
    window.addEventListener(EVENTO_MEDIO, alOtro);
    return () => window.removeEventListener(EVENTO_MEDIO, alOtro);
  }, []);

  // Fuera de la vista (por arriba o por un lado, no por debajo): a la esquina.
  useEffect(() => {
    const el = hueco.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const ojo = new IntersectionObserver(
      ([e]) => setFlota(!e.isIntersecting && e.boundingClientRect.top < window.innerHeight),
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" }
    );
    ojo.observe(el);
    return () => ojo.disconnect();
  }, []);

  const volver = () => {
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    hueco.current?.scrollIntoView({ block: "center", behavior: quieto ? "auto" : "smooth" });
  };

  // El tirón para cerrar, desde la barra de la esquina (sobre el video manda YouTube).
  const alBajar = (e) => {
    if (gesto.current || !e.isPrimary || e.target.closest("button")) return;
    gesto.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const alMover = (e) => {
    const g = gesto.current;
    if (!g || !caja.current) return;
    const dx = Math.max(0, e.clientX - g.x);
    const dy = Math.max(0, e.clientY - g.y);
    caja.current.style.transform = `translate(${dx}px, ${dy}px)`;
    caja.current.style.opacity = String(Math.max(0.35, 1 - Math.hypot(dx, dy) / 260));
  };
  const alSoltar = (e) => {
    const g = gesto.current;
    gesto.current = null;
    if (!g || !caja.current) return;
    const dx = Math.max(0, e.clientX - g.x);
    const dy = Math.max(0, e.clientY - g.y);
    const d = Math.hypot(dx, dy);
    if (d >= DISTANCIA || (d > 16 && d / Math.max(1, performance.now() - g.t) > VELOCIDAD)) {
      onCerrar();
      return;
    }
    caja.current.style.transform = "";
    caja.current.style.opacity = "";
  };

  return (
    <div className="se-canal__hueco" ref={hueco}>
      <div ref={caja} className={`se-canal__caja${flota ? " is-flotante" : ""}`}>
        <iframe
          ref={marco}
          src={urlReproductor(v.id)}
          title={t("portada.canal.video", { titulo: v.titulo })}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {flota ? (
          <div
            className="se-canal__barra"
            onPointerDown={alBajar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
          >
            <span className="se-canal__barra-titulo">{v.titulo}</span>
            <button type="button" className="se-canal__barra-boton" onClick={volver} aria-label={t("portada.canal.volver")}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="se-canal__barra-boton" onClick={onCerrar} aria-label={t("comun.cerrar")}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

Reproductor.propTypes = {
  v: PropTypes.shape({ id: PropTypes.string.isRequired, titulo: PropTypes.string }).isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export const NuestroCanal = () => {
  const { t, lang } = useIdioma();
  const datos = useCanal();
  const pista = useRef(null);
  const [visible, setVisible] = useState(0);
  const [sonando, setSonando] = useState(null);
  const largos = datos?.largos ?? [];

  // Cuál se ve: el que ocupa el sitio al detenerse la pista.
  useEffect(() => {
    const p = pista.current;
    if (!p) return undefined;
    const medir = () => {
      const ancho = p.firstElementChild?.getBoundingClientRect().width || p.clientWidth;
      setVisible(Math.max(0, Math.min(largos.length - 1, Math.round(p.scrollLeft / ancho))));
    };
    p.addEventListener("scroll", medir, { passive: true });
    return () => p.removeEventListener("scroll", medir);
  }, [largos.length]);

  if (!datos?.canal || !largos.length) return null;

  const ir = (i) => {
    const p = pista.current;
    const item = p?.children[i];
    if (!item) return;
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    p.scrollTo({ left: item.offsetLeft, behavior: quieto ? "auto" : "smooth" });
  };

  return (
    <section className="se-plana__bloque se-plana__canal se-canal" aria-labelledby="plana-canal">
      <h2 id="plana-canal" className="se-plana__cabeza se-canal__cabeza">
        <a href={datos.canal.url} target="_blank" rel="noopener noreferrer">
          {t("portada.canal.titulo")}
          <span className="se-sr-only"> {t("comun.nuevaPestana")}</span>
        </a>
      </h2>

      <ul className="se-canal__pista" ref={pista}>
        {largos.map((v, i) => {
          const dura = duracionReloj(v.duracion);
          const meta = [
            v.publicado ? formatearFecha(v.publicado, "diaMes", lang) : null,
            v.vistas != null ? t("portada.calle.vistas", { n: vistasCortas(v.vistas, lang) }) : null,
          ].filter(Boolean);
          return (
            <li key={v.id} className={`se-canal__item${v.tipo === "short" ? " se-canal__item--vertical" : ""}`} aria-hidden={i !== visible && sonando !== i ? "true" : undefined}>
              {sonando === i ? (
                <Reproductor v={v} onCerrar={() => setSonando(null)} />
              ) : (
                <button
                  type="button"
                  className="se-canal__portada"
                  tabIndex={i === visible ? 0 : -1}
                  onClick={() => setSonando(i)}
                  aria-label={dura ? t("portada.canal.reproducirConDuracion", { titulo: v.titulo, duracion: dura }) : t("portada.canal.reproducir", { titulo: v.titulo })}
                >
                  {v.tipo === "short" ? (
                    <img src={v.portada} alt="" width="360" height="640" loading="lazy" decoding="async" />
                  ) : (
                    <img src={v.portada} alt="" width="640" height="360" loading="lazy" decoding="async" />
                  )}
                  <span className="se-canal__play">
                    <IconoPlay tamano={22} />
                    {dura}
                  </span>
                </button>
              )}
              <p className="se-canal__titulo">{v.titulo}</p>
              {meta.length ? <p className="se-canal__meta">{meta.join(" · ")}</p> : null}
            </li>
          );
        })}
      </ul>

      {largos.length > 1 ? (
        <div className="se-canal__mando">
          <ol className="se-canal__puntos" aria-hidden="true">
            {largos.map((v, i) => (
              <li key={v.id} className={i === visible ? "is-actual" : undefined} />
            ))}
          </ol>
          <button type="button" className="se-canal__flecha" onClick={() => ir(visible - 1)} disabled={visible === 0}
            aria-label={t("portada.canal.anterior")}>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" className="se-canal__flecha" onClick={() => ir(visible + 1)} disabled={visible === largos.length - 1}
            aria-label={t("portada.canal.siguiente")}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default NuestroCanal;
