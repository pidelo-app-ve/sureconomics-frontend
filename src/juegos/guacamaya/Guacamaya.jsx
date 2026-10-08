import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Enlace } from "../../components/Enlace";
import { ShareButtons } from "../../components/content/ShareButtons";
import { formatearFecha, formatearNumero } from "../../i18n/motor";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { SITIO } from "../../lib/seo";
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
  estrellasDe,
  faltaban,
  puntuacion,
  semillaDelDia,
} from "./motor";
import { NIVELES, nivelDe, siguienteDe } from "./niveles";
import { crearEscena, dibujar, dibujarGuacamaya, efecto } from "./dibujo";
import { PLUMAJES, comprar, guardarMangos, leerTienda, plumajePorId, ponerse } from "./plumajes";
import { apuntar, mejorResultado, progreso, resumen, vueloParaSeguir } from "./registro";
import "./guacamaya.css";

/**
 * «Vuela, guacamaya»: un minuto de pausa entre lecturas, en siete vuelos.
 *
 * Este componente solo junta las piezas: el motor (`motor.js`) decide qué pasa, el
 * dibujo (`dibujo.js`) lo pinta en un canvas, los vuelos (`niveles.js`) dicen qué trae
 * cada uno y el registro (`registro.js`) recuerda récord, estrellas y racha. Aquí viven
 * el bucle de fotogramas, la entrada (dedo, ratón, teclado) y las pantallas que tapan el
 * escenario: la de inicio, el mapa de vuelos, la pausa, la final y la tienda de
 * plumajes (`plumajes.js`), donde se gastan los mangos que llegaron a casa.
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
 *
 * Los textos viven en `i18n/{es,en}/juegos.json`, apartado `juegos.guacamaya`; la
 * dirección que se comparte es la de la página en el idioma en que se juega.
 */

/** El dato de cierre, sacado de la cinta de mercado: el dólar oficial del BCV. */
const datoDelDolar = (cinta) => {
  const fila = (cinta?.indicators ?? []).find(
    (i) => /bcv/i.test(i.label) && /usd|\$|d[oó]lar/i.test(i.label)
  );
  return fila ? fila.value : null;
};

/** El listado de noticias. No hay `/noticias` a secas: se sale de la misma función que
 * usa el resto del sitio, para que no se rompa si el listado cambia de dirección. */
const NOTICIAS = rutaDeFormato("noticia");

const Corazon = ({ lleno }) => (
  <svg viewBox="0 0 24 24" className={`se-guaca__corazon${lleno ? "" : " se-guaca__corazon--vacio"}`} aria-hidden="true" focusable="false">
    <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.1 1.8-1.9 3.3-3.1 5.4-3.1 3.6 0 5.7 3.8 4.2 7.3C19.5 16.4 12 21 12 21z" />
  </svg>
);
Corazon.propTypes = { lleno: PropTypes.bool.isRequired };

const Candado = () => (
  <svg viewBox="0 0 24 24" className="se-guaca__candado" aria-hidden="true" focusable="false">
    <path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z" />
  </svg>
);

/** El chaguaramo: la palma real donde anidan las guacamayas de Caracas. Es el destino. */
const Chaguaramo = ({ titulo }) => (
  <svg viewBox="0 0 24 24" className="se-guaca__casa" focusable="false" role="img" aria-label={titulo}>
    <title>{titulo}</title>
    <path d="M11.2 23c.3-4.6.4-8.6.2-12.6h1.3c.3 4 .3 8 .1 12.6z" />
    <path d="M12 10.6c-1.3-2.3-3.6-3.6-6.6-3.4 2.3.4 4 1.6 5.1 3.6zM12 10.6c1.3-2.3 3.6-3.6 6.6-3.4-2.3.4-4 1.6-5.1 3.6zM12 10.2C10.7 7.4 8.5 5.2 5 4.8c3 1.1 5 3 6.2 5.7zM12 10.2c1.3-2.8 3.5-5 7-5.4-3 1.1-5 3-6.2 5.7zM12 9.8c-.4-2.8-1.5-5.2-3.6-6.8 1.7 2 2.6 4.3 2.9 6.9zM12 9.8c.4-2.8 1.5-5.2 3.6-6.8-1.7 2-2.6 4.3-2.9 6.9zM12 10.6c-2.2-.7-4.8-.2-7 2 2.3-1.2 4.6-1.6 6.7-1.1zM12 10.6c2.2-.7 4.8-.2 7 2-2.3-1.2-4.6-1.6-6.7-1.1z" />
  </svg>
);
Chaguaramo.propTypes = { titulo: PropTypes.string.isRequired };

