import PropTypes from "prop-types";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { getEnVivo, getResumen } from "../../services/adminAnaliticaService";

/**
 * Audiencia: quién lee ahora y qué pasó en el periodo.
 *
 * Los números salen de la medición propia del sitio -- ver `lib/analitica.js` y
 * `analitica_service.py` --, así que cuentan solo a quien aceptó las cookies. Eso lo dice
 * la pantalla en voz alta: un panel de audiencia que no lo advierta se lee como si fueran
 * todos los lectores, y no lo son.
 *
 * ## Cómo está armada
 *
 * **Una cifra grande, y solo una.** Los lectores de ahora. Lo demás son fichas pequeñas
 * y gráficos: si todo grita, no se oye nada.
 *
 * **Cada número lleva su periodo anterior.** «1.240 visitas» no es información; «1.240,
 * un 18 % más que la semana pasada» sí. El color de la variación indica dirección, y va
 * siempre con su signo escrito, que es lo que la hace legible sin distinguir colores.
 *
 * **Los tiempos de lectura van en tramos, no en media.** Una media junta al que rebotó a
 * los diez segundos con el que leyó diez minutos y devuelve un número que no describe a
 * ninguno de los dos. «Cuántos se quedaron» sí se contesta.
 *
 * **Un filtro, arriba, para todo.** No hay filtros dentro de las tarjetas: el periodo
 * manda sobre todos los bloques a la vez.
 *
 * ## Sobre los gráficos
 *
 * Dibujados a mano en SVG y CSS, sin librería: son cuatro formas simples y una
 * dependencia de gráficos pesaría más que la pantalla entera.
 *
 * Todos son de **una sola serie** -- magnitud, no identidad --, así que llevan un solo
 * color y no hacen falta leyendas. La excepción es la rampa de los tramos de lectura,
 * que sí tiene orden natural (de menos a más tiempo) y por eso usa una escala de un
 * mismo tono, de claro a oscuro. Los tonos están comprobados contra fondo blanco: la
 * rampa es monótona en luminosidad, mantiene un tono único y su paso más claro supera el
 * contraste mínimo -- si alguien la retoca a ojo, es fácil romper eso sin notarlo.
 *
 * Y ninguno deja un dato solo en el globo del ratón: cada bloque tiene su tabla
 * equivalente detrás del botón «tabla», que es la versión que funciona con lector de
 * pantalla, con el teclado y al imprimir.
 */

const PERIODOS = [
  { dias: 7, etiqueta: "7 días" },
  { dias: 30, etiqueta: "30 días" },
  { dias: 90, etiqueta: "90 días" },
];

const REFRESCO_EN_VIVO = 20000;

const NOMBRE_FORMATO = {
  noticias: "Noticias",
  articulos: "Artículos",
  editorial: "Editorial",
  entrevistas: "Entrevistas",
  informes: "Informes",
  podcast: "Podcast",
};

/** 95 -> «1 min 35 s». Un promedio en segundos sueltos no se lee de un vistazo. */
const duracion = (segundos) => {
  const n = Math.max(0, Math.round(segundos || 0));
  if (n < 60) return `${n} s`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
};

const numero = (n) => new Intl.NumberFormat("es").format(Math.round(n || 0));

/** «hace 40 s», «hace 3 min». Dice cuándo se miró, que en un panel en vivo es la mitad. */
const desdeHace = (marca, ahora) => {
  const s = Math.max(0, Math.round((ahora - marca) / 1000));
  if (s < 10) return "recién actualizado";
  if (s < 60) return `actualizado hace ${s} s`;
  const m = Math.round(s / 60);
  return `actualizado hace ${m} min`;
};

const diaCorto = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("es", { day: "numeric", month: "short" });
};

const diaLargo = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
};

