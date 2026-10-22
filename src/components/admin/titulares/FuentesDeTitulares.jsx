import { useState } from "react";
import PropTypes from "prop-types";
import { useAdminToast } from "../../../context/AdminToastContext";
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { adminRequest } from "../../../lib/api";
import { unwrapEntity } from "../../../services/adminResponseUtils";
import { ModalDelPanel } from "../ModalDelPanel";

/**
 * Los medios que lee el sistema de titulares, con cuántas notas mandaron en 24 horas.
 *
 * Silenciar uno hace que sus notas nuevas dejen de contar; con la casilla marcada, se
 * borran además los titulares publicados donde era el único medio (motivo «fuente poco
 * confiable»). Reactivar lo devuelve desde ese momento. Va plegada: son decenas de
 * medios y se mira de vez en cuando, no a cada rato.
 */

const NIVEL = { 1: "1 · oficial", 2: "2 · agencia", 3: "3 · medio", 4: "4 · Google News o pequeño" };

export const FuentesDeTitulares = ({ fuentes, onCambio, anclaje }) => {
  const { toastSuccess, toastError } = useAdminToast();
  const [silenciando, setSilenciando] = useState(null);
  const [retirar, setRetirar] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const silenciadas = fuentes.filter((f) => f.silenciada).length;

  const silenciar = async () => {
    setOcupado(true);
    try {
      const r = await adminRequest(`/admin/headlines/fuentes/${encodeURIComponent(silenciando.id)}/mute`, {
        method: "POST",
        json: { retirar },
      });
      const n = unwrapEntity(r)?.retirados?.length ?? 0;
      toastSuccess(
        `${silenciando.nombre} silenciada.${n ? ` Se borraron ${n} titular${n === 1 ? "" : "es"} donde era la única fuente.` : ""}`,
        "Titulares",
      );
      setSilenciando(null);
      onCambio();
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo silenciar."), "Titulares");
    } finally {
      setOcupado(false);
    }
  };

  const reactivar = async (f) => {
    setOcupado(true);
    try {
      await adminRequest(`/admin/headlines/fuentes/${encodeURIComponent(f.id)}/unmute`, { method: "POST" });
      toastSuccess(`${f.nombre} vuelve a contar.`, "Titulares");
      onCambio();
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo reactivar."), "Titulares");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <details className="se-admin-table-wrap se-tit-fuentes" {...anclaje}>
      <summary className="se-tit-fuentes__resumen">
        <span className="se-heading-card">Medios que lee el sistema</span>
        <span className="se-admin-meta-hint">
          {fuentes.length} medio{fuentes.length === 1 ? "" : "s"}
          {silenciadas ? ` · ${silenciadas} silenciado${silenciadas === 1 ? "" : "s"}` : ""}
        </span>
      </summary>
      {fuentes.length ? (
        <div className="se-tit-fuentes__tabla">
          <table className="se-admin-table">
            <thead>
              <tr>
                <th scope="col">Medio</th>
                <th scope="col">Nivel</th>
                <th scope="col">País</th>
                <th scope="col" className="se-tit-num">Notas 24 h</th>
                <th scope="col">Estado</th>
                <th scope="col"><span className="se-sr-only">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {fuentes.map((f) => (
                <tr key={f.id} className={f.silenciada ? "se-tit-fuentes__fila--muda" : undefined}>
                  <td>{f.nombre}</td>
                  <td>{NIVEL[f.nivel] || f.nivel}</td>
                  <td>{f.pais}</td>
                  <td className="se-tit-num">{f.notas_24h}</td>
                  <td>{f.silenciada ? `Silenciado${f.silenciada_por ? ` por ${f.silenciada_por}` : ""}` : "Cuenta"}</td>
                  <td className="se-admin-table__actions">
                    {f.silenciada ? (
                      <button type="button" className="se-btn se-btn--secondary" disabled={ocupado}
                        onClick={() => reactivar(f)}>
                        Reactivar
                      </button>
                    ) : (
                      <button type="button" className="se-btn se-btn--secondary" disabled={ocupado}
                        onClick={() => { setRetirar(false); setSilenciando(f); }}>
                        Silenciar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="se-admin-meta-hint">Todavía no llegó ninguna nota.</p>
      )}

      <ModalDelPanel
        abierto={Boolean(silenciando)}
        ocupado={ocupado}
        onCerrar={() => setSilenciando(null)}
        titulo={`Silenciar ${silenciando?.nombre ?? ""}`}
        pie={
          <>
            <button type="button" className="se-btn se-btn--secondary" onClick={() => setSilenciando(null)} disabled={ocupado}>
              Cancelar
            </button>
            <button type="button" className="se-btn se-btn--primary" onClick={silenciar} disabled={ocupado}>
              {ocupado ? "Silenciando…" : "Silenciar"}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          Sus notas nuevas dejan de contar para elegir y redactar titulares. Lo que ya contó sigue contando.
          Se puede reactivar cuando quiera.
        </p>
        <label className="se-tit-casilla">
          <input type="checkbox" checked={retirar} onChange={(e) => setRetirar(e.target.checked)} />
          Borrar también los titulares publicados donde este medio era la única fuente
        </label>
      </ModalDelPanel>
    </details>
  );
};

FuentesDeTitulares.propTypes = {
  fuentes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nombre: PropTypes.string,
      nivel: PropTypes.number,
      pais: PropTypes.string,
      notas_24h: PropTypes.number,
      silenciada: PropTypes.bool,
      silenciada_por: PropTypes.string,
    }),
  ).isRequired,
  onCambio: PropTypes.func.isRequired,
  anclaje: PropTypes.object,
};
