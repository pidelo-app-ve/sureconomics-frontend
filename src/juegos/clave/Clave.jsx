import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Enlace } from "../../components/Enlace";
import { ShareButtons } from "../../components/content/ShareButtons";
import { formatearFecha, formatearNumero } from "../../i18n/motor";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { BRAND } from "../../data/surEconomicsMock";
import { rutaDeFormato, rutaDePieza } from "../../lib/pieza";
import { SITIO } from "../../lib/seo";
import { getCategoriasClave, getPalabraDelDia, buscarPiezaConPalabra } from "../../services/claveService";
import { getMarketTicker } from "../../services/marketTickerService";
import { datoDelDolar } from "../datoDelDolar";
import { IconoWhatsApp, REDES_DEL_JUEGO, enlaceWhatsApp } from "../compartir";
import { FILAS_DEL_TECLADO, MAX_INTENTOS, acerto, cuadricula, estadoDelTeclado, evaluar, normalizar } from "./motor";
import {
  apuntar,
  categoriaPreferida,
  estadisticas,
  guardarPartida,
  idDePartida,
  leerPartida,
  recordarCategoria,
} from "./registro";
import { PaisajeClave, escenaDe } from "./Paisaje";
import "./clave.css";

/**
 * «La Clave»: una palabra escondida, seis intentos, una pinta por letra.
 *
 * Dos maneras de jugarla:
 *
 * - **La del día.** Quien juega elige de qué va la palabra (economía, deportes,
 *   entretenimiento…) y recibe la de hoy de esa categoría, la misma para todos: la
 *   elige el servidor con la fecha de Caracas (`/juegos/clave/hoy`). El catálogo se
 *   alimenta desde el panel, tantas palabras como se quiera.
 * - **La de una pieza.** Al final de un artículo, una noticia o un editorial, con la
 *   palabra que la redacción dejó en el editor: tiene que ver con lo que se acaba de
 *   leer. Llega en `pieza` y no pide nada al servidor.
 *
 * El motor (`motor.js`) decide las pintas; el registro (`registro.js`) recuerda las
 * partidas, la racha y las estadísticas en este navegador. Aquí viven el tablero, el
 * teclado (en pantalla y físico), la pista y la pantalla final, que como la de la
 * guacamaya termina llevando a leer: dónde sale la palabra, el dólar del BCV y las
 * noticias.
 *
 * Los textos viven en `i18n/{es,en}/juegos.json`, apartado `juegos.clave`.
 */

const NOTICIAS = rutaDeFormato("noticia");
/** Cuántos intentos fallidos antes de ofrecer la pista. */
const INTENTOS_PARA_PISTA = 3;
/** Lo que tarda en voltearse cada letra de una fila (igual que `--clave-vuelta` en el CSS). */
const MS_POR_LETRA = 260;

const IconoCopiar = () => (
  <svg viewBox="0 0 24 24" className="se-clave__icono" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M9 9h10v11H9zM5 15V4h10" />
  </svg>
);

const IconoBorrar = () => (
  <svg viewBox="0 0 24 24" className="se-clave__icono" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M8.5 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-11L3 12zm4 4 5 6m0-6-5 6"
    />
  </svg>
);

/** Una fila del tablero: las letras ya probadas con su pinta, la que se escribe, o vacía. */
const Fila = ({ letras, pintas, largo, revela, tiembla, activa }) => (
  <div
    className={`se-clave__fila${tiembla ? " se-clave__fila--tiembla" : ""}`}
    role="row"
    aria-current={activa ? "step" : undefined}
  >
    {Array.from({ length: largo }, (_, i) => {
      const letra = letras[i] ?? "";
      const pinta = pintas?.[i];
      const clases = ["se-clave__celda"];
      if (pinta) clases.push(`se-clave__celda--${pinta}`);
      if (revela) clases.push("se-clave__celda--revela");
      if (!pinta && letra) clases.push("se-clave__celda--llena");
      return (
        <div
          key={i}
          className={clases.join(" ")}
          style={revela ? { animationDelay: `${i * MS_POR_LETRA}ms` } : undefined}
          role="cell"
        >
          {letra}
        </div>
      );
    })}
  </div>
);
Fila.propTypes = {
  letras: PropTypes.string.isRequired,
  pintas: PropTypes.arrayOf(PropTypes.string),
  largo: PropTypes.number.isRequired,
  revela: PropTypes.bool,
  tiembla: PropTypes.bool,
  activa: PropTypes.bool,
};
Fila.defaultProps = { pintas: undefined, revela: false, tiembla: false, activa: false };