/** El ancho real del contenedor. Los gráficos se dibujan en píxeles, no en porcentajes. */
const useAncho = () => {
  const ref = useRef(null);
  const [ancho, setAncho] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const medir = () => setAncho(el.clientWidth);
    medir();
    // `ResizeObserver` y no el evento `resize` de la ventana: la barra lateral del panel
    // se pliega sin que la ventana cambie de tamaño, y entonces el gráfico se quedaría
    // dibujado al ancho de antes.
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, ancho];
};

/* ─── Piezas ───────────────────────────────────────────────────────────────── */

/** La variación contra el periodo anterior. Signo escrito: el color solo acompaña. */
const Variacion = ({ actual, anterior }) => {
  if (!anterior) {
    return <span className="se-aud__delta se-aud__delta--nuevo">sin periodo anterior</span>;
  }
  const pct = Math.round(((actual - anterior) / anterior) * 100);
  const signo = pct > 0 ? "+" : "";
  const clase = pct > 0 ? "sube" : pct < 0 ? "baja" : "igual";
  return (
    <span className={`se-aud__delta se-aud__delta--${clase}`}>
      {signo}
      {pct} % vs. periodo anterior
    </span>
  );
};

Variacion.propTypes = { actual: PropTypes.number.isRequired, anterior: PropTypes.number };

/**
 * `valor` puede llegar vacío cuando el servidor es más viejo que esta pantalla -- se
 * despliegan por separado. Entonces se dibuja una raya: «no lo sé» es una respuesta;
 * «undefined %» es un fallo escrito en la cara del lector.
 */
const Ficha = ({ valor, etiqueta, nota, children }) => (
  <div className="se-aud__ficha">
    <span className="se-aud__ficha-valor">
      {valor === null || valor === undefined || valor === "" ? "—" : valor}
    </span>
    <span className="se-aud__ficha-etiqueta">{etiqueta}</span>
    {children}
    {nota ? <span className="se-aud__ficha-nota">{nota}</span> : null}
  </div>
);

Ficha.propTypes = {
  // Sin `isRequired`: `null` es un valor legitimo aqui -- significa "el servidor no
  // manda ese dato" -- y se dibuja como una raya.
  valor: PropTypes.node,
  etiqueta: PropTypes.string.isRequired,
  nota: PropTypes.string,
  children: PropTypes.node,
};

/**
 * Una tarjeta con su gráfico y su tabla.
 *
 * La tabla no es un extra de accesibilidad colgado al final: es la misma información sin
 * depender de la vista ni del ratón, y por eso el botón está donde se ve.
 */
