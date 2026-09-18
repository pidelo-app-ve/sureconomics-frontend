import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BotonesDePago } from "../components/educacion/BotonesDePago";
import { IconReloj } from "../components/icons/educacion";
import {
  descargarArchivoDeLeccion,
  duracionLegible,
  getAudioDeLeccion,
  getCatalogo,
  getLeccion,
  getModulo,
} from "../services/educacionService";

/**
 * El lector de una leccion: texto, video, audio o PDF -- y el muro de pago si toca.
 *
 * El muro no es una pantalla aparte. Es lo que se dibuja **en el sitio de la leccion**
 * cuando el servidor contesta que no, con el motivo que dio: falta sesion, falta
 * verificar el correo, o falta comprar. Tres motivos, tres frases; un "no tienes acceso"
 * generico deja a la persona sin saber que hacer a continuacion.
 *
 * El contenido de pago no pasa nunca por aqui sin permiso: el cuerpo llega del servidor
 * ya filtrado, y el archivo se pide por su propia ruta, que vuelve a comprobar. No hay
 * nada que "esconder con CSS" -- si estuviera en el HTML, estaria.
 */

const Reproductor = ({ leccion, moduloSlug }) => {
  const [bajando, setBajando] = useState(false);
  const [error, setError] = useState("");

  if (leccion.tipo === "video") {
    if (!leccion.reproductor) {
      return <p className="se-edu__aviso">El video todavía no está cargado.</p>;
    }
    return (
      <div className="se-edu__video">
        <iframe
          src={leccion.reproductor}
          title={leccion.titulo}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
      </div>
    );
  }

  if (leccion.tipo === "audio") {
    if (!leccion.archivo?.hay) {
      return <p className="se-edu__aviso">El audio todavía no está cargado.</p>;
    }
    // El audio se descarga con la sesión puesta y se reproduce desde memoria: el
    // elemento `<audio>` no manda cabeceras, así que un `src` directo llegaría sin
    // token y el servidor lo rechazaría con razón.
    return <AudioProtegido leccion={leccion} moduloSlug={moduloSlug} />;
  }

  if (leccion.tipo === "pdf") {
    if (!leccion.archivo?.hay) {
      return <p className="se-edu__aviso">El documento todavía no está cargado.</p>;
    }
    return (
      <div className="se-edu__descarga">
        <button
          type="button"
          className="se-btn"
          disabled={bajando}
          onClick={async () => {
            setBajando(true);
            setError("");
            try {
              await descargarArchivoDeLeccion(
                moduloSlug,
                leccion.slug,
                `${leccion.slug}.pdf`,
              );
            } catch (err) {
              setError(err?.message || "No se pudo descargar.");
            } finally {
              setBajando(false);
            }
          }}
        >
          {bajando ? "Descargando…" : "Descargar el documento"}
        </button>
        {leccion.archivo.paginas ? (
          <span className="se-edu__descarga-meta">{leccion.archivo.paginas} páginas</span>
        ) : null}
        {error ? (
          <p className="se-edu__pago-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return null;
};

/**
 * El audio de una leccion de pago.
 *
 * Se baja con `fetch` -- que si manda la cabecera de sesion -- y se reproduce desde un
 * blob. Poner la ruta directamente en `src` seria mas simple y no funcionaria: el
 * elemento no manda el token, y el servidor contestaria 401 a un archivo que la persona
 * si compro.
 */
const AudioProtegido = ({ leccion, moduloSlug }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const blob = await getAudioDeLeccion(moduloSlug, leccion.slug);
      if (blob instanceof Blob) setUrl(URL.createObjectURL(blob));
      else setError("No se pudo cargar el audio.");
    } catch (err) {
      setError(err?.message || "No se pudo cargar el audio.");
    } finally {
      setCargando(false);
    }
  }, [leccion.slug, moduloSlug]);

  useEffect(() => {
    return () => {
      // Sin esto el blob se queda en memoria hasta recargar la pestaña, y una clase de
      // media hora pesa lo suyo.
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (url) {
    return <audio className="se-edu__audio" src={url} controls preload="metadata" />;
  }

  return (
    <div className="se-edu__descarga">
      <button type="button" className="se-btn" onClick={cargar} disabled={cargando}>
        {cargando ? "Cargando…" : "Escuchar la clase"}
      </button>
      {error ? (
        <p className="se-edu__pago-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

Reproductor.propTypes = {
  leccion: PropTypes.object.isRequired,
  moduloSlug: PropTypes.string.isRequired,
};

AudioProtegido.propTypes = {
  leccion: PropTypes.object.isRequired,
  moduloSlug: PropTypes.string.isRequired,
};

export const EducacionLeccion = () => {
  const { slug, leccionSlug } = useParams();
  const [datos, setDatos] = useState(null);
  const [modulo, setModulo] = useState(null);
  const [pasarelas, setPasarelas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [respuesta, mod] = await Promise.all([
        getLeccion(slug, leccionSlug),
        getModulo(slug).catch(() => null),
      ]);
      setDatos(respuesta);
      setModulo(mod);
    } catch {
      setDatos({ leccion: null, bloqueada: true, motivo: "error" });
    } finally {
      setCargando(false);
    }
  }, [slug, leccionSlug]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    let vivo = true;
    getCatalogo()
      .then((d) => vivo && setPasarelas(d.pasarelas))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  if (cargando) {
    return (
      <main className="se-blog se-edu" role="main">
        <section className="se-section">
          <div className="se-container">
            <p className="se-edu__aviso">Cargando…</p>
          </div>
        </section>
      </main>
    );
  }

  const leccion = datos?.leccion;
  const totalDeLecciones = leccion?.modulo?.lecciones ?? 0;
  const duracion = duracionLegible(leccion?.duracion_minutos);
  // La siguiente esta cerrada si existe, no es libre y el modulo no esta comprado.
  // `libre` viaja en `vecinas` justamente para poder contestar esto sin otra peticion.
  const siguienteCerrada = Boolean(
    leccion?.vecinas?.siguiente &&
      !leccion.vecinas.siguiente.libre &&
      modulo &&
      !modulo.comprado &&
      !modulo.gratuito,
  );

  return (
    <main className="se-blog se-edu" role="main">
      <section className="se-section">
        <div className="se-container se-edu__lectura">
          <nav className="se-edu__migas" aria-label="Ruta">
            <Link to="/educacion" className="se-link">
              Educación
            </Link>
            {" / "}
            <Link to={`/educacion/${slug}`} className="se-link">
              {modulo?.titulo ?? "Módulo"}
            </Link>
          </nav>

          {leccion ? (
            <>
              {/* Donde esta uno y cuanto queda. Un "Leccion 2" a secas no dice nada:
                  lo que sostiene la lectura hasta el final de un modulo es ver que
                  el final existe y esta cerca. El total viaja con la leccion, asi
                  que no hace falta pedir el modulo entero para pintarlo. */}
              <p className="se-edu__leccion-kicker">
                <span>
                  Lección {leccion.posicion}
                  {totalDeLecciones ? ` de ${totalDeLecciones}` : ""}
                </span>
                {duracion ? (
                  <span className="se-edu__leccion-kicker-dato">
                    <IconReloj className="se-edu__leccion-kicker-icono" />
                    {duracion}
                  </span>
                ) : null}
              </p>

              {totalDeLecciones > 1 ? (
                <div
                  className="se-edu__avance"
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={totalDeLecciones}
                  aria-valuenow={leccion.posicion}
                  aria-label={`Lección ${leccion.posicion} de ${totalDeLecciones}`}
                >
                  <span
                    className="se-edu__avance-barra"
                    style={{ width: `${(leccion.posicion / totalDeLecciones) * 100}%` }}
                  />
                </div>
              ) : null}

              <h1 className="se-edu__titulo">{leccion.titulo}</h1>

              <Reproductor leccion={leccion} moduloSlug={slug} />

              {leccion.cuerpo ? (
                <div
                  className="se-edu__cuerpo se-prose"
                  // El cuerpo lo escribe la redacción en el panel y el backend lo
                  // limpia con `bleach` antes de guardarlo, igual que el de una pieza.
                  dangerouslySetInnerHTML={{ __html: leccion.cuerpo }}
                />
              ) : null}

              {/* El final de la clase abierta es donde se decide la compra: se acaba
                  de leer una clase entera, la siguiente esta cerrada, y el enlace de
                  abajo llevaba a ella sin avisar -- a un muro, despues de haber
                  enganchado. Decirlo aqui, con el precio y el boton, convierte ese
                  tropiezo en la oferta. */}
              {siguienteCerrada ? (
                <div className="se-edu__continuar">
                  <p className="se-edu__continuar-titulo">
                    Sigue en <strong>{modulo.titulo}</strong>
                  </p>
                  <p className="se-edu__continuar-texto">
                    La siguiente es «{leccion.vecinas.siguiente.titulo}». Quedan{" "}
                    {modulo.lecciones - modulo.lecciones_libres}{" "}
                    {modulo.lecciones - modulo.lecciones_libres === 1
                      ? "lección"
                      : "lecciones"}{" "}
                    por abrir.
                  </p>
                  <BotonesDePago
                    modulo={modulo}
                    pasarelas={pasarelas}
                    onComprado={cargar}
                  />
                </div>
              ) : null}

              <nav className="se-edu__vecinas" aria-label="Navegación entre lecciones">
                {leccion.vecinas?.anterior ? (
                  <Link
                    to={`/educacion/${slug}/${leccion.vecinas.anterior.slug}`}
                    className="se-link"
                  >
                    ← {leccion.vecinas.anterior.titulo}
                  </Link>
                ) : (
                  <span />
                )}
                {leccion.vecinas?.siguiente ? (
                  <Link
                    to={`/educacion/${slug}/${leccion.vecinas.siguiente.slug}`}
                    className="se-link"
                  >
                    {leccion.vecinas.siguiente.titulo} →
                  </Link>
                ) : null}
              </nav>
            </>
          ) : (
            <MuroDePago
              motivo={datos?.motivo}
              modulo={modulo}
              pasarelas={pasarelas}
              onComprado={cargar}
            />
          )}
        </div>
      </section>
    </main>
  );
};

/** Lo que se dibuja en el sitio de la lección cuando el servidor dice que no. */
const MuroDePago = ({ motivo, modulo, pasarelas, onComprado }) => {
  if (motivo === "error") {
    return (
      <p className="se-edu__aviso" role="alert">
        No se pudo cargar la lección. Inténtelo de nuevo.
      </p>
    );
  }

  if (motivo === "sin-sesion" || motivo === "sin-verificar" || !modulo) {
    // Los dos primeros motivos los explica `BotonesDePago`, que ya distingue los tres
    // estados. Sin módulo cargado no hay precio que enseñar, así que también cae aquí.
    return (
      <div className="se-edu__muro">
        <h1 className="se-edu__titulo">Esta lección es para quien tiene cuenta</h1>
        <p className="se-text-body">
          La primera lección de cada módulo es gratuita, pero pedimos una cuenta
          verificada para abrirla.
        </p>
        <div className="se-edu__pago-acciones">
          <Link to="/cuenta/entrar" className="se-btn">
            Iniciar sesión
          </Link>
          <Link to="/cuenta/registro" className="se-btn se-btn--secondary">
            Crear una cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="se-edu__muro">
      <h1 className="se-edu__titulo">Esta lección viene con el módulo</h1>
      <p className="se-text-body">
        Sigue leyendo <strong>{modulo.titulo}</strong> desde donde lo dejaste: el resto
        del temario se desbloquea al comprarlo.
      </p>
      <BotonesDePago modulo={modulo} pasarelas={pasarelas} onComprado={onComprado} />
    </div>
  );
};

MuroDePago.propTypes = {
  /** "sin-sesion" | "sin-verificar" | "sin-compra" | "error". */
  motivo: PropTypes.string,
  modulo: PropTypes.object,
  pasarelas: PropTypes.arrayOf(PropTypes.string),
  onComprado: PropTypes.func,
};

export default EducacionLeccion;
