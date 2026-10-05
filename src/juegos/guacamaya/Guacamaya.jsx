import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getMarketTicker } from "../../services/marketTickerService";
import { rutaDeFormato } from "../../lib/pieza";
import {
  ALTO,
  DURACION,
  VIDAS,
  aletear,
  avanzar,
  cambiarAncho,
  crearPartida,
  diaDeCaracas,
  faltaban,
  puntuacion,
  semillaDelDia,
} from "./motor";
import { crearEscena, dibujar, dibujarGuacamaya, efecto } from "./dibujo";
import { PLUMAJES, comprar, guardarMangos, leerTienda, plumajePorId, ponerse } from "./plumajes";
import { apuntar, resumen } from "./registro";
import "./guacamaya.css";

/**
 * «La guacamaya va a su casa»: un minuto de pausa entre lecturas.
 *
 * Este componente solo junta las piezas: el motor (`motor.js`) decide qué pasa, el
 * dibujo (`dibujo.js`) lo pinta en un canvas y el registro (`registro.js`) recuerda
 * récord y racha. Aquí viven el bucle de fotogramas, la entrada (dedo, ratón, teclado)
 * y las pantallas que tapan el escenario: la de inicio, la pausa, la final y la tienda
 * de plumajes (`plumajes.js`), donde se gastan los mangos que llegaron a casa.
 *
 * ## Lo que se decidió, y por qué
 *
 * **El marcador va en HTML, no en el canvas.** Texto nítido a cualquier tamaño, las
 * cifras de Host Grotesk y botones de verdad para pausar. El canvas solo pinta el mundo.
 *
 * **Cuesta lo mismo que no tenerlo, hasta que se abre.** Quien lo importa lo hace con
 * carga perezosa (`/pausa`, la página de error), así que la portada no descarga ni una
 * línea del juego: su tarjeta es solo una ilustración y un enlace.
 *
 * **Se pausa solo.** Al cambiar de pestaña o bloquear el teléfono el vuelo se congela;
 * nadie pierde una vida por contestar un mensaje.
 *
 * **Termina llevando a leer.** La pantalla final trae una cifra real del cintillo --
 * lo que marcaba el dólar oficial mientras se jugaba -- y un enlace a las noticias.
 */

/** El dato de cierre, sacado de la cinta de mercado: el dólar oficial del BCV. */
const datoDelDolar = (cinta) => {
  const fila = (cinta?.indicators ?? []).find(
    (i) => /bcv/i.test(i.label) && /usd|\$|d[oó]lar/i.test(i.label)
  );
  return fila ? fila.value : null;
};

const fechaCorta = (dia) =>
  new Date(`${dia}T12:00:00Z`).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const fechaLarga = (dia) =>
  new Date(`${dia}T12:00:00Z`).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

const DIRECCION = "https://www.sureconomics.com/pausa";
/** El listado de noticias. No hay `/noticias` a secas: se sale de la misma función que
 * usa el resto del sitio, para que no se rompa si el listado cambia de dirección. */
const NOTICIAS = rutaDeFormato("noticia");

const Corazon = ({ lleno }) => (
  <svg viewBox="0 0 24 24" className={`se-guaca__corazon${lleno ? "" : " se-guaca__corazon--vacio"}`} aria-hidden="true" focusable="false">
    <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.1 1.8-1.9 3.3-3.1 5.4-3.1 3.6 0 5.7 3.8 4.2 7.3C19.5 16.4 12 21 12 21z" />
  </svg>
);
Corazon.propTypes = { lleno: PropTypes.bool.isRequired };

const IconoMango = () => (
  <svg viewBox="0 0 24 24" className="se-guaca__icono-mango" aria-hidden="true" focusable="false">
    <ellipse cx="12" cy="13.5" rx="7" ry="8.5" transform="rotate(20 12 13.5)" fill="#ffb21f" />
    <ellipse cx="15.5" cy="4.5" rx="4" ry="1.8" transform="rotate(-35 15.5 4.5)" fill="#2f9e44" />
  </svg>
);

/** La vista previa de un plumaje en la tienda: la guacamaya quieta, en su canvas. */
const VistaPlumaje = ({ plumaje }) => {
  const ref = useRef(null);
  useEffect(() => {
    const lienzo = ref.current;
    if (!lienzo) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    lienzo.width = Math.round(120 * dpr);
    lienzo.height = Math.round(72 * dpr);
    const ctx = lienzo.getContext("2d");
    ctx.setTransform(1.45 * dpr, 0, 0, 1.45 * dpr, 64 * dpr, 42 * dpr);
    dibujarGuacamaya(ctx, 0, 0, -0.08, 1.1, 1, plumaje);
  }, [plumaje]);
  return <canvas ref={ref} className="se-guaca__vista" aria-hidden="true" />;
};
VistaPlumaje.propTypes = { plumaje: PropTypes.object.isRequired };