const Bloque = ({ titulo, apunte, tabla, children, vacio }) => {
  const [verTabla, setVerTabla] = useState(false);
  const id = `aud-${titulo.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section className="se-aud__bloque" aria-labelledby={id}>
      <div className="se-aud__bloque-cabeza">
        <div>
          <h3 id={id} className="se-aud__h3">
            {titulo}
          </h3>
          {apunte ? <p className="se-aud__apunte">{apunte}</p> : null}
        </div>
        {tabla ? (
          <button
            type="button"
            className="se-aud__ver-tabla"
            aria-pressed={verTabla}
            onClick={() => setVerTabla((v) => !v)}
          >
            {verTabla ? "Gráfico" : "Tabla"}
          </button>
        ) : null}
      </div>
      {vacio ? (
        <p className="se-admin-meta-hint">Sin datos en el periodo.</p>
      ) : verTabla ? (
        <div className="se-aud__tabla-caja">{tabla}</div>
      ) : (
        children
      )}
    </section>
  );
};

Bloque.propTypes = {
  titulo: PropTypes.string.isRequired,
  apunte: PropTypes.string,
  tabla: PropTypes.node,
  children: PropTypes.node,
  vacio: PropTypes.bool,
};

/* ─── Gráfico de área: visitas por día ─────────────────────────────────────── */

const ALTO_SERIE = 190;
const MARGEN = { arriba: 14, derecha: 8, abajo: 26, izquierda: 42 };

/**
 * Topes limpios para el eje: 0 / 10 / 20, nunca 0 / 7,33 / 14,66.
 *
 * Y siempre par, porque el eje dibuja tambien el punto medio: con un tope de 25 la
 * marca de en medio salia "13", que no es la mitad de nada.
 */
const techo = (max) => {
  if (max <= 4) return 4;
  const mag = 10 ** Math.floor(Math.log10(max));
  const t = Math.ceil(max / (mag / 2)) * (mag / 2);
  return t % 2 === 0 ? t : t + 1;
};

const SerieDiaria = ({ serie }) => {
  const [ref, ancho] = useAncho();
  const [activo, setActivo] = useState(null);

  const max = Math.max(1, ...serie.map((d) => d.sesiones));
  const tope = techo(max);
  const anchoPlot = Math.max(10, ancho - MARGEN.izquierda - MARGEN.derecha);
  const altoPlot = ALTO_SERIE - MARGEN.arriba - MARGEN.abajo;
  const x = (i) =>
    MARGEN.izquierda + (serie.length > 1 ? (i / (serie.length - 1)) * anchoPlot : anchoPlot / 2);
  const y = (v) => MARGEN.arriba + altoPlot - (v / tope) * altoPlot;

  const linea = serie.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.sesiones)}`).join(" ");
  const area = `${linea} L${x(serie.length - 1)},${MARGEN.arriba + altoPlot} L${x(0)},${
    MARGEN.arriba + altoPlot
  } Z`;

  const cima = serie.reduce((a, b) => (b.sesiones > a.sesiones ? b : a), serie[0]);
  const iCima = serie.indexOf(cima);

  const alMover = (e) => {
    const caja = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - caja.left;
    const i = Math.round(
      ((px - MARGEN.izquierda) / anchoPlot) * (serie.length - 1)
    );
    setActivo(Math.min(serie.length - 1, Math.max(0, i)));
  };

  return (
    <div className="se-aud__grafico" ref={ref}>
      {ancho > 0 ? (
        <>
          <svg
            width={ancho}
            height={ALTO_SERIE}
            role="img"
            aria-label={`Visitas por día. Máximo ${cima.sesiones} el ${diaLargo(cima.fecha)}.`}
            onMouseMove={alMover}
            onMouseLeave={() => setActivo(null)}
          >
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line
                  className="se-aud__rejilla"
                  x1={MARGEN.izquierda}
                  x2={ancho - MARGEN.derecha}
                  y1={y(tope * f)}
                  y2={y(tope * f)}
                />
                <text
                  className="se-aud__tick"
                  textAnchor="end"
                  x={MARGEN.izquierda - 8}
                  y={y(tope * f) + 4}
                >
                  {numero(tope * f)}
                </text>
              </g>
            ))}

            <path className="se-aud__area" d={area} />
            <path className="se-aud__linea" d={linea} />

            {/* La cima, etiquetada. Un número en cada punto sería ilegible; el máximo es
                el dato que se busca al mirar una serie. */}
            <circle className="se-aud__punto" cx={x(iCima)} cy={y(cima.sesiones)} r="4" />

            {activo != null ? (
              <g>
                <line
                  className="se-aud__cruz"
                  x1={x(activo)}
                  x2={x(activo)}
                  y1={MARGEN.arriba}
                  y2={MARGEN.arriba + altoPlot}
                />
                <circle
                  className="se-aud__punto se-aud__punto--activo"
                  cx={x(activo)}
                  cy={y(serie[activo].sesiones)}
                  r="4"
                />
              </g>
            ) : null}

            {serie.map((d, i) =>
              i === 0 || i === serie.length - 1 || i === Math.floor(serie.length / 2) ? (
                <text
                  key={d.fecha}
                  className="se-aud__tick"
                  x={x(i)}
                  y={ALTO_SERIE - 8}
                  textAnchor={i === 0 ? "start" : i === serie.length - 1 ? "end" : "middle"}
                >
                  {diaCorto(d.fecha)}
                </text>
              ) : null
            )}
          </svg>

          {activo != null ? (
            <div
              className="se-aud__globo"
              style={{
                left: `${Math.min(Math.max(x(activo), 70), ancho - 70)}px`,
              }}
            >
              <strong>{diaLargo(serie[activo].fecha)}</strong>
              <span>
                {numero(serie[activo].sesiones)} visitas · {numero(serie[activo].personas)}{" "}
                navegadores
              </span>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

SerieDiaria.propTypes = { serie: PropTypes.arrayOf(PropTypes.object).isRequired };

/* ─── Columnas ─────────────────────────────────────────────────────────────── */

/**
 * Columnas verticales. `rampa` solo cuando las categorías tienen orden natural: pintar
 * más oscuro lo más grande en categorías sin orden repite con el color lo que ya dice la
 * altura, y gasta el único canal libre que quedaba.
 */
const Columnas = ({ datos, rampa, formatoEtiqueta }) => {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <ul className={`se-aud__columnas${rampa ? " se-aud__columnas--rampa" : ""}`}>
      {datos.map((d, i) => (
        <li key={d.etiqueta} className="se-aud__columna" title={`${d.etiqueta}: ${numero(d.valor)}`}>
          <span className="se-aud__columna-caja">
            <span
              className="se-aud__columna-marca"
              data-paso={rampa ? i : undefined}
              style={{ height: `${Math.max(d.valor > 0 ? 2 : 0, (d.valor / max) * 100)}%` }}
            />
          </span>
          <span className="se-aud__columna-pie">
            {formatoEtiqueta ? formatoEtiqueta(d.etiqueta, i) : d.etiqueta}
          </span>
        </li>
      ))}
    </ul>
  );
};

Columnas.propTypes = {
  datos: PropTypes.arrayOf(PropTypes.object).isRequired,
  rampa: PropTypes.bool,
  formatoEtiqueta: PropTypes.func,
};

/* ─── Barras horizontales ──────────────────────────────────────────────────── */

const Barras = ({ datos, enlazar }) => {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <ul className="se-aud__barras">
      {datos.map((d) => (
        <li key={d.clave} className="se-aud__fila">
          {enlazar ? (
            <a
              className="se-aud__etiqueta se-aud__etiqueta--enlace"
              href={d.clave}
              target="_blank"
              rel="noreferrer"
              title={d.clave}
            >
              {d.etiqueta}
            </a>
          ) : (
            <span className="se-aud__etiqueta" title={d.etiqueta}>
              {d.etiqueta}
            </span>
          )}
          <span className="se-aud__pista">
            <span
              className="se-aud__marca"
              style={{ width: `${Math.max(2, (d.valor / max) * 100)}%` }}
            />
          </span>
          <span className="se-aud__valor">
            {numero(d.valor)}
            {d.apunte ? <small> · {d.apunte}</small> : null}
          </span>
        </li>
      ))}
    </ul>
  );
};

