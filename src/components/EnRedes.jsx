import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { SOCIAL } from "../data/surEconomicsMock";
import { getRedes } from "../services/publicContentService";
import { IconReproducir } from "./icons/social";

/**
 * «En redes»: lo último que publicó el medio, al pie de todas las vistas.
 *
 * Una línea por red -- Instagram, X y TikTok, en ese orden --, cada una con su
 * rótulo y su cuenta, y las tarjetas se desplazan a lo ancho. Vive en `Layout.jsx`
 * justo encima del pie, que ya sale en todas las vistas: así aparece en todas sin
 * tocar la maqueta de ninguna. Cuando la redacción no ha curado nada, no pinta
 * nada -- igual que la cinta de mercado.
 *
 * **Lo que se mueve, y por qué.** Dos tipos, y ninguno arranca solo:
 *
 *  1. Entrada, una vez, cuando el bloque se asoma: la raya superior se dibuja de
 *     izquierda a derecha, los rótulos entran, y las tarjetas suben escalonadas con
 *     un rebote mínimo. Es coreografía: le dice al ojo en qué orden leer.
 *  2. Respuesta al lector: la foto se acerca despacio y sube su pie; la tarjeta de X
 *     saca una raya roja por el borde. Debajo de cada fila, una línea de un píxel
 *     marca por dónde va el desplazamiento. Se arrastra con el ratón y se mueve con
 *     las flechas.
 *
 * Lo que NO hay: carrusel automático ni nada que gire mientras alguien lee. Con
 * «movimiento reducido» en el sistema todo queda quieto (`blog.css`).
 *
 * **De dónde salen los datos.** De `/social`, curado por la redacción desde el panel.
 * No de las APIs: la de X que lee cronologías es de pago, el widget gratuito se probó
 * y pinta cero píxeles, la de Instagram pide un token que no puede vivir en el
 * navegador, y el oEmbed público de TikTok sólo describe un video que ya se conoce --
 * no sirve para automatizar nada, y de todas formas carga su propio script. El
 * detalle largo está en `redes_service.py` del backend.
 *
 * **El video de TikTok sí se reproduce aquí, en grande, sin ese script.** Al pulsar
 * una tarjeta se abre un cuadro con el video puesto -- ver `VideoTikTok` más abajo.
 */

const CUENTA = Object.fromEntries(SOCIAL.map((s) => [s.id, s]));
const NOMBRE = { instagram: "Instagram", x: "X", tiktok: "TikTok" };

/** Qué redes se pintan como tarjeta de imagen (foto o fotograma) en vez de texto. */
const REDES_CON_IMAGEN = new Set(["instagram", "tiktok"]);

/** Los que hay que dejar pasar tal cual: el lector quiere una pestaña nueva, no
 *  nuestro cuadro -- clic central, Ctrl/Cmd, Mayús o Alt son los gestos de siempre
 *  para "ábrelo aparte", y quitárselos sería peor que no interceptar nada. */
const esClicSencillo = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** El identificador numérico dentro de un enlace de TikTok, o nada si no lo trae. */
const idDeVideoTikTok = (enlace) => {
  const m = /\/video\/(\d+)/.exec(enlace || "");
  return m ? m[1] : null;
};

const enElemento = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * El video de una publicación de TikTok, grande y reproduciéndose, sin salir del
 * sitio.
 *
 * **El mismo truco que ya usa la pieza para YouTube y Vimeo.** En vez de cargar el
 * *widget* de TikTok -- un `<script>` que se mete en la página, que ya se probó y se
 * descartó para X, y que contradice lo que `Cookies.jsx` le promete al lector --, se
 * construye directamente la dirección de su reproductor
 * (`tiktok.com/embed/v2/<id>`), que es a donde ese script termina llevando de todas
 * formas. El contenido ajeno queda encerrado en su `<iframe>`; nada de TikTok corre
 * en esta página.
 *
 * Esa dirección no es un contrato publicado como el oEmbed -- es donde su propio
 * `embed.js` resuelve el video, no algo que TikTok documente --, así que puede
 * cambiar de forma sin aviso. Por eso el enlace real a TikTok sigue debajo: si el
 * marco no carga, queda una salida.
 */