/** El logo de WhatsApp: el globo y el teléfono, en blanco sobre el verde del botón. */
const IconoWhatsApp = () => (
  <svg viewBox="0 0 24 24" className="se-guaca__icono-whatsapp" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L2.9 21.1l4.5-1.2A9.2 9.2 0 1 0 12 2.8z"
    />
    <path
      fill="currentColor"
      d="M8.6 7.2c.2-.4.5-.4.8-.4h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.6l-.6.7c-.1.2-.2.4 0 .6.6 1.1 1.5 2 2.6 2.6.2.1.4.1.6 0l.7-.6c.2-.2.4-.2.6-.1l1.9.8c.3.1.4.3.4.5v.6c0 .3 0 .6-.4.8-.6.4-1.4.6-2.2.4-2.6-.6-4.9-2.9-5.5-5.5-.2-.8 0-1.6.4-2.2z"
    />
  </svg>
);

/** Las redes de la fila de compartir, además de WhatsApp (que va en su botón grande). */
const REDES_DEL_JUEGO = ["facebook", "x", "telegram", "instagram"];

/** Un enlace que abre WhatsApp con el mensaje ya escrito (en el teléfono, la app). */
const enlaceWhatsApp = (texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`;

const IconoMango = () => (
  <svg viewBox="0 0 24 24" className="se-guaca__icono-mango" aria-hidden="true" focusable="false">
    <ellipse cx="12" cy="13.5" rx="7" ry="8.5" transform="rotate(20 12 13.5)" fill="#ffb21f" />
    <ellipse cx="15.5" cy="4.5" rx="4" ry="1.8" transform="rotate(-35 15.5 4.5)" fill="#2f9e44" />
  </svg>
);

/** Tres estrellas, tantas llenas como se hayan ganado. Decorativas: el número va en texto. */
const Estrellas = ({ n, className }) => (
  <span className={`se-guaca__estrellas${className ? ` ${className}` : ""}`} aria-hidden="true">
    {[1, 2, 3].map((i) => (
      <svg key={i} viewBox="0 0 24 24" className={`se-guaca__estrella${i <= n ? " se-guaca__estrella--llena" : ""}`} focusable="false">
        <path d="m12 2.8 2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.7l-5.8 3.1 1.1-6.5L2.6 9.7l6.5-.9z" />
      </svg>
    ))}
  </span>
);
Estrellas.propTypes = { n: PropTypes.number.isRequired, className: PropTypes.string };
Estrellas.defaultProps = { className: undefined };

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
  const { t, ruta } = useIdioma();
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
  const [dolar, setDolar] = useState(null);
  const [dia] = useState(() => diaDeCaracas());
  // El vuelo elegido: al entrar, donde toca seguir (el último que no se ha logrado).
  const [nivelId, setNivelId] = useState(() => vueloParaSeguir());
  const nivelRef = useRef(nivelId);
  nivelRef.current = nivelId;
  const nivel = nivelDe(nivelId);
  // Lo que el juego recuerda cambia al terminar un vuelo (cambia `fase`) o al elegir otro.
  const memoria = useMemo(() => resumen(dia, nivelId), [dia, nivelId, fase]); // eslint-disable-line react-hooks/exhaustive-deps
  const avance = useMemo(() => progreso(), [fase]); // eslint-disable-line react-hooks/exhaustive-deps
  const [tienda, setTienda] = useState(() => leerTienda());
  // Comprar pide dos toques: el primero marca el plumaje, el segundo paga.
  const [porConfirmar, setPorConfirmar] = useState(null);
  // El bucle de fotogramas lee el plumaje de una referencia: cambiarlo no lo reinicia.
  const plumajeRef = useRef(plumajePorId(tienda.puesto));
  plumajeRef.current = plumajePorId(tienda.puesto);
  const volverDeTiendaRef = useRef("portada");
  const volverDeVuelosRef = useRef("portada");

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
      else partidaRef.current = crearPartida({ ancho, semilla: semillaDelDia(dia, nivelRef.current), nivel: nivelRef.current });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caja);
    return () => ro.disconnect();
  }, [dia]);

  // Al elegir otro vuelo, el escenario de detrás cambia a ese: así se ve adónde se va.
  useEffect(() => {
    const escena = escenaRef.current;
    if (!escena || faseRef.current === "jugando" || faseRef.current === "pausa") return;
    partidaRef.current = crearPartida({ ancho: escena.ancho, semilla: semillaDelDia(dia, nivelId), nivel: nivelId });
  }, [nivelId, dia]);

  const terminar = useCallback(
    (p) => {
      const puntos = puntuacion(p);
      const estrellas = estrellasDe(p);
      const guardado = apuntar(puntos, { nivel: p.nivel.id, llego: p.llego, estrellas }, dia);
      // Solo llegan a la alcancía los mangos que llegaron a casa.
      if (p.llego && p.mangos > 0) setTienda(guardarMangos(p.mangos));
      setFin({
        nivel: p.nivel.id,
        estrellasVuelo: estrellas,
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

  /** Empieza un vuelo: el que se pida o, sin más, el que está elegido. */
  const empezar = useCallback((id) => {
    const escena = escenaRef.current;
    if (!escena) return;
    const vuelo = typeof id === "number" ? id : nivelRef.current;
    nivelRef.current = vuelo;
    setNivelId(vuelo);
    partidaRef.current = crearPartida({ ancho: escena.ancho, semilla: semillaDelDia(dia, vuelo), nivel: vuelo });
    escena.efectos = [];
    hudRef.current = { seg: DURACION, vidas: VIDAS, mangos: 0 };
    setHud(hudRef.current);
    barraRef.current?.style.setProperty("--prog", "0");
    setFin(null);
    cambiarFase("jugando");
    aletear(partidaRef.current);
    // El foco al escenario: desde ahí la barra espaciadora aletea sin desplazar la página.
    escenarioRef.current?.focus({ preventScroll: true });
  }, [cambiarFase, dia]);

  const abrirVuelos = () => {
    volverDeVuelosRef.current = faseRef.current;
    cambiarFase("vuelos");
  };

  const elegirVuelo = (id) => {
    setNivelId(id);
    nivelRef.current = id;
    cambiarFase("portada");
  };

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

  // Lo que se comparte por WhatsApp. La dirección es la de `/pausa` en el idioma en que se
  // juega: quien la abre cae en el juego, con el sitio alrededor.
  const direccion = `${SITIO}${ruta("/pausa")}`;

  /** El resultado de este vuelo, en una frase (sin la dirección). */
  const fraseDelResultado = () =>
    fin
      ? t("juegos.guacamaya.compartir.texto", {
          logro: fin.llego ? t("juegos.guacamaya.compartir.llego") : t("juegos.guacamaya.compartir.casi"),
          destino: t(`juegos.guacamaya.niveles.${nivelDe(fin.nivel).clave}.destino`),
          mangos: t("juegos.guacamaya.mangos", { n: fin.mangos }),
          puntos: formatearNumero(fin.puntos),
          fecha: formatearFecha(dia, "diaMes"),
        })
      : "";
  const textoDelResultado = () => `${fraseDelResultado()} ${direccion}`.trim();

  /** La invitación de la portada: con el mejor resultado de quien ya jugó, si lo hay. */
  const fraseDeInvitacion = () => {
    const mejor = mejorResultado();
    return mejor
      ? t("juegos.guacamaya.portada.whatsapp.mensajeRecord", {
          puntos: formatearNumero(mejor.record),
          destino: t(`juegos.guacamaya.niveles.${mejor.clave}.destino`),
        })
      : t("juegos.guacamaya.portada.whatsapp.mensaje");
  };
  const textoDeInvitacion = () => `${fraseDeInvitacion()} ${direccion}`;

  const lineaPatrocinio = patrocinio ?? (
    <p className="se-guaca__patrocinio">
      {t("juegos.guacamaya.patrocinadoPor", { marca: <strong>SurEconomics</strong> })}
    </p>
  );

  // La línea del reto en la portada: la fecha y, si hay memoria, lo mejor de hoy y la racha.
  const frasesDelReto = [t("juegos.guacamaya.portada.reto", { fecha: formatearFecha(dia, "diaMesLargo") })];
  if (memoria.mejorHoy) frasesDelReto.push(t("juegos.guacamaya.portada.mejorHoy", { n: formatearNumero(memoria.mejorHoy) }));
  if (memoria.racha > 1) frasesDelReto.push(t("juegos.guacamaya.portada.racha", { n: memoria.racha }));

  // El resumen de la pantalla final: lo recogido, lo guardado o perdido, el récord y la racha.
  let textoDelFin = "";
  const esJefe = Boolean(fin && nivelDe(fin.nivel).jefe);
  const siguiente = fin ? siguienteDe(fin.nivel) : null;
  if (fin) {
    const mangos = t("juegos.guacamaya.mangos", { n: fin.mangos });
    const frases = [
      fin.llego
        ? t("juegos.guacamaya.fin.recogioYLlego", { mangos, vidas: t("juegos.guacamaya.vidas", { n: fin.vidas }) })
        : t("juegos.guacamaya.fin.recogioYFalto", { mangos, segundos: t("juegos.guacamaya.segundos", { n: fin.faltaban }) }),
    ];
    if (fin.llego && fin.mangos > 0) frases.push(t("juegos.guacamaya.fin.guardo", { n: fin.mangos, total: tienda.mangos }));
    if (!fin.llego && fin.mangos > 0) frases.push(t("juegos.guacamaya.fin.perdidos", { n: fin.mangos }));
    if (fin.estrellasNuevas > 0) frases.push(t("juegos.guacamaya.fin.estrellasNuevas", { n: fin.estrellasNuevas }));
    if (fin.abrio) {
      frases.push(
        t("juegos.guacamaya.fin.abrio", {
          n: fin.abrio,
          nombre: t(`juegos.guacamaya.niveles.${nivelDe(fin.abrio).clave}.nombre`),
        })
      );
    }
    if (fin.llego && !siguiente) frases.push(t("juegos.guacamaya.fin.completo"));
    if (fin.nuevoRecord) frases.push(t("juegos.guacamaya.fin.nuevoRecord"));
    if (fin.racha > 1) frases.push(t("juegos.guacamaya.fin.racha", { n: fin.racha }));
    textoDelFin = frases.join(" ");
  }

  return (
    <div
      className={`se-guaca se-guaca--${fase}`}
      ref={escenarioRef}
      tabIndex={0}
      onPointerDown={alTocar}
      onKeyDown={alPulsar}
      aria-label={t("juegos.guacamaya.escenario")}
    >
      <canvas ref={lienzoRef} className="se-guaca__lienzo" aria-hidden="true" />

      {/* El marcador, como en un juego de teléfono: tiempo y camino arriba, vidas debajo, mangos a la derecha. */}
      <div className="se-guaca__hud" aria-hidden={fase !== "jugando"}>
        <div className="se-guaca__fila">
          <span className="se-guaca__tiempo" aria-label={t("juegos.guacamaya.hud.quedanSegundos", { n: hud.seg })}>
            {t("juegos.guacamaya.hud.segundosCorto", { n: hud.seg })}
          </span>
          <div className="se-guaca__camino" ref={barraRef} aria-hidden="true">
            <span className="se-guaca__camino-relleno" />
            <span className="se-guaca__camino-ave" />
            <Chaguaramo titulo={t("juegos.guacamaya.hud.destino")} />
          </div>
          <span className="se-guaca__mangos" aria-label={t("juegos.guacamaya.mangos", { n: hud.mangos })}>
            <IconoMango />
            {hud.mangos}
          </span>
          <button
            type="button"
            className="se-guaca__pausar"
            onClick={() => cambiarFase("pausa")}
            aria-label={t("juegos.guacamaya.hud.pausar")}
            tabIndex={fase === "jugando" ? 0 : -1}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        </div>
        <div className="se-guaca__vidas" aria-label={t("juegos.guacamaya.vidas", { n: hud.vidas })}>
          {Array.from({ length: VIDAS }, (_, i) => (
            <Corazon key={i} lleno={i < hud.vidas} />
          ))}
        </div>
      </div>

      {fase === "portada" ? (
        <div className="se-guaca__pantalla">
          <div className="se-guaca__tarjeta">
            <p className="se-guaca__kicker">
              {t("juegos.guacamaya.portada.vuelo", { n: nivel.id, nombre: t(`juegos.guacamaya.niveles.${nivel.clave}.nombre`) })}
              {nivel.jefe ? ` · ${t("juegos.guacamaya.portada.jefe")}` : ""}
            </p>
            <h2 className="se-guaca__titulo">{t("juegos.guacamaya.titulo")}</h2>
            <p className="se-guaca__texto">{t(`juegos.guacamaya.niveles.${nivel.clave}.texto`)}</p>
            <div className="se-guaca__acciones">
              <button type="button" className="se-guaca__boton" onClick={empezar}>
                {t("juegos.guacamaya.portada.volar")}
              </button>
              <button type="button" className="se-guaca__secundario se-guaca__vuelos-boton" onClick={abrirVuelos}>
                {t("juegos.guacamaya.portada.vuelos")}
                <Estrellas n={avance[nivel.id]?.estrellas ?? 0} />
              </button>
              <button type="button" className="se-guaca__secundario se-guaca__alcancia" onClick={abrirTienda}>
                <IconoMango />
                {t("juegos.guacamaya.plumajesConSaldo", { n: tienda.mangos })}
              </button>
            </div>
            <p className="se-guaca__ayuda">{t("juegos.guacamaya.portada.ayuda")}</p>
            <p className="se-guaca__reto">{frasesDelReto.join(" ")}</p>
            {/* Invitar a otros: es lo que hace que un juego de un minuto llegue lejos. */}
            <div className="se-guaca__invitar">
              <p className="se-guaca__invitar-texto">{t("juegos.guacamaya.portada.whatsapp.invitacion")}</p>
              <a
                className="se-guaca__whatsapp"
                href={enlaceWhatsApp(textoDeInvitacion())}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconoWhatsApp />
                {t("juegos.guacamaya.portada.whatsapp.boton")}
              </a>
              <div className="se-guaca__redes">
                <span className="se-guaca__redes-texto">{t("juegos.guacamaya.otrasRedes")}</span>
                <ShareButtons url={direccion} title={fraseDeInvitacion()} redes={REDES_DEL_JUEGO} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lo que estrena este vuelo, un par de segundos al despegar. */}
      {fase === "jugando" && hud.seg >= DURACION - 3 ? (
        <div className="se-guaca__intro" role="status" key={nivel.id}>
          <strong>
            {t("juegos.guacamaya.hud.intro", { n: nivel.id, nombre: t(`juegos.guacamaya.niveles.${nivel.clave}.nombre`) })}
          </strong>
          <span>{t(`juegos.guacamaya.niveles.${nivel.clave}.aviso`)}</span>
        </div>
      ) : null}

      {fase === "vuelos" ? (
        <div className="se-guaca__pantalla se-guaca__pantalla--tienda">
          <div className="se-guaca__tienda">
            <p className="se-guaca__kicker">{t("juegos.guacamaya.vuelos.kicker", { n: NIVELES.length })}</p>
            <h2 className="se-guaca__titulo se-guaca__titulo--chico">{t("juegos.guacamaya.vuelos.titulo")}</h2>
            <p className="se-guaca__ayuda se-guaca__ayuda--estrellas">{t("juegos.guacamaya.vuelos.estrellas")}</p>
            <ol className="se-guaca__mapa">
              {NIVELES.map((n) => {
                const a = avance[n.id];
                const abierto = a?.abierto;
                const nombre = t(`juegos.guacamaya.niveles.${n.clave}.nombre`);
                const anterior = n.id - 1;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`se-guaca__vuelo${n.id === nivelId ? " se-guaca__vuelo--elegido" : ""}${abierto ? "" : " se-guaca__vuelo--cerrado"}${n.jefe ? " se-guaca__vuelo--jefe" : ""}`}
                      disabled={!abierto}
                      onClick={() => elegirVuelo(n.id)}
                    >
                      <span className="se-guaca__vuelo-num">{abierto ? n.id : <Candado />}</span>
                      <span className="se-guaca__vuelo-texto">
                        <strong>
                          {t("juegos.guacamaya.vuelos.numero", { n: n.id })} · {nombre}
                          {n.jefe ? <em>{t("juegos.guacamaya.vuelos.jefe")}</em> : null}
                        </strong>
                        <span>
                          {abierto
                            ? t(`juegos.guacamaya.niveles.${n.clave}.corto`)
                            : t("juegos.guacamaya.vuelos.bloqueado", { n: anterior })}
                        </span>
                      </span>
                      <Estrellas n={a?.estrellas ?? 0} className="se-guaca__vuelo-estrellas" />
                      <span className="se-guaca__solo-lectores">
                        {t("juegos.guacamaya.vuelos.estrellasDe", { n: a?.estrellas ?? 0 })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <button type="button" className="se-guaca__boton" onClick={() => cambiarFase(volverDeVuelosRef.current)}>
              {t("juegos.guacamaya.vuelos.volver")}
            </button>
          </div>
        </div>
      ) : null}

      {fase === "pausa" ? (
        <div className="se-guaca__pantalla">
          <div className="se-guaca__tarjeta">
            <h2 className="se-guaca__titulo se-guaca__titulo--chico">{t("juegos.guacamaya.pausa.titulo")}</h2>
            <p className="se-guaca__texto">{t("juegos.guacamaya.pausa.texto")}</p>
            <button type="button" className="se-guaca__boton" onClick={seguir}>
              {t("juegos.guacamaya.pausa.seguir")}
            </button>
            <button type="button" className="se-guaca__reiniciar" onClick={empezar}>
              {t("juegos.guacamaya.pausa.reiniciar")}
            </button>
          </div>
        </div>
      ) : null}

      {fase === "fin" && fin ? (
        <div className="se-guaca__pantalla">
          <div className="se-guaca__tarjeta" role="status">
            <p className="se-guaca__kicker">
              {esJefe
                ? t("juegos.guacamaya.fin.kickerJefe")
                : fin.llego
                  ? t("juegos.guacamaya.fin.kickerLlego")
                  : t("juegos.guacamaya.fin.kickerNoLlego")}
            </p>
            <h2 className="se-guaca__titulo">
              {esJefe
                ? fin.llego
                  ? t("juegos.guacamaya.fin.llegoJefe")
                  : t("juegos.guacamaya.fin.casiJefe")
                : fin.llego
                  ? t("juegos.guacamaya.fin.llego")
                  : t("juegos.guacamaya.fin.casi")}
            </h2>
            <Estrellas n={fin.estrellasVuelo} className="se-guaca__estrellas--fin" />
            <p className="se-guaca__solo-lectores">{t("juegos.guacamaya.fin.estrellas", { n: fin.estrellasVuelo })}</p>
            <p className="se-guaca__puntos">
              {formatearNumero(fin.puntos)} <span>{t("juegos.guacamaya.fin.pts")}</span>
            </p>
            <p className="se-guaca__texto">{textoDelFin}</p>
            {dolar ? (
              <p className="se-guaca__dato">
                {t("juegos.guacamaya.fin.dolar", { valor: <strong>{dolar}</strong> })}{" "}
                <Enlace to={NOTICIAS}>{t("juegos.guacamaya.fin.verNoticias")}</Enlace>
              </p>
            ) : (
              <p className="se-guaca__dato">
                <Enlace to={NOTICIAS}>{t("juegos.guacamaya.fin.verNoticias")}</Enlace>
              </p>
            )}
            <div className="se-guaca__acciones">
              {fin.llego && siguiente ? (
                <>
                  <button type="button" className="se-guaca__boton" onClick={() => empezar(siguiente.id)}>
                    {t("juegos.guacamaya.fin.siguiente")}
                  </button>
                  <button type="button" className="se-guaca__secundario" onClick={empezar}>
                    {t("juegos.guacamaya.fin.volarOtraVez")}
                  </button>
                </>
              ) : (
                <button type="button" className="se-guaca__boton" onClick={empezar}>
                  {t("juegos.guacamaya.fin.volarOtraVez")}
                </button>
              )}
              <button type="button" className="se-guaca__secundario" onClick={abrirVuelos}>
                {t("juegos.guacamaya.fin.vuelos")}
              </button>
              <button type="button" className="se-guaca__secundario se-guaca__alcancia" onClick={abrirTienda}>
                <IconoMango />
                {t("juegos.guacamaya.plumajesConSaldo", { n: tienda.mangos })}
              </button>
              <a
                className="se-guaca__whatsapp"
                href={enlaceWhatsApp(textoDelResultado())}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconoWhatsApp />
                {t("juegos.guacamaya.fin.whatsapp")}
              </a>
              <div className="se-guaca__redes">
                <span className="se-guaca__redes-texto">{t("juegos.guacamaya.otrasRedes")}</span>
                <ShareButtons url={direccion} title={fraseDelResultado()} redes={REDES_DEL_JUEGO} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {fase === "tienda" ? (
        <div className="se-guaca__pantalla se-guaca__pantalla--tienda">
          <div className="se-guaca__tienda">
            <p className="se-guaca__kicker">{t("juegos.guacamaya.tienda.kicker")}</p>
            <h2 className="se-guaca__titulo se-guaca__titulo--chico">{t("juegos.guacamaya.tienda.titulo")}</h2>
            <p className="se-guaca__saldo">
              <IconoMango />
              {t("juegos.guacamaya.tienda.saldo", { n: tienda.mangos, cifra: <strong>{tienda.mangos}</strong> })}
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
                      {t("juegos.guacamaya.tienda.puesto")}
                    </button>
                  );
                } else if (tiene) {
                  accion = (
                    <button type="button" className="se-guaca__chip" onClick={() => setTienda(ponerse(k.id))}>
                      {t("juegos.guacamaya.tienda.ponermelo")}
                    </button>
                  );
                } else if (porConfirmar === k.id) {
                  accion = (
                    <button type="button" className="se-guaca__chip se-guaca__chip--pagar" onClick={() => pagar(k.id)}>
                      {t("juegos.guacamaya.tienda.toqueParaPagar", { n: k.precio })}
                    </button>
                  );
                } else if (falta > 0) {
                  accion = (
                    <button type="button" className="se-guaca__chip" disabled>
                      {t("juegos.guacamaya.tienda.leFaltan", { n: falta })}
                    </button>
                  );
                } else {
                  accion = (
                    <button type="button" className="se-guaca__chip se-guaca__chip--comprar" onClick={() => setPorConfirmar(k.id)}>
                      {t("juegos.guacamaya.tienda.comprar")}
                    </button>
                  );
                }
                return (
                  <li key={k.id} className={`se-guaca__plumaje${puesto ? " se-guaca__plumaje--puesto" : ""}`}>
                    <VistaPlumaje plumaje={k} />
                    <strong className="se-guaca__plumaje-nombre">{t(`juegos.guacamaya.plumajes.${k.id}.nombre`)}</strong>
                    <span className="se-guaca__precio">
                      {tiene ? t("juegos.guacamaya.tienda.suyo") : t("juegos.guacamaya.mangos", { n: k.precio })}
                    </span>
                    <span className="se-guaca__nota">{t(`juegos.guacamaya.plumajes.${k.id}.nota`)}</span>
                    {accion}
                  </li>
                );
              })}
            </ul>
            <button type="button" className="se-guaca__boton" onClick={cerrarTienda}>
              {t("juegos.guacamaya.tienda.volver")}
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
