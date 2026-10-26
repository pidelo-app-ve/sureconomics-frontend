import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha } from "../../i18n/motor";
import { avisarMedio, urlVisor, vistasCortas } from "../../lib/youtube";

/**
 * El visor de «En la calle»: un short a pantalla completa, con sonido, y los demás a un
 * gesto de distancia, como en las apps de video vertical.
 *
 * El molde es el visor de TikTok de «En redes» (`EnRedes.jsx`): foco dentro al abrir y
 * de vuelta a la tarjeta al cerrar, Escape cierra, Tab no se escapa, la página no se
 * mueve detrás. Lo propio de aquí:
 *
 * - **Siguiente y anterior** con ↑ ↓ (y Re Pág / Av Pág), con la rueda del ratón, con los
 *   botones de la cabecera y deslizando el dedo hacia arriba o hacia abajo. El deslizar
 *   cuenta por distancia (60 px) **o** por velocidad: un tirón rápido basta, sin tener
 *   que arrastrar hasta un punto. Sobre el video no se puede deslizar -- los toques
 *   dentro del reproductor son de YouTube --, así que el gesto vive en el resto de la
 *   pantalla: cabecera, pie y márgenes.
 * - **Nace de la tarjeta** que se tocó (`origen`), y al cambiar de video el nuevo entra
 *   desde el lado hacia el que se fue. Con «movimiento reducido», solo se funde.
 * - **Con sonido.** El toque en la tarjeta es el gesto que deja al navegador arrancarlo
 *   con sonido; si uno (Safari en iPhone) no lo deja, YouTube enseña su botón de play.
 */

const FOCALES = 'button:not([disabled]), [href], iframe, [tabindex]:not([tabindex="-1"])';
const DISTANCIA = 60;
const VELOCIDAD = 0.11;
const PAUSA_RUEDA = 650;
/** Por dónde entra el video nuevo: desde abajo si se avanzó, desde arriba si se volvió. */
const ENTRADA = { 1: " se-visor__marco--siguiente", [-1]: " se-visor__marco--anterior" };

