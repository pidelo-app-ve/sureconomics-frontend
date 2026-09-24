import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { ACCEPTED_IMAGE_MIME, uploadAdminMediaImage } from "../../services/adminMediaService";
import {
  getSocial,
  ocultarInstagram,
  putSocial,
  sincronizarInstagram,
} from "../../services/adminSettingsService";

/**
 * «En redes»: qué publicaciones se destacan al pie de todas las vistas.
 *
 * **Curado, no automático.** La redacción pega el enlace de la publicación, escribe
 * el texto tal como quiere que se lea, y en Instagram y TikTok sube la imagen -- en
 * TikTok, un fotograma o una captura del video. Se probaron las vías automáticas y
 * ninguna sirve hoy: la API de X que lee cronologías es de pago, el widget gratuito
 * pinta cero píxeles, la de Instagram pide un token que no puede vivir en el
 * navegador, y el oEmbed público de TikTok sólo describe un video que ya se conoce --
 * no sirve para listar los últimos de la cuenta, que es lo que haría falta -- y carga
 * su propio script igual que el widget de X. Curar cuesta un minuto a la semana y
 * deja elegir qué se enseña -- ver `redes_service.py` para el detalle.
 *
 * **Se guarda al terminar.** Como las fotos del equipo: se arma la lista entera en
 * pantalla y se pulsa Guardar una vez. El servidor reemplaza todo, así que quitar una
 * es simplemente no mandarla.
 *
 * **Instagram, en automático** cuando el backend tiene el token de la cuenta: trae solo
 * las últimas publicaciones cada hora, y aquí sólo se ven, se actualizan al momento o
 * se ocultan. Ver `instagram_service.py`.
 *
 * **El enlace tiene que ir a su red.** Lo comprueba el servidor: un post de Instagram
 * no puede apuntar a otro sitio. Si se cuela uno mal, Guardar lo dice y no guarda nada.
 */

const MAX_POR_RED = 8;

//: Qué redes llevan una imagen (foto o fotograma) además del texto. X es sólo texto.
const REDES_CON_IMAGEN = new Set(["instagram", "tiktok"]);

const NOMBRE = { instagram: "Instagram", x: "X", tiktok: "TikTok" };
const EJEMPLO_ENLACE = {
  instagram: "https://www.instagram.com/p/…",
  x: "https://x.com/Sur_economics/status/…",
  tiktok: "https://www.tiktok.com/@surecon0mics/video/…",
};

const vacia = (red) =>
  REDES_CON_IMAGEN.has(red)
    ? { imagen: null, url: "", texto: "", enlace: "", fecha: "" }
    : { texto: "", enlace: "", fecha: "" };

const Publicacion = ({ red, indice, total, valor, ocupada, onCambiar, onQuitar, onMover, onSubir }) => {
  const id = `redes-${red}-${indice}`;
  const esFoto = REDES_CON_IMAGEN.has(red);

  return (
    <li className="se-admin-redes__pub">
      <div className="se-admin-redes__orden">
        <span className="se-admin-redes__num">{indice + 1}</span>
        <button type="button" className="se-admin-redes__flecha" onClick={() => onMover(-1)}
                disabled={indice === 0} aria-label="Subir una posición">↑</button>
        <button type="button" className="se-admin-redes__flecha" onClick={() => onMover(1)}
                disabled={indice === total - 1} aria-label="Bajar una posición">↓</button>
      </div>

      {esFoto ? (
        <label className="se-admin-redes__miniatura" title="Elegir la imagen de la publicación">
          {valor.url ? (
            <img src={valor.url} alt="" />
          ) : (
            <span className="se-admin-redes__sin-imagen">{ocupada ? "Subiendo…" : "Imagen"}</span>
          )}
          <input
            type="file"
            accept={ACCEPTED_IMAGE_MIME}
            style={{ display: "none" }}
            disabled={ocupada}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              e.target.value = "";
              if (archivo) onSubir(archivo);
            }}
          />
        </label>
      ) : null}

      <div className="se-admin-redes__campos">
        <label className="se-form-field" htmlFor={`${id}-texto`}>
          <span className="se-form-label">Texto</span>
          <textarea
            id={`${id}-texto`}
            className="se-form-control"
            rows={esFoto ? 2 : 3}
            maxLength={500}
            value={valor.texto}
            onChange={(e) => onCambiar({ texto: e.target.value })}
            placeholder={esFoto ? "El pie de la publicación" : "El texto del post"}
          />
        </label>
        <div className="se-admin-redes__fila-campos">
          <label className="se-form-field" htmlFor={`${id}-enlace`}>
            <span className="se-form-label">Enlace</span>
            <input
              id={`${id}-enlace`}
              className="se-form-control"
              type="url"
              value={valor.enlace}
              onChange={(e) => onCambiar({ enlace: e.target.value })}
              placeholder={EJEMPLO_ENLACE[red]}
            />
          </label>
          <label className="se-form-field se-admin-redes__fecha" htmlFor={`${id}-fecha`}>
            <span className="se-form-label">Fecha</span>
            <input
              id={`${id}-fecha`}
              className="se-form-control"
              type="date"
              value={valor.fecha || ""}
              onChange={(e) => onCambiar({ fecha: e.target.value })}
            />
          </label>
        </div>
      </div>

      <button type="button" className="se-btn se-btn--secondary se-btn--small" onClick={onQuitar}>
        Quitar
      </button>
    </li>
  );
};

