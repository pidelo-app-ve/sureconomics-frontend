import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { ACCEPTED_IMAGE_MIME, uploadAdminMediaImage } from "../../services/adminMediaService";
import { getSocial, putSocial } from "../../services/adminSettingsService";

/**
 * «En redes»: qué publicaciones se destacan al pie de todas las vistas.
 *
 * **Curado, no automático.** La redacción pega el enlace de la publicación, escribe
 * el texto tal como quiere que se lea, y en Instagram sube la imagen. Se probaron las
 * dos vías automáticas y ninguna sirve hoy: la API de X que lee cronologías es de
 * pago, el widget gratuito pinta cero píxeles, y la de Instagram pide un token que no
 * puede vivir en el navegador. Curar cuesta un minuto a la semana y deja elegir qué se
 * enseña -- ver `redes_service.py` para el detalle.
 *
 * **Se guarda al terminar.** Como las fotos del equipo: se arma la lista entera en
 * pantalla y se pulsa Guardar una vez. El servidor reemplaza todo, así que quitar una
 * es simplemente no mandarla.
 *
 * **El enlace tiene que ir a su red.** Lo comprueba el servidor: un post de Instagram
 * no puede apuntar a otro sitio. Si se cuela uno mal, Guardar lo dice y no guarda nada.
 */

const MAX_POR_RED = 8;

const NOMBRE = { instagram: "Instagram", x: "X" };
const EJEMPLO_ENLACE = {
  instagram: "https://www.instagram.com/p/…",
  x: "https://x.com/Sur_economics/status/…",
};

const vacia = (red) =>
  red === "instagram"
    ? { imagen: null, url: "", texto: "", enlace: "", fecha: "" }
    : { texto: "", enlace: "", fecha: "" };

const Publicacion = ({ red, indice, total, valor, ocupada, onCambiar, onQuitar, onMover, onSubir }) => {
  const id = `redes-${red}-${indice}`;
  const esFoto = red === "instagram";

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
  red: PropTypes.oneOf(["instagram", "x"]).isRequired,
  indice: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  valor: PropTypes.object.isRequired,
  ocupada: PropTypes.bool,
  onCambiar: PropTypes.func.isRequired,
  onQuitar: PropTypes.func.isRequired,
  onMover: PropTypes.func.isRequired,
  onSubir: PropTypes.func.isRequired,
};

export const AdminRedes = () => {
  const [listas, setListas] = useState({ instagram: [], x: [] });
  const [inicial, setInicial] = useState(null);
  const [carga, setCarga] = useState({ status: "loading", error: "" });
  const [guardado, setGuardado] = useState({ status: "idle", mensaje: "" });
  const [subiendo, setSubiendo] = useState("");

  useEffect(() => {
    let vivo = true;
    getSocial()
      .then((d) => {
        if (!vivo) return;
        const normal = {
          instagram: (d.instagram || []).map((p) => ({ ...vacia("instagram"), ...p, fecha: p.fecha || "" })),
          x: (d.x || []).map((p) => ({ ...vacia("x"), ...p, fecha: p.fecha || "" })),
        };
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

  const subir = useCallback(async (i, archivo) => {
    setSubiendo(`instagram-${i}`);
    setGuardado({ status: "idle", mensaje: "" });
    try {
      const fila = await uploadAdminMediaImage(archivo);
      cambiar("instagram", i, { imagen: fila.id, url: fila.url || "" });
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
      };
      const d = await putSocial(cuerpo);
      const normal = {
        instagram: (d.instagram || []).map((p) => ({ ...vacia("instagram"), ...p, fecha: p.fecha || "" })),
        x: (d.x || []).map((p) => ({ ...vacia("x"), ...p, fecha: p.fecha || "" })),
      };
      setListas(normal);
      setInicial(JSON.stringify(normal));
      setGuardado({ status: "ok", mensaje: "Guardado. Ya se ve al pie de todas las páginas." });
    } catch (err) {
      setGuardado({ status: "error", mensaje: adminErrorMessage(err, "No se pudieron guardar las redes.") });
    }
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
              onSubir={(archivo) => subir(i, archivo)}
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
            publicación y escriba el texto como quiere que se lea; en Instagram, suba
            también la imagen. El orden de aquí es el orden de la fila. Se guarda todo
            de una vez al pulsar Guardar.
          </p>
        </div>
      </header>

      {carga.status === "loading" ? <p className="se-admin-meta-hint">Cargando…</p> : null}
      {carga.status === "error" ? (
        <p className="se-admin-form-feedback" role="alert">{carga.error}</p>
      ) : null}

      {carga.status === "ready" ? (
        <>
          {bloque("instagram")}
          {bloque("x")}

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
