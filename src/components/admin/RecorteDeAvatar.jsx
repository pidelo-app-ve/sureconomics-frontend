import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { buscarCara } from "../../lib/deteccionDeCaras";

/**
 * Encuadrar una foto dentro del círculo, antes de subirla.
 *
 * **Por qué existe.** Las fotos que manda la gente son de cuerpo entero o de tres
 * cuartos. Un recorte cuadrado automático se queda con el torso y la cara acaba
 * midiendo diez píxeles dentro de un círculo de sesenta: por muy buena que sea la
 * foto, se ve mal, y no hay compresión ni tamaño que lo arregle porque el problema
 * es el encuadre. Esto deja elegirlo.
 *
 * **Y de paso arregla lo otro.** Lo que se sube ya no es el archivo original sino el
 * recorte, un cuadrado de {@link LADO_SALIDA} px. Una foto de 133 megapíxeles --
 * que es lo que traía una de las del equipo, y lo que el servidor rechazaba como
 * bomba de descompresión -- sale de aquí convertida en unos 40 KB. El límite deja
 * de importar porque el archivo gigante nunca viaja.
 *
 * **La decodificación va con `createImageBitmap` y no con un `<img>`.** Con la
 * opción de reescalado, el navegador decodifica y reduce de una vez, sin tener el
 * mapa de bits entero en memoria: medido, esos 133 megapíxeles tardan 1,6 s por
 * este camino, y por el otro son 500 MB de RAM y un riesgo real de tumbar la
 * pestaña.
 */

/** El lado del cuadrado que se sube. */
const LADO_SALIDA = 512;

/**
 * El lado corto al que se reduce al decodificar.
 *
 * Holgado respecto a los 512 de salida para que acercarse siga teniendo detalle
 * que mostrar, y lo bastante chico para que una foto enorme no cueste memoria.
 */
const LADO_TRABAJO = 1400;

/** Cuánto se puede acercar. Más allá de esto ya se ven los píxeles de casi todo. */
const ZOOM_MAX = 4;

/** El círculo de la vista previa, en píxeles CSS. */
const VISTA = 260;

const sujetar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));

