import PropTypes from "prop-types";
import { useRef } from "react";

import { focoDelTexto } from "../../lib/pieza";

/**
 * El encuadre de la foto de una pieza: qué punto queda a la vista cuando el sitio la
 * recorta. Se pulsa (o se arrastra) sobre la foto y, al lado, se ve cómo queda en cada
 * forma en que sale: la tarjeta del sitio, la de Al punto, las miniaturas y la tarjeta
 * que enseñan WhatsApp y las redes al compartir.
 *
 * Guarda «x,y» en por ciento, en pasos de 5 (ver `Post.imagen_foco` en el backend). Con
 * el teclado: flechas para moverlo, Inicio para volver al centro.
 */
const FORMAS = [
  { clave: "tarjeta", nombre: "Tarjeta del sitio", detalle: "portada, listados, apertura", ancho: 16, alto: 9 },
  { clave: "alpunto", nombre: "Al punto", detalle: "rejilla de entrevistas y podcast", ancho: 3, alto: 2 },
  { clave: "miniatura", nombre: "Miniatura", detalle: "«Siguiente lectura»", ancho: 4, alto: 3 },
  { clave: "redes", nombre: "Al compartir", detalle: "WhatsApp, X, Facebook", ancho: 1200, alto: 630 },
];

const paso5 = (n) => Math.max(0, Math.min(100, Math.round(n / 5) * 5));

export const EncuadreDeFoto = ({ url, valor, onChange, titulo }) => {
  const foto = useRef(null);
  const arrastrando = useRef(false);
  const [x, y] = focoDelTexto(valor) ?? [50, 50];
  const posicion = `${x}% ${y}%`;

  const fijar = (nx, ny) => {
    const fx = paso5(nx);
    const fy = paso5(ny);
    onChange(fx === 50 && fy === 50 ? "" : `${fx},${fy}`);
  };

  const desdePuntero = (e) => {
    const caja = foto.current?.getBoundingClientRect();
    if (!caja || !caja.width || !caja.height) return;
    fijar(((e.clientX - caja.left) / caja.width) * 100, ((e.clientY - caja.top) / caja.height) * 100);
  };

  const alPulsarTecla = (e) => {
    const mover = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
    if (mover) {
      e.preventDefault();
      fijar(x + mover[0], y + mover[1]);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange("");
    }
  };

  return (
    <div className="se-encuadre">
      <div className="se-encuadre__cabeza">
        <span className="se-form-label">Encuadre</span>
        <span className="se-admin-meta-hint">
          {valor ? `Punto elegido: ${x} % desde la izquierda, ${y} % desde arriba.` : "Al centro (como sale si no se toca)."}
        </span>
        {valor ? (
          <button type="button" className="se-encuadre__centrar" onClick={() => onChange("")}>
            Volver al centro
          </button>
        ) : null}
      </div>
      <p className="se-admin-meta-hint" style={{ marginTop: 0 }}>
        Pulse sobre lo que tiene que verse siempre (una cara, el rótulo, el producto). Las
        tarjetas recortan la foto alrededor de ese punto.
      </p>
      <div className="se-encuadre__cuerpo">
        <div
          className="se-encuadre__foto"
          ref={foto}
          role="slider"
          tabIndex={0}
          aria-label="Punto de la foto que queda a la vista"
          aria-valuetext={`${x} % desde la izquierda, ${y} % desde arriba`}
          aria-valuenow={x}
          aria-valuemin={0}
          aria-valuemax={100}
          onPointerDown={(e) => {
            arrastrando.current = true;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            desdePuntero(e);
          }}
          onPointerMove={(e) => arrastrando.current && desdePuntero(e)}
          onPointerUp={() => {
            arrastrando.current = false;
          }}
          onKeyDown={alPulsarTecla}
        >
          <img src={url} alt="" draggable={false} />
          <span className="se-encuadre__punto" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />
        </div>
        <ul className="se-encuadre__formas" aria-label="Cómo queda en cada sitio">
          {FORMAS.map((f) => (
            <li key={f.clave} className="se-encuadre__forma">
              <div className="se-encuadre__marco" style={{ aspectRatio: `${f.ancho} / ${f.alto}` }}>
                <img src={url} alt="" style={{ objectPosition: posicion }} />
                {f.clave === "redes" && titulo ? <span className="se-encuadre__titulo-redes">{titulo}</span> : null}
              </div>
              <span className="se-encuadre__nombre">{f.nombre}</span>
              <span className="se-encuadre__detalle">{f.detalle}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

EncuadreDeFoto.propTypes = {
  /** La foto: la dirección que pinta el sitio. */
  url: PropTypes.string.isRequired,
  /** «x,y» en por ciento, o vacío (el centro). */
  valor: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  /** El título de la pieza, para la tarjeta de redes. */
  titulo: PropTypes.string,
};

export default EncuadreDeFoto;