Publicacion.propTypes = {
  red: PropTypes.oneOf(["instagram", "x", "tiktok"]).isRequired,
  indice: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  valor: PropTypes.object.isRequired,
  ocupada: PropTypes.bool,
  onCambiar: PropTypes.func.isRequired,
  onQuitar: PropTypes.func.isRequired,
  onMover: PropTypes.func.isRequired,
  onSubir: PropTypes.func.isRequired,
};

/** «hace 12 minutos», «hace 3 horas»: cuándo llegó lo último de Instagram. */
const haceCuanto = (iso) => {
  if (!iso) return "nunca";
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} ${min === 1 ? "minuto" : "minutos"}`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} ${h === 1 ? "hora" : "horas"}`;
  return `hace ${Math.round(h / 24)} días`;
};

const TIPO = { VIDEO: "Reel", CAROUSEL_ALBUM: "Carrusel", IMAGE: "Foto" };

/**
 * Instagram en automático. Nada que escribir: se ve lo que llegó, en el orden en que
 * saldrá, y cada publicación se puede ocultar. Las ocultas no cuentan para las ocho,
 * así que la siguiente ocupa su hueco.
 */
const InstagramAutomatico = ({ auto, ocupado, onActualizar, onOcultar }) => {
  let visibles = 0;
  return (
    <section className="se-admin-redes__red">
      <header className="se-admin-redes__red-cabeza">
        <h2 className="se-admin-redes__red-titulo">
          Instagram <span className="se-admin-redes__auto">Automático</span>
        </h2>
        <button
          type="button"
          className="se-btn se-btn--secondary se-btn--small"
          onClick={onActualizar}
          disabled={ocupado}
        >
          {ocupado ? "Actualizando…" : "Actualizar ahora"}
        </button>
      </header>
      <p className="se-admin-meta-hint">
        Se actualiza sola cada hora desde @sur_economics. Última vez:{" "}
        {haceCuanto(auto.sincronizado_en)}. Salen las {auto.mostrar} primeras que no estén
        ocultas.
      </p>
      {auto.error ? (
        <p className="se-admin-form-feedback" role="alert">
          La última actualización falló: {auto.error} Se sigue mostrando lo que llegó antes.
        </p>
      ) : null}
      {auto.publicaciones.length ? (
        <ul className="se-admin-redes__auto-lista">
          {auto.publicaciones.map((p) => {
            const sale = !p.oculta && visibles < auto.mostrar;
            if (sale) visibles += 1;
            return (
              <li
                key={p.id}
                className={`se-admin-redes__auto-pub${sale ? "" : " se-admin-redes__auto-pub--fuera"}`}
              >
                <a href={p.enlace} target="_blank" rel="noreferrer" className="se-admin-redes__auto-foto">
                  <img src={p.url} alt="" loading="lazy" />
                  <span className="se-admin-redes__auto-tipo">{TIPO[p.tipo] ?? "Publicación"}</span>
                </a>
                <div className="se-admin-redes__auto-texto">
                  <span className="se-admin-meta-hint">
                    {p.fecha}
                    {" · "}
                    {p.oculta ? "Oculta" : sale ? "Sale en el sitio" : "De reserva"}
                  </span>
                  <p>{p.texto || "Sin texto"}</p>
                </div>
                <button
                  type="button"
                  className="se-btn se-btn--secondary se-btn--small"
                  disabled={ocupado}
                  onClick={() => onOcultar(p.id, !p.oculta)}
                >
                  {p.oculta ? "Mostrar" : "Ocultar"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="se-admin-meta-hint">
          Todavía no llegó nada. Pulse «Actualizar ahora» para traer las últimas.
        </p>
      )}
    </section>
  );
};

InstagramAutomatico.propTypes = {
  auto: PropTypes.shape({
    sincronizado_en: PropTypes.string,
    error: PropTypes.string,
    mostrar: PropTypes.number,
    publicaciones: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  ocupado: PropTypes.bool,
  onActualizar: PropTypes.func.isRequired,
  onOcultar: PropTypes.func.isRequired,
};

//: Normaliza lo que llega del servidor para las tres redes de una vez, rellenando
//: los campos que falten con la fila vacía de cada una.
const normalizar = (d) =>
  Object.fromEntries(
    ["instagram", "x", "tiktok"].map((red) => [
      red,
      (d[red] || []).map((p) => ({ ...vacia(red), ...p, fecha: p.fecha || "" })),
    ])
  );

export const AdminRedes = () => {
  const [listas, setListas] = useState({ instagram: [], x: [], tiktok: [] });
  const [inicial, setInicial] = useState(null);
  const [carga, setCarga] = useState({ status: "loading", error: "" });
  const [guardado, setGuardado] = useState({ status: "idle", mensaje: "" });
  const [subiendo, setSubiendo] = useState("");
  const [auto, setAuto] = useState(null);
  const [autoOcupado, setAutoOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    getSocial()
      .then((d) => {
        if (!vivo) return;
        setAuto(d.instagram_auto?.activo ? d.instagram_auto : null);
        const normal = normalizar(d);
        setListas(normal);
        setInicial(JSON.stringify(normal));
        setCarga({ status: "ready", error: "" });
      })
      .catch((err) => {
        if (vivo) setCarga({ status: "error", error: adminErrorMessage(err, "No se pudieron cargar las redes.") });
      });
    return () => {
      vivo = false;
    };
  }, []);

  const hayCambios = useMemo(() => inicial !== null && JSON.stringify(listas) !== inicial, [listas, inicial]);

  const cambiar = useCallback((red, i, parche) => {
    setListas((prev) => {
      const copia = prev[red].slice();
      copia[i] = { ...copia[i], ...parche };
      return { ...prev, [red]: copia };
    });
    setGuardado({ status: "idle", mensaje: "" });
  }, []);

  const quitar = useCallback((red, i) => {
    setListas((prev) => ({ ...prev, [red]: prev[red].filter((_, j) => j !== i) }));
    setGuardado({ status: "idle", mensaje: "" });
  }, []);

  const mover = useCallback((red, i, delta) => {
    setListas((prev) => {
      const copia = prev[red].slice();
      const j = i + delta;
      if (j < 0 || j >= copia.length) return prev;
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return { ...prev, [red]: copia };
    });
  }, []);

  const anadir = useCallback((red) => {
    setListas((prev) =>
      prev[red].length >= MAX_POR_RED ? prev : { ...prev, [red]: [...prev[red], vacia(red)] }
    );
  }, []);

  const subir = useCallback(async (red, i, archivo) => {
    setSubiendo(`${red}-${i}`);
    setGuardado({ status: "idle", mensaje: "" });
    try {
      const fila = await uploadAdminMediaImage(archivo);
      cambiar(red, i, { imagen: fila.id, url: fila.url || "" });
    } catch (err) {
      setGuardado({ status: "error", mensaje: adminErrorMessage(err, "No se pudo subir la imagen.") });
    } finally {
      setSubiendo("");
    }
  }, [cambiar]);

  const guardar = async () => {
    setGuardado({ status: "saving", mensaje: "" });
    try {
      const cuerpo = {
        instagram: listas.instagram.map(({ imagen, texto, enlace, fecha }) => ({
          imagen, texto, enlace, fecha: fecha || null,
        })),
        x: listas.x.map(({ texto, enlace, fecha }) => ({ texto, enlace, fecha: fecha || null })),
        tiktok: listas.tiktok.map(({ imagen, texto, enlace, fecha }) => ({
          imagen, texto, enlace, fecha: fecha || null,
        })),
      };
      const d = await putSocial(cuerpo);
      const normal = normalizar(d);
      setListas(normal);
      setInicial(JSON.stringify(normal));
      setGuardado({ status: "ok", mensaje: "Guardado. Ya se ve al pie de todas las páginas." });
    } catch (err) {
      setGuardado({ status: "error", mensaje: adminErrorMessage(err, "No se pudieron guardar las redes.") });
    }
  };

  // Actualizar u ocultar sólo toca Instagram: la respuesta trae el panel entero, pero
  // de ella se toma sólo esa parte para no pisar lo que se esté editando en X o TikTok.
  const conInstagram = async (accion, exito) => {
    setAutoOcupado(true);
    try {
      const d = await accion();
      setAuto(d.instagram_auto?.activo ? d.instagram_auto : null);
      setGuardado({ status: "ok", mensaje: exito });
    } catch (err) {
      setGuardado({ status: "error", mensaje: adminErrorMessage(err, "No se pudo tocar Instagram.") });
    } finally {
      setAutoOcupado(false);
    }
  };

  const ocultar = (id, ocultarla) => {
    const actuales = auto.publicaciones.filter((p) => p.oculta).map((p) => p.id);
    const ids = ocultarla ? [...actuales, id] : actuales.filter((x) => x !== id);
    conInstagram(
      () => ocultarInstagram(ids),
      ocultarla ? "Oculta: ya no sale en el sitio." : "Vuelve a salir en el sitio."
    );
  };

  const bloque = (red) => (
    <section className="se-admin-redes__red" key={red}>
      <header className="se-admin-redes__red-cabeza">
        <h2 className="se-admin-redes__red-titulo">{NOMBRE[red]}</h2>
        <span className="se-admin-meta-hint">
          {listas[red].length} de {MAX_POR_RED}
        </span>
      </header>

      {listas[red].length ? (
        <ul className="se-admin-redes__lista">
          {listas[red].map((p, i) => (
            <Publicacion
              key={`${red}-${i}`}
              red={red}
              indice={i}
              total={listas[red].length}
              valor={p}
              ocupada={subiendo === `${red}-${i}`}
              onCambiar={(parche) => cambiar(red, i, parche)}
              onQuitar={() => quitar(red, i)}
              onMover={(delta) => mover(red, i, delta)}
              onSubir={(archivo) => subir(red, i, archivo)}
            />
          ))}
        </ul>
      ) : (
        <p className="se-admin-meta-hint">Sin publicaciones: esta fila no aparece en el sitio.</p>
      )}

      <button
        type="button"
        className="se-btn se-btn--secondary se-btn--small"
        onClick={() => anadir(red)}
        disabled={listas[red].length >= MAX_POR_RED}
      >
        Añadir publicación
      </button>
    </section>
  );

  return (
    <div className="se-admin-shell">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>En redes</h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
            Lo que se destaca al pie de todas las páginas. Pegue el enlace de la
            publicación y escriba el texto como quiere que se lea; en Instagram y en
            TikTok, suba también la imagen -- en TikTok, un fotograma o una captura
            del video. El orden de aquí es el orden de la fila. Se guarda todo de una
            vez al pulsar Guardar.
          </p>
        </div>
      </header>

      {carga.status === "loading" ? <p className="se-admin-meta-hint">Cargando…</p> : null}
      {carga.status === "error" ? (
        <p className="se-admin-form-feedback" role="alert">{carga.error}</p>
      ) : null}

      {carga.status === "ready" ? (
        <>
          {auto ? (
            <InstagramAutomatico
              auto={auto}
              ocupado={autoOcupado}
              onActualizar={() =>
                conInstagram(sincronizarInstagram, "Instagram actualizado con lo último.")
              }
              onOcultar={ocultar}
            />
          ) : (
            bloque("instagram")
          )}
          {bloque("x")}
          {bloque("tiktok")}

          <div className="se-admin-form-actions" style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              className="se-btn"
              onClick={guardar}
              disabled={!hayCambios || guardado.status === "saving" || Boolean(subiendo)}
            >
              {guardado.status === "saving" ? "Guardando…" : "Guardar"}
            </button>
            {hayCambios ? (
              <p className="se-admin-meta-hint" style={{ margin: 0 }}>Hay cambios sin guardar.</p>
            ) : null}
          </div>

          {guardado.mensaje ? (
            <p
              className={guardado.status === "error" ? "se-admin-form-feedback" : "se-admin-meta-hint"}
              role={guardado.status === "error" ? "alert" : "status"}
            >
              {guardado.mensaje}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