/** La barra de la distribución: cuántas veces se acertó en n intentos. */
const Distribucion = ({ distribucion, destacado }) => {
  const max = Math.max(1, ...Object.values(distribucion));
  return (
    <ol className="se-clave__distribucion">
      {Array.from({ length: MAX_INTENTOS }, (_, i) => i + 1).map((n) => {
        const v = distribucion[n] ?? 0;
        return (
          <li key={n} className="se-clave__barra-fila">
            <span className="se-clave__barra-n">{n}</span>
            <span
              className={`se-clave__barra${n === destacado ? " se-clave__barra--hoy" : ""}`}
              style={{ width: `${Math.max(8, Math.round((v / max) * 100))}%` }}
            >
              {v}
            </span>
          </li>
        );
      })}
    </ol>
  );
};
Distribucion.propTypes = { distribucion: PropTypes.object.isRequired, destacado: PropTypes.number };
Distribucion.defaultProps = { destacado: undefined };

export const Clave = ({ pieza, categoriaInicial }) => {
  const { t, ruta } = useIdioma();
  const esDePieza = Boolean(pieza?.palabra);

  // —— La del día: categoría y palabra ——
  const [categorias, setCategorias] = useState(null);
  const [categoria, setCategoria] = useState(() =>
    esDePieza ? null : categoriaInicial || categoriaPreferida() || null
  );
  const [carga, setCarga] = useState({ estado: esDePieza ? "lista" : "idle", error: null });
  const [reintento, setReintento] = useState(0);
  const [reto, setReto] = useState(() =>
    esDePieza ? { palabra: pieza.palabra, pista: pieza.pista || "", definicion: "", dia: null, categoria: null } : null
  );

  useEffect(() => {
    if (esDePieza) return undefined;
    let vivo = true;
    getCategoriasClave()
      .then((lista) => vivo && setCategorias(lista))
      .catch(() => vivo && setCategorias([]));
    return () => {
      vivo = false;
    };
  }, [esDePieza]);

  useEffect(() => {
    if (esDePieza || !categoria) return undefined;
    let vivo = true;
    setCarga({ estado: "cargando", error: null });
    getPalabraDelDia(categoria)
      .then((r) => {
        if (!vivo) return;
        setReto(r);
        setCarga({ estado: "lista", error: null });
        recordarCategoria(categoria);
      })
      .catch((err) => vivo && setCarga({ estado: "error", error: err }));
    return () => {
      vivo = false;
    };
  }, [esDePieza, categoria, reintento]);

  // —— La partida ——
  const solucion = reto?.palabra ?? "";
  const largo = normalizar(solucion).length;
  const idPartida = reto ? idDePartida({ dia: reto.dia, categoria: reto.categoria, slug: pieza?.slug }) : null;

  const [partida, setPartida] = useState({ intentos: [], estado: "jugando" });
  const [actual, setActual] = useState("");
  const [aviso, setAviso] = useState("");
  const [tiembla, setTiembla] = useState(false);
  const [revelando, setRevelando] = useState(false);
  const [pistaVisible, setPistaVisible] = useState(false);
  const [stats, setStats] = useState(null);
  const [piezaDondeSale, setPiezaDondeSale] = useState(null);
  const [dolar, setDolar] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef(null);
  const tableroRef = useRef(null);

  // Al cambiar de reto, se recupera lo jugado (o se empieza de cero).
  useEffect(() => {
    if (!idPartida) return;
    setPartida(leerPartida(idPartida));
    setActual("");
    setAviso("");
    setPistaVisible(false);
    setRevelando(false);
    setCopiado(false);
  }, [idPartida]);

  const terminada = partida.estado !== "jugando";
  const pintas = useMemo(() => partida.intentos.map((i) => evaluar(i, solucion)), [partida.intentos, solucion]);
  const teclado = useMemo(() => estadoDelTeclado(partida.intentos, solucion), [partida.intentos, solucion]);
  const hoy = reto?.dia ?? null;

  // La pantalla final: estadísticas, dónde sale la palabra y el dólar.
  useEffect(() => {
    if (!terminada || revelando) return undefined;
    setStats(estadisticas(hoy));
    let vivo = true;
    getMarketTicker()
      .then((c) => vivo && setDolar(datoDelDolar(c)))
      .catch(() => {});
    if (!esDePieza && solucion) {
      buscarPiezaConPalabra(solucion).then((p) => vivo && setPiezaDondeSale(p));
    }
    return () => {
      vivo = false;
    };
  }, [terminada, revelando, hoy, esDePieza, solucion]);

  const avisar = useCallback((texto) => {
    setAviso(texto);
    setTiembla(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setTiembla(false);
      setAviso("");
    }, 1400);
  }, []);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const probar = useCallback(() => {
    if (terminada || revelando || !idPartida) return;
    if (actual.length < largo) {
      avisar(t("juegos.clave.avisos.pocasLetras", { n: largo }));
      return;
    }
    const intentos = [...partida.intentos, actual];
    const gano = acerto(actual, solucion);
    const estado = gano ? "gano" : intentos.length >= MAX_INTENTOS ? "perdio" : "jugando";
    const nueva = { intentos, estado };
    setPartida(nueva);
    setActual("");
    guardarPartida(idPartida, nueva);
    // Las letras se voltean una a una; lo que viene después espera a la última.
    setRevelando(true);
    setTimeout(() => setRevelando(false), largo * MS_POR_LETRA + 350);
    if (estado !== "jugando") {
      apuntar({ hoy, gano, intentos: intentos.length, esDelDia: !esDePieza });
    }
  }, [terminada, revelando, idPartida, actual, largo, avisar, t, partida.intentos, solucion, hoy, esDePieza]);

  const teclear = useCallback(
    (tecla) => {
      if (terminada || revelando) return;
      if (tecla === "ENTER") {
        probar();
      } else if (tecla === "BORRAR") {
        setActual((a) => a.slice(0, -1));
      } else {
        setActual((a) => (a.length < largo ? a + tecla : a));
      }
    },
    [terminada, revelando, probar, largo]
  );

  // El teclado físico, mientras el tablero esté en pantalla y nadie escriba en otro sitio.
  useEffect(() => {
    if (!reto || terminada) return undefined;
    const escuchar = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      if (e.key === "Enter") {
        e.preventDefault();
        teclear("ENTER");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        teclear("BORRAR");
      } else if (e.key.length === 1 && /^[a-zñ]$/i.test(e.key)) {
        teclear(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", escuchar);
    return () => window.removeEventListener("keydown", escuchar);
  }, [reto, terminada, teclear]);

  // —— Lo que se comparte ——
  const nombreCategoria = reto?.categoria ? t(`juegos.clave.categorias.${reto.categoria}`) : "";
  const direccion = `${SITIO}${ruta(esDePieza && pieza.ruta ? pieza.ruta : reto?.categoria ? `/clave?c=${reto.categoria}` : "/clave")}`;
  const resultadoCorto = partida.estado === "gano" ? `${partida.intentos.length}/${MAX_INTENTOS}` : `X/${MAX_INTENTOS}`;
  const fraseDelResultado = () =>
    esDePieza
      ? t("juegos.clave.compartir.pieza", { marca: BRAND.name, resultado: resultadoCorto })
      : t("juegos.clave.compartir.dia", {
          marca: BRAND.name,
          categoria: nombreCategoria,
          fecha: formatearFecha(hoy, "diaMes"),
          resultado: resultadoCorto,
        });
  const textoDelResultado = () => `${fraseDelResultado()}\n${cuadricula(partida.intentos, solucion)}\n${direccion}`;
  const fraseDeInvitacion = () =>
    t("juegos.clave.invitar.mensaje", {
      marca: BRAND.name,
      categoria: nombreCategoria,
      letras: t("juegos.clave.letras", { n: largo }),
    });
  const textoDeInvitacion = () => `${fraseDeInvitacion()} ${direccion}`;

  const copiarResultado = async () => {
    try {
      await navigator.clipboard.writeText(textoDelResultado());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin portapapeles: quedan WhatsApp y las redes */
    }
  };

  const cambiarCategoria = () => {
    setCategoria(null);
    setReto(null);
    setCarga({ estado: "idle", error: null });
    setPiezaDondeSale(null);
  };

  // —— Las pantallas ——

  /** Elegir de qué va la palabra. */
  if (!esDePieza && !categoria) {
    return (
      <section className="se-clave se-clave--elegir" aria-labelledby="clave-elegir">
        <div className="se-clave__paisaje">
          <PaisajeClave escena="tepuy" />
          <p className="se-clave__kicker se-clave__kicker--sobre">{t("juegos.clave.titulo")}</p>
        </div>
        <h2 id="clave-elegir" className="se-clave__pregunta">{t("juegos.clave.elegir")}</h2>
        {categorias === null ? (
          <p className="se-clave__nota">{t("juegos.clave.cargando")}</p>
        ) : categorias.length === 0 ? (
          <p className="se-clave__nota">{t("juegos.clave.sinPalabras")}</p>
        ) : (
          <div className="se-clave__categorias" role="list">
            {categorias.map((c) => (
              <button
                key={c.categoria}
                type="button"
                role="listitem"
                className={`se-clave__categoria se-clave__categoria--${c.categoria}`}
                onClick={() => setCategoria(c.categoria)}
              >
                {/* La inicial en una celda del tablero: el juego presentándose a sí mismo. */}
                <span className="se-clave__categoria-inicial" aria-hidden="true">
                  {t(`juegos.clave.categorias.${c.categoria}`).charAt(0)}
                </span>
                <span className="se-clave__categoria-texto">
                  <span className="se-clave__categoria-nombre">{t(`juegos.clave.categorias.${c.categoria}`)}</span>
                  <span className="se-clave__categoria-total">{t("juegos.clave.palabras", { n: c.total })}</span>
                </span>
                <span className="se-clave__categoria-flecha" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        )}
        {/* Las reglas, enseñadas y no solo dichas: una fila de muestra con las tres pintas. */}
        <div className="se-clave__reglas" role="list">
          {[
            ["bien", "C"],
            ["casi", "L"],
            ["no", "A"],
          ].map(([pinta, letra]) => (
            <div key={pinta} className="se-clave__regla" role="listitem">
              <span className={`se-clave__celda se-clave__celda--${pinta} se-clave__celda--muestra`} aria-hidden="true">
                {letra}
              </span>
              <span className="se-clave__regla-texto">{t(`juegos.clave.reglas.${pinta}`)}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (carga.estado === "cargando" || (carga.estado === "idle" && !reto)) {
    return (
      <section className="se-clave se-clave--aviso" aria-busy="true">
        <p className="se-clave__nota">{t("juegos.clave.cargando")}</p>
      </section>
    );
  }

  if (carga.estado === "error" || !reto) {
    const sinPalabras = carga.error?.status === 404;
    return (
      <section className="se-clave se-clave--aviso">
        <p className="se-clave__nota">{sinPalabras ? t("juegos.clave.sinPalabras") : t("juegos.clave.error")}</p>
        <div className="se-clave__acciones">
          {!sinPalabras ? (
            <button type="button" className="se-clave__boton" onClick={() => setReintento((n) => n + 1)}>
              {t("juegos.clave.reintentar")}
            </button>
          ) : null}
          <button type="button" className="se-clave__secundario" onClick={cambiarCategoria}>
            {t("juegos.clave.cambiar")}
          </button>
        </div>
      </section>
    );
  }

  const filaActiva = partida.intentos.length;
  const muestraFinal = terminada && !revelando;
  const puedePista = Boolean(reto.pista) && !terminada && partida.intentos.length >= INTENTOS_PARA_PISTA;

  return (
    <section className="se-clave" aria-label={t("juegos.clave.titulo")}>
      <div className="se-clave__paisaje">
        <PaisajeClave escena={esDePieza ? "avila" : escenaDe(reto.categoria)} />
      </div>
      <header className="se-clave__cabeza">
        <div>
          <p className="se-clave__kicker">{t("juegos.clave.titulo")}</p>
          <p className="se-clave__reto">
            {esDePieza
              ? t("juegos.clave.retoPieza", { letras: t("juegos.clave.letras", { n: largo }) })
              : t("juegos.clave.reto", {
                  fecha: formatearFecha(hoy, "diaMes"),
                  categoria: nombreCategoria,
                  letras: t("juegos.clave.letras", { n: largo }),
                })}
          </p>
        </div>
        {!esDePieza ? (
          <button type="button" className="se-clave__cambiar" onClick={cambiarCategoria}>
            {t("juegos.clave.cambiar")}
          </button>
        ) : null}
      </header>

      <div className="se-clave__aviso" role="status" aria-live="polite">
        {aviso || (copiado ? t("juegos.clave.fin.copiado") : "")}
      </div>

      <div
        ref={tableroRef}
        className="se-clave__tablero"
        style={{ "--clave-largo": largo }}
        role="grid"
        aria-rowcount={MAX_INTENTOS}
        aria-colcount={largo}
      >
        {Array.from({ length: MAX_INTENTOS }, (_, i) => {
          if (i < filaActiva) {
            return (
              <Fila
                key={i}
                letras={normalizar(partida.intentos[i])}
                pintas={pintas[i]}
                largo={largo}
                revela={revelando && i === filaActiva - 1}
              />
            );
          }
          if (i === filaActiva && !terminada) {
            return <Fila key={i} letras={actual} largo={largo} tiembla={tiembla} activa />;
          }
          return <Fila key={i} letras="" largo={largo} />;
        })}
      </div>

      {puedePista ? (
        <div className="se-clave__pista">
          {pistaVisible ? (
            <p className="se-clave__pista-texto">{t("juegos.clave.pista.texto", { pista: reto.pista })}</p>
          ) : (
            <button type="button" className="se-clave__secundario" onClick={() => setPistaVisible(true)}>
              {t("juegos.clave.pista.boton")}
            </button>
          )}
        </div>
      ) : null}

      {!terminada ? (
        <div className="se-clave__teclado" aria-label={t("juegos.clave.teclado.etiqueta")}>
          {FILAS_DEL_TECLADO.map((fila, i) => (
            <div key={i} className="se-clave__teclas">
              {fila.map((tecla) => {
                const especial = tecla === "ENTER" || tecla === "BORRAR";
                const pinta = teclado[tecla];
                return (
                  <button
                    key={tecla}
                    type="button"
                    className={`se-clave__tecla${especial ? " se-clave__tecla--ancha" : ""}${tecla === "ENTER" ? " se-clave__tecla--probar" : ""}${pinta ? ` se-clave__tecla--${pinta}` : ""}`}
                    onClick={() => teclear(tecla)}
                    aria-label={tecla === "ENTER" ? t("juegos.clave.teclado.enter") : tecla === "BORRAR" ? t("juegos.clave.teclado.borrar") : undefined}
                  >
                    {tecla === "ENTER" ? t("juegos.clave.teclado.enter") : tecla === "BORRAR" ? <IconoBorrar /> : tecla}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {muestraFinal ? (
        <div className="se-clave__final">
          <p className="se-clave__final-kicker">
            {partida.estado === "gano"
              ? t("juegos.clave.fin.enIntentos", { n: partida.intentos.length })
              : t("juegos.clave.fin.sinAcertar")}
          </p>
          <h2 className="se-clave__final-titulo">
            {partida.estado === "gano" ? t("juegos.clave.fin.gano") : t("juegos.clave.fin.perdio")}
          </h2>
          <p className="se-clave__palabra">
            <span className="se-clave__palabra-letras">{reto.palabra}</span>
            {reto.definicion ? <span className="se-clave__definicion">{reto.definicion}</span> : null}
          </p>

          {/* El remate: de la palabra a la lectura. */}
          {piezaDondeSale ? (
            <p className="se-clave__dato">
              {t("juegos.clave.fin.saleEn")}{" "}
              <Enlace to={rutaDePieza({ formatoApi: piezaDondeSale.content_format?.slug, slug: piezaDondeSale.slug })}>
                {piezaDondeSale.title}
              </Enlace>
            </p>
          ) : null}
          <p className="se-clave__dato">
            {dolar ? <>{t("juegos.clave.fin.dolar", { valor: <strong>{dolar}</strong> })} </> : null}
            <Enlace to={NOTICIAS}>{t("juegos.clave.fin.verNoticias")}</Enlace>
          </p>

          {stats ? (
            <div className="se-clave__stats">
              <dl className="se-clave__cifras">
                <div><dt>{t("juegos.clave.fin.stats.jugadas")}</dt><dd>{formatearNumero(stats.jugadas)}</dd></div>
                <div><dt>{t("juegos.clave.fin.stats.acertadas")}</dt><dd>{stats.jugadas ? Math.round((stats.ganadas / stats.jugadas) * 100) : 0}%</dd></div>
                <div><dt>{t("juegos.clave.fin.stats.racha")}</dt><dd>{formatearNumero(stats.racha)}</dd></div>
                <div><dt>{t("juegos.clave.fin.stats.mejorRacha")}</dt><dd>{formatearNumero(stats.mejorRacha)}</dd></div>
              </dl>
              <p className="se-clave__stats-titulo">{t("juegos.clave.fin.distribucion")}</p>
              <Distribucion distribucion={stats.distribucion} destacado={partida.estado === "gano" ? partida.intentos.length : undefined} />
            </div>
          ) : null}

          <pre className="se-clave__cuadricula" aria-label={t("juegos.clave.fin.cuadricula")}>{cuadricula(partida.intentos, solucion)}</pre>

          <div className="se-clave__acciones">
            <a className="se-clave__whatsapp" href={enlaceWhatsApp(textoDelResultado())} target="_blank" rel="noopener noreferrer">
              <IconoWhatsApp className="se-clave__icono" />
              {t("juegos.clave.fin.whatsapp")}
            </a>
            <button type="button" className="se-clave__secundario" onClick={copiarResultado}>
              <IconoCopiar />
              {copiado ? t("juegos.clave.fin.copiado") : t("juegos.clave.fin.copiar")}
            </button>
            <div className="se-clave__redes">
              <span className="se-clave__redes-texto">{t("juegos.clave.otrasRedes")}</span>
              <ShareButtons url={direccion} title={fraseDelResultado()} redes={REDES_DEL_JUEGO} />
            </div>
          </div>

          <p className="se-clave__nota">{esDePieza ? t("juegos.clave.fin.masEnClave") : t("juegos.clave.fin.manana")}</p>
          <div className="se-clave__acciones">
            {esDePieza ? (
              <Enlace className="se-clave__boton" to="/clave">{t("juegos.clave.fin.irAClave")}</Enlace>
            ) : (
              <button type="button" className="se-clave__boton" onClick={cambiarCategoria}>
                {t("juegos.clave.fin.otraCategoria")}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {!terminada ? (
        <div className="se-clave__invitar">
          <p className="se-clave__invitar-texto">{t("juegos.clave.invitar.texto")}</p>
          <a className="se-clave__whatsapp" href={enlaceWhatsApp(textoDeInvitacion())} target="_blank" rel="noopener noreferrer">
            <IconoWhatsApp className="se-clave__icono" />
            {t("juegos.clave.invitar.boton")}
          </a>
          <div className="se-clave__redes">
            <span className="se-clave__redes-texto">{t("juegos.clave.otrasRedes")}</span>
            <ShareButtons url={direccion} title={fraseDeInvitacion()} redes={REDES_DEL_JUEGO} />
          </div>
        </div>
      ) : null}
    </section>
  );
};

Clave.propTypes = {
  /** La palabra de una pieza: `{ palabra, pista, slug, ruta }`. Sin ella, se juega la del día. */
  pieza: PropTypes.shape({
    palabra: PropTypes.string.isRequired,
    pista: PropTypes.string,
    slug: PropTypes.string.isRequired,
    ruta: PropTypes.string,
  }),
  /** La categoría con la que abrir (por ejemplo, la del enlace que se compartió). */
  categoriaInicial: PropTypes.string,
};
Clave.defaultProps = { pieza: undefined, categoriaInicial: undefined };

export default Clave;
