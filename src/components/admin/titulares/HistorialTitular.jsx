import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { adminRequest } from "../../../lib/api";
import { unwrapEntity } from "../../../services/adminResponseUtils";
import { ModalDelPanel } from "../ModalDelPanel";

/**
 * El historial de un titular: cada versión del texto (la que escribió el sistema, las
 * que reescribió al llegar más fuentes, las corregidas a mano) y lo que hizo la
 * redacción con él (borrar, restaurar, editar, fijar), con quién y cuándo.
 */

const VERSION = {
  first_publish: "Primera versión, del sistema",
  new_sources: "Reescrito por el sistema al llegar más fuentes",
  manual_edit: "Corregido a mano",
};

const cuando = (iso) =>
  iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas", dateStyle: "short", timeStyle: "short" }) : "—";

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
                    <span className="se-admin-meta-hint">{cuando(a.cuando)} · {a.quien || "—"}</span>
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
