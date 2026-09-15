import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { getEnVivo, getResumen } from "../../services/adminAnaliticaService";

/**
 * Audiencia: quién está leyendo ahora y qué pasó estos días.
 *
 * Los números vienen de la medición propia del sitio -- ver `lib/analitica.js` y
 * `analitica_service.py` --, así que solo cuentan a quien aceptó las cookies. Eso lo dice
 * la pantalla en voz alta, porque un panel de audiencia que no lo diga se lee como si
 * fueran todos los lectores, y no lo son.
 *
 * ## Tres decisiones
 *
 * **«Lectores» son sesiones, no personas.** Dos pestañas abiertas en la misma casa son
 * dos. Es lo que cuenta cualquier medidor en vivo, y por eso al lado va el número de
 * identificadores distintos: juntos dicen la verdad, cada uno por su lado engaña.
 *
 * **El directo se refresca solo; lo demás no.** Los lectores en vivo se piden cada veinte
 * segundos -- la misma cadencia del latido del navegador, pedirlo más a menudo no daría
 * un número más nuevo. El resumen de la semana no cambia de un minuto a otro, así que se
 * pide una vez y solo se vuelve a pedir si se cambia el periodo.
 *
 * **Se para cuando la pestaña no se ve.** Un panel olvidado en una pestaña de fondo
 * estaría pidiendo al servidor toda la noche para nadie.
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

/** 95 -> «1 min 35 s». Un promedio de lectura en segundos sueltos no se lee de un vistazo. */
const duracion = (segundos) => {
  const n = Math.max(0, Math.round(segundos || 0));
  if (n < 60) return `${n} s`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
};

const Cifra = ({ valor, etiqueta, nota, grande }) => (
  <div className={`se-audiencia__cifra${grande ? " se-audiencia__cifra--grande" : ""}`}>
    <span className="se-audiencia__numero">{valor}</span>
    <span className="se-audiencia__etiqueta">{etiqueta}</span>
    {nota ? <span className="se-audiencia__nota">{nota}</span> : null}
  </div>
);

Cifra.propTypes = {
  valor: PropTypes.node.isRequired,
  etiqueta: PropTypes.string.isRequired,
  nota: PropTypes.string,
  grande: PropTypes.bool,
};

/**
 * Una barra proporcional al mayor de la lista.
 *
 * Dibujada y no una librería de gráficos: son dos listas cortas, y meter una dependencia
 * de gráficos para esto pesaría más que la pantalla entera.
 */
const Barra = ({ parte, total }) => (
  <span className="se-audiencia__barra" aria-hidden="true">
    <span
      className="se-audiencia__barra-relleno"
      style={{ width: `${total > 0 ? Math.max(3, Math.round((parte / total) * 100)) : 0}%` }}
    />
  </span>
);

Barra.propTypes = { parte: PropTypes.number.isRequired, total: PropTypes.number.isRequired };