const VideoTikTok = ({ pieza, onCerrar }) => {
  const id = idDeVideoTikTok(pieza.enlace);
  const superficie = useRef(null);
  const activoAntes = useRef(null);
  const tituloId = "se-redes-video-titulo";

  // Foco dentro al abrir, y de vuelta a la tarjeta que lo abrió al cerrar -- quien
  // navega con teclado no puede perder el sitio en el que estaba.
  useEffect(() => {
    activoAntes.current = document.activeElement;
    const t = window.setTimeout(() => superficie.current?.focus?.(), 0);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
      const el = activoAntes.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, []);

  // Escape cierra; Tab no se escapa del cuadro mientras está abierto.
  useEffect(() => {
    const alTeclado = (e) => {
      if (e.key === "Escape") {
        onCerrar();
        return;
      }
      if (e.key !== "Tab") return;
      const raiz = superficie.current;
      if (!raiz) return;
      const focales = Array.from(raiz.querySelectorAll(enElemento));
      if (!focales.length) return;
      const primero = focales[0];
      const ultimo = focales[focales.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === primero || document.activeElement === raiz) {
          e.preventDefault();
          ultimo.focus();
        }
        return;
      }
      if (document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", alTeclado);
    return () => document.removeEventListener("keydown", alTeclado);
  }, [onCerrar]);

  return (
    <div className="se-redes-video" role="presentation">
      <div
        className="se-redes-video__fondo"
        role="button"
        tabIndex={0}
        aria-label="Cerrar"
        onClick={onCerrar}
        onKeyDown={(e) => e.key === "Enter" && onCerrar()}
      />
      <div
        className="se-redes-video__superficie"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        ref={superficie}
        tabIndex={-1}
      >
        <button type="button" className="se-redes-video__cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>
        <div className="se-redes-video__marco">
          {id ? (
            <iframe
              className="se-redes-video__frame"
              src={`https://www.tiktok.com/embed/v2/${id}`}
              title={`Video de TikTok: ${(pieza.texto || "").slice(0, 90)}`}
              allow="autoplay; encrypted-media; fullscreen; clipboard-write"
              allowFullScreen
            />
          ) : (
            <p className="se-redes-video__nota">No se pudo abrir este video aquí.</p>
          )}
        </div>
        <p id={tituloId} className="se-redes-video__pie">
          {pieza.texto}{" "}
          <a href={pieza.enlace} target="_blank" rel="noreferrer noopener">
            Ver en TikTok<span aria-hidden="true"> ↗</span>
          </a>
        </p>
      </div>
    </div>
  );
};

VideoTikTok.propTypes = {
  pieza: PropTypes.shape({
    enlace: PropTypes.string.isRequired,
    texto: PropTypes.string,
  }).isRequired,
  onCerrar: PropTypes.func.isRequired,
};

/** Fecha relativa y corta: lo que cabe en una tarjeta. */
const fechaCorta = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dias = Math.round((Date.now() - d) / 86400000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
};

/** El escalonado de la entrada: 55 ms entre tarjetas, con techo. */
const retardo = (i) => `${Math.min(i, 6) * 55}ms`;

/**
 * Una fila: rótulo, pista y línea de progreso. Toda la interacción vive aquí.
 */
const Fila = ({ red, piezas, onAbrirVideo }) => {
  const cuenta = CUENTA[red];
  const fila = useRef(null);
  const pista = useRef(null);
  const barra = useRef(null);
  const [dentro, setDentro] = useState(false);
  const [conSobra, setConSobra] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  // Entrada al asomarse, una sola vez.
  useEffect(() => {
    const el = fila.current;
    if (!el) return undefined;
    if (!("IntersectionObserver" in window)) {
      setDentro(true);
      return undefined;
    }
    const ojo = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setDentro(true);
          ojo.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    ojo.observe(el);
    return () => ojo.disconnect();
  }, []);

  // La línea de progreso: se llena según se avanza; se esconde si la fila cabe.
  useEffect(() => {
    const p = pista.current;
    const b = barra.current;
    if (!p || !b) return undefined;
    const medir = () => {
      const sobra = p.scrollWidth - p.clientWidth;
      setConSobra(sobra > 4);
      if (sobra > 0) {
        b.style.transform = `scaleX(${(p.scrollLeft + p.clientWidth) / p.scrollWidth})`;
      }
    };
    p.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    const imagenes = Array.from(p.querySelectorAll("img"));
    imagenes.forEach((img) => img.addEventListener("load", medir));
    const cuadro = requestAnimationFrame(medir);
    return () => {
      cancelAnimationFrame(cuadro);
      p.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
      imagenes.forEach((img) => img.removeEventListener("load", medir));
    };
  }, [piezas]);

  // Arrastrar con el ratón. Un clic sin arrastre sigue abriendo el enlace; uno con
  // arrastre no -- si no, soltar tras mover abriría una pestaña.
  const inicio = useRef(null);
  const alBajar = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    inicio.current = { x: e.clientX, scroll: pista.current.scrollLeft, movio: false };
  };
  const alMover = (e) => {
    const s = inicio.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (!s.movio && Math.abs(dx) > 5) {
      s.movio = true;
      setArrastrando(true);
    }
    if (s.movio) pista.current.scrollLeft = s.scroll - dx;
  };
  const alSoltar = () => {
    if (!inicio.current) return;
    inicio.current = null;
    // En el siguiente cuadro, para que el clic que cierra el arrastre no llegue al
    // enlace que quedó debajo.
    requestAnimationFrame(() => setArrastrando(false));
  };

  const alTeclado = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const primera = pista.current.querySelector(".se-redes__pieza");
    const paso = (primera ? primera.getBoundingClientRect().width : 200) + 11;
    pista.current.scrollBy({ left: e.key === "ArrowRight" ? paso : -paso, behavior: "smooth" });
  };

  const esFoto = REDES_CON_IMAGEN.has(red);
  const esVideo = red === "tiktok";

  return (
    <section
      ref={fila}
      className={`se-redes__fila${dentro ? " se-redes__fila--dentro" : ""}`}
      aria-labelledby={`se-redes-${red}`}
    >
      <header className="se-redes__cabeza">
        <span className="se-redes__marca" aria-hidden="true" />
        <h3 className="se-redes__nombre" id={`se-redes-${red}`}>{NOMBRE[red]}</h3>
        <a className="se-redes__cuenta" href={cuenta.url} target="_blank" rel="noreferrer">
          {cuenta.handle}
        </a>
      </header>

      <div
        ref={pista}
        className={`se-redes__pista${arrastrando ? " se-redes__pista--arrastrando" : ""}`}
        role="list"
        tabIndex={0}
        aria-label={`Publicaciones en ${NOMBRE[red]}. Use las flechas para desplazarse.`}
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerLeave={alSoltar}
        onPointerCancel={alSoltar}
        onKeyDown={alTeclado}
      >
        {piezas.map((p, i) =>
          esFoto ? (
            <a
              key={`${p.enlace}-${i}`}
              className={`se-redes__pieza se-redes__pieza--foto${esVideo ? " se-redes__pieza--video" : ""}`}
              role="listitem"
              style={{ "--d": retardo(i) }}
              href={p.enlace}
              target="_blank"
              rel="noreferrer"
              draggable="false"
              aria-label={
                esVideo
                  ? `Ver el video de TikTok: ${(p.texto || "").slice(0, 90)}`
                  : `Publicación en ${NOMBRE[red]}: ${(p.texto || "").slice(0, 90)}`
              }
              onClick={
                esVideo
                  ? (e) => {
                      // Clic sencillo: se abre aquí mismo, en grande. Clic central,
                      // Ctrl/Cmd, Mayús o Alt: se deja seguir a TikTok en pestaña
                      // nueva, que es lo que ese gesto siempre ha significado.
                      if (!esClicSencillo(e)) return;
                      e.preventDefault();
                      onAbrirVideo(p);
                    }
                  : undefined
              }
            >
              {/* `alt` vacío: el pie de foto va dentro del mismo enlace, y
                  describirla otra vez haría que un lector de pantalla lo dijera
                  dos veces. */}
              <img src={p.url} alt="" loading="lazy" decoding="async" draggable="false" />
              {esVideo ? <IconReproducir className="se-redes__reproducir" /> : null}
              <span className="se-redes__pie">{p.texto}</span>
            </a>
          ) : (
            <a
              key={`${p.enlace}-${i}`}
              className="se-redes__pieza se-redes__pieza--texto"
              role="listitem"
              style={{ "--d": retardo(i) }}
              href={p.enlace}
              target="_blank"
              rel="noreferrer"
              draggable="false"
              aria-label="Publicación en X"
            >
              <p>{p.texto}</p>
              <span className="se-redes__fecha">{fechaCorta(p.fecha)}</span>
            </a>
          )
        )}
      </div>

      <div
        className={`se-redes__progreso${conSobra ? " se-redes__progreso--activo" : ""}`}
        aria-hidden="true"
      >
        <i ref={barra} />
      </div>
    </section>
  );
};