export const RecorteDeAvatar = ({ archivo, nombre, onCancelar, onListo }) => {
  const lienzo = useRef(null);
  const bitmap = useRef(null);
  const arrastre = useRef(null);
  // Donde esta la cara, si se encontro. Nulo = se encuadra al centro.
  const rostro = useRef(null);

  const [estado, setEstado] = useState({ status: "cargando", error: "" });
  const [zoom, setZoom] = useState(1);
  const [desvio, setDesvio] = useState({ x: 0, y: 0 });
  const [exportando, setExportando] = useState(false);

  // —— Decodificar ——
  useEffect(() => {
    let vivo = true;
    let bmp = null;

    (async () => {
      try {
        // Se reduce por el lado corto: así el resultado siempre tiene al menos
        // LADO_TRABAJO por el lado que manda en un recorte cuadrado.
        const medidas = await createImageBitmap(archivo);
        const corto = Math.min(medidas.width, medidas.height);
        const factor = corto > LADO_TRABAJO ? LADO_TRABAJO / corto : 1;
        if (factor < 1) {
          bmp = await createImageBitmap(archivo, {
            resizeWidth: Math.round(medidas.width * factor),
            resizeQuality: "high",
          });
          medidas.close();
        } else {
          bmp = medidas;
        }
        if (!vivo) {
          bmp.close();
          return;
        }
        bitmap.current = bmp;

        // La cara, si se encuentra: con eso el recuadro abre ya encuadrado en vez
        // de centrado en el torso. Es una sugerencia -- lo que salga se puede
        // mover y acercar igual.
        const cara = await buscarCara(bmp);
        if (!vivo) {
          bmp.close();
          return;
        }
        rostro.current = cara;
        setEstado({ status: "listo", error: "" });
      } catch (err) {
        if (vivo) {
          setEstado({
            status: "error",
            error:
              err?.name === "InvalidStateError" || err?.name === "TypeError"
                ? "No se pudo leer esa imagen. ¿Es un archivo de foto válido?"
                : "No se pudo preparar la imagen para recortarla.",
          });
        }
      }
    })();

    return () => {
      vivo = false;
      if (bitmap.current) {
        bitmap.current.close();
        bitmap.current = null;
      }
    };
  }, [archivo]);

  /** La escala a la que la imagen cubre el círculo justo, antes del zoom. */
  const escalaBase = useCallback(() => {
    const bmp = bitmap.current;
    if (!bmp) return 1;
    return Math.max(VISTA / bmp.width, VISTA / bmp.height);
  }, []);

  /** El desvío, sujetado para que nunca se vea un borde vacío dentro del círculo. */
  const sujetarDesvio = useCallback(
    (bruto, zoomActual) => {
      const bmp = bitmap.current;
      if (!bmp) return { x: 0, y: 0 };
      const escala = escalaBase() * zoomActual;
      const ancho = bmp.width * escala;
      const alto = bmp.height * escala;
      return {
        x: sujetar(bruto.x, VISTA - ancho, 0),
        y: sujetar(bruto.y, VISTA - alto, 0),
      };
    },
    [escalaBase]
  );

  // Si ya se aplico el encuadre de partida, para no repetirlo en cada repintado.
  const centrado = useRef(false);

  /**
   * El encuadre de partida, una sola vez: sobre la cara si se encontró, y al
   * centro si no.
   *
   * Va en su propio efecto y no dentro del actualizador del desvío. Ahí estaba
   * antes, llamando a `setZoom` desde dentro de `setDesvio`, y no funcionaba: la
   * función que se le pasa a un `setState` tiene que ser pura, así que el zoom se
   * perdía y el recorte salía centrado en el torso aunque la cara estuviera bien
   * detectada. Se veía en el resultado, no en la consola.
   */
  useEffect(() => {
    if (estado.status !== "listo" || centrado.current) return;
    const bmp = bitmap.current;
    if (!bmp) return;
    centrado.current = true;

    const base = escalaBase();
    const cara = rostro.current;

    if (cara) {
      // Se acerca hasta que la cara ocupe una parte razonable del círculo. El 1.9
      // sale de probarlo con las fotos del equipo: deja la cara holgada, con algo
      // de hombros, sin recortar la frente.
      const ladoDeseado = Math.min(cara.diametro * 1.9, Math.min(bmp.width, bmp.height));
      const zoomCara = sujetar(VISTA / (ladoDeseado * base), 1, ZOOM_MAX);
      const escalaCara = base * zoomCara;
      setZoom(zoomCara);
      setDesvio(
        sujetarDesvio(
          { x: VISTA / 2 - cara.x * escalaCara, y: VISTA / 2 - cara.y * escalaCara },
          zoomCara
        )
      );
      return;
    }

    setDesvio(
      sujetarDesvio(
        { x: (VISTA - bmp.width * base) / 2, y: (VISTA - bmp.height * base) / 2 },
        1
      )
    );
  }, [estado.status, escalaBase, sujetarDesvio]);

  /**
   * Acercar, conservando el punto que está en el centro del círculo.
   *
   * Va aquí, en el manejador del deslizador, y no en un efecto que mire `zoom`.
   * Ahí estaba, y tenía una carrera desagradable: en el mismo ciclo en que el
   * encuadre inicial llamaba a `setZoom`, el efecto ya se ejecutaba leyendo el
   * `zoom` viejo -- deshacía el acercamiento y lo rehacía sobre un desvío ya
   * alterado, y la cara terminaba fuera del círculo. Aquí los dos valores, el de
   * antes y el de después, están a la vista y no hay orden que adivinar.
   *
   * Anclar por el centro es lo que hace que acercar agrande lo que se estaba
   * mirando; por la esquina -- que es lo que sale solo -- la imagen se va hacia
   * abajo y a la derecha y se pierde el encuadre.
   */
  const cambiarZoom = (nuevo) => {
    const base = escalaBase();
    const escalaVieja = base * zoom;
    const escalaNueva = base * nuevo;
    setDesvio((previo) => {
      const centroX = (VISTA / 2 - previo.x) / escalaVieja;
      const centroY = (VISTA / 2 - previo.y) / escalaVieja;
      return sujetarDesvio(
        { x: VISTA / 2 - centroX * escalaNueva, y: VISTA / 2 - centroY * escalaNueva },
        nuevo
      );
    });
    setZoom(nuevo);
  };

  // —— Pintar la vista previa ——
  useEffect(() => {
    if (estado.status !== "listo") return;
    const bmp = bitmap.current;
    const cv = lienzo.current;
    if (!bmp || !cv) return;

    const dpr = window.devicePixelRatio || 1;
    cv.width = VISTA * dpr;
    cv.height = VISTA * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VISTA, VISTA);

    const escala = escalaBase() * zoom;
    ctx.drawImage(bmp, desvio.x, desvio.y, bmp.width * escala, bmp.height * escala);
  }, [estado.status, zoom, desvio, escalaBase]);

  // —— Arrastrar ——
  const alBajar = (evento) => {
    if (estado.status !== "listo") return;
    // El arrastre se apunta ANTES de capturar el puntero, y la captura va envuelta:
    // si `setPointerCapture` falla -- pasa con punteros sinteticos y con algun
    // navegador -- el arrastre tiene que funcionar igual. Al reves, una excepcion
    // aqui dejaba la foto inmovil sin decir nada.
    arrastre.current = { x: evento.clientX, y: evento.clientY, inicio: desvio };
    try {
      evento.currentTarget.setPointerCapture(evento.pointerId);
    } catch {
      /* sin captura se sigue moviendo; solo se pierde el arrastre fuera del circulo */
    }
  };

  const alMover = (evento) => {
    if (!arrastre.current) return;
    const dx = evento.clientX - arrastre.current.x;
    const dy = evento.clientY - arrastre.current.y;
    setDesvio(
      sujetarDesvio(
        { x: arrastre.current.inicio.x + dx, y: arrastre.current.inicio.y + dy },
        zoom
      )
    );
  };

  const alSoltar = (evento) => {
    if (arrastre.current) {
      evento.currentTarget.releasePointerCapture?.(evento.pointerId);
      arrastre.current = null;
    }
  };

  /** Mover con el teclado: sin esto el encuadre sólo existe para quien usa ratón. */
  const alTeclado = (evento) => {
    const paso = evento.shiftKey ? 20 : 6;
    const mapa = {
      ArrowLeft: { x: -paso, y: 0 },
      ArrowRight: { x: paso, y: 0 },
      ArrowUp: { x: 0, y: -paso },
      ArrowDown: { x: 0, y: paso },
    };
    const mover = mapa[evento.key];
    if (!mover) return;
    evento.preventDefault();
    setDesvio((previo) =>
      sujetarDesvio({ x: previo.x + mover.x, y: previo.y + mover.y }, zoom)
    );
  };

  // —— Exportar ——
  const confirmar = async () => {
    const bmp = bitmap.current;
    if (!bmp) return;
    setExportando(true);
    try {
      const escala = escalaBase() * zoom;
      // Qué trozo del original cae dentro del círculo, en coordenadas de la imagen.
      const sx = -desvio.x / escala;
      const sy = -desvio.y / escala;
      const lado = VISTA / escala;

      const fuera = document.createElement("canvas");
      fuera.width = LADO_SALIDA;
      fuera.height = LADO_SALIDA;
      const ctx = fuera.getContext("2d");
      // Fondo blanco: si la imagen trae transparencia, el JPEG la pintaría de negro.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, LADO_SALIDA, LADO_SALIDA);
      ctx.drawImage(bmp, sx, sy, lado, lado, 0, 0, LADO_SALIDA, LADO_SALIDA);

      const blob = await new Promise((resolver) =>
        fuera.toBlob(resolver, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("toBlob vacio");

      // Con nombre: el endpoint de subida rechaza un archivo sin `filename`.
      const base = (archivo.name || "foto").replace(/\.[^.]+$/, "");
      onListo(new File([blob], `${base}-recorte.jpg`, { type: "image/jpeg" }));
    } catch {
      setEstado({ status: "error", error: "No se pudo generar el recorte." });
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="se-recorte" role="group" aria-label={`Encuadrar la foto de ${nombre}`}>
      <p className="se-recorte__titulo">Encuadre la foto de {nombre}</p>

      {estado.status === "cargando" ? (
        <p className="se-admin-meta-hint">Preparando la imagen…</p>
      ) : null}

      {estado.status === "error" ? (
        <p className="se-admin-form-feedback" role="alert">
          {estado.error}
        </p>
      ) : null}

      {estado.status === "listo" ? (
        <>
          <p className="se-admin-meta-hint se-recorte__ayuda">
            {rostro.current
              ? "Encuadrado en la cara automáticamente. "
              : "No se detectó una cara, así que empieza centrado. "}
            Arrastre para mover y use la barra para acercar. Lo que quede dentro del
            círculo es lo que se va a ver. Con el teclado: flechas para mover.
          </p>

          <canvas
            ref={lienzo}
            className="se-recorte__lienzo"
            style={{ width: VISTA, height: VISTA }}
            tabIndex={0}
            role="application"
            aria-label="Vista previa del recorte. Use las flechas para mover la foto."
            onPointerDown={alBajar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            onKeyDown={alTeclado}
          />

          <label className="se-recorte__zoom">
            <span className="se-form-label">Acercar</span>
            <input
              type="range"
              min="1"
              max={ZOOM_MAX}
              step="0.02"
              value={zoom}
              onChange={(evento) => cambiarZoom(Number(evento.target.value))}
            />
          </label>
        </>
      ) : null}

      <div className="se-recorte__acciones">
        <button
          type="button"
          className="se-btn"
          onClick={confirmar}
          disabled={estado.status !== "listo" || exportando}
        >
          {exportando ? "Recortando…" : "Usar este encuadre"}
        </button>
        <button type="button" className="se-btn se-btn--secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

RecorteDeAvatar.propTypes = {
  archivo: PropTypes.object.isRequired,
  nombre: PropTypes.string.isRequired,
  onCancelar: PropTypes.func.isRequired,
  /** Recibe un `File` cuadrado de {@link LADO_SALIDA} px, listo para subir. */
  onListo: PropTypes.func.isRequired,
};
