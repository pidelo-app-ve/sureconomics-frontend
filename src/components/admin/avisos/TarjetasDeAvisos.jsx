import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Plegable } from "../Plegable";
import {
  accionesDe, comprobacion, detalleDeLoComprobado, estadoDeAviso, MOTIVO_QUITADA, MOTIVO_SIN_LEER, nombreDeMotivo, nombreDePais,
} from "../../../lib/avisos";

/**
 * Las tarjetas de «Avisos de noticias» (`pages/admin/AdminAvisos.jsx`): un aviso del día
 * (`Aviso`), con sus fuentes y lo que se comprobó al redactarlo, y una noticia que el
 * sistema tiene en la mira (`Candidato`).
 */

const zona = { timeZone: "America/Caracas" };
// Con espacios que no parten: «02:52 p. m.» se quedaba con la «m.» sola en otro renglón.
const hora = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("es-VE", { ...zona, hour: "2-digit", minute: "2-digit" }).replace(/\s/g, "\u00a0") : "—";
const medios = (n) => `${n} medio${n === 1 ? "" : "s"}`;
/** Cuántas fuentes se ven sin pulsar «ver todas». */
const FUENTES_A_LA_VISTA = 3;

/** Lo que publicó cada medio sobre el hecho: tres a la vista y el resto al pulsar. */
const Fuentes = ({ fuentes }) => {
  const [todas, setTodas] = useState(false);
  if (!fuentes.length) return null;
  const visibles = todas ? fuentes : fuentes.slice(0, FUENTES_A_LA_VISTA);
  return (
    <div className="se-avisos__fuentes">
      <ul>
        {visibles.map((f, k) => (
          <li key={`${f.url || f.medio}-${k}`}>
            <span className="se-avisos__medio">{f.medio}</span>
            {f.url ? (
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                {f.titulo || "Ver la nota"}
              </a>
            ) : (
              <span>{f.titulo}</span>
            )}
          </li>
        ))}
      </ul>
      {fuentes.length > FUENTES_A_LA_VISTA ? (
        <button type="button" className="se-avisos__mas" onClick={() => setTodas((v) => !v)} aria-expanded={todas}>
          {todas ? "Ver menos" : `Ver las ${fuentes.length} fuentes`}
        </button>
      ) : null}
    </div>
  );
};

Fuentes.propTypes = {
  fuentes: PropTypes.arrayOf(PropTypes.shape({ medio: PropTypes.string, titulo: PropTypes.string, url: PropTypes.string }))
    .isRequired,
};

/**
 * Lo que se comprobó al redactar el aviso: quién la escribió, cada cifra con el medio que
 * la da, las frases que se quitaron y los nombres por mirar. Va en la tarjeta, antes del
 * botón de abrir el borrador: es lo que hay que leer primero.
 */
