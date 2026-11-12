import PropTypes from "prop-types";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import {
  DIAS_GUARDADOS,
  NOMBRE_FORMATO,
  desdeHace,
  diaCorto,
  diaLargo,
  duracion,
  numero,
  porciento,
} from "../../lib/audiencia";
import { ancla, recorridoAudiencia } from "../../lib/guias/guiaAudiencia";
import {
  descargarInforme,
  getConsentimiento,
  getEnVivo,
  getResumen,
} from "../../services/adminAnaliticaService";
import "../../styles/analitica-consentimiento.css";
import "../../styles/analitica-bloques.css";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";
import { AudienciaReal } from "../../components/admin/audiencia/AudienciaReal";
import { ComoVaElMes } from "../../components/admin/audiencia/ComoVaElMes";
import { CuantosVuelven } from "../../components/admin/audiencia/CuantosVuelven";
import { DeDondeLlegan } from "../../components/admin/audiencia/DeDondeLlegan";
import { PaisesYAparatos } from "../../components/admin/audiencia/PaisesYAparatos";
import { Barras, Bloque, Columnas, Ficha, Tabla, Variacion } from "../../components/admin/audiencia/Piezas";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";

/**
 * Audiencia: quién lee ahora y qué pasó en el periodo.
 *
 * Los números salen de la medición propia del sitio -- ver `lib/analitica.js` y
 * `analitica_service.py` --, así que cuentan solo a quien aceptó las cookies. Eso lo dice
 * la pantalla en voz alta: un panel de audiencia que no lo advierta se lee como si fueran
 * todos los lectores, y no lo son. Cuánto queda fuera lo estima «Audiencia real
 * estimada», con el contador de páginas, que no guarda nada de la persona.
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
 * manda sobre todos los bloques a la vez. Las dos excepciones lo dicen en su apunte:
 * «Cómo va el mes» es del mes en curso y «Cuántos vuelven» mira las últimas semanas.
 *
 * **La página ordena; los bloques viven aparte.** Aquí quedan la carga de los datos, la
 * cabecera y el orden. Las piezas comunes (ficha, bloque, barras, tabla) y los bloques
 * de audiencia real, proyección del mes, origen, país y aparato y retorno están en
 * `components/admin/audiencia/`; las palabras con que se escriben los números, en
 * `lib/audiencia.js`; y la guía de la página, en `lib/guias/guiaAudiencia.js`.
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

/* ─── El aviso de cookies: cuántos dicen que sí ────────────────────────────── */

/**
 * Una pila por día: aceptaron abajo, rechazaron encima. Dos tramos de un mismo total,
 * así que la altura dice cuántos contestaron y el reparto dice qué parte aceptó.
 *
 * Es la única serie del panel con dos valores, y por eso la única con leyenda.
 */