export const Guacamaya = ({ patrocinio }) => {
  const escenarioRef = useRef(null);
  const lienzoRef = useRef(null);
  const barraRef = useRef(null);
  const partidaRef = useRef(null);
  const escenaRef = useRef(null);
  const faseRef = useRef("portada");
  const hudRef = useRef({ seg: DURACION, vidas: VIDAS, mangos: 0 });

  const [fase, setFase] = useState("portada");
  const [hud, setHud] = useState(hudRef.current);
  const [fin, setFin] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [dolar, setDolar] = useState(null);
  const [memoria, setMemoria] = useState(() => resumen());
  const [dia] = useState(() => diaDeCaracas());
  const [tienda, setTienda] = useState(() => leerTienda());
  // Comprar pide dos toques: el primero marca el plumaje, el segundo paga.
  const [porConfirmar, setPorConfirmar] = useState(null);
  // El bucle de fotogramas lee el plumaje de una referencia: cambiarlo no lo reinicia.
  const plumajeRef = useRef(plumajePorId(tienda.puesto));
  plumajeRef.current = plumajePorId(tienda.puesto);
  const volverDeTiendaRef = useRef("portada");

  const cambiarFase = useCallback((f) => {
    faseRef.current = f;
    setFase(f);
  }, []);

  // La cifra real de la pantalla final. Si la cinta no responde, la pantalla sale igual.
  useEffect(() => {
    let vivo = true;
    getMarketTicker()
      .then((c) => vivo && setDolar(datoDelDolar(c)))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  // El tamaño: el mundo mide ALTO unidades de alto y tantas de ancho como quepan.
  useEffect(() => {
    const caja = escenarioRef.current;
    const lienzo = lienzoRef.current;
    if (!caja || !lienzo) return undefined;
    const medir = () => {
      const { width, height } = caja.getBoundingClientRect();
      if (!width || !height) return;
      const escala = height / ALTO;
      const ancho = width / escala;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      lienzo.width = Math.round(width * dpr);
      lienzo.height = Math.round(height * dpr);
      const ctx = lienzo.getContext("2d");
      ctx.setTransform(dpr * escala, 0, 0, dpr * escala, 0, 0);
      escenaRef.current = crearEscena(ancho);
      if (partidaRef.current) cambiarAncho(partidaRef.current, ancho);
      else partidaRef.current = crearPartida({ ancho, semilla: semillaDelDia(dia) });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caja);
    return () => ro.disconnect();
  }, [dia]);

  const terminar = useCallback(
    (p) => {
      const puntos = puntuacion(p);
      const guardado = apuntar(puntos, dia);
      setMemoria(resumen(dia));
      // Solo llegan a la alcancía los mangos que llegaron a casa.
      if (p.llego && p.mangos > 0) setTienda(guardarMangos(p.mangos));
      setFin({
        llego: p.llego,
        puntos,
        mangos: p.mangos,
        vidas: p.vidas,
        faltaban: faltaban(p),
        ...guardado,
      });
      cambiarFase("fin");
    },
    [cambiarFase, dia]
  );

  // El bucle de fotogramas. Siempre dibuja (en la portada la guacamaya flota y el
  // paisaje se mueve despacio); solo avanza el vuelo mientras se juega.
  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return undefined;
    const ctx = lienzo.getContext("2d");
    const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let ultimo = performance.now() / 1000;

    const cuadro = (ms) => {
      const ahora = ms / 1000;
      const dt = Math.min(1 / 30, Math.max(0, ahora - ultimo));
      ultimo = ahora;
      const p = partidaRef.current;
      const escena = escenaRef.current;
      if (p && escena) {
        if (faseRef.current === "jugando") {
          for (const e of avanzar(p, dt)) {
            if (e.tipo === "mango") efecto(escena, ahora, e.x, e.y, "+10");
            if (e.tipo === "golpe" && !reducido) navigator.vibrate?.(40);
            if (e.tipo === "fin") terminar(p);
          }
          const nuevo = { seg: Math.ceil(DURACION - p.t), vidas: p.vidas, mangos: p.mangos };
          const viejo = hudRef.current;
          if (nuevo.seg !== viejo.seg || nuevo.vidas !== viejo.vidas || nuevo.mangos !== viejo.mangos) {
            hudRef.current = nuevo;
            setHud(nuevo);
          }
          barraRef.current?.style.setProperty("--prog", String(p.t / DURACION));
        } else if (faseRef.current === "portada") {
          // En la portada flota arriba, sobre el título y no detrás de él.
          p.y = ALTO * 0.12 + Math.sin(ahora * 2) * 10;
          p.aleteo = 0;
          if (!reducido) p.recorrido += 30 * dt;
        }
        dibujar(ctx, p, escena, ahora, { reducido, plumaje: plumajeRef.current });
      }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(raf);
  }, [terminar]);

  // Cambiar de pestaña o bloquear el teléfono congela el vuelo.
  useEffect(() => {
    const alOcultar = () => {
      if (document.hidden && faseRef.current === "jugando") cambiarFase("pausa");
    };
    document.addEventListener("visibilitychange", alOcultar);
    return () => document.removeEventListener("visibilitychange", alOcultar);
  }, [cambiarFase]);

  const empezar = useCallback(() => {
    const escena = escenaRef.current;
    if (!escena) return;
    partidaRef.current = crearPartida({ ancho: escena.ancho, semilla: semillaDelDia(dia) });
    escena.efectos = [];
    hudRef.current = { seg: DURACION, vidas: VIDAS, mangos: 0 };
    setHud(hudRef.current);
    barraRef.current?.style.setProperty("--prog", "0");
    setFin(null);
    setCopiado(false);
    cambiarFase("jugando");
    aletear(partidaRef.current);
    // El foco al escenario: desde ahí la barra espaciadora aletea sin desplazar la página.
    escenarioRef.current?.focus({ preventScroll: true });
  }, [cambiarFase, dia]);

  const abrirTienda = () => {
    volverDeTiendaRef.current = faseRef.current;
    setPorConfirmar(null);
    cambiarFase("tienda");
  };

  const cerrarTienda = () => {
    setPorConfirmar(null);
    cambiarFase(volverDeTiendaRef.current);
  };

  const pagar = (id) => {
    const nueva = comprar(id);
    setPorConfirmar(null);
    if (nueva) setTienda(nueva);
  };

  const seguir = useCallback(() => {
    cambiarFase("jugando");
    escenarioRef.current?.focus({ preventScroll: true });
  }, [cambiarFase]);

  const alTocar = (e) => {
    // Los botones de las pantallas hacen lo suyo; el resto del escenario aletea.
    if (e.target.closest("button, a")) return;
    if (faseRef.current === "jugando") {
      e.preventDefault();
      aletear(partidaRef.current);
    } else if (faseRef.current === "portada") {
      empezar();
    } else if (faseRef.current === "pausa") {
      // Quien vuelve de otra app toca la pantalla para seguir, como hacía para aletear.
      // Por eso aquí un toque sigue el vuelo y reiniciar es un enlace pequeño abajo:
      // con «Empezar de nuevo» en medio, ese toque borraba la partida.
      seguir();
    }
  };

  const alPulsar = (e) => {
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      if (faseRef.current === "jugando") {
        e.preventDefault();
        aletear(partidaRef.current);
      } else if (faseRef.current === "portada" && e.target === escenarioRef.current) {
        e.preventDefault();
        empezar();
      }
    } else if (e.key === "Escape" && faseRef.current === "jugando") {
      cambiarFase("pausa");
    }
  };

  const compartir = async () => {
    if (!fin) return;
    const texto = `${fin.llego ? "Llevé a la guacamaya a casa" : "Mi guacamaya casi llega a casa"} con ${fin.mangos} ${fin.mangos === 1 ? "mango" : "mangos"}: ${fin.puntos} pts en el reto del ${fechaCorta(dia)}. ¿Lo superas?`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "La guacamaya va a su casa", text: texto, url: DIRECCION });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${texto} ${DIRECCION}`);
      setCopiado(true);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${DIRECCION}`)}`, "_blank", "noopener");
    }
  };

  const lineaPatrocinio = patrocinio ?? (
    <p className="se-guaca__patrocinio">
      Patrocinado por <strong>SurEconomics</strong>
    </p>
  );

  return (
    <div
      className={`se-guaca se-guaca--${fase}`}
      ref={escenarioRef}
      tabIndex={0}
      onPointerDown={alTocar}
      onKeyDown={alPulsar}
      aria-label="La guacamaya va a su casa. Toque o pulse la barra espaciadora para aletear."
    >
      <canvas ref={lienzoRef} className="se-guaca__lienzo" aria-hidden="true" />

      {/* El marcador, como en un juego de teléfono: tiempo y camino arriba, vidas debajo, mangos a la derecha. */}
      <div className="se-guaca__hud" aria-hidden={fase !== "jugando"}>
        <div className="se-guaca__fila">
          <span className="se-guaca__tiempo" aria-label={`Quedan ${hud.seg} segundos`}>
            {hud.seg}s
          </span>
          <div className="se-guaca__camino" ref={barraRef} aria-hidden="true">
            <span className="se-guaca__camino-relleno" />
            <span className="se-guaca__camino-ave" />
            <svg viewBox="0 0 24 24" className="se-guaca__casa" aria-hidden="true" focusable="false">
              <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            </svg>
          </div>
          <span className="se-guaca__mangos" aria-label={`${hud.mangos} mangos`}>
            <IconoMango />
            {hud.mangos}
          </span>
          <button
            type="button"
            className="se-guaca__pausar"
            onClick={() => cambiarFase("pausa")}
            aria-label="Pausar"
            tabIndex={fase === "jugando" ? 0 : -1}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        </div>
        <div className="se-guaca__vidas" aria-label={`${hud.vidas} vidas`}>
          {Array.from({ length: VIDAS }, (_, i) => (
            <Corazon key={i} lleno={i < hud.vidas} />
          ))}
        </div>
      </div>

      {fase === "portada" ? (
        <div className="se-guaca__pantalla">
          <div className="se-guaca__tarjeta">
            <p className="se-guaca__kicker">Un minuto sobre Caracas</p>
            <h2 className="se-guaca__titulo">La guacamaya va a su casa</h2>
            <p className="se-guaca__texto">
              Cae la tarde frente al Ávila. Esquive papagayos, zamuros y tormentas, recoja
              mangos y llegue a casa antes de que oscurezca.
            </p>
            <div className="se-guaca__acciones">
              <button type="button" className="se-guaca__boton" onClick={empezar}>
                Volar
              </button>
              <button type="button" className="se-guaca__secundario se-guaca__alcancia" onClick={abrirTienda}>
                <IconoMango />
                {tienda.mangos} · Plumajes
              </button>
            </div>
            <p className="se-guaca__ayuda">Toque la pantalla o pulse la barra espaciadora para aletear.</p>
            <p className="se-guaca__reto">
              Reto del {fechaLarga(dia)}: el mismo vuelo para todos, hoy.
              {memoria.mejorHoy ? ` Su mejor de hoy: ${memoria.mejorHoy} pts.` : ""}
              {memoria.racha > 1 ? ` Racha: ${memoria.racha} días.` : ""}
            </p>
          </div>
        </div>
      ) : null}

      {fase === "pausa" ? (
        <div className="se-guaca__pantalla">
          <div className="se-guaca__tarjeta">
            <h2 className="se-guaca__titulo se-guaca__titulo--chico">En pausa</h2>
            <p className="se-guaca__texto">La guacamaya espera en el aire. Toque la pantalla para seguir.</p>
            <button type="button" className="se-guaca__boton" onClick={seguir}>
              Seguir volando
            </button>
            <button type="button" className="se-guaca__reiniciar" onClick={empezar}>
              Empezar de nuevo
            </button>
          </div>
        </div>
      ) : null}

      {fase === "fin" && fin ? (
        <div className="se-guaca__pantalla">
          <div className="se-guaca__tarjeta" role="status">
            <p className="se-guaca__kicker">
              {fin.llego ? "Justo antes de que oscureciera" : "La tarde se le complicó"}
            </p>
            <h2 className="se-guaca__titulo">{fin.llego ? "¡Llegó a casa!" : "¡Uy, casi llega!"}</h2>
            <p className="se-guaca__puntos">
              {fin.puntos} <span>pts</span>
            </p>
            <p className="se-guaca__texto">
              {fin.llego
                ? `Recogió ${fin.mangos} ${fin.mangos === 1 ? "mango" : "mangos"} y llegó con ${fin.vidas} ${fin.vidas === 1 ? "vida" : "vidas"}.`
                : `Recogió ${fin.mangos} ${fin.mangos === 1 ? "mango" : "mangos"}. Le faltaron ${fin.faltaban} segundos para llegar.`}
              {fin.llego && fin.mangos > 0
                ? ` Guardó ${fin.mangos} en casa: ya tiene ${tienda.mangos} para plumajes.`
                : ""}
              {!fin.llego && fin.mangos > 0
                ? ` ${fin.mangos === 1 ? "El mango de este vuelo se perdió" : `Los ${fin.mangos} mangos de este vuelo se perdieron`}: solo se guardan los que llegan a casa.`
                : ""}
              {fin.nuevoRecord ? " ¡Nuevo récord!" : ""}
              {fin.racha > 1 ? ` Racha: ${fin.racha} días seguidos.` : ""}
            </p>
            {dolar ? (
              <p className="se-guaca__dato">
                Mientras volaba, el dólar oficial del BCV estaba en <strong>{dolar}</strong>.{" "}
                <Link to={NOTICIAS}>Ver las noticias de hoy</Link>
              </p>
            ) : (
              <p className="se-guaca__dato">
                <Link to={NOTICIAS}>Ver las noticias de hoy</Link>
              </p>
            )}
            <div className="se-guaca__acciones">
              <button type="button" className="se-guaca__boton" onClick={empezar}>
                Volar otra vez
              </button>
              <button type="button" className="se-guaca__secundario se-guaca__alcancia" onClick={abrirTienda}>
                <IconoMango />
                {tienda.mangos} · Plumajes
              </button>
              <button type="button" className="se-guaca__secundario" onClick={compartir}>
                {copiado ? "Copiado: péguelo donde quiera" : "Compartir resultado"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {fase === "tienda" ? (
        <div className="se-guaca__pantalla se-guaca__pantalla--tienda">
          <div className="se-guaca__tienda">
            <p className="se-guaca__kicker">Tienda del chaguaramo</p>
            <h2 className="se-guaca__titulo se-guaca__titulo--chico">Plumajes</h2>
            <p className="se-guaca__saldo">
              <IconoMango />
              Tiene <strong>{tienda.mangos}</strong> {tienda.mangos === 1 ? "mango guardado" : "mangos guardados"}
            </p>
            <ul className="se-guaca__plumajes">
              {PLUMAJES.map((k) => {
                const tiene = tienda.tiene.includes(k.id);
                const puesto = tienda.puesto === k.id;
                const falta = k.precio - tienda.mangos;
                let accion;
                if (puesto) {
                  accion = (
                    <button type="button" className="se-guaca__chip se-guaca__chip--puesto" disabled>
                      Puesto
                    </button>
                  );
                } else if (tiene) {
                  accion = (
                    <button type="button" className="se-guaca__chip" onClick={() => setTienda(ponerse(k.id))}>
                      Ponérmelo
                    </button>
                  );
                } else if (porConfirmar === k.id) {
                  accion = (
                    <button type="button" className="se-guaca__chip se-guaca__chip--pagar" onClick={() => pagar(k.id)}>
                      Toque otra vez para pagar {k.precio}
                    </button>
                  );
                } else if (falta > 0) {
                  accion = (
                    <button type="button" className="se-guaca__chip" disabled>
                      Le faltan {falta}
                    </button>
                  );
                } else {
                  accion = (
                    <button type="button" className="se-guaca__chip se-guaca__chip--comprar" onClick={() => setPorConfirmar(k.id)}>
                      Comprar
                    </button>
                  );
                }
                return (
                  <li key={k.id} className={`se-guaca__plumaje${puesto ? " se-guaca__plumaje--puesto" : ""}`}>
                    <VistaPlumaje plumaje={k} />
                    <strong className="se-guaca__plumaje-nombre">{k.nombre}</strong>
                    <span className="se-guaca__precio">{tiene ? "Suyo" : `${k.precio} mangos`}</span>
                    <span className="se-guaca__nota">{k.nota}</span>
                    {accion}
                  </li>
                );
              })}
            </ul>
            <button type="button" className="se-guaca__boton" onClick={cerrarTienda}>
              Volver
            </button>
          </div>
        </div>
      ) : null}

      {/* El patrocinio, montado una sola vez y visible solo en el inicio y el final:
          así cada partida cuenta una impresión, no dos. */}
      <div className="se-guaca__pie" aria-hidden={fase === "jugando" || fase === "pausa"}>
        {lineaPatrocinio}
      </div>
    </div>
  );
};

Guacamaya.propTypes = {
  /** La línea «Patrocinado por…»; sin ella, SurEconomics. */
  patrocinio: PropTypes.node,
};

Guacamaya.defaultProps = { patrocinio: null };

export default Guacamaya;
