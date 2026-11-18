import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { adminRequest } from "../../../lib/api";
import { MODOS_DEL_JUEZ, VEREDICTOS, nombreDelProblema } from "../../../lib/juezDeTitulares";
import { unwrapEntity } from "../../../services/adminResponseUtils";
import { ModalDelPanel } from "../ModalDelPanel";

/**
 * El historial de un titular: cada versión del texto (la que escribió el sistema, las
 * que reescribió al llegar más fuentes, las corregidas a mano) y lo que hizo la
 * redacción con él (borrar, restaurar, editar, fijar), con quién y cuándo. También si la
 * IA lo retiró al rehacerlo («Automático»). Cada versión de la máquina dice, plegado,
 * de dónde salió (`DeDondeSalio`).
 */

const VERSION = {
  first_publish: "Primera versión, del sistema",
  new_sources: "Reescrito por el sistema al llegar más fuentes",
  manual_edit: "Corregido a mano",
};

const cuando = (iso) =>
  iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas", dateStyle: "short", timeStyle: "short" }) : "—";

const usd = (n) =>
  typeof n === "number" ? `${n.toLocaleString("es-VE", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USD` : null;

/**
 * «Lo que dijo el juez» de una versión: `{modo, estado, aprobado, problemas, modelo,
 * prompt_hash, costo}`. En «observar» un titular rechazado sale igual, y aquí se ve por qué
 * lo habría frenado.
 */