export const AdminAnalitica = () => {
  const [vivo, setVivo] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [dias, setDias] = useState(7);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const montado = useRef(true);

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

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    getResumen(dias)
      .then((datos) => {
        if (vigente && montado.current) {
          setResumen(datos);
          setError("");
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
  }, [dias]);

  const maxPieza = resumen?.piezas?.[0]?.lecturas ?? 0;
  const maxFormato = resumen?.formatos?.[0]?.lecturas ?? 0;
  const sinDatos = !cargando && resumen && resumen.sesiones === 0 && !vivo?.lectores;

  return (
    <div className="se-admin-shell se-audiencia">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>
            Audiencia
          </h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
            Medición propia, sin herramientas de terceros. Cuenta solo a quien aceptó las
            cookies en el aviso, así que los números son un suelo: la audiencia real es
            algo mayor.
          </p>
        </div>
      </header>

      {error ? (
        <p className="se-admin-form-feedback" role="alert">
          {error}
        </p>
      ) : null}

      {sinDatos ? (
        <p className="se-admin-meta-hint">
          Todavía no hay nada que enseñar. Aparecerá en cuanto alguien acepte las cookies y
          empiece a leer.
        </p>
      ) : null}

      <section className="se-audiencia__bloque" aria-labelledby="audiencia-vivo">
        <h2 id="audiencia-vivo" className="se-audiencia__h2">
          Ahora mismo
        </h2>

        <div className="se-audiencia__cifras">
          <Cifra
            grande
            valor={vivo?.lectores ?? "—"}
            etiqueta={vivo?.lectores === 1 ? "lector" : "lectores"}
            nota={`vistos en los últimos ${vivo?.ventana_minutos ?? 5} minutos`}
          />
          <Cifra
            valor={vivo?.personas ?? "—"}
            etiqueta="navegadores distintos"
            nota="dos pestañas de la misma persona cuentan dos veces arriba, una aquí"
          />
        </div>

        {vivo?.paginas?.length ? (
          <ol className="se-audiencia__lista">
            {vivo.paginas.map((p) => (
              <li key={p.ruta} className="se-audiencia__fila">
                <span className="se-audiencia__ruta" title={p.ruta}>
                  {p.ruta}
                </span>
                <Barra parte={p.lectores} total={vivo.paginas[0].lectores} />
                <span className="se-audiencia__valor">{p.lectores}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="se-admin-meta-hint">Nadie leyendo en este momento.</p>
        )}
      </section>

      <section className="se-audiencia__bloque" aria-labelledby="audiencia-periodo">
        <div className="se-audiencia__cabeza">
          <h2 id="audiencia-periodo" className="se-audiencia__h2">
            Últimos {resumen?.dias ?? dias} días
          </h2>
          <div className="se-audiencia__periodos" role="group" aria-label="Periodo">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                type="button"
                className={`se-audiencia__periodo${
                  dias === p.dias ? " se-audiencia__periodo--on" : ""
                }`}
                aria-pressed={dias === p.dias}
                onClick={() => setDias(p.dias)}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {cargando && !resumen ? (
          <p className="se-admin-meta-hint">Cargando…</p>
        ) : (
          <>
            <div className="se-audiencia__cifras">
              <Cifra valor={resumen?.sesiones ?? 0} etiqueta="visitas" />
              <Cifra
                valor={resumen?.personas ?? 0}
                etiqueta="navegadores distintos"
                nota="a cuánta gente distinta se llegó"
              />
              <Cifra
                valor={resumen?.recurrentes ?? 0}
                etiqueta="volvieron"
                nota="entraron más de una vez en el periodo"
              />
            </div>

            <h3 className="se-audiencia__h3">Por sección</h3>
            {resumen?.formatos?.length ? (
              <ol className="se-audiencia__lista">
                {resumen.formatos.map((f) => (
                  <li key={f.formato} className="se-audiencia__fila">
                    <span className="se-audiencia__ruta">
                      {NOMBRE_FORMATO[f.formato] ?? f.formato}
                    </span>
                    <Barra parte={f.lecturas} total={maxFormato} />
                    <span className="se-audiencia__valor">
                      {f.lecturas} <small>· {duracion(f.segundos_medios)} de media</small>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="se-admin-meta-hint">Sin lecturas registradas en el periodo.</p>
            )}

            <h3 className="se-audiencia__h3">Lo más leído</h3>
            {resumen?.piezas?.length ? (
              <ol className="se-audiencia__lista se-audiencia__lista--piezas">
                {resumen.piezas.map((p) => (
                  <li key={p.ruta} className="se-audiencia__fila">
                    <a
                      className="se-audiencia__ruta se-audiencia__ruta--enlace"
                      href={p.ruta}
                      target="_blank"
                      rel="noreferrer"
                      title={p.ruta}
                    >
                      {p.ruta}
                    </a>
                    <Barra parte={p.lecturas} total={maxPieza} />
                    <span className="se-audiencia__valor">
                      {p.lecturas} <small>· {duracion(p.segundos_medios)} de media</small>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="se-admin-meta-hint">Sin lecturas registradas en el periodo.</p>
            )}
          </>
        )}
      </section>

      <p className="se-audiencia__pie">
        El tiempo medio cuenta solo los segundos que la pieza estuvo <strong>visible</strong> en
        pantalla: una pestaña abierta de fondo no suma. Los registros se borran a los catorce
        meses, como dice el aviso de cookies.
      </p>
    </div>
  );
};

export default AdminAnalitica;