const Flecha = ({ arriba }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <path d={arriba ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

Flecha.propTypes = { arriba: PropTypes.bool };

export const VisorDeShorts = ({ shorts, inicio, canal, origen, onCerrar }) => {
  const { t, lang } = useIdioma();
  const [indice, setIndice] = useState(inicio);
  const [sentido, setSentido] = useState(0);
  const [montado, setMontado] = useState(false);
  const superficie = useRef(null);
  const activoAntes = useRef(null);
  const gesto = useRef(null);
  const deslizo = useRef(false);
  const ultimaRueda = useRef(0);
  const total = shorts.length;
  const v = shorts[indice];
  const tactil = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

  const ir = useCallback(
    (paso) => {
      setIndice((actual) => {
        const nuevo = Math.min(total - 1, Math.max(0, actual + paso));
        if (nuevo !== actual) setSentido(paso);
        return nuevo;
      });
    },
    [total]
  );

  // Foco dentro al abrir, la página quieta detrás, y el foco de vuelta al cerrar.
  useEffect(() => {
    avisarMedio("visor-shorts");
    activoAntes.current = document.activeElement;
    document.body.style.overflow = "hidden";
    const cuadro = requestAnimationFrame(() => {
      setMontado(true);
      superficie.current?.focus?.();
    });
    return () => {
      cancelAnimationFrame(cuadro);
      document.body.style.overflow = "";
      const el = activoAntes.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, []);

  useEffect(() => {
    const alTeclado = (e) => {
      if (e.key === "Escape") {
        onCerrar();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        ir(1);
        return;
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        ir(-1);
        return;
      }
      if (e.key !== "Tab") return;
      const raiz = superficie.current;
      const focales = raiz ? Array.from(raiz.querySelectorAll(FOCALES)) : [];
      if (!focales.length) return;
      const primero = focales[0];
      const ultimo = focales[focales.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === raiz)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", alTeclado);
    return () => document.removeEventListener("keydown", alTeclado);
  }, [ir, onCerrar]);

  const alBajar = (e) => {
    if (gesto.current || !e.isPrimary) return;
    gesto.current = { y: e.clientY, x: e.clientX, t: performance.now() };
    deslizo.current = false;
  };
  const alSoltar = (e) => {
    const g = gesto.current;
    gesto.current = null;
    if (!g) return;
    const dy = e.clientY - g.y;
    const dx = e.clientX - g.x;
    const rapidez = Math.abs(dy) / Math.max(1, performance.now() - g.t);
    if (Math.abs(dy) > Math.abs(dx) && (Math.abs(dy) >= DISTANCIA || (Math.abs(dy) > 16 && rapidez > VELOCIDAD))) {
      deslizo.current = true;
      ir(dy < 0 ? 1 : -1);
    }
  };
  const alRodar = (e) => {
    if (Math.abs(e.deltaY) < 12) return;
    const ahora = performance.now();
    if (ahora - ultimaRueda.current < PAUSA_RUEDA) return;
    ultimaRueda.current = ahora;
    ir(e.deltaY > 0 ? 1 : -1);
  };
  // Un deslizar sobre el fondo no debe contar como clic de «cerrar».
  const alFondo = () => {
    if (deslizo.current) {
      deslizo.current = false;
      return;
    }
    onCerrar();
  };

  const tituloId = "se-visor-titulo";
  const meta = [
    v.publicado ? formatearFecha(v.publicado, "diaMes", lang) : null,
    v.vistas != null ? t("portada.calle.vistas", { n: vistasCortas(v.vistas, lang) }) : null,
  ].filter(Boolean);

  return (
    <div
      className="se-visor"
      role="presentation"
      onPointerDown={alBajar}
      onPointerUp={alSoltar}
      onPointerCancel={() => {
        gesto.current = null;
      }}
      onWheel={alRodar}
    >
      <div className="se-visor__fondo" aria-hidden="true" onClick={alFondo} />
      <div
        className="se-visor__escena"
        data-montado={montado ? "si" : "no"}
        style={origen ? { transformOrigin: `${origen.x}px ${origen.y}px` } : undefined}
      >
        <div
          className="se-visor__superficie"
          role="dialog"
          aria-modal="true"
          aria-labelledby={tituloId}
          ref={superficie}
          tabIndex={-1}
        >
          <header className="se-visor__cabeza">
            <p className="se-visor__cuenta">{t("portada.calle.visor.cuenta", { n: indice + 1, total })}</p>
            <div className="se-visor__mandos">
              <button type="button" className="se-visor__boton" onClick={() => ir(-1)} disabled={indice === 0}
                aria-label={t("portada.calle.visor.anterior")}>
                <Flecha arriba />
              </button>
              <button type="button" className="se-visor__boton" onClick={() => ir(1)} disabled={indice === total - 1}
                aria-label={t("portada.calle.visor.siguiente")}>
                <Flecha />
              </button>
              <button type="button" className="se-visor__boton" onClick={onCerrar} aria-label={t("comun.cerrar")}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </header>

          <div key={v.id} className={`se-visor__marco${ENTRADA[sentido] ?? ""}`}>
            <iframe
              src={urlVisor(v.id)}
              title={t("portada.calle.visor.video", { titulo: v.titulo })}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          <footer className="se-visor__pie">
            <p id={tituloId} className="se-visor__titulo" aria-live="polite">
              {v.titulo}
            </p>
            {meta.length ? <p className="se-visor__meta">{meta.join(" · ")}</p> : null}
            <div className="se-visor__acciones">
              {canal?.suscribirse ? (
                <a className="se-visor__suscribir" href={canal.suscribirse} target="_blank" rel="noopener noreferrer">
                  {t("portada.calle.suscribirse")}
                  <span className="se-sr-only"> {t("comun.nuevaPestana")}</span>
                </a>
              ) : null}
              <a className="se-visor__youtube" href={v.enlace} target="_blank" rel="noopener noreferrer">
                {t("portada.calle.visor.verEnYoutube")}
                <span aria-hidden="true">↗</span>
                <span className="se-sr-only"> {t("comun.nuevaPestana")}</span>
              </a>
            </div>
            {tactil && total > 1 ? <p className="se-visor__ayuda">{t("portada.calle.visor.ayuda")}</p> : null}
          </footer>
        </div>
      </div>
    </div>
  );
};

VisorDeShorts.propTypes = {
  shorts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      titulo: PropTypes.string,
      enlace: PropTypes.string.isRequired,
      publicado: PropTypes.string,
      vistas: PropTypes.number,
    })
  ).isRequired,
  inicio: PropTypes.number.isRequired,
  canal: PropTypes.shape({ suscribirse: PropTypes.string }),
  /** El centro de la tarjeta que se tocó, en píxeles de la ventana: de ahí nace. */
  origen: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  onCerrar: PropTypes.func.isRequired,
};
