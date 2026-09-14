import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { SOCIAL } from "../data/surEconomicsMock";
import { getRedes } from "../services/publicContentService";

/**
 * «En redes»: lo último que publicó el medio, al pie de todas las vistas.
 *
 * Una línea por red -- Instagram arriba, X debajo --, cada una con su rótulo y su
 * cuenta, y las tarjetas se desplazan a lo ancho. Vive en `Layout.jsx` justo encima
 * del pie, que ya sale en todas las vistas: así aparece en todas sin tocar la
 * maqueta de ninguna. Cuando la redacción no ha curado nada, no pinta nada -- igual
 * que la cinta de mercado.
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
 * y pinta cero píxeles, y la de Instagram pide un token que no puede vivir en el
 * navegador. El detalle largo está en `redes_service.py` del backend.
 */

const CUENTA = Object.fromEntries(SOCIAL.map((s) => [s.id, s]));
const NOMBRE = { instagram: "Instagram", x: "X" };

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
const Fila = ({ red, piezas }) => {
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

  const esFoto = red === "instagram";

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
              className="se-redes__pieza se-redes__pieza--foto"
              role="listitem"
              style={{ "--d": retardo(i) }}
              href={p.enlace}
              target="_blank"
              rel="noreferrer"
              draggable="false"
              aria-label={`Publicación en Instagram: ${(p.texto || "").slice(0, 90)}`}
            >
              {/* `alt` vacío: el pie de foto va dentro del mismo enlace, y
                  describirla otra vez haría que un lector de pantalla lo dijera
                  dos veces. */}
              <img src={p.url} alt="" loading="lazy" decoding="async" draggable="false" />
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
  red: PropTypes.oneOf(["instagram", "x"]).isRequired,
  piezas: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string,
      texto: PropTypes.string,
      enlace: PropTypes.string.isRequired,
      fecha: PropTypes.string,
    })
  ).isRequired,
};

export const EnRedes = () => {
  const bloque = useRef(null);
  const [datos, setDatos] = useState(null);
  const [dentro, setDentro] = useState(false);

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
  if (!instagram.length && !x.length) return null;

  return (
    <section
      ref={bloque}
      className={`se-redes${dentro ? " se-redes--dentro" : ""}`}
      aria-labelledby="se-redes-rotulo"
    >
      <div className="se-container">
        <h2 className="se-redes__rotulo" id="se-redes-rotulo">En redes</h2>
        {instagram.length ? <Fila red="instagram" piezas={instagram} /> : null}
        {x.length ? <Fila red="x" piezas={x} /> : null}
      </div>
    </section>
  );
};