const Comprobacion = ({ revision }) => {
  const resumen = comprobacion(revision);
  if (!resumen) return null;
  return (
    <div className={`se-avisos__comprobacion${resumen.ojo ? " is-ojo" : ""}`}>
      <p className="se-avisos__comprobacion-linea">{resumen.linea}</p>
      {/* Lo que salió bien va plegado: a la vista queda solo lo que hay que mirar. */}
      {revision.leidos.length || revision.sinLeer.length || revision.cifras.length ? (
        <Plegable titulo="Fuentes y cifras" resumen={detalleDeLoComprobado(revision)} estado="ok">
          {revision.leidos.length || revision.sinLeer.length ? (
            <>
              <p className="se-avisos__comprobacion-rotulo">De dónde salió el texto</p>
              <ul className="se-avisos__cifras">
                {revision.leidos.map((l) => (
                  <li key={l.medio}>
                    <strong>{l.medio}</strong>
                    <span>artículo leído entero ({l.palabras} palabras)</span>
                  </li>
                ))}
                {revision.sinLeer.map((s) => (
                  <li key={s.medio}>
                    <strong>{s.medio}</strong>
                    <span>solo su titular: {MOTIVO_SIN_LEER[s.motivo] ?? "no se pudo leer"}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {revision.cifras.length ? (
            <>
              <p className="se-avisos__comprobacion-rotulo">Cifras del borrador y quién las da</p>
              <ul className="se-avisos__cifras">
                {revision.cifras.map((c) => (
                  <li key={c.texto}>
                    <strong>{c.texto}</strong>
                    <span>{c.medios.join(", ")}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Plegable>
      ) : null}
      {revision.quitadas.length ? (
        <>
          <p className="se-avisos__comprobacion-rotulo">
            {revision.quitadas.length === 1 ? "Se quitó una frase" : `Se quitaron ${revision.quitadas.length} frases`} que
            no se pudo comprobar
          </p>
          <ul className="se-avisos__quitadas">
            {revision.quitadas.map((q) => (
              <li key={q.frase}>
                «{q.frase}» <span className="se-avisos__motivo">({MOTIVO_QUITADA[q.motivo] ?? "no se pudo comprobar"})</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {revision.copiadas.length ? (
        <>
          <p className="se-avisos__comprobacion-rotulo">
            {revision.copiadas.length === 1 ? "Una frase quedó" : `${revision.copiadas.length} frases quedaron`} casi igual
            que en el medio: reescríbala{revision.copiadas.length === 1 ? "" : "s"} con sus palabras
          </p>
          <ul className="se-avisos__quitadas">
            {revision.copiadas.map((c) => (
              <li key={c.frase}>
                «{c.frase}» <span className="se-avisos__motivo">({c.medio})</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {revision.nombres.length ? (
        <>
          <p className="se-avisos__comprobacion-rotulo">Nombres que no se vieron escritos igual en las fuentes: compruébelos</p>
          <p className="se-avisos__nombres">{revision.nombres.join(" · ")}</p>
        </>
      ) : null}
      {revision.avisos.length ? (
        <ul className="se-avisos__quitadas">
          {revision.avisos.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      ) : null}
      {revision.conIa ? (
        <p className="se-admin-meta-hint se-avisos__comprobacion-pie">
          Es un borrador: no se publica solo. Léalo entero y compárelo con las fuentes antes de publicar.
        </p>
      ) : null}
    </div>
  );
};

Comprobacion.propTypes = { revision: PropTypes.object };

/** Un aviso de hoy: cómo está y lo que puede hacer con él quien lo mira. */
export const Aviso = ({ aviso, miId, motivos, ocupado, redactando, anclaje, onTomar, onSoltar, onDescartar, onRedactar }) => {
  const [descartando, setDescartando] = useState(false);
  const estado = estadoDeAviso(aviso, miId);
  const acciones = accionesDe(aviso, miId);
  return (
    <li className={`se-admin-table-wrap se-avisos__tarjeta${estado.tono === "apagado" ? " is-apagado" : ""}`} {...anclaje}>
      <p className="se-avisos__marcas">
        <span className={`se-avisos__marca${estado.tono ? ` se-avisos__marca--${estado.tono}` : ""}`}>{estado.texto}</span>
      </p>
      <h2 className="se-heading-card se-avisos__titulo">{aviso.titulo}</h2>
      <p className="se-admin-meta-hint se-avisos__meta">
        {nombreDePais(aviso.pais)} · puntaje {aviso.calor} · {medios(aviso.medios)} · avisado a las {hora(aviso.creado)}
      </p>
      <Fuentes fuentes={aviso.fuentes} />
      <Comprobacion revision={aviso.revision} />
      {redactando ? (
        <p className="se-avisos__redactando" role="status">
          Leyendo los artículos de los medios, redactando y comprobando las cifras y las citas… Puede tardar
          hasta medio minuto.
        </p>
      ) : acciones.includes("abrir") ? (
        <div className="se-avisos__acciones">
          <Link className="se-btn se-btn--primary" to={`/admin/posts/${aviso.piezaId}`}>
            {aviso.estado === "publicado" ? "Abrir la pieza" : "Abrir el borrador"}
          </Link>
        </div>
      ) : descartando ? (
        <div className="se-avisos__acciones" role="group" aria-label="Por qué se descarta">
          <span className="se-avisos__pregunta">¿Por qué no?</span>
          {motivos.map((m) => (
            <button key={m} type="button" className="se-btn se-btn--secondary" disabled={ocupado}
              onClick={() => onDescartar(aviso, m).then((ok) => ok && setDescartando(false))}>
              {nombreDeMotivo(m)}
            </button>
          ))}
          <button type="button" className="se-avisos__mas" disabled={ocupado} onClick={() => setDescartando(false)}>
            Cancelar
          </button>
        </div>
      ) : acciones.length ? (
        <div className="se-avisos__acciones">
          {acciones.includes("redactar") ? (
            <button type="button" className="se-btn se-btn--primary" disabled={ocupado} onClick={() => onRedactar(aviso, true)}>
              Redactar
            </button>
          ) : null}
          {acciones.includes("tomar") ? (
            <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={() => onTomar(aviso)}>
              Lo hago yo
            </button>
          ) : null}
          {acciones.includes("escribir") ? (
            <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={() => onRedactar(aviso, false)}>
              Escribirla yo
            </button>
          ) : null}
          {acciones.includes("soltar") ? (
            <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={() => onSoltar(aviso)}>
              Soltar
            </button>
          ) : null}
          <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={() => setDescartando(true)}>
            Descartar
          </button>
        </div>
      ) : null}
    </li>
  );
};

Aviso.propTypes = {
  aviso: PropTypes.object.isRequired,
  miId: PropTypes.number,
  motivos: PropTypes.arrayOf(PropTypes.string).isRequired,
  ocupado: PropTypes.bool,
  /** Si es este el aviso que se está redactando ahora. */
  redactando: PropTypes.bool,
  /** El anclaje de la guía: lo lleva la primera tarjeta de la lista. */
  anclaje: PropTypes.object,
  onTomar: PropTypes.func.isRequired,
  onSoltar: PropTypes.func.isRequired,
  onDescartar: PropTypes.func.isRequired,
  /** `(aviso, conIa)`: con la IA, o un borrador vacío con el título y las fuentes. */
  onRedactar: PropTypes.func.isRequired,
};

/** Una noticia que el sistema tiene en la mira: todavía no es un aviso. */
export const Candidato = ({ candidato, anclaje }) => (
  <li className="se-admin-table-wrap se-avisos__tarjeta" {...anclaje}>
    {candidato.enEstaPasada || candidato.venezuela || candidato.enUltimaHora || candidato.seTraduce ? (
      <p className="se-avisos__marcas">
        {candidato.enEstaPasada ? <span className="se-avisos__marca se-avisos__marca--mio">Saldría en la próxima pasada</span> : null}
        {candidato.venezuela ? <span className="se-avisos__marca se-avisos__marca--ok">Venezuela</span> : null}
        {candidato.enUltimaHora ? <span className="se-avisos__marca">Ya está en «Última hora»</span> : null}
        {candidato.seTraduce ? <span className="se-avisos__marca">El aviso sale traducido al español</span> : null}
      </p>
    ) : null}
    <h2 className="se-heading-card se-avisos__titulo">{candidato.titulo}</h2>
    <p className="se-admin-meta-hint se-avisos__meta">
      {nombreDePais(candidato.pais)} · puntaje {candidato.calor} · {medios(candidato.medios)}
      {candidato.medioPrincipal ? ` · la fuente principal es ${candidato.medioPrincipal}` : ""}
    </p>
    <Fuentes fuentes={candidato.fuentes} />
  </li>
);

Candidato.propTypes = { candidato: PropTypes.object.isRequired, anclaje: PropTypes.object };