const PilasDeConsentimiento = ({ serie }) => {
  const max = Math.max(1, ...serie.map((d) => d.si + d.no));
  return (
    <>
      <ul className="se-cons__dias" aria-hidden="true">
        {serie.map((d) => {
          const total = d.si + d.no;
          return (
            <li
              key={d.fecha}
              className="se-cons__dia"
              title={`${diaLargo(d.fecha)}: ${numero(d.si)} aceptaron · ${numero(d.no)} rechazaron`}
            >
              <span className="se-cons__pila" style={{ height: `${total ? Math.max(2, (total / max) * 100) : 0}%` }}>
                <span className="se-cons__no" style={{ height: `${total ? (d.no / total) * 100 : 0}%` }} />
                <span className="se-cons__si" style={{ height: `${total ? (d.si / total) * 100 : 0}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
      <ul className="se-cons__leyenda">
        <li>
          <span className="se-cons__muestra se-cons__si" aria-hidden="true" /> aceptaron
        </li>
        <li>
          <span className="se-cons__muestra se-cons__no" aria-hidden="true" /> rechazaron
        </li>
      </ul>
    </>
  );
};

PilasDeConsentimiento.propTypes = { serie: PropTypes.arrayOf(PropTypes.object).isRequired };

/**
 * Cuenta también a quien dijo que no; fuera de este bloque solo lo hace «Audiencia real
 * estimada» (`components/admin/audiencia/AudienciaReal.jsx`).
 *
 * Por eso va en su propio bloque y con su propia petición: el resto de la pantalla sale
 * de quien aceptó, y esto dice cuántos son los que aceptan.
 * Un fallo aquí no tumba el panel -- se dice dentro de la tarjeta y ya --, porque es
 * un dato nuevo que el servidor puede no tener todavía.
 */
const AvisoDeCookiesBloque = ({ dias, recarga }) => {
  const [datos, setDatos] = useState(null);
  const [fallo, setFallo] = useState("");

  useEffect(() => {
    let vigente = true;
    getConsentimiento(dias)
      .then((d) => {
        if (vigente) {
          setDatos(d);
          setFallo("");
        }
      })
      .catch((e) => {
        if (vigente) setFallo(adminErrorMessage(e));
      });
    return () => {
      vigente = false;
    };
  }, [dias, recarga]);

  const total = datos ? datos.si + datos.no : 0;
  const titulo = `Aviso de cookies · últimos ${dias} días`;

  return (
    <Bloque
      titulo={titulo}
      apunte="Cuántos aceptan la medición. Un número por día y por respuesta, sin identificador."
      parada="cookies"
      tabla={
        total ? (
          <Tabla
            columnas={["Día", "Aceptaron", "Rechazaron", "Tasa"]}
            filas={(datos?.serie ?? []).map((d) => [
              diaLargo(d.fecha),
              numero(d.si),
              numero(d.no),
              d.si + d.no ? `${Math.round((100 * d.si) / (d.si + d.no))} %` : "—",
            ])}
          />
        ) : null
      }
    >
      {fallo ? (
        <p className="se-admin-meta-hint">No se pudo cargar: {fallo}</p>
      ) : !datos ? (
        <p className="se-admin-meta-hint">Cargando…</p>
      ) : !total ? (
        <p className="se-admin-meta-hint">Sin respuestas todavía.</p>
      ) : (
        <>
          <div className="se-aud__fichas">
            <Ficha valor={numero(datos.si)} etiqueta="aceptaron" />
            <Ficha valor={numero(datos.no)} etiqueta="rechazaron" />
            <Ficha
              valor={datos.tasa_aceptacion === null ? null : `${datos.tasa_aceptacion} %`}
              etiqueta="tasa de aceptación"
              nota="sobre quienes contestaron"
            />
          </div>
          <PilasDeConsentimiento serie={datos.serie} />
        </>
      )}
    </Bloque>
  );
};

AvisoDeCookiesBloque.propTypes = {
  dias: PropTypes.number.isRequired,
  recarga: PropTypes.number.isRequired,
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
  // Los días del informe que se está bajando; cero si no se está bajando ninguno.
  const [bajando, setBajando] = useState(0);
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

  /**
   * Bajar el informe en hoja de cálculo. `cuantos` son los días que abarca: los del
   * periodo que se está mirando o todo lo que se conserva.
   *
   * Tarda unos segundos -- el servidor lo arma al pedirlo --, así que los dos botones
   * se apagan mientras tanto: dos informes a la vez no llegan antes que uno.
   */
  const bajar = useCallback(async (cuantos) => {
    setBajando(cuantos);
    try {
      await descargarInforme(cuantos);
    } catch (e) {
      if (montado.current) setError(adminErrorMessage(e));
    } finally {
      if (montado.current) setBajando(0);
    }
  }, []);

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
      <CabeceraDePagina
        titulo="Audiencia"
        explica={
          <>
            Medición propia, sin herramientas de terceros. Cuenta solo a quien aceptó las
            cookies, así que casi todo lo de aquí es un mínimo: cuánto queda fuera lo dice
            «Audiencia real estimada».
          </>
        }
        acciones={
          <>
            {/* Un solo filtro, arriba, y manda sobre todos los bloques. */}
            <div className="se-aud__mandos">
              <div className="se-aud__mandos-grupo" {...ancla("periodo")}>
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

              {/* El informe en hoja de cálculo: lo mismo que la página y sin recortes. Dos
                  botones y no un desplegable, porque a «¿de cuándo?» solo hay dos
                  respuestas: lo que se está mirando o todo lo que se conserva. */}
              <div
                className="se-aud__descarga"
                role="group"
                aria-label="Informe en Excel"
                {...ancla("descarga")}
              >
                <span className="se-aud__descarga-rotulo" aria-hidden="true">
                  Informe en Excel
                </span>
                <button
                  type="button"
                  className="se-aud__bajar"
                  onClick={() => bajar(dias)}
                  disabled={Boolean(bajando)}
                >
                  <span aria-hidden="true">↓</span>
                  {bajando === dias ? "Preparando…" : `Estos ${dias} días`}
                </button>
                <button
                  type="button"
                  className="se-aud__bajar"
                  onClick={() => bajar(DIAS_GUARDADOS)}
                  disabled={Boolean(bajando)}
                >
                  <span aria-hidden="true">↓</span>
                  {bajando === DIAS_GUARDADOS ? "Preparando…" : "Todo lo guardado"}
                </button>
              </div>
            </div>
          </>
        }
        guia={recorridoAudiencia}
        className="se-aud__cabecera"
      />
      <RecorridoVista recorrido={recorridoAudiencia} />

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
      <section className="se-aud__directo" aria-labelledby="aud-directo" {...ancla("directo")}>
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
          <div className="se-aud__fichas" {...ancla("fichas")}>
            <Ficha valor={numero(r.sesiones)} etiqueta="visitas">
              <Variacion
                actual={r.sesiones}
                anterior={r.anterior?.sesiones}
                comparacion={r.comparacion.sesiones}
              />
            </Ficha>
            <Ficha valor={numero(r.personas)} etiqueta="navegadores distintos">
              <Variacion
                actual={r.personas}
                anterior={r.anterior?.personas}
                comparacion={r.comparacion.personas}
              />
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
              valor={porciento(r.completas.porcentaje)}
              etiqueta="la leyeron entera"
              nota={`de ${numero(r.completas.lecturas)} lecturas de texto`}
            />
            <Ficha
              valor={r.una_pagina === null ? null : `${r.una_pagina} %`}
              etiqueta="se van en la primera"
              nota="leyeron una página y salieron"
            />
          </div>

          {/* Justo debajo de las fichas y antes de la serie, los dos bloques que dicen
              cuánto de la audiencia real está viendo todo lo demás: la estimación del
              total y, detrás, cuántos aceptan medirse. */}
          <AudienciaReal datos={r.audiencia_real} />
          <AvisoDeCookiesBloque dias={dias} recarga={recarga} />

          <Bloque
            titulo="Visitas por día"
            apunte="Pase el ratón para ver un día concreto."
            parada="serie"
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

          <ComoVaElMes datos={r.proyeccion} />

          <div className="se-aud__par" {...ancla("lecturas")}>
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

          <DeDondeLlegan origen={r.origen} boletin={r.boletin} />
          <PaisesYAparatos paises={r.paises} dispositivos={r.dispositivos} />

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
            apunte="Las quince piezas con más lecturas, con su tiempo medio y en cuántas lecturas dio tiempo a terminarla. La lista entera está en el informe."
            parada="piezas"
            vacio={!r.piezas?.length}
            tabla={
              <Tabla
                columnas={["Pieza", "Lecturas", "Lectores", "Tiempo medio", "La terminaron"]}
                filas={(r.piezas ?? []).map((p) => [
                  p.titulo || p.ruta,
                  numero(p.lecturas),
                  numero(p.lectores),
                  duracion(p.segundos_medios),
                  porciento(p.enteras) ?? "—",
                ])}
              />
            }
          >
            <Barras
              enlazar
              datos={(r.piezas ?? []).map((p) => ({
                clave: p.ruta,
                // El título, si el servidor lo conoce: una ruta es una dirección, no un
                // nombre. La dirección sigue en el enlace y al pasar el ratón.
                etiqueta: p.titulo || p.ruta,
                valor: p.lecturas,
                apunte: [
                  `${duracion(p.segundos_medios)} de media`,
                  porciento(p.enteras) ? `${porciento(p.enteras)} la terminó` : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
            />
          </Bloque>

          <CuantosVuelven retorno={r.retorno} />

          <Bloque
            titulo="Por dónde se van"
            parada="salidas"
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
        registros se borran a los catorce meses, como dice el aviso de cookies. El informe
        en Excel trae lo mismo que esta página y sin recortes: todas las piezas, las
        semanas, los países y las fuentes, con una pestaña que explica cada columna.
      </p>
    </div>
  );
};

export default AdminAnalitica;