const LoQueDijoElJuez = ({ juez }) => {
  const problemas = Array.isArray(juez.problemas) ? juez.problemas : [];
  const costo = usd(juez.costo);
  return (
    <div className="se-tit-origen__juez">
      <span className="se-form-label">Lo que dijo el juez</span>
      <span className={juez.estado === "rechazado" ? "se-tit-origen__veredicto--no" : undefined}>
        {VEREDICTOS[juez.estado] || juez.estado || "Sin veredicto"}
      </span>
      <span className="se-admin-meta-hint">
        Modo {MODOS_DEL_JUEZ[juez.modo]?.nombre.toLowerCase() ?? juez.modo ?? "—"}
        {juez.modelo ? ` · ${juez.modelo}` : ""}
        {costo ? ` · costó ${costo}` : ""}
      </span>
      {problemas.length ? (
        <ul className="se-tit-frenados__problemas">
          {problemas.map((p, i) => (
            <li key={i}>
              <span className="se-tit-marca">{nombreDelProblema(p.tipo)}</span> {p.explicacion}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

LoQueDijoElJuez.propTypes = {
  juez: PropTypes.shape({
    modo: PropTypes.string,
    estado: PropTypes.string,
    problemas: PropTypes.arrayOf(PropTypes.shape({ tipo: PropTypes.string, explicacion: PropTypes.string })),
    modelo: PropTypes.string,
    costo: PropTypes.number,
  }).isRequired,
};

/** Solo enlaces web: la dirección viene del medio, y un `javascript:` no puede ir en un href. */
const esWeb = (url) => typeof url === "string" && /^https?:\/\//i.test(url);

/**
 * «De dónde salió» una versión que escribió la máquina (auditoría del 17-nov-2026,
 * D-07): qué modelo la redactó, con qué versión de las instrucciones (la huella) y qué
 * notas leyó, con su enlace y el trozo que vio; y, si la leyó el juez, qué dijo. Las notas originales se borran a los 7
 * días; esto se guarda con la versión para poder contestar un reclamo meses después.
 * Plegado: se abre cuando hace falta comprobar algo.
 */
const DeDondeSalio = ({ version }) => {
  const notas = Array.isArray(version.notas_leidas) ? version.notas_leidas : [];
  if (version.motivo === "manual_edit") return null;
  if (!version.modelo && !notas.length) {
    return <span className="se-admin-meta-hint">No se guardó de dónde salió: esta versión es de antes de que el sistema lo apuntara.</span>;
  }
  return (
    <details className="se-tit-origen">
      <summary className="se-admin-meta-hint">
        De dónde salió · {notas.length} nota{notas.length === 1 ? "" : "s"} leída{notas.length === 1 ? "" : "s"}
      </summary>
      <p className="se-admin-meta-hint se-tit-origen__datos">
        Lo redactó {version.modelo || "un modelo sin nombre"}
        {version.huella_prompt ? (
          <>
            {" "}con las instrucciones <code title={version.huella_prompt}>{version.huella_prompt.slice(0, 12)}</code>
          </>
        ) : null}
        .
      </p>
      {notas.length ? (
        <ol className="se-tit-origen__notas">
          {notas.map((n, k) => (
            <li key={`${n.url || n.titulo || ""}-${k}`}>
              <span className="se-admin-meta-hint">
                {n.medio || "Medio sin nombre"}
                {n.nivel ? ` · nivel ${n.nivel}` : ""}
                {n.publicada ? ` · ${cuando(n.publicada)}` : ""}
              </span>
              {esWeb(n.url) ? (
                <a href={n.url} target="_blank" rel="noopener noreferrer nofollow">
                  {n.titulo || n.url}
                </a>
              ) : (
                <span>{n.titulo || "Sin título"}</span>
              )}
              {n.extracto ? <span className="se-tit-origen__extracto">{n.extracto}</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
      {version.juez ? <LoQueDijoElJuez juez={version.juez} /> : null}
    </details>
  );
};

DeDondeSalio.propTypes = {
  version: PropTypes.shape({
    motivo: PropTypes.string,
    modelo: PropTypes.string,
    huella_prompt: PropTypes.string,
    juez: PropTypes.object,
    notas_leidas: PropTypes.arrayOf(
      PropTypes.shape({
        medio: PropTypes.string,
        nivel: PropTypes.number,
        url: PropTypes.string,
        titulo: PropTypes.string,
        extracto: PropTypes.string,
        publicada: PropTypes.string,
      }),
    ),
  }).isRequired,
};

const accion = (a, motivos) => {
  const d = a.datos || {};
  switch (a.accion) {
    case "borrar":
      return `Borrado (${motivos[d.motivo] || d.motivo || "sin motivo"})${d.nota ? `: «${d.nota}»` : ""}`;
    case "restaurar":
      return "Restaurado";
    case "editar":
      return "Editado a mano";
    case "fijar":
      return `Fijado arriba ${d.minutos} minutos`;
    case "desfijar":
      return "Quitado de arriba";
    case "retirado_ia":
      return "Retirado por la IA al rehacerlo: con las fuentes nuevas lo marcó «descartar»";
    default:
      return a.accion;
  }
};

export const HistorialTitular = ({ grupo, motivos, onCerrar }) => {
  const [estado, setEstado] = useState({ cargando: true, datos: null, error: null });

  useEffect(() => {
    if (!grupo) return undefined;
    let vivo = true;
    setEstado({ cargando: true, datos: null, error: null });
    adminRequest(`/admin/headlines/${grupo.id}/historial`)
      .then((r) => vivo && setEstado({ cargando: false, datos: unwrapEntity(r), error: null }))
      .catch((err) => vivo && setEstado({ cargando: false, datos: null, error: adminErrorMessage(err, "No se pudo cargar.") }));
    return () => {
      vivo = false;
    };
  }, [grupo]);

  const { cargando, datos, error } = estado;
  return (
    <ModalDelPanel
      abierto={Boolean(grupo)}
      onCerrar={onCerrar}
      ancho="ancho"
      titulo="Historial del titular"
      subtitulo={grupo?.titulo}
      pie={
        <button type="button" className="se-btn se-btn--secondary" onClick={onCerrar}>
          Cerrar
        </button>
      }
    >
      {cargando ? <p className="se-admin-meta-hint">Cargando…</p> : null}
      {error ? <p className="se-tit-aviso" role="alert">{error}</p> : null}
      {datos ? (
        <div className="se-tit-historial">
          <section>
            <h3 className="se-form-label">Lo que hizo la redacción</h3>
            {datos.acciones.length ? (
              <ul className="se-tit-historial__lista">
                {datos.acciones.map((a, k) => (
                  <li key={`a-${k}`}>
                    <span className="se-admin-meta-hint">
                      {cuando(a.cuando)} · {a.quien || (a.accion === "retirado_ia" ? "Automático" : "—")}
                    </span>
                    <span>{accion(a, motivos)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="se-admin-meta-hint">Nadie lo ha tocado.</p>
            )}
          </section>
          <section>
            <h3 className="se-form-label">Versiones del texto</h3>
            <ol className="se-tit-historial__lista">
              {datos.revisiones.map((v, k) => (
                <li key={`v-${k}`}>
                  <span className="se-admin-meta-hint">
                    {cuando(v.cuando)} · {VERSION[v.motivo] || v.motivo} · {v.fuentes} fuente{v.fuentes === 1 ? "" : "s"}
                  </span>
                  <strong>{v.titulo}</strong>
                  <span>{v.resumen}</span>
                  <span className="se-admin-meta-hint">{v.titulo_en} — {v.resumen_en}</span>
                  <DeDondeSalio version={v} />
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </ModalDelPanel>
  );
};

HistorialTitular.propTypes = {
  grupo: PropTypes.shape({ id: PropTypes.number.isRequired, titulo: PropTypes.string }),
  motivos: PropTypes.objectOf(PropTypes.string).isRequired,
  onCerrar: PropTypes.func.isRequired,
};