Barras.propTypes = {
  datos: PropTypes.arrayOf(PropTypes.object).isRequired,
  enlazar: PropTypes.bool,
};

const Tabla = ({ columnas, filas }) => (
  <table className="se-aud__tabla">
    <thead>
      <tr>
        {columnas.map((c) => (
          <th key={c} scope="col">
            {c}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {filas.map((f, i) => (
        <tr key={i}>
          {f.map((celda, j) => (
            <td key={j}>{celda}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

Tabla.propTypes = {
  columnas: PropTypes.arrayOf(PropTypes.string).isRequired,
  filas: PropTypes.array.isRequired,
};

/* ─── La pantalla ──────────────────────────────────────────────────────────── */

export const AdminAnalitica = () => {
  const [vivo, setVivo] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [dias, setDias] = useState(7);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  // Cuando se cargo el RESUMEN. No el directo: ese se refresca solo cada veinte
  // segundos, asi que un sello atado a el diria "recien actualizado" eternamente. Lo que
  // envejece -- y para lo que esta el boton -- es el periodo.
  const [actualizado, setActualizado] = useState(() => Date.now());
  const [aMano, setAMano] = useState(false);
  // Un tic cada quince segundos solo para que «hace 40 s» siga siendo verdad. No pide
  // nada al servidor: repintar un texto es gratis, preguntar no.
  const [reloj, setReloj] = useState(() => Date.now());
  const montado = useRef(true);

  useEffect(() => {
    const t = window.setInterval(() => setReloj(Date.now()), 15000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const pedirVivo = useCallback(async () => {
    try {
      const datos = await getEnVivo();
      if (montado.current) setVivo(datos);
    } catch (e) {
      // Un fallo del directo no borra lo que ya se está viendo: se queda el último
      // número bueno. Lo que no puede pasar es que la pantalla se vacíe sola.
      if (montado.current) setError(adminErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    pedirVivo();
    let t = window.setInterval(pedirVivo, REFRESCO_EN_VIVO);
    const alCambiar = () => {
      window.clearInterval(t);
      if (document.visibilityState === "visible") {
        pedirVivo();
        t = window.setInterval(pedirVivo, REFRESCO_EN_VIVO);
      }
    };
    document.addEventListener("visibilitychange", alCambiar);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", alCambiar);
    };
  }, [pedirVivo]);

  const [recarga, setRecarga] = useState(0);

  /**
   * Volver a pedirlo todo, ahora.
   *
   * El directo ya se refresca solo cada veinte segundos, pero el resumen no -- no cambia
   * de un minuto a otro -- y hasta ahora la única forma de verlo al día era recargar la
   * página entera, que además devolvía el periodo a siete días. Esto pide las dos cosas
   * y conserva lo que estabas mirando.
   */
  const actualizar = useCallback(async () => {
    setAMano(true);
    setRecarga((n) => n + 1);
    await pedirVivo();
    if (montado.current) setAMano(false);
  }, [pedirVivo]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    getResumen(dias)
      .then((datos) => {
        if (vigente && montado.current) {
          setResumen(datos);
          setError("");
          setActualizado(Date.now());
        }
      })
      .catch((e) => {
        if (vigente && montado.current) setError(adminErrorMessage(e));
      })
      .finally(() => {
        if (vigente && montado.current) setCargando(false);
      });
    return () => {
      // Si se cambia de periodo con una petición en vuelo, la vieja no puede pisar a la
      // nueva: sin esto, pulsar 90 y luego 7 deja en pantalla los datos de 90.
      vigente = false;
    };
  }, [dias, recarga]);

  const r = resumen;
  const nada = !cargando && r && r.sesiones === 0 && !vivo?.lectores;

  return (
    <div className="se-admin-shell se-aud">
      <header className="se-admin-shell__header se-aud__cabecera">
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>
            Audiencia
          </h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem", maxWidth: "70ch" }}>
            Medición propia, sin herramientas de terceros. Cuenta solo a quien aceptó las
            cookies, así que todo lo de aquí es un suelo: la audiencia real es algo mayor.
          </p>
        </div>
        {/* Un solo filtro, arriba, y manda sobre todos los bloques. */}
        <div className="se-aud__mandos">
          <div className="se-aud__periodos" role="group" aria-label="Periodo">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                type="button"
                className={`se-aud__periodo${dias === p.dias ? " se-aud__periodo--on" : ""}`}
                aria-pressed={dias === p.dias}
                onClick={() => setDias(p.dias)}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>

          <div className="se-aud__refresco">
            <button
              type="button"
              className="se-aud__actualizar"
              onClick={actualizar}
              disabled={aMano || cargando}
            >
              <span className="se-aud__actualizar-icono" aria-hidden="true">
                ↻
              </span>
              {aMano ? "Actualizando…" : "Actualizar"}
            </button>
            {/* `aria-live` para que quien no ve la pantalla se entere de que hay datos
                nuevos; `polite` porque no es una urgencia que deba cortar la lectura. */}
            <span className="se-aud__sello" aria-live="polite">
              {desdeHace(actualizado, reloj)}
            </span>
          </div>
        </div>
      </header>

      {error ? (
        <p className="se-admin-form-feedback" role="alert">
          {error}
        </p>
      ) : null}

      {nada ? (
        <p className="se-admin-meta-hint">
          Todavía no hay nada que enseñar. Aparecerá en cuanto alguien acepte las cookies y
          empiece a leer.
        </p>
      ) : null}

      {/* La única cifra grande de la pantalla. */}
      <section className="se-aud__directo" aria-labelledby="aud-directo">
        <div className="se-aud__directo-cifra">
          <h2 id="aud-directo" className="se-aud__directo-rotulo">
            <span className="se-aud__pulso" aria-hidden="true" />
            Leyendo ahora
          </h2>
          <span className="se-aud__heroe">{vivo ? numero(vivo.lectores) : "—"}</span>
          <p className="se-aud__directo-nota">
            visitas activas en los últimos {vivo?.ventana_minutos ?? 5} minutos ·{" "}
            {numero(vivo?.personas ?? 0)} navegadores distintos. Dos pestañas de la misma
            persona suman dos arriba y uno aquí.
          </p>
        </div>

        <div className="se-aud__directo-lista">
          {vivo?.paginas?.length ? (
            <Barras
              enlazar
              datos={vivo.paginas.map((p) => ({
                clave: p.ruta,
                etiqueta: p.ruta,
                valor: p.lectores,
              }))}
            />
          ) : (
            <p className="se-admin-meta-hint">Nadie leyendo en este momento.</p>
          )}
        </div>
      </section>

      {cargando && !r ? (
        <p className="se-admin-meta-hint">Cargando…</p>
      ) : r ? (
        <div className={`se-aud__cuerpo${cargando ? " se-aud__cuerpo--esperando" : ""}`}>
          <div className="se-aud__fichas">
            <Ficha valor={numero(r.sesiones)} etiqueta="visitas">
              <Variacion actual={r.sesiones} anterior={r.anterior?.sesiones} />
            </Ficha>
            <Ficha valor={numero(r.personas)} etiqueta="navegadores distintos">
              <Variacion actual={r.personas} anterior={r.anterior?.personas} />
            </Ficha>
            <Ficha
              valor={numero(r.recurrentes)}
              etiqueta="volvieron"
              nota="entraron más de una vez en el periodo"
            />
            <Ficha
              valor={r.paginas_por_visita}
              etiqueta="páginas por visita"
              nota="cuánto se navega dentro del sitio"
            />
            <Ficha
              valor={r.segundos_por_visita === null ? null : duracion(r.segundos_por_visita)}
              etiqueta="de lectura por visita"
              nota="solo tiempo con la pieza visible"
            />
            <Ficha
              valor={r.una_pagina === null ? null : `${r.una_pagina} %`}
              etiqueta="se van en la primera"
              nota="leyeron una página y salieron"
            />
          </div>

          <Bloque
            titulo="Visitas por día"
            apunte="Pase el ratón para ver un día concreto."
            vacio={!r.serie?.length}
            tabla={
              <Tabla
                columnas={["Día", "Visitas", "Navegadores"]}
                filas={(r.serie ?? []).map((d) => [diaLargo(d.fecha), numero(d.sesiones), numero(d.personas)])}
              />
            }
          >
            {r.serie?.length ? <SerieDiaria serie={r.serie} /> : null}
          </Bloque>

          <div className="se-aud__par">
            <Bloque
              titulo="Cuánto duran las lecturas"
              apunte="Cuántos se quedaron, que es lo que una media no dice."
              vacio={!r.profundidad?.some((t) => t.lecturas > 0)}
              tabla={
                <Tabla
                  columnas={["Tramo", "Lecturas"]}
                  filas={(r.profundidad ?? []).map((t) => [t.etiqueta, numero(t.lecturas)])}
                />
              }
            >
              <Columnas
                rampa
                datos={(r.profundidad ?? []).map((t) => ({
                  etiqueta: t.etiqueta,
                  valor: t.lecturas,
                }))}
              />
            </Bloque>

            <Bloque
              titulo="A qué hora leen"
              apunte={
                r.zona && r.zona !== "UTC"
                  ? "Visitas por hora del día, en su hora local, para saber cuándo conviene publicar."
                  : "Visitas por hora del día. Su navegador no informa de su zona horaria, así que están en hora UTC."
              }
              vacio={!r.horas?.some((h) => h.sesiones > 0)}
              tabla={
                <Tabla
                  columnas={["Hora", "Visitas"]}
                  filas={(r.horas ?? []).map((h) => [`${h.hora}:00`, numero(h.sesiones)])}
                />
              }
            >
              <Columnas
                datos={(r.horas ?? []).map((h) => ({ etiqueta: String(h.hora), valor: h.sesiones }))}
                formatoEtiqueta={(e, i) => (i % 6 === 0 ? `${e}h` : "")}
              />
            </Bloque>
          </div>

          <Bloque
            titulo="Por sección"
            vacio={!r.formatos?.length}
            tabla={
              <Tabla
                columnas={["Sección", "Lecturas", "Tiempo medio"]}
                filas={(r.formatos ?? []).map((f) => [
                  NOMBRE_FORMATO[f.formato] ?? f.formato,
                  numero(f.lecturas),
                  duracion(f.segundos_medios),
                ])}
              />
            }
          >
            <Barras
              datos={(r.formatos ?? []).map((f) => ({
                clave: f.formato,
                etiqueta: NOMBRE_FORMATO[f.formato] ?? f.formato,
                valor: f.lecturas,
                apunte: `${duracion(f.segundos_medios)} de media`,
              }))}
            />
          </Bloque>

          <Bloque
            titulo="Lo más leído"
            vacio={!r.piezas?.length}
            tabla={
              <Tabla
                columnas={["Pieza", "Lecturas", "Tiempo medio"]}
                filas={(r.piezas ?? []).map((p) => [
                  p.ruta,
                  numero(p.lecturas),
                  duracion(p.segundos_medios),
                ])}
              />
            }
          >
            <Barras
              enlazar
              datos={(r.piezas ?? []).map((p) => ({
                clave: p.ruta,
                etiqueta: p.ruta,
                valor: p.lecturas,
                apunte: `${duracion(p.segundos_medios)} de media`,
              }))}
            />
          </Bloque>

          <Bloque
            titulo="Por dónde se van"
            apunte="La última página de cada visita. Si una se repite mucho, algo termina ahí."
            vacio={!r.salidas?.length}
            tabla={
              <Tabla
                columnas={["Página", "Salidas"]}
                filas={(r.salidas ?? []).map((s) => [s.ruta, numero(s.salidas)])}
              />
            }
          >
            <Barras
              enlazar
              datos={(r.salidas ?? []).map((s) => ({
                clave: s.ruta,
                etiqueta: s.ruta,
                valor: s.salidas,
              }))}
            />
          </Bloque>
        </div>
      ) : null}

      <p className="se-aud__pie">
        El tiempo de lectura cuenta solo los segundos que la pieza estuvo{" "}
        <strong>visible</strong> en pantalla: una pestaña abierta de fondo no suma. Los
        registros se borran a los catorce meses, como dice el aviso de cookies.
      </p>
    </div>
  );
};

export default AdminAnalitica;