Fila.propTypes = {
  red: PropTypes.oneOf(["instagram", "x", "tiktok"]).isRequired,
  piezas: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string,
      texto: PropTypes.string,
      enlace: PropTypes.string.isRequired,
      fecha: PropTypes.string,
    })
  ).isRequired,
  /** Sólo la hace falta TikTok: qué hacer al pulsar una tarjeta. */
  onAbrirVideo: PropTypes.func,
};

export const EnRedes = () => {
  const bloque = useRef(null);
  const [datos, setDatos] = useState(null);
  const [dentro, setDentro] = useState(false);
  const [videoAbierto, setVideoAbierto] = useState(null);

  useEffect(() => {
    let vivo = true;
    getRedes().then((d) => {
      if (vivo) setDatos(d);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // La raya superior y el rótulo entran cuando el bloque se asoma.
  useEffect(() => {
    const el = bloque.current;
    if (!el) return undefined;
    if (!("IntersectionObserver" in window)) {
      setDentro(true);
      return undefined;
    }
    const ojo = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setDentro(true);
          ojo.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    ojo.observe(el);
    return () => ojo.disconnect();
  }, [datos]);

  // Nada hasta que llegan los datos, y nada si no hay nada curado. No hay
  // esqueletos a propósito: el bloque vive bajo el pliegue, y un esqueleto que
  // aparece y se va porque no había nada sería un parpadeo en cada página.
  if (!datos) return null;
  const instagram = datos.instagram || [];
  const x = datos.x || [];
  const tiktok = datos.tiktok || [];
  if (!instagram.length && !x.length && !tiktok.length) return null;

  return (
    <>
      <section
        ref={bloque}
        className={`se-redes${dentro ? " se-redes--dentro" : ""}`}
        aria-labelledby="se-redes-rotulo"
      >
        <div className="se-container">
          <h2 className="se-redes__rotulo" id="se-redes-rotulo">En redes</h2>
          {instagram.length ? <Fila red="instagram" piezas={instagram} /> : null}
          {x.length ? <Fila red="x" piezas={x} /> : null}
          {tiktok.length ? (
            <Fila red="tiktok" piezas={tiktok} onAbrirVideo={setVideoAbierto} />
          ) : null}
        </div>
      </section>

      {/* Fuera de la sección a propósito: es una capa fija sobre toda la pantalla,
          no algo que viva dentro del ancho de "En redes". */}
      {videoAbierto ? (
        <VideoTikTok pieza={videoAbierto} onCerrar={() => setVideoAbierto(null)} />
      ) : null}
    </>
  );
};
